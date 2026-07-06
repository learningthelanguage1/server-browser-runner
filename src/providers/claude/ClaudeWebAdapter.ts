import type { ProviderAdapter } from "../ProviderAdapter.js";
import type { Page } from "playwright";
import type { AgentTask, AgentTaskResult, RunnerConfig } from "../../types.js";
import { assertProviderPermission } from "../../security/PermissionGate.js";
import { BrowserProfileManager } from "../../browser/BrowserProfileManager.js";
import { waitForDoneMarkerOrStable } from "../../browser/CompletionDetector.js";
import { captureLastAnswer } from "../../browser/CaptureEngine.js";
import { ScreenshotService } from "../../browser/ScreenshotService.js";
import { claudeSelectors } from "./claudeSelectors.js";
import { claudeHealth } from "./claudeHealth.js";
import { browserFailedResult } from "../browserFailureResult.js";

export class ClaudeWebAdapter implements ProviderAdapter {
  name = "claude_web_adapter";
  provider = "claude" as const;
  kind = "browser" as const;

  constructor(private readonly config: RunnerConfig) {}

  async selfCheck() {
    try {
      assertProviderPermission(this.provider, this.config.providers.claude);
    } catch (error) {
      return { provider: this.provider, status: "permission_blocked" as const, details: String(error) };
    }
    let context;
    let page;
    try {
      context = await new BrowserProfileManager(this.config).open(this.config.providers.claude);
      page = await context.newPage();
      await page.goto(this.config.providers.claude.target_url, { waitUntil: "domcontentloaded" });
      return { provider: this.provider, status: await claudeHealth(page), currentUrl: page.url() };
    } catch (error) {
      return { provider: this.provider, status: "unknown_error" as const, currentUrl: page?.url(), details: String(error) };
    } finally {
      await context?.close();
    }
  }

  async execute(task: AgentTask): Promise<AgentTaskResult> {
    assertProviderPermission(this.provider, this.config.providers.claude);
    const context = await new BrowserProfileManager(this.config).open(this.config.providers.claude);
    const page = await context.newPage();
    const artifacts = [];
    const timings: Record<string, string> = { claimed_at: new Date().toISOString() };
    try {
      await page.goto(task.target_url, { waitUntil: "domcontentloaded" });
      const health = await claudeHealth(page);
      if (health === "login_required") throw new Error("LOGIN_REQUIRED");
      if (health === "rate_limited") throw new Error("PROVIDER_RATE_LIMITED");
      if (health === "human_check_required") throw new Error("CAPTCHA_OR_HUMAN_CHECK");
      if (health !== "ready") throw new Error("SELECTOR_CHANGED");
      await page.locator(claudeSelectors.composer).first().click();
      await page.evaluate((prompt) => navigator.clipboard.writeText(prompt), task.prompt);
      await page.keyboard.press(process.platform === "darwin" ? "Meta+V" : "Control+V");
      await page.locator(claudeSelectors.sendButton).first().click();
      timings.prompt_sent_at = new Date().toISOString();
      await page.waitForTimeout(1500);
      if ((await page.locator(claudeSelectors.rateLimit).count()) > 0) throw new Error("PROVIDER_RATE_LIMITED");
      const answer = await lastNonEmptyClaudeResponse(page);
      const done = await waitForDoneMarkerOrStable(answer, task.expected_output?.done_marker, (task.timeout_seconds ?? 900) * 1000, {
        markerSeen: async () => markerAppearsTwice(await page.locator("body").textContent(), task.expected_output?.done_marker)
      });
      if (done.status === "timeout") throw new Error("RESPONSE_TIMEOUT");
      timings.response_completed_at = new Date().toISOString();
      const captured = await captureClaudeAnswer(page, answer, task);
      const screenshot = await new ScreenshotService(this.config).capture(page, task.task_id);
      artifacts.push(screenshot);
      return {
        task_id: task.task_id,
        runner_id: this.config.runner.id,
        attempt_id: `attempt_${Date.now()}`,
        status: "succeeded",
        result_text: captured.text,
        clean_result_text: cleanMarker(captured.text, task.expected_output?.done_marker),
        capture_method: captured.method,
        timings,
        validation_status: done.status === "marker" ? "passed" : "marker_missing",
        provider_receipt: { provider: this.provider, adapter_version: "0.1.0", url_host: new URL(page.url()).hostname },
        artifacts
      };
    } catch (error) {
      const screenshot = await new ScreenshotService(this.config).capture(page, task.task_id).catch(() => undefined);
      if (screenshot) artifacts.push(screenshot);
      return browserFailedResult(this.config.runner.id, task, this.provider, page.url(), error, artifacts);
    } finally {
      await context.close();
    }
  }
}

function cleanMarker(text: string, marker?: string) {
  return marker ? text.replace(marker, "").trim() : text.trim();
}

export async function lastNonEmptyClaudeResponse(page: Page) {
  const messages = page.locator(claudeSelectors.assistantResponse);
  for (let index = (await messages.count()) - 1; index >= 0; index -= 1) {
    const message = messages.nth(index);
    if (((await message.textContent().catch(() => "")) ?? "").trim()) return message;
  }
  return messages.last();
}

function markerAppearsTwice(text: string | null, marker?: string) {
  if (!text || !marker) return false;
  return text.split(marker).length - 1 >= 2;
}

async function captureClaudeAnswer(page: Page, answer: ReturnType<Page["locator"]>, task: AgentTask) {
  try {
    return await captureLastAnswer(page, answer);
  } catch (error) {
    if (!String(error).includes("RESPONSE_EMPTY")) throw error;
    const text = extractClaudeAnswerFromBody((await page.locator("body").textContent().catch(() => "")) ?? "", task);
    if (text.trim()) return { method: "dom" as const, text };
    throw error;
  }
}

export function extractClaudeAnswerFromBody(bodyText: string, task: AgentTask) {
  const marker = task.expected_output?.done_marker;
  if (!marker) return "";
  const markerIndex = bodyText.lastIndexOf(marker);
  if (markerIndex === -1) return "";
  const beforeMarker = bodyText.slice(0, markerIndex);
  const required = typeof task.expected_output?.must_include === "string" ? task.expected_output.must_include : task.expected_output?.must_include?.[0];
  const start = required ? beforeMarker.lastIndexOf(required) : -1;
  if (start !== -1) return `${beforeMarker.slice(start).trim()}\n${marker}`;
  return `${beforeMarker.slice(Math.max(0, beforeMarker.length - 8000)).trim()}\n${marker}`;
}

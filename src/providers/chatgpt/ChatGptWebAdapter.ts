import type { ProviderAdapter } from "../ProviderAdapter.js";
import type { AgentTask, AgentTaskResult, RunnerConfig } from "../../types.js";
import type { Page } from "playwright";
import { BrowserProfileManager } from "../../browser/BrowserProfileManager.js";
import { waitForDoneMarkerOrStable } from "../../browser/CompletionDetector.js";
import { captureLastAnswer } from "../../browser/CaptureEngine.js";
import { ScreenshotService } from "../../browser/ScreenshotService.js";
import { chatgptSelectors } from "./chatgptSelectors.js";
import { chatgptHealth } from "./chatgptHealth.js";
import { assertProviderPermission } from "../../security/PermissionGate.js";
import { browserFailedResult } from "../browserFailureResult.js";

export class ChatGptWebAdapter implements ProviderAdapter {
  name = "chatgpt_web_adapter";
  provider = "chatgpt" as const;
  kind = "browser" as const;

  constructor(private readonly config: RunnerConfig) {}

  async selfCheck() {
    try {
      assertProviderPermission(this.provider, this.config.providers.chatgpt);
    } catch (error) {
      return { provider: this.provider, status: "permission_blocked" as const, details: String(error) };
    }
    let context;
    let page;
    try {
      context = await new BrowserProfileManager(this.config).open(this.config.providers.chatgpt);
      page = await context.newPage();
      await page.goto(this.config.providers.chatgpt.target_url, { waitUntil: "domcontentloaded" });
      return { provider: this.provider, status: await waitForChatGptHealth(page), currentUrl: page.url() };
    } catch (error) {
      return { provider: this.provider, status: "unknown_error" as const, currentUrl: page?.url(), details: String(error) };
    } finally {
      await context?.close();
    }
  }

  async execute(task: AgentTask): Promise<AgentTaskResult> {
    assertProviderPermission(this.provider, this.config.providers.chatgpt);
    const context = await new BrowserProfileManager(this.config).open(this.config.providers.chatgpt);
    const page = await context.newPage();
    const artifacts = [];
    const timings: Record<string, string> = { claimed_at: new Date().toISOString() };
    try {
      await page.goto(task.target_url, { waitUntil: "domcontentloaded" });
      const health = await waitForChatGptHealth(page);
      if (health === "login_required") throw new Error("LOGIN_REQUIRED");
      if (health === "rate_limited") throw new Error("PROVIDER_RATE_LIMITED");
      if (health === "human_check_required") throw new Error("CAPTCHA_OR_HUMAN_CHECK");
      if (health === "loading") throw new Error("RESPONSE_TIMEOUT");
      if (health !== "ready") throw new Error("SELECTOR_CHANGED");
      if (isArticleChainTask(task)) {
        await openFreshChat(page);
        const freshHealth = await waitForChatGptHealth(page);
        if (freshHealth === "rate_limited") throw new Error("PROVIDER_RATE_LIMITED");
        if (freshHealth === "human_check_required") throw new Error("CAPTCHA_OR_HUMAN_CHECK");
        if (freshHealth === "loading") throw new Error("RESPONSE_TIMEOUT");
        if (freshHealth !== "ready") throw new Error("SELECTOR_CHANGED");
      }
      await page.locator(chatgptSelectors.composer).first().click();
      await page.evaluate((prompt) => navigator.clipboard.writeText(prompt), task.prompt);
      await page.keyboard.press(process.platform === "darwin" ? "Meta+V" : "Control+V");
      if ((await chatgptHealth(page)) === "rate_limited") throw new Error("PROVIDER_COOLDOWN");
      const sendButton = page.locator(chatgptSelectors.sendButton).first();
      try {
        await sendButton.waitFor({ state: "visible", timeout: 5000 });
        await sendButton.click();
      } catch {
        await page.keyboard.press("Enter");
      }
      timings.prompt_sent_at = new Date().toISOString();
      const answer = page.locator(chatgptSelectors.assistantResponse).last();
      const done = await waitForDoneMarkerOrStable(answer, task.expected_output?.done_marker, (task.timeout_seconds ?? 900) * 1000, {
        isBusy: () => isChatGptGenerating(page)
      });
      if (done.status === "timeout") throw new Error(timeoutErrorForChatGptHealth(await chatgptHealth(page)));
      timings.response_completed_at = new Date().toISOString();
      const captured = await captureLastAnswer(page, answer);
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

export function isArticleChainTask(task: AgentTask) {
  const chainMeta = task.metadata?.article_prompt_chain;
  return Boolean(
    task.provider === "chatgpt" &&
    task.chain_id?.startsWith("article-chain-") &&
    chainMeta &&
    typeof chainMeta === "object"
  );
}

export function timeoutErrorForChatGptHealth(status: string) {
  if (status === "rate_limited") return "PROVIDER_COOLDOWN";
  if (status === "human_check_required") return "CAPTCHA_OR_HUMAN_CHECK";
  if (status === "login_required") return "LOGIN_REQUIRED";
  return "RESPONSE_TIMEOUT";
}

export async function waitForChatGptHealth(page: Page, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  let status = await chatgptHealth(page);
  while (status === "loading" && Date.now() < deadline) {
    await page.waitForTimeout(1000);
    status = await chatgptHealth(page);
  }
  return status;
}

export async function isChatGptGenerating(page: Page) {
  return page.locator(chatgptSelectors.stopButton).first().isVisible().catch(() => false);
}

async function openFreshChat(page: Page) {
  const newChat = page.getByRole("link", { name: /new chat/i }).first();
  try {
    await newChat.click({ timeout: 3000 });
  } catch {
    await page.goto("https://chatgpt.com/?model=auto", { waitUntil: "domcontentloaded" });
  }
  await page.locator(chatgptSelectors.composer).first().waitFor({ state: "visible", timeout: 10000 });
}

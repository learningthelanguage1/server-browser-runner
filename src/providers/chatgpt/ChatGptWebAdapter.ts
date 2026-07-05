import type { ProviderAdapter } from "../ProviderAdapter.js";
import type { AgentTask, AgentTaskResult, RunnerConfig } from "../../types.js";
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
      return { provider: this.provider, status: await chatgptHealth(page), currentUrl: page.url() };
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
    try {
      await page.goto(task.target_url, { waitUntil: "domcontentloaded" });
      const health = await chatgptHealth(page);
      if (health === "login_required") throw new Error("LOGIN_REQUIRED");
      if (health === "rate_limited") throw new Error("PROVIDER_RATE_LIMITED");
      if (health !== "ready") throw new Error("SELECTOR_CHANGED");
      await page.locator(chatgptSelectors.composer).first().click();
      await page.evaluate((prompt) => navigator.clipboard.writeText(prompt), task.prompt);
      await page.keyboard.press(process.platform === "darwin" ? "Meta+V" : "Control+V");
      await page.locator(chatgptSelectors.sendButton).first().click();
      const answer = page.locator(chatgptSelectors.assistantResponse).last();
      const done = await waitForDoneMarkerOrStable(answer, task.expected_output?.done_marker, (task.timeout_seconds ?? 900) * 1000);
      if (done.status === "timeout") throw new Error("RESPONSE_TIMEOUT");
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

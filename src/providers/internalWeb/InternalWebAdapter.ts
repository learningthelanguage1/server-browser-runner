import type { ProviderAdapter } from "../ProviderAdapter.js";
import type { AgentTask, AgentTaskResult, RunnerConfig } from "../../types.js";
import { BrowserProfileManager } from "../../browser/BrowserProfileManager.js";
import { waitForDoneMarkerOrStable } from "../../browser/CompletionDetector.js";
import { captureLastAnswer } from "../../browser/CaptureEngine.js";
import { ScreenshotService } from "../../browser/ScreenshotService.js";
import { browserFailedResult } from "../browserFailureResult.js";

export class InternalWebAdapter implements ProviderAdapter {
  name = "internal_web_adapter";
  provider = "internal" as const;
  kind = "browser" as const;

  constructor(private readonly config: RunnerConfig) {}

  async selfCheck() {
    return { provider: this.provider, status: "ready" as const };
  }

  async execute(task: AgentTask): Promise<AgentTaskResult> {
    const context = await new BrowserProfileManager(this.config).open(this.config.providers.internal);
    const page = await context.newPage();
    const artifacts = [];
    try {
      await page.goto(task.target_url, { waitUntil: "domcontentloaded" });
      const composer = page.locator("textarea, [contenteditable='true']").first();
      if ((await composer.count()) === 0) throw new Error("COMPOSER_NOT_FOUND");
      await composer.fill(task.prompt).catch(async () => {
        await composer.click();
        await page.keyboard.insertText(task.prompt);
      });
      await page.locator("button:has-text('Send'), button[type='submit']").first().click();
      const answer = page.locator("[data-testid='assistant-response'], .assistant-response").first();
      const done = await waitForDoneMarkerOrStable(answer, task.expected_output?.done_marker, (task.timeout_seconds ?? 300) * 1000);
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

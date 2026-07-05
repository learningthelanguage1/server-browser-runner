import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import type { ArtifactRef, RunnerConfig } from "../types.js";

export class ScreenshotService {
  constructor(private readonly config: RunnerConfig) {}

  async capture(page: Page, taskId: string): Promise<ArtifactRef> {
    const dir = join(this.config.browser.artifacts_dir, "screenshots");
    await mkdir(dir, { recursive: true });
    const path = join(dir, `${taskId}-${Date.now()}.png`);
    await page.screenshot({ path, fullPage: true });
    return { type: "screenshot", path };
  }
}

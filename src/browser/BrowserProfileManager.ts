import { mkdir } from "node:fs/promises";
import type { BrowserContext } from "playwright";
import { chromium } from "playwright";
import type { ProviderConfig, RunnerConfig } from "../types.js";

export class BrowserProfileManager {
  constructor(private readonly config: RunnerConfig) {}

  async open(provider: ProviderConfig): Promise<BrowserContext> {
    await mkdir(provider.profile_dir, { recursive: true });
    return chromium.launchPersistentContext(provider.profile_dir, {
      channel: this.config.browser.channel,
      headless: this.config.browser.headless,
      viewport: this.config.browser.viewport,
      locale: this.config.browser.locale,
      timezoneId: this.config.browser.timezone_id
    });
  }
}

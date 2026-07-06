import { mkdir } from "node:fs/promises";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer } from "node:net";
import type { BrowserContext } from "playwright";
import { chromium } from "playwright";
import type { ProviderConfig, RunnerConfig } from "../types.js";

export class BrowserProfileManager {
  constructor(private readonly config: RunnerConfig) {}

  async open(provider: ProviderConfig): Promise<BrowserContext> {
    await mkdir(provider.profile_dir, { recursive: true });
    if (this.config.browser.channel === "chrome" && !this.config.browser.headless) {
      return this.openRealChrome(provider);
    }
    return chromium.launchPersistentContext(provider.profile_dir, {
      channel: this.config.browser.channel,
      headless: this.config.browser.headless,
      viewport: this.config.browser.viewport,
      locale: this.config.browser.locale,
      timezoneId: this.config.browser.timezone_id
    });
  }

  private async openRealChrome(provider: ProviderConfig): Promise<BrowserContext> {
    const port = await freePort();
    const chrome = spawn(process.env.CHROME_PATH ?? "google-chrome", [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${provider.profile_dir}`,
      "--no-first-run",
      "--no-default-browser-check",
      `--window-size=${this.config.browser.viewport.width},${this.config.browser.viewport.height}`,
      "about:blank"
    ]);
    chrome.unref();
    await waitForChrome(port, chrome);
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const close = context.close.bind(context);
    context.close = async () => {
      await close().catch(() => undefined);
      await browser.close().catch(() => undefined);
      chrome.kill();
    };
    return context;
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => (typeof address === "object" && address ? resolve(address.port) : reject(new Error("No free port"))));
    });
    server.on("error", reject);
  });
}

async function waitForChrome(port: number, chrome: ChildProcessWithoutNullStreams): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (chrome.exitCode !== null) break;
    const ok = await fetch(`http://127.0.0.1:${port}/json/version`).then(
      (response) => response.ok,
      () => false
    );
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  chrome.kill();
  throw new Error("UNKNOWN_PROVIDER_ERROR:Chrome did not open with remote control");
}

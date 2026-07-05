import type { ProviderName, RunnerConfig } from "../types.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { assertProviderPermission } from "../security/PermissionGate.js";
import { BrowserProfileManager } from "../browser/BrowserProfileManager.js";
import { chatgptHealth } from "../providers/chatgpt/chatgptHealth.js";
import { claudeHealth } from "../providers/claude/claudeHealth.js";

export async function loginProvider(config: RunnerConfig, provider: ProviderName) {
  if (provider !== "chatgpt" && provider !== "claude") {
    throw new Error(`LOGIN_MODE_UNSUPPORTED:${provider}`);
  }
  const providerConfig = config.providers[provider];
  assertProviderPermission(provider, providerConfig);
  const context = await new BrowserProfileManager(config).open(providerConfig);
  const page = await context.newPage();
  try {
    await page.goto(providerConfig.target_url, { waitUntil: "domcontentloaded" });
    console.log(`Login browser opened for ${provider}. Complete login through VNC.`);
    console.log("This command exits after the provider composer is visible.");

    const deadline = Date.now() + (providerConfig.timeout_seconds || 600) * 1000;
    let lastStatus = await providerHealth(provider, page);
    while (Date.now() < deadline) {
      lastStatus = await providerHealth(provider, page);
      await writeSessionHealth(providerConfig.profile_dir, {
        provider,
        status: lastStatus,
        currentUrl: page.url(),
        checkedAt: new Date().toISOString()
      });
      if (lastStatus === "ready") {
        console.log(`Login session is ready for ${provider}.`);
        return;
      }
      await delay(2000);
    }

    throw new Error(`LOGIN_REQUIRED:${provider}:${lastStatus}`);
  } finally {
    await context.close();
  }
}

async function providerHealth(provider: "chatgpt" | "claude", page: Parameters<typeof chatgptHealth>[0]) {
  return provider === "chatgpt" ? chatgptHealth(page) : claudeHealth(page);
}

async function writeSessionHealth(
  profileDir: string,
  health: { provider: ProviderName; status: string; currentUrl: string; checkedAt: string }
) {
  await mkdir(profileDir, { recursive: true });
  await writeFile(join(profileDir, ".ff-session.json"), JSON.stringify(health, null, 2) + "\n", "utf8");
}

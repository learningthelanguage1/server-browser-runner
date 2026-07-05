import type { ProviderName, RunnerConfig } from "../types.js";
import { assertProviderPermission } from "../security/PermissionGate.js";
import { BrowserProfileManager } from "../browser/BrowserProfileManager.js";

export async function loginProvider(config: RunnerConfig, provider: ProviderName) {
  const providerConfig = config.providers[provider];
  assertProviderPermission(provider, providerConfig);
  const context = await new BrowserProfileManager(config).open(providerConfig);
  const page = await context.newPage();
  await page.goto(providerConfig.target_url, { waitUntil: "domcontentloaded" });
  console.log(`Login browser opened for ${provider}. Complete login through VNC, then stop this command.`);
  await new Promise(() => undefined);
}

import type { ProviderConfig } from "../types.js";

export function assertProviderPermission(provider: string, config: ProviderConfig): void {
  if (!config.enabled) {
    throw new Error(`PROVIDER_PERMISSION_BLOCKED:${provider} is disabled`);
  }
  if (config.permission_required && config.permission_status !== "approved") {
    throw new Error(`PROVIDER_PERMISSION_BLOCKED:${provider} permission is not approved`);
  }
}

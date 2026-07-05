import type { ProviderName, RunnerConfig } from "../types.js";
import { createAdapters } from "../providers/registry.js";

export async function selfCheck(config: RunnerConfig, provider: ProviderName) {
  const adapters = createAdapters(config);
  return adapters[provider].selfCheck();
}

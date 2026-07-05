import type { ProviderConfig, ProviderName } from "../types.js";

type Stamp = { at: number };

export class RateLimitGate {
  private readonly history = new Map<ProviderName, Stamp[]>();

  assertCanRun(provider: ProviderName, config: ProviderConfig, now = Date.now()): void {
    const stamps = (this.history.get(provider) ?? []).filter((stamp) => now - stamp.at < 86_400_000);
    const last = stamps.at(-1);
    if (last && now - last.at < config.min_gap_seconds * 1000) {
      throw new Error(`PROVIDER_COOLDOWN:${provider} min gap not met`);
    }
    if (stamps.filter((stamp) => now - stamp.at < 3_600_000).length >= config.max_tasks_per_hour) {
      throw new Error(`PROVIDER_RATE_LIMITED:${provider} hourly quota exhausted`);
    }
    if (stamps.length >= config.max_tasks_per_day) {
      throw new Error(`PROVIDER_RATE_LIMITED:${provider} daily quota exhausted`);
    }
  }

  record(provider: ProviderName, now = Date.now()): void {
    const stamps = this.history.get(provider) ?? [];
    stamps.push({ at: now });
    this.history.set(provider, stamps);
  }
}

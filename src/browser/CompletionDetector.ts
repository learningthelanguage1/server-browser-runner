import type { Locator } from "playwright";

type WaitForDoneOptions = {
  isBusy?: () => Promise<boolean>;
  markerSeen?: () => Promise<boolean>;
  stableMs?: number;
  pollMs?: number;
};

export async function waitForDoneMarkerOrStable(
  locator: Locator,
  marker: string | undefined,
  timeoutMs: number,
  options: WaitForDoneOptions = {}
) {
  const started = Date.now();
  const stableMs = options.stableMs ?? 20_000;
  const pollMs = options.pollMs ?? 1000;
  let last = "";
  let stableSince = Date.now();
  while (Date.now() - started < timeoutMs) {
    const text = (await locator.textContent().catch(() => "")) ?? "";
    const busy = (await options.isBusy?.().catch(() => false)) ?? false;
    if (marker && (text.includes(marker) || (await options.markerSeen?.().catch(() => false)))) {
      return { status: "marker" as const, text };
    }
    if (text !== last) {
      last = text;
      stableSince = Date.now();
    }
    if (text && !busy && Date.now() - stableSince > stableMs) {
      return { status: "stable" as const, text };
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  return { status: "timeout" as const, text: last };
}

import type { Locator } from "playwright";

export async function waitForDoneMarkerOrStable(locator: Locator, marker: string | undefined, timeoutMs: number) {
  const started = Date.now();
  let last = "";
  let stableSince = Date.now();
  while (Date.now() - started < timeoutMs) {
    const text = (await locator.textContent().catch(() => "")) ?? "";
    if (marker && text.includes(marker)) {
      return { status: "marker" as const, text };
    }
    if (text !== last) {
      last = text;
      stableSince = Date.now();
    }
    if (text && Date.now() - stableSince > 20_000) {
      return { status: "stable" as const, text };
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return { status: "timeout" as const, text: last };
}

import type { Locator, Page } from "playwright";

export async function captureLastAnswer(page: Page, answer: Locator) {
  const copyButton = page.locator("button:has-text('Copy'), [aria-label*='Copy']").last();
  if ((await copyButton.count()) > 0) {
    await copyButton.click().catch(() => undefined);
    const clip = await Promise.race([
      page.evaluate(() => navigator.clipboard.readText()).catch(() => ""),
      new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000))
    ]);
    if (clip.trim()) return { method: "copy_button" as const, text: clip };
  }
  const text = ((await answer.textContent().catch(() => "")) ?? "").trim();
  if (text) return { method: "dom" as const, text };
  return { method: "accessibility" as const, text: "" };
}

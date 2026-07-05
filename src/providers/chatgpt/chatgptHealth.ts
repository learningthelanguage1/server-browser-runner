import type { Page } from "playwright";
import { chatgptSelectors } from "./chatgptSelectors.js";

export async function chatgptHealth(page: Page) {
  if ((await page.locator(chatgptSelectors.humanCheck).count()) > 0) return "human_check_required" as const;
  if ((await page.locator(chatgptSelectors.rateLimit).count()) > 0) return "rate_limited" as const;
  if ((await page.locator(chatgptSelectors.login).count()) > 0) return "login_required" as const;
  if ((await page.locator(chatgptSelectors.composer).count()) === 0) return "selector_broken" as const;
  return "ready" as const;
}

import type { Page } from "playwright";
import { claudeSelectors } from "./claudeSelectors.js";

export async function claudeHealth(page: Page) {
  if ((await page.locator(claudeSelectors.humanCheck).count()) > 0) return "unknown_error" as const;
  if ((await page.locator(claudeSelectors.rateLimit).count()) > 0) return "rate_limited" as const;
  if ((await page.locator(claudeSelectors.login).count()) > 0) return "login_required" as const;
  if ((await page.locator(claudeSelectors.composer).count()) === 0) return "selector_broken" as const;
  return "ready" as const;
}

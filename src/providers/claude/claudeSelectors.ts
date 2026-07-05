export const claudeSelectors = {
  composer: "div[contenteditable='true'], textarea",
  assistantResponse: "[data-testid='message'], .font-claude-message, main",
  sendButton: "button[aria-label*='Send'], button:has-text('Send')",
  login: "text=/log in|sign up/i",
  rateLimit: "text=/limit|try again later|too many requests/i",
  humanCheck: "text=/captcha|verify you are human|security check/i"
};

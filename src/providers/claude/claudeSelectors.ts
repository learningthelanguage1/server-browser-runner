export const claudeSelectors = {
  composer: "div[contenteditable='true'], textarea",
  assistantResponse: "[data-testid='message'], .font-claude-message",
  sendButton: "button[aria-label*='Send'], button[aria-label*='Submit'], button[type='submit']",
  login: "text=/log in|sign up/i",
  rateLimit: "text=/limit|session limit|try again later|too many requests|resets at/i",
  humanCheck: "text=/captcha|verify you are human|security check/i"
};

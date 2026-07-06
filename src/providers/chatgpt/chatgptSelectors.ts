export const chatgptSelectors = {
  composer: "textarea, [contenteditable='true'], #prompt-textarea",
  assistantResponse: "[data-message-author-role='assistant'], .markdown",
  sendButton: "button[data-testid='send-button'], button[data-testid='composer-submit-button'], button[aria-label*='Send'], button[aria-label*='send']",
  login: "text=/log in|sign up/i",
  rateLimit: "text=/limit|try again later|too many requests/i",
  humanCheck: "text=/captcha|verify you are human|security check/i"
};

export function redactSecret(value: string): string {
  return value.replace(/(runner_secret|token|authorization)["':=\s]+[^\s"',}]+/gi, "$1=[REDACTED]");
}

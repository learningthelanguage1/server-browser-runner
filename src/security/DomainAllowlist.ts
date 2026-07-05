export function assertAllowedDomain(targetUrl: string, allowedDomains: string[]): void {
  const host = new URL(targetUrl).hostname;
  if (!allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    throw new Error(`DOMAIN_NOT_ALLOWED:${host}`);
  }
}

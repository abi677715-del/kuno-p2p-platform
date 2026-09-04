/** Best-effort "Browser on OS" summary for a login-activity list — not meant to be exhaustive. */
export function summarizeUserAgent(userAgent: string | undefined | null): string {
  if (!userAgent) return 'Unknown device';

  const os = /windows/i.test(userAgent)
    ? 'Windows'
    : /android/i.test(userAgent)
      ? 'Android'
      : /iphone|ipad|ipod/i.test(userAgent)
        ? 'iOS'
        : /mac os/i.test(userAgent)
          ? 'macOS'
          : /linux/i.test(userAgent)
            ? 'Linux'
            : 'Unknown OS';

  const browser = /edg\//i.test(userAgent)
    ? 'Edge'
    : /chrome\//i.test(userAgent)
      ? 'Chrome'
      : /firefox\//i.test(userAgent)
        ? 'Firefox'
        : /safari\//i.test(userAgent)
          ? 'Safari'
          : 'Unknown browser';

  return `${browser} on ${os}`;
}

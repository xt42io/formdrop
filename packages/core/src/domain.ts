/**
 * Domain allowlisting for the public collect endpoint.
 *
 * Behaviour here is a faithful lift of what `apps/api` did inline, deliberately
 * unchanged: `POST /f/:slug` is live traffic, and the PRD schedules the
 * correction for the Elysia port so it lands with contract tests behind it
 * (W2, "Fix during the port and cover with tests").
 *
 * Two known bypasses are pinned by tests below so the fix is a visible diff
 * rather than a silent behaviour change:
 *
 *  1. The caller only consults this when an Origin or Referer header is
 *     present, so a request with neither is allowed through regardless of the
 *     allowlist.
 *  2. The `origin.includes(domain)` fallback is a substring match, so
 *     `evil-example.com.attacker.test` satisfies an allowlist of
 *     `example.com`.
 */
export function isDomainAllowed(
  origin: string,
  allowedDomains: string[],
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true; // Empty array means allow all
  }

  try {
    const originHost = new URL(origin).hostname;

    return allowedDomains.some((domain) => {
      // Support wildcards like *.example.com
      if (domain.startsWith("*.")) {
        const baseDomain = domain.slice(2);
        return originHost.endsWith(baseDomain);
      }
      return originHost === domain || origin.includes(domain);
    });
  } catch {
    return false;
  }
}

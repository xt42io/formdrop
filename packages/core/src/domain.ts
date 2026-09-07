/**
 * Domain allowlisting for the public collect endpoint.
 *
 * W2 calls out three ways the original could be walked past, and fixes all
 * three here ("Fix during the port and cover with tests"):
 *
 *  1. A substring fallback: `origin.includes(domain)` meant an allowlist of
 *     `example.com` admitted `example.com.attacker.test`. Gone -- a bare entry
 *     now matches that host and nothing else.
 *  2. A wildcard with no dot boundary: `*.example.com` stripped the `*.` and
 *     called endsWith, so `notexample.com` passed. A wildcard now requires
 *     either the apex itself or a real dot-separated subdomain.
 *  3. The check was skipped entirely when a request carried no Origin or
 *     Referer header. That one is a property of the *caller*, so it is closed
 *     by isRequestOriginAllowed below rather than here.
 *
 * COMPATIBILITY: (1) is a tightening with a visible consequence. An allowlist
 * of `example.com` used to admit `www.example.com` through the substring
 * fallback and no longer does -- that now needs `*.example.com`. This is the
 * behaviour W2 asks for, but it is a change to live traffic, not a no-op.
 */
export function isDomainAllowed(
  origin: string,
  allowedDomains: string[],
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true; // Empty array means allow all
  }

  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }

  return allowedDomains.some((entry) => {
    // Hostnames are case-insensitive, and an entry typed with a stray space
    // should not silently never match.
    const domain = entry.trim().toLowerCase();
    if (!domain) return false;

    if (domain.startsWith("*.")) {
      const base = domain.slice(2);
      if (!base) return false;

      // The apex is included deliberately: the previous endsWith already
      // admitted it, so excluding it now would break allowlists that work
      // today. The dot is what stops `notexample.com`.
      return host === base || host.endsWith(`.${base}`);
    }

    return host === domain;
  });
}

/**
 * The allowlist decision for an actual request.
 *
 * Express consulted the allowlist only when an Origin or Referer header was
 * present -- `if (origin && !isDomainAllowed(...))` -- so a request with
 * neither header skipped the check completely. Since those headers are set by
 * browsers and simply omitted by anything else, that made the allowlist
 * trivial to walk past.
 *
 * A form with no allowlist still accepts anything, which is what makes
 * server-to-server posting work at all. But once an owner has configured one,
 * a request that cannot say where it came from is not on it.
 */
export function isRequestOriginAllowed(
  origin: string | null | undefined,
  allowedDomains: string[],
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true;
  }

  if (!origin) {
    return false;
  }

  return isDomainAllowed(origin, allowedDomains);
}

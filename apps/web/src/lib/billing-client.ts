/**
 * The Polar-enabled auth client, fetched only when somebody buys something.
 *
 * `polarClient()` was a plugin on the shared auth client in ./auth-client,
 * which put it in the entry chunk on every page. It does not arrive alone:
 * measured against the built bundle, it pulled better-auth, @better-auth/core,
 * better-call, @noble/ciphers and jose in with it -- 613 KB of source, more
 * than react-dom, on a landing page whose only use of auth is deciding
 * whether the button says "Dashboard" or "Get started".
 *
 * That is a packaging problem in the plugin rather than something we can
 * configure away, so the fix is not to load it until it is wanted. Both
 * things that want it -- Upgrade and Manage subscription -- are buttons, so
 * the import happens on a click, while the reader is already expecting a
 * redirect to a payment page.
 *
 * A second client instance rather than a plugin added to the first, because
 * better-auth builds its method surface at construction and cannot be
 * extended afterwards. It shares the browser's cookies, so it is the same
 * session; only the Polar endpoints differ.
 */
type BillingClient = {
  checkout: (options: { slug: string }) => Promise<unknown>;
  customer: { portal: () => Promise<unknown> };
};

let pending: Promise<BillingClient> | null = null;

export function getBillingClient(): Promise<BillingClient> {
  // Memoised on the promise, not the result, so two quick clicks share one
  // download instead of racing two.
  pending ??= (async () => {
    const [{ createAuthClient }, { polarClient }] = await Promise.all([
      import("better-auth/react"),
      import("@polar-sh/better-auth"),
    ]);

    return createAuthClient({
      plugins: [polarClient()],
    }) as unknown as BillingClient;
  })();

  return pending;
}

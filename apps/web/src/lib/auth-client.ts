import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient } from "better-auth/client/plugins";

/**
 * The session client, loaded on every page.
 *
 * polarClient() used to be in this list. It brought better-auth's server
 * stack with it -- better-auth, @better-auth/core, better-call,
 * @noble/ciphers and jose, 613 KB of source measured against the built
 * bundle -- onto the landing page, which uses auth only to choose a button
 * label. It now lives in ./billing-client and is fetched when somebody
 * clicks Upgrade or Manage subscription.
 */

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

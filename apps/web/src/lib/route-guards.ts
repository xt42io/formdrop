import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Who the caller is, decided on the server.
 *
 * Both guards run in beforeLoad. On a full page load that executes during
 * SSR, so a visitor who should not be here is redirected before any of the
 * page is generated; on a client navigation it becomes an RPC to the same
 * function, so the answer still comes from the server rather than from a
 * session object the visitor can reach.
 *
 * Each reports a boolean rather than the session. A route only needs to know
 * whether to continue, and returning the user would put their record into the
 * page payload for no reason.
 */

/**
 * The signed-in user, or null.
 *
 * Auth is imported here rather than at module scope: this module is reachable
 * from the client bundle through the routes' beforeLoad, and auth pulls in the
 * database client.
 */
async function currentUser() {
  const { auth } = await import("./auth");

  const session = await auth.api.getSession({
    headers: getRequest().headers,
  });

  return session?.user ?? null;
}

/**
 * Whether anyone is signed in at all, for the account dashboard.
 *
 * /app had no guard. The mock always supplied a session, so a logged-out
 * visitor was never seen -- and once it was removed they got the dashboard
 * shell, skeletons that never resolve and a stream of 401s, rather than the
 * login page.
 */
export const isCallerAuthenticated = createServerFn({ method: "GET" }).handler(
  async () => ({ isAuthenticated: (await currentUser()) !== null }),
);

/**
 * Whether the caller is an admin, decided on the server (PRD 4.6).
 *
 * 4.6 asks that "admin routes carry a server-side role check, not just a
 * hidden nav item". Every /api/admin handler has always checked the role, so
 * the data was never exposed -- but the route itself decided in the component,
 * which meant the admin shell painted for a moment before redirecting, and the
 * decision was made by code the visitor controls.
 *
 * This runs in beforeLoad. On a full page load it executes during SSR, so a
 * non-admin is redirected before any admin markup is generated; on a client
 * navigation it is an RPC to the same function, so the answer still comes from
 * the server rather than from a session object in the browser.
 *
 * It reports a boolean rather than the session. The route only needs to know
 * whether to continue, and returning the user would put an admin's record into
 * the page payload for no reason.
 */
export const isCallerAdmin = createServerFn({ method: "GET" }).handler(
  async () => ({ isAdmin: (await currentUser())?.role === "admin" }),
);

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { MOCK_ENABLED } from "./mock-data";

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
  async () => {
    // The mock fabricates an admin session in the browser, so with it on there
    // is no real session for this to read and the admin surface would be
    // unreachable in the very mode built to preview it.
    //
    // This does not widen anything. When the mock is on it is already
    // answering /api/auth/get-session with an administrator, so the flag is
    // the security boundary either way -- this keeps the server agreeing with
    // the client instead of the two contradicting each other. The mock and
    // this branch are removed together.
    if (MOCK_ENABLED) {
      console.warn(
        "[FormDrop] VITE_MOCK_DATA=1 - the admin role check is bypassed.",
      );
      return { isAdmin: true };
    }

    // Imported here rather than at module scope: this module is reachable from
    // the client bundle through the route's beforeLoad, and auth pulls in the
    // database client.
    const { auth } = await import("./auth");

    const session = await auth.api.getSession({
      headers: getRequest().headers,
    });

    return { isAdmin: session?.user?.role === "admin" };
  },
);

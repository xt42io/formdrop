import { Elysia, t } from "elysia";
import { findApiKeyByValue, touchApiKeyLastUsed } from "@formdrop/core/data";

/**
 * API-key authentication, as a macro so a route opts in with `apiKey: true`
 * and receives the resolved key -- rather than Express's pattern of attaching
 * it to the request object behind an `any` cast and hoping the handler
 * remembers it is there.
 *
 * Error bodies match the Express middleware exactly, because W2's acceptance
 * is byte-compatible responses on the legacy paths.
 */
export const UNAUTHENTICATED = {
  MISSING: "API key required in Authorization header",
  INVALID: "Invalid API key",
} as const;

export const errorResponse = t.Object({ error: t.String() });

export const apiKeyAuth = new Elysia({ name: "api-key-auth" }).macro({
  apiKey: {
    async resolve({ headers, status }) {
      const presented = headers.authorization?.replace("Bearer ", "");

      if (!presented) {
        return status(401, { error: UNAUTHENTICATED.MISSING });
      }

      const key = await findApiKeyByValue(presented);
      if (!key) {
        return status(401, { error: UNAUTHENTICATED.INVALID });
      }

      // Not awaited: Express blocks every authenticated request on this write.
      // Nothing reads lastUsedAt synchronously, so the request does not need
      // to wait for it -- but a rejection still has to be swallowed, or Bun
      // reports an unhandled rejection.
      void touchApiKeyLastUsed(key.id).catch((error: unknown) => {
        console.error("failed to record api key usage", error);
      });

      return { key };
    },
  },
});

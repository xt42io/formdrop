import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { apiKeys } from "@formdrop/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const generateApiKey = () => {
  return `fd_${crypto.randomBytes(24).toString("hex")}`;
};

export const Route = createFileRoute("/api/api-keys")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;

          // Get existing keys
          let userApiKeys = await db
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.userId, userId))
            .orderBy(desc(apiKeys.createdAt));

          return Response.json({
            keys: userApiKeys,
          });
        } catch (error: any) {
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },

      POST: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const body = await request.json();
          const { name } = body;

          const [newKey] = await db
            .insert(apiKeys)
            .values({
              userId,
              key: generateApiKey(),
              name: name || "New API Key",
            })
            .returning();

          return Response.json({ key: newKey });
        } catch (error: any) {
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },

      DELETE: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const body = await request.json();
          const { id } = body;

          if (!id) {
            return Response.json(
              { error: "Key ID is required" },
              { status: 400 },
            );
          }

          // Prevent deleting the last key? Maybe not strictly required but good practice.
          // For now, let's allow deleting any key.

          await db
            .delete(apiKeys)
            .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

          return Response.json({ success: true });
        } catch (error: any) {
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

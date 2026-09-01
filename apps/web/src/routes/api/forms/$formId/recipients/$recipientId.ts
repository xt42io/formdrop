import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms, emailNotificationRecipients } from "@formdrop/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute(
  "/api/forms/$formId/recipients/$recipientId",
)({
  server: {
    handlers: {
      DELETE: async ({
        request,
        params,
      }: {
        request: Request;
        params: { formId: string; recipientId: string };
      }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId, recipientId } = params;

          // Verify form belongs to user
          const [form] = await db
            .select()
            .from(forms)
            .where(
              and(
                eq(forms.id, formId),
                eq(forms.userId, userId),
                isNull(forms.deletedAt),
              ),
            )
            .limit(1);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          await db
            .delete(emailNotificationRecipients)
            .where(
              and(
                eq(emailNotificationRecipients.id, recipientId),
                eq(emailNotificationRecipients.formId, formId),
              ),
            );

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

      PATCH: async ({
        request,
        params,
      }: {
        request: Request;
        params: { formId: string; recipientId: string };
      }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId, recipientId } = params;
          const { enabled } = await request.json();

          // Verify form belongs to user
          const [form] = await db
            .select()
            .from(forms)
            .where(
              and(
                eq(forms.id, formId),
                eq(forms.userId, userId),
                isNull(forms.deletedAt),
              ),
            )
            .limit(1);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          const [recipient] = await db
            .update(emailNotificationRecipients)
            .set({ enabled })
            .where(
              and(
                eq(emailNotificationRecipients.id, recipientId),
                eq(emailNotificationRecipients.formId, formId),
              ),
            )
            .returning();

          return Response.json({ recipient });
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

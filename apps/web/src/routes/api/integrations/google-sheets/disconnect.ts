import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute(
  "/api/integrations/google-sheets/disconnect",
)({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = await request.json();
          const { formId } = body;

          if (!formId) {
            return Response.json(
              { error: "formId is required" },
              { status: 400 },
            );
          }

          // Verify form belongs to user
          const [form] = await db
            .select()
            .from(forms)
            .where(
              and(
                eq(forms.id, formId),
                eq(forms.userId, session.user.id),
                isNull(forms.deletedAt),
              ),
            )
            .limit(1);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          // Clear Google Sheets integration data
          await db
            .update(forms)
            .set({
              googleSheetsAccessToken: null,
              googleSheetsRefreshToken: null,
              googleSheetsTokenExpiry: null,
              googleSheetsSpreadsheetId: null,
              googleSheetsSpreadsheetName: null,
              googleSheetsSheetId: null,
              googleSheetsEnabled: false,
            })
            .where(eq(forms.id, formId));

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

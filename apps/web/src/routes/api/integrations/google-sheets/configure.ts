import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute(
  "/api/integrations/google-sheets/configure",
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
          const { formId, spreadsheetId, spreadsheetName } = body;

          if (!formId || !spreadsheetId || !spreadsheetName) {
            return Response.json(
              {
                error:
                  "formId, spreadsheetId, and spreadsheetName are required",
              },
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

          if (!form.googleSheetsAccessToken) {
            return Response.json(
              { error: "Google Sheets not connected" },
              { status: 400 },
            );
          }

          // Update form with spreadsheet info and enable integration
          await db
            .update(forms)
            .set({
              googleSheetsSpreadsheetId: spreadsheetId,
              googleSheetsSpreadsheetName: spreadsheetName,
              googleSheetsEnabled: true,
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

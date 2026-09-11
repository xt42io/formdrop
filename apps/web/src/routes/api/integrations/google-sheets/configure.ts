import { createFileRoute } from "@tanstack/react-router";
import { findOwnedForm, updateFormById } from "@formdrop/core/data";
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

          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          if (!form.googleSheetsAccessToken) {
            return Response.json(
              { error: "Google Sheets not connected" },
              { status: 400 },
            );
          }

          await updateFormById(formId, {
            googleSheetsSpreadsheetId: spreadsheetId,
            googleSheetsSpreadsheetName: spreadsheetName,
            googleSheetsEnabled: true,
          });

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

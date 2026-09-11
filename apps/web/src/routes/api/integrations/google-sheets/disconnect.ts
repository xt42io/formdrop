import { createFileRoute } from "@tanstack/react-router";
import { findOwnedForm, updateFormById } from "@formdrop/core/data";
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

          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          await updateFormById(formId, {
            googleSheetsAccessToken: null,
            googleSheetsRefreshToken: null,
            googleSheetsTokenExpiry: null,
            googleSheetsSpreadsheetId: null,
            googleSheetsSpreadsheetName: null,
            googleSheetsSheetId: null,
            googleSheetsEnabled: false,
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

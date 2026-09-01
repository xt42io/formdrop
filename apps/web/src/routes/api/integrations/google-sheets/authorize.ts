import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isUserPro } from "@/lib/subscription-check";

export const Route = createFileRoute(
  "/api/integrations/google-sheets/authorize",
)({
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

          const url = new URL(request.url);
          const formId = url.searchParams.get("formId");

          if (!formId) {
            return Response.json(
              { error: "formId is required" },
              { status: 400 },
            );
          }

          const isPro = await isUserPro(session.user.id);
          if (!isPro) {
            return Response.redirect(
              `${url.origin}/app/forms/${formId}/integrations?error=requires_pro`,
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

          const clientId = process.env.GOOGLE_CLIENT_ID;
          const redirectUri = `${process.env.APP_URL}/api/integrations/google-sheets/callback`;

          if (!clientId) {
            return Response.json(
              { error: "Google Sheets integration not configured" },
              { status: 500 },
            );
          }

          // Build Google OAuth URL
          const googleAuthUrl = new URL(
            "https://accounts.google.com/o/oauth2/v2/auth",
          );
          googleAuthUrl.searchParams.set("client_id", clientId);
          googleAuthUrl.searchParams.set(
            "scope",
            "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
          );
          googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
          googleAuthUrl.searchParams.set("response_type", "code");
          googleAuthUrl.searchParams.set("access_type", "offline");
          googleAuthUrl.searchParams.set("prompt", "consent");
          googleAuthUrl.searchParams.set("state", formId); // Pass formId in state

          // Redirect to Google OAuth
          return Response.redirect(googleAuthUrl.toString(), 302);
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

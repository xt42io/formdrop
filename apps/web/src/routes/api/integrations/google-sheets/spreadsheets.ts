import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { refreshGoogleSheetsToken } from "@/lib/google-sheets";

export const Route = createFileRoute(
  "/api/integrations/google-sheets/spreadsheets",
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

          // Get form with tokens
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

          // Check if token is expired or about to expire (within 5 minutes)
          let accessToken = form.googleSheetsAccessToken;
          const isExpired =
            form.googleSheetsTokenExpiry &&
            new Date(form.googleSheetsTokenExpiry).getTime() - 5 * 60 * 1000 <
              Date.now();

          if (isExpired && form.googleSheetsRefreshToken) {
            try {
              const { accessToken: newAccessToken, expiresIn } =
                await refreshGoogleSheetsToken(form.googleSheetsRefreshToken);

              accessToken = newAccessToken;
              const newExpiry = new Date(Date.now() + expiresIn * 1000);

              // Update form with new token
              await db
                .update(forms)
                .set({
                  googleSheetsAccessToken: newAccessToken,
                  googleSheetsTokenExpiry: newExpiry,
                })
                .where(eq(forms.id, formId));
            } catch (error) {
              console.error("Failed to refresh Google Sheets token:", error);
              // Continue with old token if refresh fails, or return error
              // For now we'll try to proceed, but it will likely fail at the API call
            }
          }

          // List spreadsheets from Google Drive
          const response = await fetch(
            "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=50&fields=files(id,name,modifiedTime)",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (!response.ok) {
            const error = await response.json();
            return Response.json(
              { error: "Failed to fetch spreadsheets", details: error },
              { status: response.status },
            );
          }

          const data = await response.json();

          return Response.json({
            spreadsheets: data.files || [],
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
    },
  },
});

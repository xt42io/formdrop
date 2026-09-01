import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq } from "drizzle-orm";

export const Route = createFileRoute(
  "/api/integrations/google-sheets/callback",
)({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state"); // formId
          const error = url.searchParams.get("error");

          if (error) {
            // User denied access
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${state}/integrations?error=google_sheets_denied`,
              302,
            );
          }

          if (!code || !state) {
            return Response.json(
              { error: "Missing code or state" },
              { status: 400 },
            );
          }

          const formId = state;

          // Exchange code for access token
          const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code,
                redirect_uri: `${process.env.APP_URL}/api/integrations/google-sheets/callback`,
                grant_type: "authorization_code",
              }),
            },
          );

          const tokenData = await tokenResponse.json();

          if (tokenData.error) {
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${formId}/integrations?error=google_sheets_failed`,
              302,
            );
          }

          const accessToken = tokenData.access_token;
          const refreshToken = tokenData.refresh_token;
          const expiresIn = tokenData.expires_in; // seconds
          const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

          if (!accessToken) {
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${formId}/integrations?error=google_sheets_no_token`,
              302,
            );
          }

          // Get form info to create spreadsheet name
          const [form] = await db
            .select()
            .from(forms)
            .where(eq(forms.id, formId))
            .limit(1);

          if (!form) {
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${formId}/integrations?error=form_not_found`,
              302,
            );
          }

          // Create a new spreadsheet automatically
          const createSpreadsheetResponse = await fetch(
            "https://sheets.googleapis.com/v4/spreadsheets",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                properties: {
                  title: `FormDrop - ${form.name}`,
                },
              }),
            },
          );

          if (!createSpreadsheetResponse.ok) {
            console.error(
              "Failed to create spreadsheet:",
              await createSpreadsheetResponse.text(),
            );
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${formId}/integrations?error=spreadsheet_creation_failed`,
              302,
            );
          }

          const spreadsheetData = await createSpreadsheetResponse.json();
          const spreadsheetId = spreadsheetData.spreadsheetId;
          const spreadsheetName = spreadsheetData.properties.title;

          // Update form with Google Sheets tokens and spreadsheet info
          await db
            .update(forms)
            .set({
              googleSheetsAccessToken: accessToken,
              googleSheetsRefreshToken: refreshToken,
              googleSheetsTokenExpiry: tokenExpiry,
              googleSheetsSpreadsheetId: spreadsheetId,
              googleSheetsSpreadsheetName: spreadsheetName,
              googleSheetsEnabled: true, // Enable immediately
            })
            .where(eq(forms.id, formId));

          // Redirect back to integrations page with success
          return Response.redirect(
            `${process.env.APP_URL}/app/forms/${formId}/integrations?success=google_sheets_connected`,
            302,
          );
        } catch (error: any) {
          console.error("Google Sheets OAuth error:", error);
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

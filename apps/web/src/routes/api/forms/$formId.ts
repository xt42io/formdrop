import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/forms/$formId")({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { formId: string };
      }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId } = params;

          const [form] = await db
            .select({
              id: forms.id,
              userId: forms.userId,
              name: forms.name,
              slug: forms.slug,
              description: forms.description,
              allowedDomains: forms.allowedDomains,
              emailNotificationsEnabled: forms.emailNotificationsEnabled,
              slackNotificationsEnabled: forms.slackNotificationsEnabled,
              slackChannelName: forms.slackChannelName,
              slackTeamName: forms.slackTeamName,
              discordNotificationsEnabled: forms.discordNotificationsEnabled,
              discordChannelName: forms.discordChannelName,
              discordGuildName: forms.discordGuildName,
              googleSheetsEnabled: forms.googleSheetsEnabled,
              googleSheetsSpreadsheetName: forms.googleSheetsSpreadsheetName,
              googleSheetsSpreadsheetId: forms.googleSheetsSpreadsheetId,
              googleSheetsConnected: sql<boolean>`${forms.googleSheetsAccessToken} IS NOT NULL`,
              airtableEnabled: forms.airtableEnabled,
              airtableBaseName: forms.airtableBaseName,
              airtableTableName: forms.airtableTableName,
              airtableConnected: sql<boolean>`${forms.airtableAccessToken} IS NOT NULL`,
              slackConnected: sql<boolean>`${forms.slackWebhookUrl} IS NOT NULL`,
              discordConnected: sql<boolean>`${forms.discordWebhookUrl} IS NOT NULL`,
              createdAt: forms.createdAt,
              updatedAt: forms.updatedAt,
            })
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

          return Response.json({ form });
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
        params: { formId: string };
      }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId } = params;

          const body = await request.json();
          const {
            name,
            description,
            allowedDomains,
            emailNotificationsEnabled,
            slackNotificationsEnabled,
            discordNotificationsEnabled,
            googleSheetsEnabled,
            airtableEnabled,
          } = body;

          // Verify form belongs to user
          const [existingForm] = await db
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

          if (!existingForm) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          const [updatedForm] = await db
            .update(forms)
            .set({
              name: name ?? existingForm.name,
              description: description ?? existingForm.description,
              allowedDomains: allowedDomains ?? existingForm.allowedDomains,
              emailNotificationsEnabled:
                emailNotificationsEnabled ??
                existingForm.emailNotificationsEnabled,
              slackNotificationsEnabled:
                slackNotificationsEnabled ??
                existingForm.slackNotificationsEnabled,
              discordNotificationsEnabled:
                discordNotificationsEnabled ??
                existingForm.discordNotificationsEnabled,
              googleSheetsEnabled:
                googleSheetsEnabled !== undefined
                  ? googleSheetsEnabled
                  : existingForm.googleSheetsEnabled,
              airtableEnabled:
                airtableEnabled !== undefined
                  ? airtableEnabled
                  : existingForm.airtableEnabled,
              updatedAt: new Date(),
            })
            .where(eq(forms.id, formId))
            .returning();

          return Response.json({ form: updatedForm });
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

      DELETE: async ({
        request,
        params,
      }: {
        request: Request;
        params: { formId: string };
      }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const userId = session.user.id;
          const { formId } = params;

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
            .update(forms)
            .set({ deletedAt: new Date() })
            .where(eq(forms.id, formId));

          return Response.json({ message: "Form deleted" });
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

import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms, usage } from "@formdrop/db/schema";
import { eq, desc, sql, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/forms")({
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

          const userForms = await db
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
              submissionCount: sql<number>`cast(coalesce(sum(${usage.count}), 0) as integer)`,
            })
            .from(forms)
            .leftJoin(usage, eq(forms.id, usage.formId))
            .where(and(eq(forms.userId, userId), isNull(forms.deletedAt)))
            .groupBy(forms.id)
            .orderBy(desc(forms.createdAt));

          return Response.json({ forms: userForms });
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
          const { name, description, allowedDomains } = body;

          if (!name) {
            return Response.json(
              { error: "Form name is required" },
              { status: 400 },
            );
          }

          const existingForm = await db.query.forms.findFirst({
            where: and(
              eq(forms.userId, userId),
              eq(forms.name, name),
              isNull(forms.deletedAt),
            ),
          });

          if (existingForm) {
            return Response.json(
              { error: "You already have a form with this name" },
              { status: 409 },
            );
          }

          const chars =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let slug = "";
          for (let i = 0; i < 8; i++) {
            slug += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          const [form] = await db
            .insert(forms)
            .values({
              userId,
              name,
              slug,
              description: description || null,
              allowedDomains: allowedDomains || [],
            })
            .returning();

          return Response.json({ form }, { status: 201 });
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

import { createFileRoute } from "@tanstack/react-router";
import {
  findFormDetailForUser,
  findOwnedForm,
  softDeleteForm,
  updateFormById,
} from "@formdrop/core/data";
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

          const form = await findFormDetailForUser(
            params.formId,
            session.user.id,
          );

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
          const existingForm = await findOwnedForm(formId, session.user.id);

          if (!existingForm) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          // The merge stays here: it depends on which keys the request sent,
          // and the two spellings below are not interchangeable — ?? keeps a
          // sent `false`, while the !== undefined checks are what let the
          // Sheets and Airtable toggles be turned off at all.
          const updatedForm = await updateFormById(formId, {
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
          });

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

          const { formId } = params;

          // Verify form belongs to user
          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          await softDeleteForm(formId);

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

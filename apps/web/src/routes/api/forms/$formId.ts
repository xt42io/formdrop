import { createFileRoute } from "@tanstack/react-router";
import {
  findFormDetailForUser,
  findOwnedForm,
  softDeleteForm,
  updateFormById,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

const GET = async ({
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
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await findFormDetailForUser(params.formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    return json({ form });
  } catch (error: any) {
    return json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
};

const PATCH = async ({
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
      return json({ error: "Unauthorized" }, { status: 401 });
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

    const existingForm = await findOwnedForm(formId, session.user.id);

    if (!existingForm) {
      return json({ error: "Form not found" }, { status: 404 });
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
        emailNotificationsEnabled ?? existingForm.emailNotificationsEnabled,
      slackNotificationsEnabled:
        slackNotificationsEnabled ?? existingForm.slackNotificationsEnabled,
      discordNotificationsEnabled:
        discordNotificationsEnabled ?? existingForm.discordNotificationsEnabled,
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

    return json({ form: updatedForm });
  } catch (error: any) {
    return json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
};

const DELETE = async ({
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
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId } = params;

    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    await softDeleteForm(formId);

    return json({ message: "Form deleted" });
  } catch (error: any) {
    return json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
};

export type FormsFormidGetResponse = HandlerPayload<typeof GET>;
export type FormsFormidPatchResponse = HandlerPayload<typeof PATCH>;
export type FormsFormidDeleteResponse = HandlerPayload<typeof DELETE>;

export const Route = createFileRoute("/api/forms/$formId")({
  server: { handlers: { GET, PATCH, DELETE } },
});

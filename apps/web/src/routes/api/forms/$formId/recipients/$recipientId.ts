import { createFileRoute } from "@tanstack/react-router";
import {
  deleteRecipient,
  findOwnedForm,
  setRecipientEnabled,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

const DELETE = async ({
  request,
  params,
}: {
  request: Request;
  params: { formId: string; recipientId: string };
}) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId, recipientId } = params;

    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    await deleteRecipient(formId, recipientId);

    return json({ success: true });
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
  params: { formId: string; recipientId: string };
}) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId, recipientId } = params;
    const { enabled } = await request.json();

    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    const recipient = await setRecipientEnabled(formId, recipientId, enabled);

    return json({ recipient });
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

export type FormsFormidRecipientsRecipientidDeleteResponse = HandlerPayload<
  typeof DELETE
>;
export type FormsFormidRecipientsRecipientidPatchResponse = HandlerPayload<
  typeof PATCH
>;

export const Route = createFileRoute(
  "/api/forms/$formId/recipients/$recipientId",
)({
  server: { handlers: { DELETE, PATCH } },
});

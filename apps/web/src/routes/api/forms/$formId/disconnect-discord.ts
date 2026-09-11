import { createFileRoute } from "@tanstack/react-router";
import { disconnectDiscord, findOwnedForm } from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

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

    await disconnectDiscord(formId);

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

export type FormsFormidDisconnectDiscordDeleteResponse = HandlerPayload<
  typeof DELETE
>;

export const Route = createFileRoute("/api/forms/$formId/disconnect-discord")({
  server: { handlers: { DELETE } },
});

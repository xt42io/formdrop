import { createFileRoute } from "@tanstack/react-router";
import {
  findOwnedForm,
  findSubmissionInForm,
  softDeleteSubmission,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

const GET = async ({
  request,
  params,
}: {
  request: Request;
  params: { formId: string; submissionId: string };
}) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId, submissionId } = params;

    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    const submission = await findSubmissionInForm(formId, submissionId);

    if (!submission) {
      return json({ error: "Submission not found" }, { status: 404 });
    }

    return json({ submission });
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
  params: { formId: string; submissionId: string };
}) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId, submissionId } = params;

    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    await softDeleteSubmission(formId, submissionId);

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

export type FormsFormidSubmissionsSubmissionidGetResponse = HandlerPayload<
  typeof GET
>;
export type FormsFormidSubmissionsSubmissionidDeleteResponse = HandlerPayload<
  typeof DELETE
>;

export const Route = createFileRoute(
  "/api/forms/$formId/submissions/$submissionId",
)({
  server: { handlers: { GET, DELETE } },
});

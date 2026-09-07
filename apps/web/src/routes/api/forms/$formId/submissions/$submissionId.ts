import { createFileRoute } from "@tanstack/react-router";
import {
  findOwnedForm,
  findSubmissionInForm,
  softDeleteSubmission,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";

export const Route = createFileRoute(
  "/api/forms/$formId/submissions/$submissionId",
)({
  server: {
    handlers: {
      GET: async ({
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
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { formId, submissionId } = params;

          // Verify form belongs to user
          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          const submission = await findSubmissionInForm(formId, submissionId);

          if (!submission) {
            return Response.json(
              { error: "Submission not found" },
              { status: 404 },
            );
          }

          return Response.json({ submission });
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
        params: { formId: string; submissionId: string };
      }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { formId, submissionId } = params;

          // Verify form belongs to user
          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          // Soft delete submission
          await softDeleteSubmission(formId, submissionId);

          return Response.json({ success: true });
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

import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { submissions, forms } from "@formdrop/db/schema";
import { eq, and, isNull } from "drizzle-orm";
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

          const userId = session.user.id;
          const { formId, submissionId } = params;

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

          const [submission] = await db
            .select()
            .from(submissions)
            .where(
              and(
                eq(submissions.id, submissionId),
                eq(submissions.formId, formId),
              ),
            )
            .limit(1);

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

          const userId = session.user.id;
          const { formId, submissionId } = params;

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

          // Soft delete submission
          await db
            .update(submissions)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(submissions.id, submissionId),
                eq(submissions.formId, formId),
              ),
            );

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

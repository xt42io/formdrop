import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { submissions, forms } from "@formdrop/db/schema";
import { eq, and, desc, isNull, inArray, count } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/forms/$formId/submissions")({
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
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "50");
          const offset = (page - 1) * limit;

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

          const [totalResult] = await db
            .select({ count: count() })
            .from(submissions)
            .where(
              and(
                eq(submissions.formId, formId),
                isNull(submissions.deletedAt),
              ),
            );

          const total = totalResult?.count || 0;

          const allSubmissions = await db
            .select()
            .from(submissions)
            .where(
              and(
                eq(submissions.formId, formId),
                isNull(submissions.deletedAt),
              ),
            )
            .orderBy(desc(submissions.createdAt))
            .limit(limit)
            .offset(offset);

          return Response.json({
            submissions: allSubmissions,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
          });
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
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId } = params;
          const { submissionIds } = await request.json();

          if (
            !submissionIds ||
            !Array.isArray(submissionIds) ||
            submissionIds.length === 0
          ) {
            return Response.json(
              { error: "Invalid submission IDs" },
              { status: 400 },
            );
          }

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

          // Verify submissions belong to form
          const validSubmissions = await db
            .select()
            .from(submissions)
            .where(
              and(
                inArray(submissions.id, submissionIds),
                eq(submissions.formId, formId),
              ),
            );

          if (validSubmissions.length !== submissionIds.length) {
            return Response.json(
              { error: "Invalid submission IDs" },
              { status: 400 },
            );
          }

          // Soft delete submissions
          await db
            .update(submissions)
            .set({ deletedAt: new Date() })
            .where(inArray(submissions.id, submissionIds));

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

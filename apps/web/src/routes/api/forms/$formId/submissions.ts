import { createFileRoute } from "@tanstack/react-router";
import {
  countSubmissionsForForm,
  findOwnedForm,
  findSubmissionsInForm,
  listSubmissionsForForm,
  softDeleteSubmissions,
} from "@formdrop/core/data";
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

          const { formId } = params;
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "50");
          const offset = (page - 1) * limit;

          // Verify form belongs to user
          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          const total = await countSubmissionsForForm(formId);

          const allSubmissions = await listSubmissionsForForm(formId, {
            limit,
            offset,
          });

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
          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          // Verify submissions belong to form
          const validSubmissions = await findSubmissionsInForm(
            formId,
            submissionIds,
          );

          if (validSubmissions.length !== submissionIds.length) {
            return Response.json(
              { error: "Invalid submission IDs" },
              { status: 400 },
            );
          }

          // Soft delete submissions
          await softDeleteSubmissions(submissionIds);

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

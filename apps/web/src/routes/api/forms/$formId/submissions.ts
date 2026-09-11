import { createFileRoute } from "@tanstack/react-router";
import {
  countSubmissionsForForm,
  findOwnedForm,
  findSubmissionsInForm,
  listSubmissionsForForm,
  softDeleteSubmissions,
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

    const { formId } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    const total = await countSubmissionsForForm(formId);

    const allSubmissions = await listSubmissionsForForm(formId, {
      limit,
      offset,
    });

    return json({
      submissions: allSubmissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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
    const { submissionIds } = await request.json();

    if (
      !submissionIds ||
      !Array.isArray(submissionIds) ||
      submissionIds.length === 0
    ) {
      return json({ error: "Invalid submission IDs" }, { status: 400 });
    }

    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    const validSubmissions = await findSubmissionsInForm(formId, submissionIds);

    if (validSubmissions.length !== submissionIds.length) {
      return json({ error: "Invalid submission IDs" }, { status: 400 });
    }

    await softDeleteSubmissions(submissionIds);

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

export type FormsFormidSubmissionsGetResponse = HandlerPayload<typeof GET>;
export type FormsFormidSubmissionsDeleteResponse = HandlerPayload<
  typeof DELETE
>;

export const Route = createFileRoute("/api/forms/$formId/submissions")({
  server: { handlers: { GET, DELETE } },
});

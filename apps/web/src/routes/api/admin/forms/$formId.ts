import { createFileRoute } from "@tanstack/react-router";
import { findFormById, softDeleteForm } from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

/**
 * Deleting any account's form.
 *
 * The admin forms table has had a delete button since it was written, calling
 * DELETE /api/admin/forms/:formId -- a path with no handler behind it. The
 * request fell through to the SPA catch-all, came back as HTML, and the page
 * reloaded as though it had worked. The row was still there afterwards, which
 * is the only way anyone would have noticed.
 *
 * Soft delete, matching every other delete in the product: the row keeps its
 * submissions and its usage history, and stops being served. `softDeleteForm`
 * is the same helper the account-facing and legacy API deletes use, so there
 * is one definition of what deleting a form means.
 *
 * The form is fetched first rather than deleting blind. Without it, deleting a
 * form that does not exist reports success -- and on this screen, where the
 * operator is acting on somebody else's data, "it said it worked" is not good
 * enough.
 */
const DELETE = async ({
  request,
  params,
}: {
  request: Request;
  params: { formId: string };
}) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    // Server-side, not a hidden nav item -- PRD 4.6. The route guard in the
    // layout only decides what paints.
    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // findFormById, not findOwnedForm: this is the cross-tenant surface, so
    // the form deliberately does not have to belong to the caller. That is the
    // whole point of the screen, and the reason the role check above is the
    // only thing standing in front of it.
    const form = await findFormById(params.formId);
    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    if (form.deletedAt) {
      // Already gone. Not an error -- a second click, or two operators on the
      // same row -- but worth answering honestly rather than reporting a fresh
      // deletion that did not happen.
      return json({ success: true, alreadyDeleted: true });
    }

    await softDeleteForm(form.id);

    console.log(
      `admin ${session.user.id} deleted form ${form.id} (owner ${form.userId})`,
    );

    return json({ success: true, alreadyDeleted: false });
  } catch (error) {
    console.error("Error deleting form as admin:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export type AdminFormsFormidDeleteResponse = HandlerPayload<typeof DELETE>;

export const Route = createFileRoute("/api/admin/forms/$formId")({
  server: { handlers: { DELETE } },
});

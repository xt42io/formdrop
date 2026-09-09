import { createFileRoute } from "@tanstack/react-router";
import {
  createRecipient,
  findOwnedForm,
  listRecipientRowsForForm,
  listRecipientsForForm,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { RecipientVerificationEmail } from "@/emails/RecipientVerificationEmail";
import crypto from "crypto";
import { isUserPro } from "@/lib/subscription-check";
import { getResend } from "@/lib/email";
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

    // Verify form belongs to user
    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    const recipients = await listRecipientsForForm(formId);

    return json({ recipients });
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

const POST = async ({
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

    const userId = session.user.id;
    const { formId } = params;
    const { email } = await request.json();

    if (!email) {
      return json({ error: "Email is required" }, { status: 400 });
    }

    // Verify form belongs to user
    const form = await findOwnedForm(formId, userId);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    // Check if user is pro
    const isPro = await isUserPro(userId);

    // Check recipient limit
    const existingRecipients = await listRecipientRowsForForm(formId);

    const limit = isPro ? 10 : 2;
    if (existingRecipients.length >= limit) {
      return json(
        {
          error: `You have reached the limit of ${limit} recipient${limit > 1 ? "s" : ""} for this form. Upgrade to Pro to add more.`,
        },
        { status: 403 },
      );
    }

    // Check if recipient already exists
    const existingRecipient = existingRecipients.find((r) => r.email === email);

    if (existingRecipient) {
      return json({ error: "Recipient already exists" }, { status: 400 });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24 hours

    // Create recipient
    const recipient = await createRecipient({
      formId,
      email,
      verificationToken,
      verificationTokenExpiresAt,
    });

    // Send verification email
    const verificationLink = `${process.env.APP_URL}/verify-recipient?token=${verificationToken}`;

    await getResend().emails.send({
      from: "FormDrop <noreply@mail.formdrop.co>",
      to: email,
      subject: "Verify your email address",
      react: RecipientVerificationEmail({
        verificationLink,
        formName: form.name,
      }),
    });

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

export type FormsFormidRecipientsGetResponse = HandlerPayload<typeof GET>;
export type FormsFormidRecipientsPostResponse = HandlerPayload<typeof POST>;

export const Route = createFileRoute("/api/forms/$formId/recipients")({
  server: { handlers: { GET, POST } },
});

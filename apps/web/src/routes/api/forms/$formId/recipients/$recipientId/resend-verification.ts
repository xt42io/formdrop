import { createFileRoute } from "@tanstack/react-router";
import {
  findOwnedForm,
  findRecipientInForm,
  setRecipientVerificationToken,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { RecipientVerificationEmail } from "@/emails/RecipientVerificationEmail";
import crypto from "crypto";
import { getResend } from "@/lib/email";
import { json, type HandlerPayload } from "@/lib/api/respond";

const POST = async ({
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

    const recipient = await findRecipientInForm(formId, recipientId);

    if (!recipient) {
      return json({ error: "Recipient not found" }, { status: 404 });
    }

    if (recipient.verifiedAt) {
      return json({ error: "Recipient already verified" }, { status: 400 });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24 hours

    await setRecipientVerificationToken(
      recipientId,
      verificationToken,
      verificationTokenExpiresAt,
    );

    const verificationUrl = `${process.env.APP_URL}/verify-recipient?token=${verificationToken}`;

    await getResend().emails.send({
      from: "FormDrop <noreply@formdrop.co>",
      to: recipient.email,
      subject: "Verify your email address",
      react: RecipientVerificationEmail({
        verificationLink: verificationUrl,
        formName: form.name,
      }),
    });

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

export type FormsFormidRecipientsRecipientidResendVerificationPostResponse =
  HandlerPayload<typeof POST>;

export const Route = createFileRoute(
  "/api/forms/$formId/recipients/$recipientId/resend-verification",
)({
  server: { handlers: { POST } },
});

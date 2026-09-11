import { NewSubmissionEmail, sendEmail } from "@formdrop/email";

import { recordNotificationUsage } from "./recordNotificationUsage";

interface SendEmailNotificationParams {
  recipientEmail: string;
  formName: string;
  data: Record<string, unknown>;
  userId: string;
  formId: string;
  submissionId: string;
  period: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * The new-submission notification (PRD W7).
 *
 * The body must stay a React Email component rather than an HTML string.
 * The payload is whatever a stranger typed into somebody else's form, and
 * building markup by interpolation puts a submitted tag straight into the
 * form owner's mail client. React escapes children; a template literal does
 * not.
 */
export async function sendEmailNotification({
  recipientEmail,
  formName,
  data,
  userId,
  formId,
  submissionId,
  period,
}: SendEmailNotificationParams): Promise<void> {
  try {
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      throw new Error(`Invalid email address: ${recipientEmail}`);
    }

    const appUrl = process.env.APP_URL;

    await sendEmail({
      to: recipientEmail,
      subject: `New submission for ${formName}`,
      templateName: "new_submission",
      userId,
      /*
       * One logical send is one submission to one recipient, and that pair is
       * stable across every retry the outbox makes.
       *
       * It matters because a send that reached the provider but timed out on
       * the way back is indistinguishable here from one that never left. The
       * worker retries either way, and without this the recipient gets the
       * same notification twice.
       */
      idempotencyKey: `submission:${submissionId}:${recipientEmail}`,
      template: NewSubmissionEmail({
        formName,
        payload: data,
        // Omitted rather than guessed at when APP_URL is unset: the template
        // drops the button, which beats a link to "undefined/app/...".
        submissionUrl: appUrl
          ? `${appUrl}/app/forms/${formId}/submissions`
          : undefined,
      }),
    });

    await recordNotificationUsage({
      userId,
      formId,
      submissionId,
      period,
      type: "email",
      target: recipientEmail,
    });
  } catch (error) {
    console.error("Failed to send email notification:", {
      error: error instanceof Error ? error.message : String(error),
      recipientEmail,
      formName,
      submissionId,
    });

    // Rethrown on purpose: the outbox worker is the caller, and a swallowed
    // failure here would mark the delivery succeeded and never retry it.
    throw error;
  }
}

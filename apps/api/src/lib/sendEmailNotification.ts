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
 * This file used to hold the whole send: a ZeptoMail client, a dead Plunk
 * path behind a hardcoded `EMAIL_PROVIDER` constant that could never be
 * anything but "zepto", and the email's markup as a template literal. All
 * three are gone. The provider is chosen once in @formdrop/email, the markup
 * is a React Email component, and every send gets a row in email_deliveries.
 *
 * The markup change is not only tidiness. The old HTML interpolated
 * submission values straight into a string, so a field containing a tag put
 * that tag in the notification -- content from a stranger, rendered in the
 * form owner's mail client. React escapes children, so the template cannot
 * do that.
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

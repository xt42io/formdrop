import { render } from "@react-email/render";
import { db } from "@formdrop/db";
import { emailDeliveries } from "@formdrop/db/schema";
import type { ReactElement } from "react";

import {
  EmailSendError,
  type EmailProvider,
  type EmailAddress,
} from "./provider.ts";
import { resendProvider } from "./providers/resend.ts";
import { zeptoMailProvider } from "./providers/zeptomail.ts";
import { sendByteProvider } from "./providers/sendbyte.ts";

export type {
  EmailAddress,
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "./provider.ts";
export { EmailSendError } from "./provider.ts";

export { EmailLayout } from "./templates/layout.tsx";
export { OtpEmail, type OtpEmailProps } from "./templates/otp.tsx";
export {
  RecipientVerificationEmail,
  type RecipientVerificationEmailProps,
} from "./templates/recipient-verification.tsx";
export {
  NewSubmissionEmail,
  type NewSubmissionEmailProps,
} from "./templates/new-submission.tsx";
export { ReportEmail, type ReportEmailProps } from "./templates/report.tsx";

/**
 * One way to send an email (PRD W7).
 *
 * Three places used to do this independently -- Better Auth's OTP through
 * Resend, recipient verification through Resend again, and submission
 * notifications through ZeptoMail with dead Plunk code behind a hardcoded
 * constant. Each had its own client setup, its own idea of a sender, and its
 * own HTML. This is the one entry point they all go through now.
 *
 * The provider is chosen from the environment and reached through the
 * EmailProvider interface, so switching to SendByte is a configuration change
 * plus one adapter, not a change to any caller.
 */

export type EmailProviderName = "resend" | "zeptomail" | "sendbyte";

let cached: EmailProvider | null = null;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set, so no email could be sent.`);
  }
  return value;
}

/**
 * Built on first send rather than at import, so a missing key fails the one
 * request that needs email instead of every module that imports this one.
 */
export function getEmailProvider(): EmailProvider {
  if (cached) return cached;

  const choice = (process.env.EMAIL_PROVIDER ?? "resend") as EmailProviderName;

  switch (choice) {
    case "resend":
      cached = resendProvider(
        required("RESEND_API_KEY"),
        required("EMAIL_FROM"),
      );
      break;

    case "zeptomail":
      cached = zeptoMailProvider(required("ZEPTO_API_KEY"), {
        address: required("EMAIL_FROM"),
        name: process.env.EMAIL_FROM_NAME ?? "FormDrop",
      });
      break;

    case "sendbyte":
      cached = sendByteProvider(required("SENDBYTE_API_KEY"), {
        email: required("EMAIL_FROM"),
        name: process.env.EMAIL_FROM_NAME ?? "FormDrop",
      });
      break;

    default:
      // A typo in EMAIL_PROVIDER should not quietly fall back to a provider
      // nobody chose -- that is how a cutover looks like it worked.
      throw new Error(
        `EMAIL_PROVIDER is "${choice}", which is not a provider. ` +
          `Use "resend", "zeptomail" or "sendbyte".`,
      );
  }

  return cached;
}

/** Test seam, and what a dual-send cutover would use. */
export function setEmailProvider(provider: EmailProvider | null) {
  cached = provider;
}

export interface SendEmailOptions {
  to: EmailAddress | string;
  subject: string;
  /** A React Email component, rendered to both HTML and text. */
  template: ReactElement;
  /** Recorded on the delivery row, e.g. "new_submission". */
  templateName: string;
  /** The account this belongs to, when there is one. */
  userId?: string;
  replyTo?: EmailAddress;
  /** Passed to providers that support it, so a retry cannot send twice. */
  idempotencyKey?: string;
}

/**
 * Renders a template, sends it, and records what happened.
 *
 * Throws on failure. The delivery row is written either way -- a failure that
 * leaves no trace is the thing W7 exists to fix -- and the write is guarded,
 * because losing the log must not turn a delivered email into an error, and a
 * database that is down must not hide the send failure underneath its own.
 */
export async function sendEmail(options: SendEmailOptions) {
  const to: EmailAddress =
    typeof options.to === "string" ? { email: options.to } : options.to;

  const provider = getEmailProvider();

  const [html, text] = await Promise.all([
    render(options.template),
    render(options.template, { plainText: true }),
  ]);

  try {
    const result = await provider.send({
      to,
      subject: options.subject,
      html,
      text,
      replyTo: options.replyTo,
      idempotencyKey: options.idempotencyKey,
    });

    await log({
      userId: options.userId,
      template: options.templateName,
      recipient: to.email,
      subject: options.subject,
      provider: provider.name,
      status: "sent",
      providerMessageId: result.messageId,
      error: null,
    });

    return result;
  } catch (error) {
    const message =
      error instanceof EmailSendError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);

    await log({
      userId: options.userId,
      template: options.templateName,
      recipient: to.email,
      subject: options.subject,
      provider: provider.name,
      status: "failed",
      providerMessageId: null,
      error: message,
    });

    throw error;
  }
}

async function log(row: {
  userId?: string;
  template: string;
  recipient: string;
  subject: string;
  provider: string;
  status: "sent" | "failed";
  providerMessageId: string | null;
  error: string | null;
}) {
  try {
    await db.insert(emailDeliveries).values({
      userId: row.userId ?? null,
      template: row.template,
      recipient: row.recipient,
      subject: row.subject,
      provider: row.provider,
      status: row.status,
      providerMessageId: row.providerMessageId,
      error: row.error,
    });
  } catch (logError) {
    // Deliberately swallowed. The send already succeeded or already failed,
    // and that outcome is what the caller needs; replacing it with a logging
    // error would report the wrong problem.
    console.error("email delivery log write failed", logError);
  }
}

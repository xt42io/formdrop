import { Resend } from "resend";
import {
  EmailSendError,
  type EmailProvider,
  type SendEmailInput,
  type SendEmailResult,
} from "../provider.ts";

/**
 * Resend, behind the interface.
 *
 * This is one of the two providers the repository already sends through. It
 * is here so W7's structural work -- one entry point, React Email templates,
 * a delivery log -- can land and be used before D3 resolves, rather than
 * waiting on a contract nobody has yet.
 */
export function resendProvider(apiKey: string, from: string): EmailProvider {
  // Constructed once per provider instance rather than per send; the client
  // is a thin wrapper over fetch and holds no connection.
  const client = new Resend(apiKey);

  return {
    name: "resend",

    async send(input: SendEmailInput): Promise<SendEmailResult> {
      const { data, error } = await client.emails.send({
        from,
        to: input.to.name
          ? `${input.to.name} <${input.to.email}>`
          : input.to.email,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo?.email,
      });

      // Resend reports failure in the result rather than throwing, which is
      // exactly the shape the interface exists to normalise away.
      if (error) throw new EmailSendError("resend", error.message);

      return { messageId: data?.id ?? null };
    },
  };
}

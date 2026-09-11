import { SendMailClient } from "zeptomail";
import {
  EmailSendError,
  type EmailProvider,
  type SendEmailInput,
  type SendEmailResult,
} from "../provider.ts";

const ZEPTO_URL = "https://api.zeptomail.com/v1.1/email";

/**
 * ZeptoMail, behind the interface.
 *
 * What submission notifications went through before W7. Kept for the same
 * reason as the Resend adapter: something has to keep sending while the
 * SendByte cutover is proved out.
 */
export function zeptoMailProvider(
  token: string,
  from: { address: string; name: string },
): EmailProvider {
  const client = new SendMailClient({ url: ZEPTO_URL, token });

  return {
    name: "zeptomail",

    async send(input: SendEmailInput): Promise<SendEmailResult> {
      try {
        const response = (await client.sendMail({
          from,
          to: [
            {
              email_address: {
                address: input.to.email,
                // Zepto wants a name; the local part is what the old inline
                // implementation used and is better than repeating the
                // address back at the reader.
                name: input.to.name ?? input.to.email.split("@")[0],
              },
            },
          ],
          subject: input.subject,
          htmlbody: input.html,
          textbody: input.text,
          ...(input.replyTo
            ? {
                // Zepto's type requires a name on every address, so fall
                // back to the address itself rather than an empty string.
                reply_to: [
                  {
                    address: input.replyTo.email,
                    name: input.replyTo.name ?? input.replyTo.email,
                  },
                ],
              }
            : {}),
        })) as { data?: Array<{ message_id?: string }> } | undefined;

        return { messageId: response?.data?.[0]?.message_id ?? null };
      } catch (error) {
        // The SDK throws its own error object shape. Normalising it here is
        // the entire job of an adapter.
        const message =
          error instanceof Error ? error.message : String(error ?? "unknown");
        throw new EmailSendError("zeptomail", message);
      }
    },
  };
}

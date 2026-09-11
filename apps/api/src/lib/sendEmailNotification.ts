import { recordNotificationUsage } from "./recordNotificationUsage";

import { SendMailClient } from "zeptomail";
import { palette } from "@formdrop/ui/palette";

const EMAIL_PROVIDER: "plunk" | "zepto" = "zepto";

interface SendEmailNotificationParams {
  recipientEmail: string;
  formName: string;
  data: Record<string, any>;
  userId: string;
  formId: string;
  submissionId: string;
  period: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/*
 * The notification email's markup.
 *
 * Colours come from the palette rather than being typed in. W4 forbids a raw
 * hex outside the token file, and these five were the last ones in the repo --
 * they were also Tailwind's default zinc rather than the product's ink ramp,
 * so the email did not match anything else FormDrop sends.
 *
 * A literal hex is still what goes down the wire: mail clients do not support
 * custom properties, which is one of the cases packages/ui/palette exists for.
 * Importing the value keeps it tied to tokens.css, where a drift test guards
 * it, instead of being a copy nobody updates.
 *
 * W7 replaces this whole function with a React Email template. Until it does,
 * this is the version that does not break the rule.
 */
function generateEmailHTML(
  formName: string,
  data: Record<string, any>,
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${palette["ink-950"]};">New Submission for ${formName}</h2>
      <p style="color: ${palette["ink-600"]};">You have received a new submission:</p>
      <div style="background: ${palette["ink-50"]}; padding: 24px; border-radius: 12px; margin-top: 20px;">
        ${Object.entries(data)
          .map(
            ([key, value]) => `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; color: ${palette["ink-500"]}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${key}</div>
            <div style="color: ${palette["ink-950"]}; font-size: 16px; white-space: pre-wrap;">${
              Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : value
            }</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

async function sendViaPlunk(
  recipientEmail: string,
  formName: string,
  data: Record<string, any>,
  submissionId: string,
): Promise<void> {
  const response = await fetch("https://api.useplunk.com/v1/send", {
    method: "POST",
    body: JSON.stringify({
      to: recipientEmail,
      subject: `New submission for ${formName}`,
      from: process.env.NOTIFICATION_SENDER_EMAIL,
      body: generateEmailHTML(formName, data),
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Plunk API error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      recipientEmail,
      formName,
      submissionId,
    });
    throw new Error(`Plunk API error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log("Email sent successfully via Plunk:", {
    recipientEmail,
    formName,
    submissionId,
    response: responseData,
  });
}

async function sendViaZepto(
  recipientEmail: string,
  formName: string,
  data: Record<string, any>,
  submissionId: string,
): Promise<void> {
  const url = "https://api.zeptomail.com/v1.1/email";
  const token = process.env.ZEPTO_API_KEY;

  if (!token) {
    throw new Error("ZEPTO_API_KEY is not set, so no email could be sent.");
  }

  const client = new SendMailClient({ url, token });

  const senderEmail = process.env.NOTIFICATION_SENDER_EMAIL!;
  const senderName = "FormDrop";
  const senderAddress = senderEmail.includes("<")
    ? senderEmail.split("<")[1].replace(">", "").trim()
    : senderEmail;

  await client.sendMail({
    from: {
      address: senderAddress,
      name: senderName,
    },
    to: [
      {
        email_address: {
          address: recipientEmail,
          name: recipientEmail.split("@")[0],
        },
      },
    ],
    subject: `New submission for ${formName}`,
    htmlbody: generateEmailHTML(formName, data),
  });

  console.log("Email sent successfully via ZeptoMail:", {
    recipientEmail,
    formName,
    submissionId,
  });
}

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
      console.error("Invalid email address:", {
        recipientEmail,
        formName,
        submissionId,
      });
      throw new Error(`Invalid email address: ${recipientEmail}`);
    }

    if (EMAIL_PROVIDER === "zepto") {
      await sendViaZepto(recipientEmail, formName, data, submissionId);
    } else {
      await sendViaPlunk(recipientEmail, formName, data, submissionId);
    }

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
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail,
      formName,
      submissionId,
    });

    throw error;
  }
}

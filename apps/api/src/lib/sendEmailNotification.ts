import { recordNotificationUsage } from "./recordNotificationUsage";

// @ts-ignore - zeptomail package has type definition issues
import { SendMailClient } from "zeptomail";

// Configure which email provider to use: 'plunk' or 'zepto'
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

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate email HTML template
function generateEmailHTML(
  formName: string,
  data: Record<string, any>,
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #18181b;">New Submission for ${formName}</h2>
      <p style="color: #52525b;">You have received a new submission:</p>
      <div style="background: #f4f4f5; padding: 24px; border-radius: 12px; margin-top: 20px;">
        ${Object.entries(data)
          .map(
            ([key, value]) => `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${key}</div>
            <div style="color: #18181b; font-size: 16px; white-space: pre-wrap;">${
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
    // Validate email before sending
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      console.error("Invalid email address:", {
        recipientEmail,
        formName,
        submissionId,
      });
      throw new Error(`Invalid email address: ${recipientEmail}`);
    }

    // Send email using configured provider
    if (EMAIL_PROVIDER === "zepto") {
      await sendViaZepto(recipientEmail, formName, data, submissionId);
    } else {
      await sendViaPlunk(recipientEmail, formName, data, submissionId);
    }

    // Record notification usage
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

    // Don't fail the request if email fails
    throw error;
  }
}

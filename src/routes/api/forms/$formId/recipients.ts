import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { forms, emailNotificationRecipients } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { RecipientVerificationEmail } from "@/emails/RecipientVerificationEmail";
import crypto from "crypto";
import { isUserPro } from "@/lib/subscription-check";
import { getResend } from "@/lib/email";

export const Route = createFileRoute("/api/forms/$formId/recipients")({
  server: {
    handlers: {
      GET: async ({
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
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId } = params;

          // Verify form belongs to user
          const [form] = await db
            .select()
            .from(forms)
            .where(
              and(
                eq(forms.id, formId),
                eq(forms.userId, userId),
                isNull(forms.deletedAt),
              ),
            )
            .limit(1);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          const recipients = await db
            .select({
              id: emailNotificationRecipients.id,
              formId: emailNotificationRecipients.formId,
              email: emailNotificationRecipients.email,
              enabled: emailNotificationRecipients.enabled,
              verifiedAt: emailNotificationRecipients.verifiedAt,
              verificationTokenExpiresAt:
                emailNotificationRecipients.verificationTokenExpiresAt,
              createdAt: emailNotificationRecipients.createdAt,
              updatedAt: emailNotificationRecipients.updatedAt,
            })
            .from(emailNotificationRecipients)
            .where(eq(emailNotificationRecipients.formId, formId));

          return Response.json({ recipients });
        } catch (error: any) {
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },

      POST: async ({
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
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId } = params;
          const { email } = await request.json();

          if (!email) {
            return Response.json(
              { error: "Email is required" },
              { status: 400 },
            );
          }

          // Verify form belongs to user
          const [form] = await db
            .select()
            .from(forms)
            .where(
              and(
                eq(forms.id, formId),
                eq(forms.userId, userId),
                isNull(forms.deletedAt),
              ),
            )
            .limit(1);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          // Check if user is pro
          const isPro = await isUserPro(userId);

          // Check recipient limit
          const existingRecipients = await db
            .select()
            .from(emailNotificationRecipients)
            .where(eq(emailNotificationRecipients.formId, formId));

          const limit = isPro ? 10 : 2;
          if (existingRecipients.length >= limit) {
            return Response.json(
              {
                error: `You have reached the limit of ${limit} recipient${limit > 1 ? "s" : ""} for this form. Upgrade to Pro to add more.`,
              },
              { status: 403 },
            );
          }

          // Check if recipient already exists
          const existingRecipient = existingRecipients.find(
            (r) => r.email === email,
          );

          if (existingRecipient) {
            return Response.json(
              { error: "Recipient already exists" },
              { status: 400 },
            );
          }

          // Create verification token
          const verificationToken = crypto.randomBytes(32).toString("hex");
          const verificationTokenExpiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ); // 24 hours

          // Create recipient
          const [recipient] = await db
            .insert(emailNotificationRecipients)
            .values({
              formId,
              email,
              verificationToken,
              verificationTokenExpiresAt,
            })
            .returning();

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

          return Response.json({ recipient });
        } catch (error: any) {
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

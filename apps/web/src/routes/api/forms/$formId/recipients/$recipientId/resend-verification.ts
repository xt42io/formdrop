import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms, emailNotificationRecipients } from "@formdrop/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { RecipientVerificationEmail } from "@/emails/RecipientVerificationEmail";
import crypto from "crypto";
import { getResend } from "@/lib/email";

export const Route = createFileRoute(
  "/api/forms/$formId/recipients/$recipientId/resend-verification",
)({
  server: {
    handlers: {
      POST: async ({
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
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId, recipientId } = params;

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

          // Get recipient
          const [recipient] = await db
            .select()
            .from(emailNotificationRecipients)
            .where(
              and(
                eq(emailNotificationRecipients.id, recipientId),
                eq(emailNotificationRecipients.formId, formId),
              ),
            )
            .limit(1);

          if (!recipient) {
            return Response.json(
              { error: "Recipient not found" },
              { status: 404 },
            );
          }

          // Check if already verified
          if (recipient.verifiedAt) {
            return Response.json(
              { error: "Recipient already verified" },
              { status: 400 },
            );
          }

          // Generate new verification token
          const verificationToken = crypto.randomBytes(32).toString("hex");
          const verificationTokenExpiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ); // 24 hours

          // Update recipient with new token
          await db
            .update(emailNotificationRecipients)
            .set({
              verificationToken,
              verificationTokenExpiresAt,
            })
            .where(eq(emailNotificationRecipients.id, recipientId));

          // Send verification email
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

          return Response.json({ success: true });
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

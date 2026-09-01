import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { emailNotificationRecipients } from "@formdrop/db/schema";
import { eq, and, gt } from "drizzle-orm";

export const Route = createFileRoute("/api/verify-recipient")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return Response.json(
              { error: "Verification token is required" },
              { status: 400 },
            );
          }

          // Find recipient with this token
          const [recipient] = await db
            .select()
            .from(emailNotificationRecipients)
            .where(
              and(
                eq(emailNotificationRecipients.verificationToken, token),
                gt(
                  emailNotificationRecipients.verificationTokenExpiresAt,
                  new Date(),
                ),
              ),
            )
            .limit(1);

          if (!recipient) {
            return Response.json(
              { error: "Invalid or expired verification token" },
              { status: 400 },
            );
          }

          // Mark as verified
          await db
            .update(emailNotificationRecipients)
            .set({
              verifiedAt: new Date(),
              verificationToken: null,
              verificationTokenExpiresAt: null,
            })
            .where(eq(emailNotificationRecipients.id, recipient.id));

          return Response.json({
            success: true,
            message: "Email verified successfully",
          });
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

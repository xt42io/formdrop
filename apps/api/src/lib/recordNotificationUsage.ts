import { db } from "@formdrop/db";
import { events, notificationUsage } from "@formdrop/db/schema";
import { sql } from "drizzle-orm";

interface RecordNotificationParams {
  userId: string;
  formId: string;
  submissionId: string;
  period: string;
  type: "email" | "slack" | "discord";
  target: string; // email address, channel name, or webhook identifier
}

export async function recordNotificationUsage({
  userId,
  formId,
  submissionId,
  period,
  type,
  target,
}: RecordNotificationParams): Promise<void> {
  try {
    // Record notification event
    await db.insert(events).values({
      userId,
      formId,
      eventType: "notification_sent",
      details: {
        type,
        target,
        submissionId,
      },
    });

    // Track notification usage
    await db
      .insert(notificationUsage)
      .values({
        userId,
        formId,
        period,
        type,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [
          notificationUsage.userId,
          notificationUsage.formId,
          notificationUsage.period,
          notificationUsage.type,
        ],
        set: {
          count: sql`${notificationUsage.count} + 1`,
        },
      });
  } catch (error) {
    console.error("Failed to record notification usage:", {
      error: error instanceof Error ? error.message : String(error),
      type,
      target,
      submissionId,
    });
    // Don't throw - this shouldn't fail the notification
  }
}

import { db } from "@formdrop/db";
import { events } from "@formdrop/db/schema";

interface RecordIntegrationParams {
  userId: string;
  formId: string;
  submissionId: string;
  integration: "google-sheets" | "airtable";
}

export async function recordIntegrationUsage({
  userId,
  formId,
  submissionId,
  integration,
}: RecordIntegrationParams): Promise<void> {
  try {
    // Record integration sync event
    await db.insert(events).values({
      userId,
      formId,
      eventType: "integration_synced",
      details: {
        integration,
        submissionId,
      },
    });
  } catch (error) {
    console.error("Failed to record integration usage:", error);
    // Don't throw, just log error
  }
}

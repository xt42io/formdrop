import { db } from "@formdrop/db";
import { subscriptions } from "@formdrop/db/schema";
import { eq } from "drizzle-orm";

export async function isUserPro(userId: string): Promise<boolean> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return subscription?.status === "active";
}

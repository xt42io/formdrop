import { db } from "@formdrop/db";
import { emailNotificationRecipients } from "@formdrop/db/schema";
import { and, eq, gt } from "drizzle-orm";

/**
 * Email notification recipients.
 *
 * Two read shapes on purpose. The listing projection below deliberately omits
 * `verificationToken`: that token is a bearer credential for verifying an
 * address, and the dashboard has no use for it. Callers that genuinely need
 * the stored row use the row-level helpers instead.
 */
const RECIPIENT_PUBLIC_COLUMNS = {
  id: emailNotificationRecipients.id,
  formId: emailNotificationRecipients.formId,
  email: emailNotificationRecipients.email,
  enabled: emailNotificationRecipients.enabled,
  verifiedAt: emailNotificationRecipients.verifiedAt,
  verificationTokenExpiresAt:
    emailNotificationRecipients.verificationTokenExpiresAt,
  createdAt: emailNotificationRecipients.createdAt,
  updatedAt: emailNotificationRecipients.updatedAt,
};

const inForm = (formId: string, recipientId: string) =>
  and(
    eq(emailNotificationRecipients.id, recipientId),
    eq(emailNotificationRecipients.formId, formId),
  );

/** For display — no verification token. */
export function listRecipientsForForm(formId: string) {
  return db
    .select(RECIPIENT_PUBLIC_COLUMNS)
    .from(emailNotificationRecipients)
    .where(eq(emailNotificationRecipients.formId, formId));
}

/** Full rows, used for the per-form recipient limit and duplicate check. */
export function listRecipientRowsForForm(formId: string) {
  return db
    .select()
    .from(emailNotificationRecipients)
    .where(eq(emailNotificationRecipients.formId, formId));
}

export async function findRecipientInForm(formId: string, recipientId: string) {
  const [recipient] = await db
    .select()
    .from(emailNotificationRecipients)
    .where(inForm(formId, recipientId))
    .limit(1);

  return recipient ?? null;
}

export async function createRecipient(input: {
  formId: string;
  email: string;
  verificationToken: string;
  verificationTokenExpiresAt: Date;
}) {
  const [recipient] = await db
    .insert(emailNotificationRecipients)
    .values(input)
    .returning();

  return recipient;
}

/** Scoped by form as well as id, so a mismatched pair deletes nothing. */
export async function deleteRecipient(formId: string, recipientId: string) {
  await db
    .delete(emailNotificationRecipients)
    .where(inForm(formId, recipientId));
}

export async function setRecipientEnabled(
  formId: string,
  recipientId: string,
  enabled: boolean,
) {
  const [recipient] = await db
    .update(emailNotificationRecipients)
    .set({ enabled })
    .where(inForm(formId, recipientId))
    .returning();

  return recipient;
}

export async function setRecipientVerificationToken(
  recipientId: string,
  token: string,
  expiresAt: Date,
) {
  await db
    .update(emailNotificationRecipients)
    .set({
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
    })
    .where(eq(emailNotificationRecipients.id, recipientId));
}

/**
 * Looks a recipient up by an unexpired token. Expiry is part of the query
 * rather than a check afterwards, so an expired token simply finds nothing.
 */
export async function findRecipientByValidToken(token: string) {
  const [recipient] = await db
    .select()
    .from(emailNotificationRecipients)
    .where(
      and(
        eq(emailNotificationRecipients.verificationToken, token),
        gt(emailNotificationRecipients.verificationTokenExpiresAt, new Date()),
      ),
    )
    .limit(1);

  return recipient ?? null;
}

/** Verifying clears the token, so a verification link cannot be replayed. */
export async function markRecipientVerified(recipientId: string) {
  await db
    .update(emailNotificationRecipients)
    .set({
      verifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(eq(emailNotificationRecipients.id, recipientId));
}

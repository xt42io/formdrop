import { db } from "@formdrop/db";
import { forms, usage } from "@formdrop/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { generateFormSlug } from "../slug.ts";

/**
 * Form queries, moved out of the route handlers.
 *
 * The column list below is a contract with the dashboard, so it lives in one
 * place rather than being retyped per handler: `*Connected` are derived flags
 * that deliberately never expose the underlying tokens, and `submissionCount`
 * is summed from the usage table rather than counted from submissions.
 */
const FORM_DETAIL_COLUMNS = {
  id: forms.id,
  userId: forms.userId,
  name: forms.name,
  slug: forms.slug,
  description: forms.description,
  allowedDomains: forms.allowedDomains,
  emailNotificationsEnabled: forms.emailNotificationsEnabled,
  slackNotificationsEnabled: forms.slackNotificationsEnabled,
  slackChannelName: forms.slackChannelName,
  slackTeamName: forms.slackTeamName,
  discordNotificationsEnabled: forms.discordNotificationsEnabled,
  discordChannelName: forms.discordChannelName,
  discordGuildName: forms.discordGuildName,
  googleSheetsEnabled: forms.googleSheetsEnabled,
  googleSheetsSpreadsheetName: forms.googleSheetsSpreadsheetName,
  googleSheetsSpreadsheetId: forms.googleSheetsSpreadsheetId,
  googleSheetsConnected: sql<boolean>`${forms.googleSheetsAccessToken} IS NOT NULL`,
  airtableEnabled: forms.airtableEnabled,
  airtableBaseName: forms.airtableBaseName,
  airtableTableName: forms.airtableTableName,
  airtableConnected: sql<boolean>`${forms.airtableAccessToken} IS NOT NULL`,
  slackConnected: sql<boolean>`${forms.slackWebhookUrl} IS NOT NULL`,
  discordConnected: sql<boolean>`${forms.discordWebhookUrl} IS NOT NULL`,
  createdAt: forms.createdAt,
  updatedAt: forms.updatedAt,
};

/** The list adds a submission count; the columns are otherwise identical. */
const FORM_LIST_COLUMNS = {
  ...FORM_DETAIL_COLUMNS,
  submissionCount: sql<number>`cast(coalesce(sum(${usage.count}), 0) as integer)`,
};

/** Live forms only: soft-deleted rows stay in the table but are never listed. */
const live = (formId: string, userId: string) =>
  and(eq(forms.id, formId), eq(forms.userId, userId), isNull(forms.deletedAt));

/** Every live form for a user, newest first, with its submission count. */
export function listFormsForUser(userId: string) {
  return db
    .select(FORM_LIST_COLUMNS)
    .from(forms)
    .leftJoin(usage, eq(forms.id, usage.formId))
    .where(and(eq(forms.userId, userId), isNull(forms.deletedAt)))
    .groupBy(forms.id)
    .orderBy(desc(forms.createdAt));
}

/** One form for the detail screen, scoped to its owner. */
export async function findFormDetailForUser(formId: string, userId: string) {
  const [form] = await db
    .select(FORM_DETAIL_COLUMNS)
    .from(forms)
    .where(live(formId, userId))
    .limit(1);

  return form ?? null;
}

/**
 * The full row, used where a handler needs the stored values themselves rather
 * than the dashboard projection — ownership checks and update merges.
 */
export async function findOwnedForm(formId: string, userId: string) {
  const [form] = await db
    .select()
    .from(forms)
    .where(live(formId, userId))
    .limit(1);

  return form ?? null;
}

/**
 * A form by id alone — NOT scoped to an owner, and it does not exclude
 * soft-deleted rows.
 *
 * Only for the OAuth callbacks, where there is no session to check against:
 * the form id arrives in the provider's state parameter. Any caller that has a
 * session should use findOwnedForm instead, which is why this is named
 * differently rather than being a default with optional scoping.
 */
export async function findFormById(formId: string) {
  const [form] = await db
    .select()
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1);

  return form ?? null;
}

/**
 * Used to reject a duplicate name before creating. Soft-deleted forms are
 * excluded, so a name is reusable once its form is deleted.
 */
export function findLiveFormByName(userId: string, name: string) {
  return db.query.forms.findFirst({
    where: and(
      eq(forms.userId, userId),
      eq(forms.name, name),
      isNull(forms.deletedAt),
    ),
  });
}

export async function createForm(input: {
  userId: string;
  name: string;
  description?: string | null;
  allowedDomains?: string[] | null;
}) {
  const [form] = await db
    .insert(forms)
    .values({
      userId: input.userId,
      name: input.name,
      slug: generateFormSlug(),
      description: input.description || null,
      allowedDomains: input.allowedDomains || [],
    })
    .returning();

  return form;
}

/**
 * Applies an already-merged set of values. The merge itself stays in the
 * handler, because it depends on which keys the request body actually sent.
 */
export async function updateFormById(
  formId: string,
  values: Partial<typeof forms.$inferInsert>,
) {
  const [form] = await db
    .update(forms)
    .set(values)
    .where(eq(forms.id, formId))
    .returning();

  return form;
}

/** Soft delete: the row stays for its submissions, but drops out of every query. */
export async function softDeleteForm(formId: string) {
  await db
    .update(forms)
    .set({ deletedAt: new Date() })
    .where(eq(forms.id, formId));
}

/**
 * Disconnecting an integration clears its credentials as well as switching it
 * off. Leaving a stale webhook URL behind would let the channel be re-enabled
 * without going back through OAuth.
 */
export async function disconnectSlack(formId: string) {
  await db
    .update(forms)
    .set({
      slackWebhookUrl: null,
      slackChannelId: null,
      slackChannelName: null,
      slackTeamName: null,
      slackNotificationsEnabled: false,
    })
    .where(eq(forms.id, formId));
}

export async function disconnectDiscord(formId: string) {
  await db
    .update(forms)
    .set({
      discordWebhookUrl: null,
      discordChannelId: null,
      discordChannelName: null,
      discordGuildName: null,
      discordNotificationsEnabled: false,
    })
    .where(eq(forms.id, formId));
}

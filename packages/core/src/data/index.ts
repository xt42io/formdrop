/**
 * Data access for the domain — imported as `@formdrop/core/data`.
 *
 * Kept behind its own entry point on purpose. Everything under `@formdrop/core`
 * is pure and unit tested without a database; everything here needs a live
 * connection and is covered by integration tests instead. Two paths keep that
 * line visible in the import statement, so nobody has to open a file to know
 * whether it can run without `DATABASE_URL`.
 */
export {
  createForm,
  disconnectDiscord,
  disconnectSlack,
  findFormById,
  findFormDetailForUser,
  findLiveFormByName,
  findOwnedForm,
  listFormsForUser,
  softDeleteForm,
  updateFormById,
  listFormsForApiKey,
  findFormBySlugForApiKey,
} from "./forms.ts";
export {
  countSubmissionsForUser,
  findSubscription,
  hasPasswordCredential,
} from "./account.ts";
export {
  createApiKey,
  deleteApiKey,
  findApiKeyByValue,
  listApiKeysForUser,
  touchApiKeyLastUsed,
} from "./api-keys.ts";
export {
  countAllForms,
  countAllSubmissions,
  countAllUsers,
  deleteSubmissionsOlderThan,
  findUserDetail,
  listAllFormsWithOwners,
  listFormsForUserWithCounts,
  listRecentSubmissionsAcrossAllForms,
  listRecentSubmissionsForUser,
  submissionsCreatedSince,
  topFormsAcrossAllUsers,
  usersCreatedSince,
} from "./admin.ts";
export {
  createRecipient,
  deleteRecipient,
  findRecipientByValidToken,
  findRecipientInForm,
  listRecipientRowsForForm,
  listRecipientsForForm,
  markRecipientVerified,
  setRecipientEnabled,
  setRecipientVerificationToken,
} from "./recipients.ts";
export {
  countFormsForUser,
  dailyUsageForForm,
  dailyUsageForUser,
  sumUsageForForm,
  sumUsageForUser,
  topFormsForUser,
} from "./analytics.ts";
export {
  countSubmissionsForForm,
  findSubmissionInForm,
  findSubmissionsInForm,
  listSubmissionsForForm,
  softDeleteSubmission,
  softDeleteSubmissions,
  pageSubmissionsForForm,
  listAllSubmissionsForForm,
} from "./submissions.ts";

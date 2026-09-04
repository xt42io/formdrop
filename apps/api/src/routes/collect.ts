import { Router } from "express";
import { db } from "@formdrop/db";
import {
  forms,
  submissions,
  usage,
  user,
  emailNotificationRecipients,
} from "@formdrop/db/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { sendEmailNotification } from "../lib/sendEmailNotification";
import {
  sendSlackNotification,
  sendDiscordNotification,
} from "../lib/sendWebhookNotification";
import { syncGoogleSheets } from "../lib/syncGoogleSheets";
import {
  isDomainAllowed,
  resolveNotificationTargets,
  usagePeriod,
} from "@formdrop/core";

export const collectRouter = Router();

// POST /f/:slug — collect a form submission
collectRouter.post("/:slug", async (req, res) => {
  const { slug } = req.params;
  const origin = (req.headers.origin || req.headers.referer || "") as string;

  try {
    // Get form by slug
    const [form] = await db
      .select()
      .from(forms)
      .where(eq(forms.slug, slug))
      .limit(1);

    if (!form) {
      res.status(404).json({ error: "Form not found" });
      return;
    }

    if (form.deletedAt) {
      res.status(400).json({ error: "Form is deleted" });
      return;
    }

    // Check domain restrictions
    const allowedDomains = (form.allowedDomains as string[]) || [];
    if (origin && !isDomainAllowed(origin, allowedDomains)) {
      res.status(403).json({ error: "Domain not allowed for this form" });
      return;
    }

    // Get owner details
    const [owner] = await db
      .select()
      .from(user)
      .where(eq(user.id, form.userId))
      .limit(1);

    const submissionData = (req.body || {}) as Record<string, any>;

    if (!submissionData || Object.keys(submissionData).length === 0) {
      res.status(400).json({ error: "No submission data found" });
      return;
    }

    // Create submission
    const [submission] = await db
      .insert(submissions)
      .values({
        formId: form.id,
        payload: submissionData,
        ip:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket?.remoteAddress ||
          null,
        userAgent: (req.headers["user-agent"] as string) || null,
      })
      .returning();

    const period = usagePeriod();

    // Only the recipient lookup needs the database; which channels actually
    // fire is decided by packages/core so the rule is testable without one.
    const recipients = form.emailNotificationsEnabled
      ? await db
          .select()
          .from(emailNotificationRecipients)
          .where(
            and(
              eq(emailNotificationRecipients.formId, form.id),
              eq(emailNotificationRecipients.enabled, true),
              isNotNull(emailNotificationRecipients.verifiedAt),
            ),
          )
      : [];

    const targets = resolveNotificationTargets(form, owner.email, recipients);

    // Send email notification
    if (targets.emails.length > 0) {
      console.log("Attempting to send email notification to:", {
        emails: targets.emails,
        formName: form.name,
        userId: form.userId,
      });

      // Non-blocking email sending
      Promise.all(
        targets.emails.map(async (email) => {
          try {
            await sendEmailNotification({
              recipientEmail: email,
              formName: form.name,
              data: submissionData,
              userId: form.userId,
              formId: form.id,
              submissionId: submission.id,
              period,
            });
          } catch (error) {
            console.error(
              `Failed to send email notification to ${email}:`,
              error,
            );
          }
        }),
      );
    }

    // Send Slack notification
    if (targets.slack) {
      Promise.resolve().then(async () => {
        try {
          await sendSlackNotification({
            webhookUrl: targets.slack!.webhookUrl,
            formName: form.name,
            data: submissionData,
            submissionId: submission.id,
            userId: form.userId,
            formId: form.id,
            period,
            channelName: form.slackChannelName,
          });
        } catch (error) {
          console.error("Failed to send Slack notification:", error);
        }
      });
    }

    // Send Discord notification
    if (targets.discord) {
      Promise.resolve().then(async () => {
        try {
          await sendDiscordNotification({
            webhookUrl: targets.discord!.webhookUrl,
            formName: form.name,
            data: submissionData,
            submissionId: submission.id,
            userId: form.userId,
            formId: form.id,
            period,
            channelName: form.discordChannelName,
          });
        } catch (error) {
          console.error("Failed to send Discord notification:", error);
        }
      });
    }

    // Sync to Google Sheets
    if (targets.googleSheets) {
      Promise.resolve().then(async () => {
        try {
          await syncGoogleSheets({
            spreadsheetId: targets.googleSheets!.spreadsheetId,
            sheetId: form.googleSheetsSheetId,
            accessToken: targets.googleSheets!.accessToken,
            refreshToken: form.googleSheetsRefreshToken,
            tokenExpiry: form.googleSheetsTokenExpiry,
            submissionData,
            submissionId: submission.id,
            formId: form.id,
            userId: form.userId,
            formName: form.name,
          });
        } catch (error) {
          console.error("Failed to sync to Google Sheets:", error);
        }
      });
    }

    // Track usage
    await db
      .insert(usage)
      .values({
        userId: form.userId,
        formId: form.id,
        period,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [usage.userId, usage.formId, usage.period],
        set: {
          count: sql`${usage.count} + 1`,
        },
      });

    res.status(201).json({
      success: true,
      submissionId: submission.id,
      message: "Submission received",
    });
  } catch (error: any) {
    console.error("Submit error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

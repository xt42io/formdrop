import { Router } from "express";
import { db } from "../db";
import { forms, submissions } from "../db/schema";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";

export const submissionsRouter = Router();


submissionsRouter.get("/:slug/submissions", async (req, res) => {
  const apiKey = (req as any).apiKey;
  const { slug } = req.params;

  const [form] = await db
    .select()
    .from(forms)
    .where(
      and(
        eq(forms.slug, slug),
        eq(forms.userId, apiKey.userId),
        isNull(forms.deletedAt),
      ),
    )
    .limit(1);

  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }

  const formSubmissions = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.formId, form.id),
        isNull(submissions.deletedAt),
      ),
    )
    .orderBy(desc(submissions.createdAt));

  res.json({ submissions: formSubmissions });
});

submissionsRouter.delete("/:formId/submissions", async (req, res) => {
  try {
    const apiKey = (req as any).apiKey;
    const { formId } = req.params;
    const { submissionIds } = req.body ?? {};

    if (
      !submissionIds ||
      !Array.isArray(submissionIds) ||
      submissionIds.length === 0
    ) {
      res.status(400).json({ error: "Invalid submission IDs" });
      return;
    }

    const [form] = await db
      .select()
      .from(forms)
      .where(
        and(
          eq(forms.id, formId),
          eq(forms.userId, apiKey.userId),
          isNull(forms.deletedAt),
        ),
      )
      .limit(1);

    if (!form) {
      res.status(404).json({ error: "Form not found" });
      return;
    }

    const validSubmissions = await db
      .select()
      .from(submissions)
      .where(
        and(
          inArray(submissions.id, submissionIds),
          eq(submissions.formId, formId),
        ),
      );

    if (validSubmissions.length !== submissionIds.length) {
      res.status(400).json({ error: "Invalid submission IDs" });
      return;
    }

    await db
      .update(submissions)
      .set({ deletedAt: new Date() })
      .where(inArray(submissions.id, submissionIds));

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

submissionsRouter.delete(
  "/:formId/submissions/:submissionId",
  async (req, res) => {
    try {
      const apiKey = (req as any).apiKey;
      const { formId, submissionId } = req.params;

      const [form] = await db
        .select()
        .from(forms)
        .where(
          and(
            eq(forms.id, formId),
            eq(forms.userId, apiKey.userId),
            isNull(forms.deletedAt),
          ),
        )
        .limit(1);

      if (!form) {
        res.status(404).json({ error: "Form not found" });
        return;
      }

      const [updated] = await db
        .update(submissions)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(submissions.id, submissionId),
            eq(submissions.formId, formId),
            isNull(submissions.deletedAt),
          ),
        )
        .returning({ id: submissions.id });

      if (!updated) {
        res.status(404).json({ error: "Submission not found" });
        return;
      }

      res.json({ success: true, message: "Submission deleted" });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

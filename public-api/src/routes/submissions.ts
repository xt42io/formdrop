import { Router } from "express";
import { db } from "../db";
import { forms, submissions } from "../db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

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
    .where(eq(submissions.formId, form.id))
    .orderBy(desc(submissions.createdAt));

  res.json({ submissions: formSubmissions });
});

// DELETE /:formId/submissions/:submissionId — delete a submission
submissionsRouter.delete(
  "/:formId/submissions/:submissionId",
  async (req, res) => {
    const apiKey = (req as any).apiKey;
    const { formId, submissionId } = req.params;

    if (apiKey.type !== "private") {
      res.status(403).json({ error: "Private API key required" });
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

    await db
      .delete(submissions)
      .where(
        and(
          eq(submissions.id, submissionId),
          eq(submissions.formId, formId),
        ),
      );

    res.json({ success: true, message: "Submission deleted" });
  },
);

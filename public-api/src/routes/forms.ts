import { Router } from "express";
import { db } from "../db";
import { forms } from "../db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

export const formsRouter = Router();

// GET /forms — list all forms for the authenticated user
formsRouter.get("/", async (req, res) => {
  const apiKey = (req as any).apiKey;

  const userForms = await db
    .select({
      id: forms.id,
      name: forms.name,
      slug: forms.slug,
      description: forms.description,
      createdAt: forms.createdAt,
    })
    .from(forms)
    .where(and(eq(forms.userId, apiKey.userId), isNull(forms.deletedAt)))
    .orderBy(desc(forms.createdAt));

  res.json({ forms: userForms });
});

formsRouter.delete("/:formId", async (req, res) => {
  try {
    const apiKey = (req as any).apiKey;
    const { formId } = req.params;

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
      .update(forms)
      .set({ deletedAt: new Date() })
      .where(eq(forms.id, formId));

    res.json({ success: true, message: "Form deleted" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

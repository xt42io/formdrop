import { Router } from "express";
import { db } from "../db";
import { forms } from "../db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

export const formsRouter = Router();

// GET /forms — list all forms for the authenticated user
formsRouter.get("/", async (req, res) => {
  const apiKey = (req as any).apiKey;

  if (apiKey.type !== "private") {
    res.status(403).json({ error: "Private API key required" });
    return;
  }

  const userForms = await db
    .select()
    .from(forms)
    .where(and(eq(forms.userId, apiKey.userId), isNull(forms.deletedAt)))
    .orderBy(desc(forms.createdAt));

  res.json({ forms: userForms });
});

import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { apiKeys } from "../db/schema";
import { eq } from "drizzle-orm";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    res
      .status(401)
      .json({ error: "API key required in Authorization header" });
    return;
  }

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key, apiKey))
    .limit(1);

  if (!key) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id));

  // Attach API key data to the request for downstream handlers
  (req as any).apiKey = key;

  next();
};

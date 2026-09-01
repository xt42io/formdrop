import { config } from "dotenv";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.ts";

// Loaded from the caller's cwd first, then from the repo root - turbo runs a
// task with cwd set to its own package, so apps/web and apps/api both need the
// second path to find the single root .env.
config();
config({ path: "../../.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  // Force the search path to public to ensure migrations and queries work as expected
  options: "-c search_path=public,drizzle",
});
export const db = drizzle(pool, { schema });

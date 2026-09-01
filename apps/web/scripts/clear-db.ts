import { sql } from "drizzle-orm";
import { db } from "@formdrop/db";
import { Polar } from "@polar-sh/sdk";

async function main() {
  console.log("⚠️  Clearing database...");
  try {
    // Clear Polar customers
    if (process.env.POLAR_ACCESS_TOKEN) {
      console.log("⚠️  Clearing Polar customers...");
      const polar = new Polar({
        accessToken: process.env.POLAR_ACCESS_TOKEN,
        server:
          process.env.NODE_ENV === "development" ? "sandbox" : "production",
      });

      const result = await polar.customers.list({});

      for await (const page of result) {
        for (const customer of page.result.items) {
          await polar.customers.delete({ id: customer.id });
        }
      }
      console.log("✅ Polar customers cleared successfully");
    }

    // Truncate all tables in the public schema
    await db.execute(sql`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    console.log("✅ Database cleared successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

main();

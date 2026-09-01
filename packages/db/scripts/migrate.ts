import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "../src/index.ts";

async function main() {
  console.log("Running migrations...");
  try {
    // This will run migrations on the database, skipping the ones already applied
    await migrate(db, {
      migrationsFolder: "drizzle",
      migrationsSchema: "drizzle",
    });
    console.log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

main();

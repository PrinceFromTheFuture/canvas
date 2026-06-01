import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// tsx does not auto-load .env. Load the monorepo-root .env first (canonical),
// then a package-local .env as fallback. Scripts run with cwd = packages/db.
for (const candidate of [
  path.resolve(process.cwd(), "..", "..", ".env"),
  path.resolve(process.cwd(), ".env"),
]) {
  if (existsSync(candidate)) config({ path: candidate });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const migrationClient = postgres(url, { max: 1 });
  const dbInstance = drizzle(migrationClient);
  console.log("Running migrations...");
  await migrate(dbInstance, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  await migrationClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

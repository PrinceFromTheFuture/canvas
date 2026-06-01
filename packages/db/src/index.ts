import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export * from "./schema/index";
export { schema };

const globalForDb = globalThis as unknown as {
  __arbSql?: ReturnType<typeof postgres>;
};

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
  }
  return url;
}

/**
 * Singleton postgres client. Reused across hot reloads / serverless warm
 * invocations to avoid exhausting connections.
 */
export const sqlClient =
  globalForDb.__arbSql ??
  postgres(getConnectionString(), {
    max: Number(process.env.PG_POOL_MAX ?? 10),
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arbSql = sqlClient;
}

export const db = drizzle(sqlClient, { schema });
export type DB = typeof db;

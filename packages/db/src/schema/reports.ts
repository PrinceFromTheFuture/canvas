import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { datasets } from "./datasets";

export const reportVisibility = pgEnum("report_visibility", ["private", "unlisted"]);
/** Denormalized cache of the latest run state for cheap list/detail reads. */
export const reportRunStatusCache = pgEnum("report_run_status_cache", ["idle", "running", "error"]);

/**
 * The conversation is an AI-SDK `UIMessage[]` snapshot. We keep it as opaque
 * JSON here so `@arb/db` does not depend on the `ai` package; the typed view
 * lives in `@arb/ai`.
 */
export type StoredUIMessage = Record<string, unknown>;

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  datasetId: uuid("dataset_id").references(() => datasets.id, { onDelete: "set null" }),
  /** Unguessable public identifier used to build /r/:slug links. */
  slug: text("slug").notNull().unique(),
  title: text("title").notNull().default("Untitled report"),
  prompt: text("prompt").notNull().default(""),
  /** The AI-authored report, as constrained JSX over the vocabulary. */
  sourceJsx: text("source_jsx"),
  /** The data object merged into the renderer scope (or a ref to it). */
  dataSnapshot: jsonb("data_snapshot").$type<Record<string, unknown>>(),
  conversation: jsonb("conversation").$type<StoredUIMessage[]>().notNull().default([]),
  visibility: reportVisibility("visibility").notNull().default("unlisted"),
  version: integer("version").notNull().default(1),
  runStatus: reportRunStatusCache("run_status").notNull().default("idle"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

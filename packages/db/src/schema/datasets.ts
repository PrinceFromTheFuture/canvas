import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * A column profile derived at upload time and handed to the AI so it can
 * author a report WITHOUT seeing the full dataset. Keeps the model's input
 * bounded and the data divergence/form convergence principle intact.
 */
export interface DatasetColumn {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "unknown";
  /** A few example values for the model to ground on. */
  samples: Array<string | number | boolean | null>;
  nullCount?: number;
}

export interface DatasetProfile {
  columns: DatasetColumn[];
  rowCount: number;
  /** A small head sample of fully-formed rows. */
  sampleRows: Array<Record<string, unknown>>;
}

export const datasets = pgTable("datasets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mediaType: text("media_type").notNull(),
  /** Where the raw bytes live (local dir in dev, object storage in prod). */
  storageRef: text("storage_ref").notNull(),
  rowCount: integer("row_count").notNull().default(0),
  profile: jsonb("profile").$type<DatasetProfile>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;

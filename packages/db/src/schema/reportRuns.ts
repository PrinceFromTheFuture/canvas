import { sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { reports } from "./reports";

export const reportRunStatus = pgEnum("report_run_status", [
  "running",
  "finished",
  "error",
  "interrupted",
]);

/**
 * One row per generation turn. The PARTIAL UNIQUE INDEX on
 * (report_id) WHERE status = 'running' is the load-bearing run lock:
 * a second concurrent run for the same report violates the index, which
 * `startRun` catches (Postgres 23505) and surfaces as a tRPC CONFLICT.
 *
 * Chunks themselves are NOT stored here; they live in a per-run Redis
 * Stream. This table tracks lifecycle (status, heartbeat, lastSeq, error)
 * so the watchdog and the subscription terminal state have a durable,
 * cross-process source of truth.
 */
export const reportRuns = pgTable(
  "report_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    status: reportRunStatus("status").notNull().default("running"),
    /** Last logical chunk sequence written; used to validate cursors. */
    lastSeq: integer("last_seq").notNull().default(0),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    oneRunningPerReport: uniqueIndex("report_runs_one_running_per_report")
      .on(table.reportId)
      .where(sql`${table.status} = 'running'`),
  }),
);

export type ReportRun = typeof reportRuns.$inferSelect;
export type NewReportRun = typeof reportRuns.$inferInsert;
export type ReportRunStatusValue = ReportRun["status"];

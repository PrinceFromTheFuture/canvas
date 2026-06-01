import { and, eq, lt, sql } from "drizzle-orm";
import { db, reportRuns, reports } from "@arb/db";
import { appendTerminal } from "@arb/streaming";

export class RunConflictError extends Error {
  constructor() {
    super("A run is already in progress for this report");
    this.name = "RunConflictError";
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

/**
 * Acquire the run lock by inserting a `running` row. The partial unique index
 * (report_id WHERE status='running') makes a concurrent second run fail with
 * 23505, which we translate into a RunConflictError. This is the single
 * source of truth for "is a run active", durable across processes.
 */
export async function startRun(reportId: string): Promise<string> {
  try {
    const [row] = await db
      .insert(reportRuns)
      .values({ reportId, status: "running" })
      .returning({ id: reportRuns.id });
    if (!row) throw new Error("Failed to create run");
    await db.update(reports).set({ runStatus: "running", updatedAt: new Date() }).where(eq(reports.id, reportId));
    return row.id;
  } catch (err) {
    if (isUniqueViolation(err)) throw new RunConflictError();
    throw err;
  }
}

export async function heartbeat(runId: string, lastSeq: number): Promise<void> {
  await db
    .update(reportRuns)
    .set({ lastHeartbeatAt: new Date(), lastSeq, updatedAt: new Date() })
    .where(eq(reportRuns.id, runId));
}

export async function finishRun(runId: string, reportId: string, lastSeq: number): Promise<void> {
  await db
    .update(reportRuns)
    .set({ status: "finished", finishedAt: new Date(), lastSeq, updatedAt: new Date() })
    .where(eq(reportRuns.id, runId));
  await db.update(reports).set({ runStatus: "idle", updatedAt: new Date() }).where(eq(reports.id, reportId));
  await appendTerminal(runId, "finished", lastSeq);
}

export async function failRun(runId: string, reportId: string, lastSeq: number, error: string): Promise<void> {
  await db
    .update(reportRuns)
    .set({ status: "error", error, finishedAt: new Date(), lastSeq, updatedAt: new Date() })
    .where(eq(reportRuns.id, runId));
  await db.update(reports).set({ runStatus: "error", updatedAt: new Date() }).where(eq(reports.id, reportId));
  await appendTerminal(runId, "error", lastSeq, error);
}

export async function interruptRun(runId: string, reportId: string, lastSeq: number): Promise<void> {
  await db
    .update(reportRuns)
    .set({ status: "interrupted", finishedAt: new Date(), lastSeq, updatedAt: new Date() })
    .where(eq(reportRuns.id, runId));
  await db.update(reports).set({ runStatus: "idle", updatedAt: new Date() }).where(eq(reports.id, reportId));
  await appendTerminal(runId, "interrupted", lastSeq);
}

/**
 * Watchdog: any run whose heartbeat is older than the threshold is assumed
 * dead (crashed worker / lost node) and is released so the report can be run
 * again. Without this, a crash would leave the run lock held forever.
 */
export async function recoverStaleRuns(thresholdMs = 60_000): Promise<number> {
  const cutoff = new Date(Date.now() - thresholdMs);
  const stale = await db
    .select({ id: reportRuns.id, reportId: reportRuns.reportId, lastSeq: reportRuns.lastSeq })
    .from(reportRuns)
    .where(and(eq(reportRuns.status, "running"), lt(reportRuns.lastHeartbeatAt, cutoff)));
  for (const run of stale) {
    await interruptRun(run.id, run.reportId, run.lastSeq);
  }
  return stale.length;
}

/** Boot recovery: release runs marked running with no live owner. */
export async function recoverOnBoot(): Promise<number> {
  const running = await db
    .select({ id: reportRuns.id, reportId: reportRuns.reportId, lastSeq: reportRuns.lastSeq })
    .from(reportRuns)
    .where(eq(reportRuns.status, "running"));
  for (const run of running) {
    await interruptRun(run.id, run.reportId, run.lastSeq);
  }
  return running.length;
}

/** Reset the denormalized report cache (used by recovery sweeps). */
export async function clearStuckReportStatus(): Promise<void> {
  await db
    .update(reports)
    .set({ runStatus: "idle" })
    .where(sql`${reports.runStatus} = 'running'`);
}

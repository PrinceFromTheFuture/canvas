/** Per-run chunk stream (XADD/XREAD). */
export const runStreamKey = (runId: string) => `arb:run:${runId}:stream`;
/** Cancel flag for cooperative abort across processes. */
export const runCancelKey = (runId: string) => `arb:run:${runId}:cancel`;
/** Worker job queue (a Redis stream used as a durable list). */
export const JOB_STREAM_KEY = "arb:jobs";
/** Consumer group name for workers reading the job stream. */
export const JOB_GROUP = "arb-workers";

/** Stream TTL after a run finishes, so late subscribers can still replay. */
export const RUN_STREAM_TTL_SECONDS = 60 * 30;
/** How long a cancel flag persists. */
export const CANCEL_TTL_SECONDS = 60 * 10;

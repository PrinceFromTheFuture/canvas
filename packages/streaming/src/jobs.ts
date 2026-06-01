import type { Redis } from "ioredis";
import { redis, createBlockingConnection } from "./redis";
import { JOB_GROUP, JOB_STREAM_KEY } from "./keys";

export interface RunJob {
  jobId: string;
  runId: string;
  reportId: string;
}

/** Enqueue a generation run for a worker to pick up. */
export async function enqueueRun(job: { runId: string; reportId: string }): Promise<void> {
  await redis.xadd(JOB_STREAM_KEY, "*", "runId", job.runId, "reportId", job.reportId);
}

/** Create the consumer group if it does not exist (idempotent). */
export async function ensureJobGroup(): Promise<void> {
  try {
    await redis.xgroup("CREATE", JOB_STREAM_KEY, JOB_GROUP, "$", "MKSTREAM");
  } catch (err) {
    // BUSYGROUP => group already exists; anything else rethrows.
    if (!(err instanceof Error) || !err.message.includes("BUSYGROUP")) throw err;
  }
}

/**
 * Long-running consumer loop for a worker. Yields jobs as they arrive via a
 * blocking XREADGROUP. Caller must `ackJob` after successful processing.
 */
export async function* consumeJobs(
  consumerName: string,
  signal?: AbortSignal,
): AsyncGenerator<RunJob> {
  await ensureJobGroup();
  const conn: Redis = createBlockingConnection();
  try {
    while (true) {
      if (signal?.aborted) return;
      const res = (await conn.xreadgroup(
        "GROUP",
        JOB_GROUP,
        consumerName,
        "COUNT",
        1,
        "BLOCK",
        15_000,
        "STREAMS",
        JOB_STREAM_KEY,
        ">",
      )) as Array<[string, Array<[string, string[]]>]> | null;
      if (!res) continue;
      for (const [, entries] of res) {
        for (const [id, fields] of entries) {
          const map: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            const key = fields[i];
            if (key !== undefined) map[key] = fields[i + 1] ?? "";
          }
          yield { jobId: id, runId: map.runId ?? "", reportId: map.reportId ?? "" };
        }
      }
    }
  } finally {
    conn.disconnect();
  }
}

export async function ackJob(jobId: string): Promise<void> {
  await redis.xack(JOB_STREAM_KEY, JOB_GROUP, jobId);
}

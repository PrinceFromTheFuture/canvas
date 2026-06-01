import "./env"; // MUST be first: loads root .env before streaming/db clients init
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import { ackJob, consumeJobs } from "@arb/streaming";
import { log, recoverOnBoot, recoverStaleRuns, runReportTurn } from "@arb/ai";

/**
 * The producer substrate. DECISION: a dedicated long-lived worker (not Vercel
 * background functions) runs the generation loop. Serverless functions return
 * after the response and cannot host a minutes-long streaming producer
 * reliably; a worker can hold the model stream, heartbeat, and respond to
 * cancellation. Web (serverless) only enqueues + subscribes; the worker
 * produces. They communicate exclusively through Postgres + Redis.
 */

const consumerName = `${hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`;
const WATCHDOG_INTERVAL_MS = 30_000;

async function main() {
  log.info("worker.boot", { consumerName });

  // Release any runs left dangling by a previous crash before taking jobs.
  const recovered = await recoverOnBoot();
  if (recovered > 0) log.warn("worker.boot_recovered", { recovered });

  const controller = new AbortController();
  const shutdown = () => controller.abort();
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Watchdog: periodically release runs whose heartbeat went stale.
  const watchdog = setInterval(() => {
    recoverStaleRuns().then((n) => {
      if (n > 0) log.warn("worker.watchdog_recovered", { recovered: n });
    }).catch((err) => log.error("worker.watchdog_failed", { message: String(err) }));
  }, WATCHDOG_INTERVAL_MS);

  try {
    for await (const job of consumeJobs(consumerName, controller.signal)) {
      log.info("worker.job_received", { jobId: job.jobId, runId: job.runId, reportId: job.reportId });
      // runReportTurn never throws; it always lands a terminal state.
      await runReportTurn({ runId: job.runId, reportId: job.reportId });
      await ackJob(job.jobId);
    }
  } finally {
    clearInterval(watchdog);
    log.info("worker.shutdown", {});
  }
}

main().catch((err) => {
  log.error("worker.fatal", { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});

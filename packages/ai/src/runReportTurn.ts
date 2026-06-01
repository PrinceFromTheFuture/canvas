import { convertToModelMessages, readUIMessageStream, stepCountIs, streamText, type UIMessage } from "ai";
import { eq } from "drizzle-orm";
import { db, reports, type DatasetProfile } from "@arb/db";
import { appendChunk, clearCancel, isCancelRequested } from "@arb/streaming";
import { getModel } from "./provider";
import { buildSystemPrompt } from "./prompt";
import { buildTools } from "./tools";
import { registerRun, unregisterRun } from "./runRegistry";
import { failRun, finishRun, heartbeat, interruptRun } from "./runLifecycle";
import { loadRunInputs } from "./loadRunInputs";
import { log } from "./observability";

const MAX_STEPS = 8;
const HEARTBEAT_MS = 5_000;
const CANCEL_POLL_MS = 750;

export interface RunReportTurnArgs {
  runId: string;
  reportId: string;
}

/**
 * Execute one generation turn. CONTRACT: this function never throws. Every
 * exit path lands the run in a terminal state (finished | error | interrupted)
 * in Postgres AND writes the terminal marker to the Redis stream, so every
 * subscriber unblocks and the run lock is released exactly once.
 */
export async function runReportTurn({ runId, reportId }: RunReportTurnArgs): Promise<void> {
  const controller = registerRun(runId);
  await clearCancel(runId);

  let seq = 0;
  let lastBeat = 0;
  let lastCancelPoll = 0;
  let cancelled = false;
  let captured: { jsx: string; title?: string } | null = null;

  try {
    const { report, rows, profile, conversation } = await loadRunInputs(reportId);

    const tools = buildTools({
      rows,
      profile,
      onReport: (jsx, title) => {
        captured = { jsx, title };
      },
    });

    // AI SDK v6: convertToModelMessages is async.
    const modelMessages = await convertToModelMessages(conversation as UIMessage[]);

    const result = streamText({
      model: getModel(),
      system: buildSystemPrompt(profile as DatasetProfile | null),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(MAX_STEPS),
      abortSignal: controller.signal,
    });

    const collected: unknown[] = [];

    for await (const chunk of result.toUIMessageStream()) {
      collected.push(chunk);
      seq += 1;
      await appendChunk(runId, seq, chunk as Record<string, unknown>);

      const now = Date.now();
      if (now - lastBeat > HEARTBEAT_MS) {
        lastBeat = now;
        await heartbeat(runId, seq);
      }
      if (now - lastCancelPoll > CANCEL_POLL_MS) {
        lastCancelPoll = now;
        if (await isCancelRequested(runId)) {
          cancelled = true;
          controller.abort();
          break;
        }
      }
    }

    // Materialize the final assistant message from the same chunks.
    const finalConversation = await materialize(conversation as UIMessage[], collected);

    await persistResult(reportId, report.version, finalConversation, captured);

    if (cancelled) {
      await interruptRun(runId, reportId, seq);
      log.info("run.interrupted", { runId, reportId, seq });
    } else {
      await finishRun(runId, reportId, seq);
      log.info("run.finished", { runId, reportId, seq, committed: Boolean(captured) });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // An abort triggered by cancel is an interrupt, not an error.
    if (cancelled || controller.signal.aborted) {
      await safe(() => interruptRun(runId, reportId, seq));
      log.warn("run.aborted", { runId, reportId, message });
    } else {
      await safe(() => failRun(runId, reportId, seq, message));
      log.error("run.error", { runId, reportId, message });
    }
  } finally {
    unregisterRun(runId);
    await safe(() => clearCancel(runId));
  }
}

async function materialize(existing: UIMessage[], chunks: unknown[]): Promise<UIMessage[]> {
  try {
    const stream = new ReadableStream<Record<string, unknown>>({
      start(c) {
        for (const ch of chunks) c.enqueue(ch as Record<string, unknown>);
        c.close();
      },
    });
    let last: UIMessage | null = null;
    for await (const message of readUIMessageStream({ stream: stream as never })) {
      last = message;
    }
    return last ? [...existing, last] : existing;
  } catch {
    return existing;
  }
}

async function persistResult(
  reportId: string,
  prevVersion: number,
  conversation: UIMessage[],
  captured: { jsx: string; title?: string } | null,
): Promise<void> {
  const update: Record<string, unknown> = {
    conversation: conversation as unknown as Record<string, unknown>[],
    updatedAt: new Date(),
  };
  if (captured) {
    update.sourceJsx = captured.jsx;
    update.version = prevVersion + 1;
    if (captured.title) update.title = captured.title;
  }
  await db.update(reports).set(update).where(eq(reports.id, reportId));
}

async function safe(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    log.error("run.cleanup_failed", { message: err instanceof Error ? err.message : String(err) });
  }
}

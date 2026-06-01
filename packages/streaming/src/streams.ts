import type { Redis } from "ioredis";
import { redis, createBlockingConnection } from "./redis";
import {
  CANCEL_TTL_SECONDS,
  RUN_STREAM_TTL_SECONDS,
  runCancelKey,
  runStreamKey,
} from "./keys";

/** A model/UI chunk. Kept as opaque JSON so this package stays AI-SDK-free. */
export type StreamChunk = Record<string, unknown>;

export type TerminalStatus = "finished" | "error" | "interrupted";

export type RunTailEvent =
  | { type: "chunk"; id: string; seq: number; chunk: StreamChunk }
  | { type: "run-finish"; id: string; lastSeq: number }
  | { type: "run-error"; id: string; lastSeq: number; error: string }
  | { type: "run-interrupted"; id: string; lastSeq: number };

/**
 * Append a chunk to the run's stream and refresh its TTL. This is the hot
 * path: a single XADD, durable and cross-process. The Redis entry id is the
 * canonical cursor; `seq` is a convenience for the client.
 */
export async function appendChunk(runId: string, seq: number, chunk: StreamChunk): Promise<string> {
  const id = await redis.xadd(
    runStreamKey(runId),
    "*",
    "kind",
    "chunk",
    "seq",
    String(seq),
    "data",
    JSON.stringify(chunk),
  );
  await redis.expire(runStreamKey(runId), RUN_STREAM_TTL_SECONDS);
  return id ?? "";
}

/**
 * Write the terminal marker as the final stream entry. Tailers read this and
 * end cleanly; the durable run-status row in Postgres is the other source of
 * truth (written by the caller).
 */
export async function appendTerminal(
  runId: string,
  status: TerminalStatus,
  lastSeq: number,
  error?: string | null,
): Promise<void> {
  await redis.xadd(
    runStreamKey(runId),
    "*",
    "kind",
    "terminal",
    "status",
    status,
    "seq",
    String(lastSeq),
    "error",
    error ?? "",
  );
  await redis.expire(runStreamKey(runId), RUN_STREAM_TTL_SECONDS);
}

function parseEntry(id: string, fields: string[]): RunTailEvent | null {
  const map: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const val = fields[i + 1];
    if (key !== undefined) map[key] = val ?? "";
  }
  const seq = Number(map.seq ?? 0);
  if (map.kind === "chunk") {
    try {
      return { type: "chunk", id, seq, chunk: JSON.parse(map.data ?? "{}") as StreamChunk };
    } catch {
      return null;
    }
  }
  if (map.kind === "terminal") {
    const status = (map.status ?? "interrupted") as TerminalStatus;
    if (status === "finished") return { type: "run-finish", id, lastSeq: seq };
    if (status === "error") return { type: "run-error", id, lastSeq: seq, error: map.error || "unknown error" };
    return { type: "run-interrupted", id, lastSeq: seq };
  }
  return null;
}

export interface TailOptions {
  /** Stream id to start AFTER. "0" replays from the beginning. Default "0". */
  fromId?: string;
  signal?: AbortSignal;
  blockMs?: number;
}

/**
 * Tail a run's stream: replay from `fromId` then block for live entries.
 * Unifies replay + live into one cursor loop (XREAD BLOCK). Ends after the
 * terminal marker is yielded, or on abort. Uses a dedicated blocking
 * connection so it never stalls the shared client.
 */
export async function* tailRun(runId: string, opts: TailOptions = {}): AsyncGenerator<RunTailEvent> {
  const { signal, blockMs = 15_000 } = opts;
  let cursor = opts.fromId ?? "0";
  const conn: Redis = createBlockingConnection();
  try {
    while (true) {
      if (signal?.aborted) return;
      // XREAD BLOCK returns null on timeout; loop again to re-check abort.
      const res = (await conn.xread("BLOCK", blockMs, "STREAMS", runStreamKey(runId), cursor)) as
        | Array<[string, Array<[string, string[]]>]>
        | null;
      if (!res) continue;
      for (const [, entries] of res) {
        for (const [id, fields] of entries) {
          cursor = id;
          const event = parseEntry(id, fields);
          if (!event) continue;
          yield event;
          if (event.type !== "chunk") return; // terminal marker ends the tail
        }
      }
    }
  } finally {
    conn.disconnect();
  }
}

/** Cooperative cancel: set a flag the producer polls. */
export async function requestCancel(runId: string): Promise<void> {
  await redis.set(runCancelKey(runId), "1", "EX", CANCEL_TTL_SECONDS);
}

export async function isCancelRequested(runId: string): Promise<boolean> {
  return (await redis.get(runCancelKey(runId))) === "1";
}

export async function clearCancel(runId: string): Promise<void> {
  await redis.del(runCancelKey(runId));
}

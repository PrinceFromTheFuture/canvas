"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readUIMessageStream, type UIMessage } from "ai";
import { trpc } from "@/lib/trpc";

export type RunStatus = "idle" | "streaming" | "done" | "error" | "cancelled";

interface RunStreamState {
  liveMessage: UIMessage | null;
  status: RunStatus;
}

/**
 * Client streaming pipeline. We deliberately do NOT use `useChat`; instead we
 * own the transport (tRPC SSE relayed from a per-run Redis stream) and reuse
 * the AI SDK's materialization (`readUIMessageStream`).
 *
 * - A single ReadableStream is fed by subscription `chunk` events.
 * - readUIMessageStream turns chunks into evolving UIMessage snapshots.
 * - Snapshots are coalesced with requestAnimationFrame so React renders at
 *   frame rate, not per token.
 * - `fromId` is the resume cursor: on reconnect we replay exactly what we
 *   missed (server-canonical, no client-side dedupe needed) and an epoch bump
 *   forces a clean resubscribe without tearing down the materialized stream.
 */
export function useRunStream(runId: string | null): RunStreamState & { lastId: string | null } {
  const [state, setState] = useState<RunStreamState>({ liveMessage: null, status: "idle" });
  const [fromId, setFromId] = useState<string | undefined>(undefined);
  const [epoch, setEpoch] = useState(0);

  const controllerRef = useRef<ReadableStreamDefaultController<unknown> | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const pendingRef = useRef<UIMessage | null>(null);
  const rafRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    rafRef.current = null;
    if (pendingRef.current) setState((s) => ({ ...s, liveMessage: pendingRef.current }));
  }, []);

  const schedule = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(flush);
  }, [flush]);

  // (Re)build the materialization stream whenever we (re)subscribe.
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    const stream = new ReadableStream<unknown>({
      start(controller) {
        controllerRef.current = controller;
      },
    });
    (async () => {
      try {
        for await (const message of readUIMessageStream({ stream: stream as never })) {
          if (cancelled) return;
          pendingRef.current = message;
          schedule();
        }
      } catch {
        /* terminal close ends the loop */
      }
    })();
    setState((s) => ({ ...s, status: "streaming" }));
    return () => {
      cancelled = true;
      try {
        controllerRef.current?.close();
      } catch {
        /* already closed */
      }
      controllerRef.current = null;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // epoch forces a fresh stream on resume.
  }, [runId, epoch, schedule]);

  trpc.run.subscribe.useSubscription(
    { runId: runId ?? "", fromId },
    {
      enabled: Boolean(runId),
      onData: (event: { type: string; id?: string; chunk?: unknown; error?: string }) => {
        if (event.id) lastIdRef.current = event.id;
        if (event.type === "chunk") {
          try {
            controllerRef.current?.enqueue(event.chunk);
          } catch {
            /* stream closed; will resume */
          }
          return;
        }
        // Terminal markers.
        try {
          controllerRef.current?.close();
        } catch {
          /* noop */
        }
        if (event.type === "run-finish") setState((s) => ({ ...s, status: "done" }));
        else if (event.type === "run-error") setState((s) => ({ ...s, status: "error" }));
        else if (event.type === "run-interrupted") setState((s) => ({ ...s, status: "cancelled" }));
      },
      onError: () => {
        // Reconnect: resume from the last id we saw, fresh stream epoch.
        if (lastIdRef.current) setFromId(lastIdRef.current);
        setEpoch((e) => e + 1);
      },
    },
  );

  return { ...state, lastId: lastIdRef.current };
}

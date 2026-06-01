"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { UIMessage } from "ai";
import { trpc } from "@/lib/trpc";
import { useRunStream } from "@/hooks/useRunStream";
import { Chat } from "./Chat";
import { ReportView } from "./ReportView";

export function Builder({ reportId, appUrl }: { reportId: string; appUrl: string }) {
  const utils = trpc.useUtils();
  const reportQuery = trpc.report.getById.useQuery({ id: reportId });
  const bundleQuery = trpc.report.renderBundle.useQuery({ id: reportId });
  const startRun = trpc.run.start.useMutation();
  const cancelRun = trpc.run.cancel.useMutation();
  const setVisibility = trpc.report.setVisibility.useMutation();

  const [runId, setRunId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const stream = useRunStream(runId);
  const streaming = runId != null && stream.status === "streaming";
  // Server-truth: a run may be active even if this client lost its runId
  // (e.g. after a refresh). Disable sending in that case too.
  const busy = streaming || reportQuery.data?.runStatus === "running";

  // When a run reaches a terminal state, pull the server-canonical report +
  // recompiled preview, then drop the live stream.
  useEffect(() => {
    if (!runId) return;
    if (stream.status === "done" || stream.status === "error" || stream.status === "cancelled") {
      void utils.report.getById.invalidate({ id: reportId });
      void utils.report.renderBundle.invalidate({ id: reportId });
      setRunId(null);
    }
  }, [stream.status, runId, reportId, utils]);

  const persisted = (reportQuery.data?.conversation ?? []) as unknown as UIMessage[];
  const messages = useMemo(() => {
    if (streaming && stream.liveMessage) return [...persisted, stream.liveMessage];
    return persisted;
  }, [persisted, streaming, stream.liveMessage]);

  async function onSend(text: string) {
    try {
      const res = await startRun.mutateAsync({ reportId, message: text });
      setRunId(res.runId);
      void utils.report.getById.invalidate({ id: reportId });
    } catch (err) {
      // CONFLICT = the run lock rejected a concurrent turn; surface quietly.
      setSendError(err instanceof Error ? err.message : "Could not start the run");
    }
  }

  function onStop() {
    if (runId) cancelRun.mutate({ runId });
  }

  const report = reportQuery.data;
  const shareUrl = report ? `${appUrl}/r/${report.slug}` : "";

  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-[420px_1fr]">
      <aside className="flex flex-col border-r border-[var(--chrome-border)] bg-[var(--chrome-bg)]">
        <div className="flex items-center justify-between border-b border-[var(--chrome-border)] p-3">
          <Link href="/" className="text-sm text-[var(--chrome-muted)] hover:text-[var(--chrome-text)]">
            ← Reports
          </Link>
          <span className="text-sm font-medium truncate">{report?.title ?? "Report"}</span>
        </div>
        <div className="min-h-0 flex-1">
          <Chat
            messages={messages}
            streaming={busy}
            error={sendError}
            onSend={(text) => {
              setSendError(null);
              void onSend(text);
            }}
            onStop={onStop}
          />
        </div>
      </aside>

      <section className="flex min-h-0 flex-col bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--chrome-border)] bg-[var(--chrome-panel)] px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--chrome-muted)]">Visibility</span>
            <button
              onClick={() =>
                report &&
                setVisibility
                  .mutateAsync({ id: reportId, visibility: report.visibility === "unlisted" ? "private" : "unlisted" })
                  .then(() => utils.report.getById.invalidate({ id: reportId }))
              }
              className="rounded border border-[var(--chrome-border)] px-2 py-1"
            >
              {report?.visibility === "unlisted" ? "Unlisted (link)" : "Private"}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {report?.visibility === "unlisted" ? (
              <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="rounded border border-[var(--chrome-border)] px-2 py-1 text-[var(--chrome-muted)]">
                Copy share link
              </button>
            ) : null}
            <a href={`/api/pdf/${reportId}`} className="rounded bg-[var(--chrome-accent)] px-3 py-1 font-medium text-white">
              Export PDF
            </a>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {bundleQuery.data?.hasReport && bundleQuery.data.compiledCode ? (
            <ReportView compiledCode={bundleQuery.data.compiledCode} data={bundleQuery.data.data} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              {streaming ? "Generating report..." : "No report yet. Describe one in the chat to begin."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

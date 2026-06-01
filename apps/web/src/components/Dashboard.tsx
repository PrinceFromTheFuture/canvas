"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export function Dashboard() {
  const router = useRouter();
  const list = trpc.report.list.useQuery();
  const createReport = trpc.report.create.useMutation();
  const uploadDataset = trpc.dataset.upload.useMutation();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function onCreate() {
    setBusy(true);
    try {
      let datasetId: string | undefined;
      if (file) {
        const res = await uploadDataset.mutateAsync({
          filename: file.name,
          mediaType: file.type || "text/csv",
          contentBase64: await fileToBase64(file),
        });
        datasetId = res.id;
      }
      const report = await createReport.mutateAsync({ title: title || "Untitled report", datasetId });
      router.push(`/report/${report.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-[var(--chrome-border)] bg-[var(--chrome-panel)] p-5">
        <h2 className="text-sm font-medium mb-3">New report</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Report title"
            className="flex-1 rounded-md bg-[var(--chrome-bg)] border border-[var(--chrome-border)] px-3 py-2 text-sm outline-none focus:border-[var(--chrome-accent)]"
          />
          <label className="text-sm text-[var(--chrome-muted)] cursor-pointer rounded-md border border-[var(--chrome-border)] px-3 py-2">
            {file ? file.name : "Attach data (.csv/.json/.xlsx)"}
            <input type="file" accept=".csv,.json,.xlsx,.xls" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={onCreate} disabled={busy} className="rounded-md bg-[var(--chrome-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {busy ? "Creating..." : "Create"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3 text-[var(--chrome-muted)]">Your reports</h2>
        {list.isLoading ? (
          <p className="text-sm text-[var(--chrome-muted)]">Loading...</p>
        ) : list.data && list.data.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.data.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => router.push(`/report/${r.id}`)}
                  className="w-full text-left rounded-lg border border-[var(--chrome-border)] bg-[var(--chrome-panel)] p-4 hover:border-[var(--chrome-accent)]"
                >
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-[var(--chrome-muted)] mt-1">
                    {r.runStatus === "running" ? "Generating..." : r.runStatus === "error" ? "Last run errored" : "Ready"}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--chrome-muted)]">No reports yet. Create one above.</p>
        )}
      </section>
    </div>
  );
}

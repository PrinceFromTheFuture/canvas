import { tool } from "ai";
import { z } from "zod";
import { compileReport, GuardrailError } from "@arb/report-language/eval";
import type { DatasetProfile } from "@arb/db";

type Row = Record<string, unknown>;

export interface ToolContext {
  rows: Row[];
  profile: DatasetProfile | null;
  /** Called when the model commits a valid report source. */
  onReport: (jsx: string, title?: string) => void;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Least-privilege dataset helpers. The model computes figures through these
 * instead of receiving the full dataset in its context: keeps prompt size
 * bounded and the "AI as secondary actor" boundary crisp. The data scope
 * available to the AUTHORED report is `rows` and `profile`.
 */
export function buildTools(ctx: ToolContext) {
  return {
    describeDataset: tool({
      description: "Return dataset columns, row count, and a few sample rows.",
      inputSchema: z.object({}),
      execute: async () => ({
        rowCount: ctx.profile?.rowCount ?? ctx.rows.length,
        columns: ctx.profile?.columns ?? [],
        sampleRows: ctx.profile?.sampleRows ?? ctx.rows.slice(0, 5),
      }),
    }),

    aggregate: tool({
      description: "Group rows by an optional column and aggregate a metric column. op: sum|avg|count|min|max.",
      inputSchema: z.object({
        groupBy: z.string().optional(),
        metric: z.string().optional(),
        op: z.enum(["sum", "avg", "count", "min", "max"]),
      }),
      execute: async ({ groupBy, metric, op }) => {
        const buckets = new Map<string, Row[]>();
        for (const r of ctx.rows) {
          const key = groupBy ? String(r[groupBy] ?? "—") : "all";
          (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(r);
        }
        const results = Array.from(buckets.entries()).map(([key, group]) => {
          let value: number;
          if (op === "count" || !metric) value = group.length;
          else {
            const vals = group.map((g) => num(g[metric]));
            if (op === "sum") value = vals.reduce((a, b) => a + b, 0);
            else if (op === "avg") value = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
            else if (op === "min") value = Math.min(...vals);
            else value = Math.max(...vals);
          }
          return { key, value: Math.round(value * 1000) / 1000 };
        });
        return { groupBy: groupBy ?? null, op, results: results.slice(0, 200) };
      },
    }),

    topN: tool({
      description: "Return the top/bottom N rows sorted by a numeric column.",
      inputSchema: z.object({
        column: z.string(),
        n: z.number().int().min(1).max(100).default(10),
        dir: z.enum(["desc", "asc"]).default("desc"),
      }),
      execute: async ({ column, n, dir }) => {
        const sorted = [...ctx.rows].sort((a, b) =>
          dir === "desc" ? num(b[column]) - num(a[column]) : num(a[column]) - num(b[column]),
        );
        return { rows: sorted.slice(0, n) };
      },
    }),

    writeReport: tool({
      description:
        "Commit the final report as JSX source (export default function Report(){...}). Returns validation result; on failure, fix the violations and call again.",
      inputSchema: z.object({
        jsx: z.string().describe("Full JSX source using only the vocabulary."),
        title: z.string().optional(),
      }),
      execute: async ({ jsx, title }) => {
        try {
          // Validate against the same data contract the viewer will use.
          await compileReport({ source: jsx, data: { rows: ctx.rows, profile: ctx.profile ?? {} } });
        } catch (err) {
          if (err instanceof GuardrailError) {
            return { ok: false as const, violations: err.violations };
          }
          return { ok: false as const, violations: [(err as Error).message] };
        }
        ctx.onReport(jsx, title);
        return { ok: true as const };
      },
    }),
  };
}

export type ReportTools = ReturnType<typeof buildTools>;

import { compileReport } from "@arb/report-language/eval";
import { loadRunInputs } from "./loadRunInputs";

export interface RenderBundle {
  hasReport: boolean;
  title: string;
  /** Compiled CJS the client evaluates with a web scope (no esbuild on client). */
  compiledCode: string | null;
  /** Data merged into the report scope: { rows, profile }. */
  data: Record<string, unknown>;
}

/**
 * Produce everything a client needs to RENDER a report without running
 * esbuild in the browser: compile on the server, ship compiled code + data.
 * The client evals it against the web vocabulary scope. Used by both the
 * builder preview and the public viewer.
 */
export async function buildRenderBundle(reportId: string): Promise<RenderBundle> {
  const { report, rows, profile } = await loadRunInputs(reportId);
  const data = { rows, profile: profile ?? {} };
  if (!report.sourceJsx) {
    return { hasReport: false, title: report.title, compiledCode: null, data };
  }
  const compiledCode = await compileReport({ source: report.sourceJsx, data });
  return { hasReport: true, title: report.title, compiledCode, data };
}

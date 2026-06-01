"use client";

import { useMemo } from "react";
import { buildWebScope, renderToElement, ReportErrorBoundary } from "@arb/report-language/client";

/**
 * Renders an already-compiled report on the client. The server compiled the
 * authored JSX to CJS (esbuild stays server-side); here we only evaluate it
 * against the curated web vocabulary scope and let React render the DOM
 * branch (interactive Sections etc).
 */
export function ReportView({
  compiledCode,
  data,
}: {
  compiledCode: string;
  data: Record<string, unknown>;
}) {
  const element = useMemo(() => {
    try {
      return renderToElement(compiledCode, buildWebScope(data));
    } catch {
      return null;
    }
  }, [compiledCode, data]);

  return (
    <ReportErrorBoundary>
      {element ?? <div style={{ padding: 24, color: "#767676" }}>Report could not be rendered.</div>}
    </ReportErrorBoundary>
  );
}

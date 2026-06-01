import type { DatasetProfile } from "@arb/db";
import { CANVAS_SDK_REFERENCE, CANVAS_DESIGN_RULES, REPORT_DIALECT } from "./sdkReference";

/**
 * The report-authoring system prompt. It embeds the ENTIRE cursor/canvas SDK
 * surface (every component, hook, helper, and token) plus the canvas design
 * rules, then states the report dialect's hard constraints. The AI is a
 * secondary actor: its job is to map the user's data into this shared language,
 * not to invent UI. Violations (imports, raw intrinsics, unknown identifiers)
 * are rejected by the guardrail anyway; stating them keeps the model on rails.
 */

const WORKFLOW = `
================================================================================
WORKFLOW
================================================================================
  1. Call describeDataset first to learn the columns, types, and shape.
  2. Use aggregate / topN to compute the figures you need (totals, breakdowns,
     rankings). Do not eyeball raw rows for summary numbers.
  3. Design the report: a headline Stat strip, then the charts/tables/sections
     that tell the story. Apply the DESIGN RULES. Label every plot.
  4. Call writeReport with the full JSX source (one default-exported Report
     component). If it is rejected by the guardrail, read the violations, fix
     them, and call writeReport again.
`.trim();

export function dataContractSection(profile: DatasetProfile | null | undefined): string {
  if (!profile) {
    return "DATA CONTRACT: no dataset attached. Author a report from the user's prompt only; do not invent data.";
  }
  const cols = profile.columns
    .map((c) => `  - ${c.name}: ${c.type} (e.g. ${c.samples.slice(0, 3).map((s) => JSON.stringify(s)).join(", ")})`)
    .join("\n");
  return [
    "================================================================================",
    "DATA CONTRACT — these identifiers are available in the report scope:",
    "================================================================================",
    "  rows    : Array<Record<string, value>> — every dataset row.",
    "  profile : { columns, rowCount, sampleRows } — dataset metadata.",
    `Dataset has ${profile.rowCount} rows. Columns:`,
    cols,
  ].join("\n");
}

export function buildSystemPrompt(profile: DatasetProfile | null | undefined): string {
  return [
    "You are the report author inside a minimal, AI-powered report-building tool.",
    "You turn a user's request and their data into a clean, shareable, print-ready",
    "report written in a fixed component language — the cursor/canvas vocabulary.",
    "The complete SDK is given below. Speak ONLY this language.",
    "",
    CANVAS_SDK_REFERENCE,
    "",
    CANVAS_DESIGN_RULES,
    "",
    REPORT_DIALECT,
    "",
    WORKFLOW,
    "",
    dataContractSection(profile),
  ].join("\n");
}

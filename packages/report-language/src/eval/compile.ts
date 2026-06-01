import * as React from "react";
import type { RenderTarget } from "../context";
import { buildScope, buildWebScope } from "../scope";
import { guardrail } from "./guardrail";
import { transformReportSource } from "./transform";
import { renderToElement } from "./runner";

export class GuardrailError extends Error {
  constructor(public readonly violations: string[]) {
    super(`Report rejected by guardrail:\n- ${violations.join("\n- ")}`);
    this.name = "GuardrailError";
  }
}

export interface CompileInput {
  source: string;
  data?: Record<string, unknown>;
}

/** Guardrail + transform. Throws GuardrailError on policy violation. */
export async function compileReport(input: CompileInput): Promise<string> {
  const data = input.data ?? {};
  const result = guardrail(input.source, { dataKeys: Object.keys(data) });
  if (!result.ok) throw new GuardrailError(result.violations);
  return transformReportSource(input.source);
}

/** Compile + render to a React element for the WEB target (no pdf import). */
export async function renderReportWeb(input: CompileInput): Promise<React.ReactElement | null> {
  const compiled = await compileReport(input);
  const scope = buildWebScope(input.data ?? {});
  return renderToElement(compiled, scope);
}

/** Compile + render to a React element for the PDF target (server only). */
export async function renderReportForTarget(
  input: CompileInput,
  target: RenderTarget,
): Promise<React.ReactElement | null> {
  const compiled = await compileReport(input);
  const scope = await buildScope(target, input.data ?? {});
  return renderToElement(compiled, scope);
}

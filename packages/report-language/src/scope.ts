import * as React from "react";
import * as webComponents from "./web/index";
import type { RenderTarget } from "./context";
import { COMPONENT_NAMES } from "./vocabulary";
import { useHostTheme, useCanvasState, useCanvasAction } from "./hooks";
import { computeDAGLayout, mergeStyle } from "./shared/dag";
import { colorPalette, usageColorSequence, chartColorSequence } from "./tokens";

export type Vocabulary = Record<string, unknown>;

/**
 * The non-component scope globals (hooks, helpers, color tokens). Injected
 * into every scope (web + pdf) so authored source can reference them as free
 * identifiers, exactly like the canvas SDK exposes them.
 */
const scopeGlobals: Record<string, unknown> = {
  useHostTheme,
  useCanvasState,
  useCanvasAction,
  useState: React.useState,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  useRef: React.useRef,
  mergeStyle,
  computeDAGLayout,
  colorPalette,
  usageColorSequence,
  chartColorSequence,
};

/**
 * Build the eval scope. The SAME authored source resolves component names
 * from THIS object, so swapping the implementation set (web vs pdf) is how
 * one source renders to two targets. The pdf set is loaded lazily and only
 * on the server (it pulls @react-pdf/renderer, which must never enter the
 * web client bundle).
 */
export async function buildScope(
  target: RenderTarget,
  data: Record<string, unknown>,
): Promise<{ React: typeof React } & Record<string, unknown>> {
  const components: Vocabulary = {};
  if (target === "pdf") {
    const pdf = await import("./pdf/index");
    for (const name of COMPONENT_NAMES) components[name] = (pdf as Record<string, unknown>)[name];
  } else {
    for (const name of COMPONENT_NAMES) components[name] = (webComponents as Record<string, unknown>)[name];
  }
  return { React, ...scopeGlobals, ...components, ...data };
}

/** Synchronous web-only scope for client-side rendering (no pdf import). */
export function buildWebScope(data: Record<string, unknown>): { React: typeof React } & Record<string, unknown> {
  const components: Vocabulary = {};
  for (const name of COMPONENT_NAMES) components[name] = (webComponents as Record<string, unknown>)[name];
  return { React, ...scopeGlobals, ...components, ...data };
}

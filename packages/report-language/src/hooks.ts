import * as React from "react";
import { canvasTheme, type CanvasTheme } from "./tokens";

/**
 * `cursor/canvas`-compatible hooks, adapted for the report runtime.
 *
 * A report is a shared, exportable artifact — there is no IDE host and no
 * persistent sidecar. So:
 *   - `useHostTheme` returns the print-first report theme (static).
 *   - `useCanvasState` degrades to plain component state (`React.useState`):
 *     interactivity works in the web view; the PDF render captures the
 *     default state (the static projection).
 *   - `useCanvasAction` returns a no-op dispatcher (IDE actions are not
 *     available outside Cursor).
 *
 * The signatures match the SDK so canvas-style source runs unchanged.
 */

export type CanvasAction = { type: string; [key: string]: unknown };
export type SetCanvasState<T> = (action: T | ((prev: T) => T)) => void;

export function useHostTheme(): CanvasTheme & { tokens: CanvasTheme } {
  return React.useMemo(() => ({ ...canvasTheme, tokens: canvasTheme }), []);
}

export function useCanvasState<T>(_key: string, defaultValue: T): [T, SetCanvasState<T>] {
  return React.useState<T>(defaultValue);
}

export function useCanvasAction(): (action: CanvasAction) => void {
  return React.useCallback(() => {
    /* no-op: IDE actions are unavailable in a shared report */
  }, []);
}

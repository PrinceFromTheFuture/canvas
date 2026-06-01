/**
 * Client-safe entry. Pulls NONE of the server-only eval machinery (esbuild,
 * babel, the pdf branch). The browser only EVALUATES already-compiled code
 * (server compiled it) against the web vocabulary scope, so this entry needs
 * the runner + web scope + tokens only.
 */
export { renderToElement, type RunnerScope } from "./eval/runner";
export { ReportErrorBoundary } from "./web/ErrorBoundary";
export { buildWebScope } from "./scope";
export { ReportRoot } from "./web/index";
export { tokens } from "./tokens";
export { useRenderTarget, RenderTargetProvider } from "./context";

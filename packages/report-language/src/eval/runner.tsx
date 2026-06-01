import * as React from "react";

export interface RunnerScope {
  React: typeof React;
  [key: string]: unknown;
}

/**
 * Evaluate compiled CJS report code with a curated scope and return the
 * default-exported component as a React element.
 *
 * We provide `module`/`exports` (which react-runner does not), so esbuild's
 * CJS output works directly. `require` is a stub that throws - the guardrail
 * already rejects imports, this is defense in depth.
 */
export function renderToElement(compiledCode: string, scope: RunnerScope): React.ReactElement | null {
  const moduleObj: { exports: Record<string, unknown> } = { exports: {} };
  const requireStub = (name: string) => {
    throw new Error(`require("${name}") is not available in report scope`);
  };

  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((k) => scope[k]);

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(...scopeKeys, "module", "exports", "require", compiledCode);
  fn(...scopeValues, moduleObj, moduleObj.exports, requireStub);

  const exported = (moduleObj.exports.default ?? moduleObj.exports) as unknown;
  if (!exported) return null;

  if (React.isValidElement(exported)) return exported;
  if (typeof exported === "function") {
    return React.createElement(exported as React.ComponentType);
  }
  return null;
}

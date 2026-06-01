import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import { COMPONENT_NAMES, SAFE_GLOBALS } from "../vocabulary";

// @babel/traverse ships as CJS; interop the default export under ESM.
const traverse = (_traverse as unknown as { default?: typeof _traverse }).default ?? _traverse;

export interface GuardrailResult {
  ok: boolean;
  violations: string[];
}

export interface GuardrailOptions {
  /** Data keys injected into scope; references to these are allowed. */
  dataKeys?: string[];
  /** Hard cap on source size to bound parse/eval cost. */
  maxLength?: number;
}

const MAX_LENGTH_DEFAULT = 50_000;

/**
 * Static gate run BEFORE transform/eval. Enforces the curated-scope security
 * model and the portability guarantee:
 *   - no import/require (nothing escapes the scope)
 *   - no intrinsic (lowercase) JSX elements (would crash the pdf reconciler)
 *   - no free identifier outside the allowed set (vocabulary + React + safe
 *     globals + data keys)
 * This is what makes evaluating model-authored code safe and what keeps the
 * web and pdf targets renderable from one source.
 */
export function guardrail(source: string, opts: GuardrailOptions = {}): GuardrailResult {
  const violations: string[] = [];
  const maxLength = opts.maxLength ?? MAX_LENGTH_DEFAULT;
  if (source.length > maxLength) {
    return { ok: false, violations: [`Source exceeds ${maxLength} characters`] };
  }

  const allowed = new Set<string>([...COMPONENT_NAMES, ...SAFE_GLOBALS, ...(opts.dataKeys ?? [])]);

  let ast;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch (err) {
    return { ok: false, violations: [`Parse error: ${(err as Error).message}`] };
  }

  traverse(ast, {
    ImportDeclaration(path) {
      violations.push(`import is not allowed (line ${path.node.loc?.start.line ?? "?"})`);
    },
    // @ts-expect-error ImportExpression exists at runtime in newer babel
    ImportExpression(path: { node: { loc?: { start: { line: number } } } }) {
      violations.push(`dynamic import is not allowed (line ${path.node.loc?.start.line ?? "?"})`);
    },
    JSXOpeningElement(path) {
      const name = path.node.name;
      if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) {
        violations.push(`intrinsic element <${name.name}> is not allowed; use the vocabulary (line ${path.node.loc?.start.line ?? "?"})`);
      }
    },
    CallExpression(path) {
      const callee = path.node.callee;
      if (callee.type === "Identifier" && (callee.name === "require" || callee.name === "eval" || callee.name === "fetch")) {
        violations.push(`call to ${callee.name}() is not allowed (line ${path.node.loc?.start.line ?? "?"})`);
      }
    },
    Identifier(path) {
      // Only check references (reads), not declarations / property keys.
      if (!path.isReferencedIdentifier()) return;
      const name = path.node.name;
      if (allowed.has(name)) return;
      // Bound locally (params, consts, function names, imports-already-rejected)?
      if (path.scope.getBinding(name)) return;
      // Member property access like obj.fetch is fine; only flag free globals.
      violations.push(`unknown identifier "${name}" (line ${path.node.loc?.start.line ?? "?"})`);
    },
  });

  // De-dupe noise (same identifier referenced many times).
  const unique = Array.from(new Set(violations));
  return { ok: unique.length === 0, violations: unique };
}

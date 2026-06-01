import * as React from "react";
import * as webComponents from "../web/index";
import { COMPONENT_NAMES } from "../vocabulary";

export interface ReportNode {
  type: string;
  props: Record<string, unknown>;
  children: Array<ReportNode | string | number>;
}

// Reverse map: component function -> vocabulary name, for stable JSON output.
const fnToName = new Map<unknown, string>();
for (const name of COMPONENT_NAMES) {
  fnToName.set((webComponents as Record<string, unknown>)[name], name);
}

function typeName(type: React.ReactElement["type"]): string {
  if (typeof type === "string") return type;
  const named = fnToName.get(type);
  if (named) return named;
  const fn = type as { displayName?: string; name?: string };
  return fn.displayName ?? fn.name ?? "Unknown";
}

/**
 * Project a rendered element tree into a serializable JSON snapshot. JSX is
 * the source of truth; this derived form is useful for diffing, caching,
 * and a future constrained-JSON authoring mode (easy to downgrade to, hard
 * to upgrade from - exactly why we author in JSX).
 */
export function projectElement(node: React.ReactNode): ReportNode | string | number | null {
  if (node == null || typeof node === "boolean") return null;
  if (typeof node === "string" || typeof node === "number") return node;
  if (Array.isArray(node)) {
    // Fragments / arrays collapse into a synthetic group.
    return { type: "Fragment", props: {}, children: node.map(projectElement).filter(notNull) };
  }
  if (React.isValidElement(node)) {
    const { children, ...props } = (node.props ?? {}) as { children?: React.ReactNode } & Record<string, unknown>;
    const childArray = React.Children.toArray(children).map(projectElement).filter(notNull);
    return {
      type: typeName(node.type),
      props: serializableProps(props),
      children: childArray,
    };
  }
  return null;
}

function notNull<T>(v: T | null): v is T {
  return v !== null;
}

function serializableProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === "function") continue; // drop handlers; not part of the static artifact
    if (React.isValidElement(v) || Array.isArray(v)) {
      out[k] = projectElement(v as React.ReactNode);
    } else {
      out[k] = v;
    }
  }
  return out;
}

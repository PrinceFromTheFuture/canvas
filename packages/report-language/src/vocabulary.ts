/**
 * The canonical list of component names the AI may use. This is the
 * allowlist the guardrail enforces and the set of names injected into the
 * eval scope. Adding a capability to the product = adding a name here AND
 * implementing it in BOTH src/web and src/pdf.
 *
 * Mirrors the public `cursor/canvas` component surface so a report speaks the
 * same language as a canvas.
 */
export const COMPONENT_NAMES = [
  // Layout
  "ReportRoot",
  "Stack",
  "Row",
  "Grid",
  "Spacer",
  "Divider",
  // Typography
  "Text",
  "H1",
  "H2",
  "H3",
  "Code",
  "Link",
  // Surfaces
  "Card",
  "CardHeader",
  "CardBody",
  "Stat",
  "Pill",
  "Callout",
  "Swatch",
  // Data
  "Table",
  "Sections",
  "CollapsibleSection",
  "UsageBar",
  "TodoList",
  "TodoListCard",
  "DiffStats",
  "DiffView",
  // Charts
  "BarChart",
  "LineChart",
  "PieChart",
  // Forms (interactive on web; static projection in pdf)
  "Button",
  "IconButton",
  "Checkbox",
  "Toggle",
  "Select",
  "TextInput",
  "TextArea",
] as const;

export type ComponentName = (typeof COMPONENT_NAMES)[number];

/**
 * Non-component identifiers injected into the eval scope: the canvas-style
 * hooks, pure layout/style helpers, and color tokens. These are referenced as
 * free identifiers in authored source, so they must also be in the guardrail
 * allowlist (see SAFE_GLOBALS below).
 */
export const SCOPE_GLOBALS = [
  // Hooks (canvas-compatible)
  "useHostTheme",
  "useCanvasState",
  "useCanvasAction",
  // React hooks the canvas surface uses directly
  "useState",
  "useMemo",
  "useCallback",
  "useRef",
  // Pure helpers
  "mergeStyle",
  "computeDAGLayout",
  // Color tokens
  "colorPalette",
  "usageColorSequence",
  "chartColorSequence",
] as const;

export type ScopeGlobal = (typeof SCOPE_GLOBALS)[number];

/**
 * Safe, pure global identifiers the authored code may reference besides the
 * vocabulary, React, the scope globals, and the injected data keys.
 * fetch/window/document/process/eval/require are NOT here and are rejected as
 * unknown identifiers.
 */
export const SAFE_GLOBALS = new Set<string>([
  "React",
  "Math",
  "JSON",
  "Object",
  "Array",
  "Number",
  "String",
  "Boolean",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "undefined",
  "NaN",
  "Infinity",
  "Set",
  "Map",
  ...SCOPE_GLOBALS,
]);

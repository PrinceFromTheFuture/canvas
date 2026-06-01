/**
 * The full `cursor/canvas` SDK surface, transcribed for the report-authoring
 * system prompt. This is a faithful, build-safe rendering of every public
 * export in ~/.cursor/skills-cursor/canvas/sdk/*.d.ts (components, props,
 * hooks, helpers, tokens) plus the design rules from canvas SKILL.md.
 *
 * It is embedded verbatim into the system prompt (see prompt.ts) so the model
 * has the entire vocabulary and its exact prop shapes in context. Inline code
 * is quoted with single quotes (not backticks) so this whole reference stays a
 * single safe template string.
 *
 * NOTE: The report runtime is a DUAL-TARGET (web + PDF) dialect of the canvas
 * SDK. The "REPORT DIALECT" section below states exactly how it differs from a
 * raw .canvas.tsx file. Honor those differences — they are hard constraints.
 */

export const CANVAS_SDK_REFERENCE = `
================================================================================
CURSOR/CANVAS SDK — COMPLETE COMPONENT VOCABULARY
================================================================================
Every name below is pre-injected into scope. Reference it directly; do NOT
import anything. Props marked '?' are optional. 'style?' accepts a plain style
object for minor tweaks (padding, width, maxWidth). 'node' = any renderable
content. 'tone' = "success" | "danger" | "warning" | "info" | "neutral".

──────────────────────────────────────────────────────────────────────────────
LAYOUT
──────────────────────────────────────────────────────────────────────────────
ReportRoot { children }
    Top-level page wrapper. Put the whole report inside one ReportRoot (or a
    single Stack — the viewer frames it either way).
Stack { children, gap?:number, style? }
    Vertical flex column. The default page-level container.
Row { children, gap?:number, align?:"start"|"center"|"end"|"stretch",
      justify?:"start"|"center"|"end"|"space-between", wrap?:bool, style? }
    Horizontal flex row for inline groups (badges, buttons, metadata).
Grid { children, columns:number | css-template-string, gap?:number,
       align?:"start"|"center"|"end"|"stretch", style? }
    CSS grid. 'columns' is a number (equal columns) or a grid-template string
    like "1fr 2fr". Prefer over Row+wrap for fixed equal-width columns.
Spacer {}
    Flexible spacer inside a Row; pushes trailing content to the far edge.
Divider { style? }
    Horizontal hairline rule separating sections.

──────────────────────────────────────────────────────────────────────────────
TYPOGRAPHY
──────────────────────────────────────────────────────────────────────────────
H1 { children, style? }   Page title. Use once at the top. Never inside CardHeader.
H2 { children, style? }   Section heading.
H3 { children, style? }   Sub-section heading.
Text { children, tone?:"primary"|"secondary"|"tertiary"|"quaternary",
       size?:"body"|"small", weight?:"normal"|"medium"|"semibold"|"bold",
       italic?:bool, as?:"p"|"span", truncate?:bool|"start"|"end", style? }
    Body copy. Compose with Code and Link inline.
Code { children, style? }
    Inline monospace span for identifiers, paths, short snippets.
Link { children, href:string, style? }
    Inline hyperlink (opens in a new tab).

──────────────────────────────────────────────────────────────────────────────
SURFACES
──────────────────────────────────────────────────────────────────────────────
Card { children, variant?:"default"|"borderless", collapsible?:bool,
       defaultOpen?:bool, style? }
    Bordered surface for a labeled, self-contained unit. Compose CardHeader +
    CardBody. Set 'collapsible' to make the header toggle the body. Do NOT nest
    cards or wrap plain text — use H2 + Text for general sections.
CardHeader { children, trailing?:node, style? }
    Compact 12px label row. 'children' is PLAIN TEXT only (no H1/H2, no buttons).
    'trailing' is a small right-aligned slot (one Pill, a DiffStats, a timestamp).
CardBody { children, style? }
    Padded content area inside a Card. Use style={{padding:0}} for tables/diffs.
Stat { value:node, label:string, tone?, style? }
    A single metric: large value + small label. Use inside a Grid for stat strips.
Pill { children, tone?:"neutral"|"success"|"warning"|"info"|"added"|"deleted"|"renamed",
       active?:bool, size?:"sm"|"md", leadingContent?:node, onClick?, disabled?,
       title?, style? }
    Pill label or toggle button. Use for tab bars and filter groups (active =
    filled). size="sm" is a compact, borderless variant for CardHeader trailing.
Callout { children, tone?:"info"|"success"|"warning"|"danger"|"neutral",
          title?:node, icon?:node, style? }
    Tinted, bordered notice block for warnings, tips, status messages.
Swatch { color:"gray"|"purple"|"green"|"yellow"|"pink"|"blue"|"orange", style? }
    Small filled category swatch. Matches the UsageBar segment color of the same
    name. Use as the 'leading' slot of CollapsibleSection or in legends.

──────────────────────────────────────────────────────────────────────────────
DATA
──────────────────────────────────────────────────────────────────────────────
Table { headers:node[], rows:node[][],
        columnAlign?:("left"|"center"|"right")[], rowTone?:tone[],
        striped?:bool, stickyHeader?:bool, emptyMessage?:node, style? }
    Framed data table. rowTone tints a row (status highlighting). Render directly
    under a heading; do not wrap in a Card unless it is a named entity.
Sections { items:{title:string, body:node}[] }
    Accordion. Web: one section open at a time. PDF: ALL sections revealed.
CollapsibleSection { title:string, leading?:node, count?:number, trailing?:node,
                     children, style? }
    Borderless disclosure row (chevron + structured header). Nest them to form a
    tree. Web: collapsible. PDF: expanded. For a bordered collapsible surface use
    Card collapsible instead.
UsageBar { segments:{id:string, value:number, color?:Color}[], total:number,
           topLeftLabel?:node, topRightLabel?:node, style? }
    Segmented proportional bar for a fixed-budget breakdown (storage, capacity,
    token usage). Remainder fills max(0, total - sum(values)).
TodoList { todos:{id:string, content:string,
           status:"pending"|"in_progress"|"completed"|"cancelled"}[],
           dimmedTodoIds?, onTodoClick?, style? }
    Task list with status glyphs. Web: each row is clickable.
TodoListCard { ...TodoList, defaultExpanded?:bool }
    Bordered, collapsible todo list with an "N of M done" summary header.
DiffStats { additions?:number, deletions?:number, style? }
    Inline +N green / -N red glyph pair. Renders nothing when both are zero. Put
    in a CardHeader 'trailing' slot.
DiffView { lines:{type:"added"|"removed"|"unchanged", content:string,
           lineNumber?:number}[], path?:string, language?:string,
           showLineNumbers?:bool, coloredLineNumbers?:bool,
           showAccentStrip?:bool, style? }
    Unified diff body (monospace, colored line backgrounds, gutter). Place inside
    a Card + CardBody with style={{padding:0}} for the standard file-diff look.
    (Syntax highlighting from 'path'/'language' is not applied in this dialect.)

──────────────────────────────────────────────────────────────────────────────
CHARTS  (tone optional per series/slice; otherwise auto categorical colors;
         a legend is shown automatically for 2+ series)
──────────────────────────────────────────────────────────────────────────────
BarChart { categories:string[], series:{name, data:number[], tone?}[],
           height?:number, stacked?:bool, normalized?:bool, valueSuffix?:string,
           style? }
    Multi-series columns. 'stacked' stacks; 'normalized' makes 100%-stacked.
LineChart { categories:string[], series:{name, data:number[], tone?}[],
            height?:number, fill?:bool, valueSuffix?:string, style? }
    Multi-series lines. 'fill' shades the area under each line. Not a time-series
    component — pass pre-formatted date strings as categories.
PieChart { data:{label:string, value:number, tone?}[], size?:number,
           donut?:bool, style? }
    Pie / donut. Each datum is a slice.

──────────────────────────────────────────────────────────────────────────────
FORM CONTROLS  (interactive in the web view; STATIC PROJECTION in the PDF —
                the current value is shown, no interaction)
──────────────────────────────────────────────────────────────────────────────
Button { children, variant?:"primary"|"secondary"|"ghost", disabled?, onClick?, style? }
    Inline action button. Never stretch full width.
IconButton { children (icon), onClick?, title?, variant?:"default"|"circle",
             size?:"sm"|"md", style? }
    Compact icon-only button. 'children' is an inline glyph or short text. Always
    provide 'title'. (No raw SVG in this dialect — use a short text/Unicode glyph.)
Checkbox { checked?, onChange:(checked:boolean)=>void, disabled?, label?, style? }
Toggle { checked?, onChange:(checked:boolean)=>void, disabled?, size?:"sm"|"md", style? }
Select { value?, onChange:(value:string)=>void, options:{value,label,disabled?}[],
         placeholder?, disabled?, style? }
TextInput { value?, onChange:(value:string)=>void, placeholder?,
            type?:"text"|"email"|"password"|"number"|"url"|"search", disabled?, style? }
TextArea { value?, onChange:(value:string)=>void, placeholder?, rows?:number,
           disabled?, style? }
    All onChange callbacks receive the VALUE directly (not a DOM event), pairing
    with useCanvasState setters.

──────────────────────────────────────────────────────────────────────────────
HOOKS  (call at the top of your Report component)
──────────────────────────────────────────────────────────────────────────────
useHostTheme() => theme
    Returns the report theme for inline styling. Stable paths:
      theme.text.primary | secondary | tertiary | quaternary | link | onAccent
      theme.bg.editor | chrome | elevated
      theme.fill.primary | secondary | tertiary | quaternary
      theme.stroke.primary | secondary | tertiary
      theme.accent.primary | control
      theme.diff.insertedLine | removedLine | stripAdded | stripRemoved
      theme.palette.{gray|purple|green|yellow|pink|blue|orange}
    Prefer built-in components over raw token usage.
useCanvasState(key:string, defaultValue) => [value, setValue]
    Like useState. In a SHARED REPORT it is plain component state — it does NOT
    persist across reloads and is NOT captured in the PDF. The default value must
    produce a meaningful report on its own.
useCanvasAction() => dispatch
    No-op in a shared report (IDE actions are unavailable). Safe to call.
useState, useMemo, useCallback, useRef
    The React hooks are also available directly (no import).

──────────────────────────────────────────────────────────────────────────────
HELPERS & TOKENS
──────────────────────────────────────────────────────────────────────────────
mergeStyle(base, override?) => style
    Shallow-merge two style objects (override wins). For minor tweaks only.
computeDAGLayout({ nodes:{id}[], edges:{from,to}[], direction?, nodeWidth?,
    nodeHeight?, rankGap?, nodeGap?, padding? }) => { nodes, edges, ranks,
    width, height }
    Pure DAG layout math. NOTE: rendering requires raw SVG, which is NOT
    available in this dialect — prefer a Table or nested CollapsibleSection tree
    to represent graph/pipeline data.
colorPalette        Object: { gray, purple, green, yellow, pink, blue, orange } hex.
usageColorSequence  Default segment color rotation for UsageBar.
chartColorSequence  Default multi-series chart color rotation.
`.trim();

export const CANVAS_DESIGN_RULES = `
================================================================================
DESIGN RULES (from the canvas SKILL — apply to every report)
================================================================================
Be creative with layout, but reports are FLAT, MINIMAL, and PURPOSEFUL.

VISUAL HIERARCHY
  - Not everything deserves equal weight. One thing should stand out (a headline
    Stat strip, a key chart). Primary content gets more space; supporting content
    stays compact. Squint test: can you tell what matters?
  - Vary the composition. Do NOT emit a single column of identical cards. Mix
    open H2 sections with the occasional Card.

LABEL EVERY PLOT (charts AND tables must be self-describing)
  - A title naming the SPECIFIC metric (e.g. "API error rate by service", not
    "Metrics").
  - Units in the title or a small caption (e.g. "Latency (ms)", "% of requests").
  - A legend when 2+ series are shown (BarChart/LineChart add one automatically).
  - The source and time range in a small caption when known (e.g.
    "Source: dataset - last 5 weeks"). Note transforms (mean, p95, normalized).

NEVER RENDER EMPTY STATES
  - If a section/chart/table has no data, OMIT it. No placeholder text, no "No
    data" rows, no zeroed/empty charts.

SLOP — FORBIDDEN (if 2+ appear, redesign)
  - Gradients (no linear-gradient / radial-gradient / background-clip:text).
  - Emojis as icons, bullets, or status markers.
  - Box-shadows. Flat surfaces only.
  - A wall of identical cards. Rainbow coloring (a different color on everything).
  - Giant text above H1. Decorative colored borders (borders are structural).
  - Use accent color deliberately, not on everything. Most elements are neutral.
`.trim();

export const REPORT_DIALECT = `
================================================================================
REPORT DIALECT — how this runtime DIFFERS from a raw .canvas.tsx (HARD RULES)
================================================================================
1. NO IMPORTS. Every component, hook, helper, and token above is pre-injected as
   a global. Reference it directly. An 'import' statement is rejected.
2. NO RAW HTML/SVG INTRINSICS. Do not use <div>, <span>, <p>, <table>, <svg>,
   <rect>, <button>, etc. Use ONLY the vocabulary above. (Reports also render to
   PDF, where raw DOM/SVG cannot exist.) This is the biggest difference from a
   canvas. Consequence: there is no way to draw a DAG/graph — represent that data
   as a Table or a nested CollapsibleSection tree instead.
3. DUAL-TARGET. The SAME source renders to an interactive web view AND a static
   PDF. Interactive pieces (Toggle, Checkbox, Select, TextInput, TextArea, Button,
   onClick, CollapsibleSection, Sections) degrade to their STATIC PROJECTION in
   the PDF (current value shown; sections fully expanded). Never hide essential
   content behind interaction — the PDF reader must still get the full report.
4. EPHEMERAL STATE. useCanvasState is plain component state: nothing persists
   across reloads or into the PDF. Default values must render a complete report.
5. ONE DEFAULT EXPORT. Emit exactly: export default function Report() { ... }
6. DATA, NOT FICTION. Read figures from the injected scope identifiers (see DATA
   CONTRACT). Do not fabricate numbers. Prefer computing aggregates with the
   dataset tools, then inlining the results; use raw rows for tables/lists.
7. UNSUPPORTED: horizontal bar charts (BarChart 'horizontal' is ignored — use
   vertical bars or a Table); DiffView syntax highlighting; canvas data
   persistence; IDE actions (useCanvasAction is a no-op).
`.trim();

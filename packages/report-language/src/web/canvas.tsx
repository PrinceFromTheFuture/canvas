import * as React from "react";
import { tokens, paletteColor } from "../tokens";
import type {
  ButtonProps,
  CheckboxProps,
  CodeProps,
  CollapsibleSectionProps,
  DiffStatsProps,
  DiffViewProps,
  IconButtonProps,
  LinkProps,
  SelectProps,
  SwatchProps,
  TextAreaProps,
  TextInputProps,
  TodoItem,
  TodoListCardProps,
  TodoListProps,
  ToggleProps,
  UsageBarProps,
} from "../shared/types";

const C = tokens.color;
const S = tokens.space;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/* ── Typography extras ──────────────────────────────────────────────────── */

export function Code({ children, style }: CodeProps) {
  return (
    <code style={{ fontFamily: MONO, fontSize: "0.92em", background: C.fill.subtle, borderRadius: 4, padding: "1px 4px", ...style }}>
      {children}
    </code>
  );
}

export function Link({ children, href, style }: LinkProps) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: C.text.link, textDecoration: "underline", ...style }}>
      {children}
    </a>
  );
}

/* ── Swatch ─────────────────────────────────────────────────────────────── */

export function Swatch({ color, style }: SwatchProps) {
  return <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 4, background: paletteColor(color), ...style }} />;
}

/* ── Chevron ────────────────────────────────────────────────────────────── */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
      <path d="M4 2.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── CollapsibleSection ─────────────────────────────────────────────────── */

export function CollapsibleSection({ title, leading, count, trailing, children, style }: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={style}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 0", background: "none", border: "none", cursor: "pointer", color: C.text.primary, textAlign: "left" }}
      >
        <Chevron open={open} />
        {leading}
        <span style={{ fontWeight: 600 }}>{title}</span>
        {typeof count === "number" ? <span style={{ color: C.text.tertiary, fontSize: tokens.font.size.small + 2 }}>{count}</span> : null}
        {trailing ? <span style={{ marginLeft: "auto" }}>{trailing}</span> : null}
      </button>
      {open ? <div>{children}</div> : null}
    </div>
  );
}

/* ── UsageBar ───────────────────────────────────────────────────────────── */

export function UsageBar({ segments, total, topLeftLabel, topRightLabel, style }: UsageBarProps) {
  const sum = segments.reduce((acc, s) => acc + (Number.isFinite(s.value) && s.value > 0 ? s.value : 0), 0);
  const denom = total > 0 ? total : sum || 1;
  const seq = ["purple", "green", "yellow", "pink", "blue", "orange", "gray"] as const;
  return (
    <div style={style}>
      {topLeftLabel || topRightLabel ? (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span>{topLeftLabel}</span>
          <span>{topRightLabel}</span>
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 2, height: 10, borderRadius: 999, overflow: "hidden", background: C.fill.subtle }}>
        {segments.map((seg, i) => {
          const w = ((Number.isFinite(seg.value) && seg.value > 0 ? seg.value : 0) / denom) * 100;
          return <div key={seg.id} style={{ width: `${w}%`, background: paletteColor(seg.color ?? seq[i % seq.length]!) }} />;
        })}
      </div>
    </div>
  );
}

/* ── Todo list ──────────────────────────────────────────────────────────── */

function StatusGlyph({ status }: { status: TodoItem["status"] }) {
  const map: Record<TodoItem["status"], { ch: string; color: string }> = {
    completed: { ch: "✓", color: C.tone.success },
    in_progress: { ch: "◐", color: C.tone.info },
    pending: { ch: "○", color: C.text.tertiary },
    cancelled: { ch: "✕", color: C.text.tertiary },
  };
  const { ch, color } = map[status];
  return <span style={{ color, width: 14, display: "inline-block", textAlign: "center" }}>{ch}</span>;
}

export function TodoList({ todos, dimmedTodoIds, onTodoClick, style }: TodoListProps) {
  if (todos.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, ...style }}>
      {todos.map((todo) => {
        const dimmed = dimmedTodoIds?.has(todo.id) || todo.status === "cancelled";
        return (
          <button
            key={todo.id}
            onClick={onTodoClick ? () => onTodoClick(todo) : undefined}
            style={{
              display: "flex", alignItems: "flex-start", gap: 8, width: "100%", textAlign: "left",
              background: "none", border: "none", padding: "4px 0", cursor: onTodoClick ? "pointer" : "default",
              opacity: dimmed ? 0.55 : 1, color: C.text.primary,
              textDecoration: todo.status === "cancelled" ? "line-through" : "none",
            }}
          >
            <StatusGlyph status={todo.status} />
            <span style={{ fontSize: tokens.font.size.body + 3 }}>{todo.content}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TodoListCard({ todos, dimmedTodoIds, defaultExpanded, onTodoClick, style }: TodoListCardProps) {
  const [open, setOpen] = React.useState(defaultExpanded ?? false);
  if (todos.length === 0) return null;
  const done = todos.filter((t) => t.status === "completed").length;
  return (
    <div style={{ border: `1px solid ${C.stroke.primary}`, borderRadius: tokens.radius.md, ...style }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: `${S.sm}px ${S.md}px`, background: "none", border: "none", cursor: "pointer", color: C.text.primary }}
      >
        <Chevron open={open} />
        <span style={{ fontWeight: 600 }}>Tasks</span>
        <span style={{ marginLeft: "auto", color: C.text.tertiary, fontSize: tokens.font.size.small + 2 }}>{done} of {todos.length} done</span>
      </button>
      {open ? <div style={{ padding: `0 ${S.md}px ${S.sm}px` }}><TodoList todos={todos} dimmedTodoIds={dimmedTodoIds} onTodoClick={onTodoClick} /></div> : null}
    </div>
  );
}

/* ── Diff ───────────────────────────────────────────────────────────────── */

export function DiffStats({ additions = 0, deletions = 0, style }: DiffStatsProps) {
  if (additions === 0 && deletions === 0) return null;
  return (
    <span style={{ display: "inline-flex", gap: 8, fontFamily: MONO, fontSize: tokens.font.size.small + 2, fontVariantNumeric: "tabular-nums", ...style }}>
      {additions > 0 ? <span style={{ color: C.tone.success }}>+{additions}</span> : null}
      {deletions > 0 ? <span style={{ color: C.tone.danger }}>-{deletions}</span> : null}
    </span>
  );
}

export function DiffView({ lines, showLineNumbers = true, coloredLineNumbers = true, showAccentStrip = true, style }: DiffViewProps) {
  const bg = (t: string) => (t === "added" ? "#e6f4ec" : t === "removed" ? "#fbeaec" : "transparent");
  const strip = (t: string) => (t === "added" ? C.tone.success : t === "removed" ? C.tone.danger : "transparent");
  const sign = (t: string) => (t === "added" ? "+" : t === "removed" ? "-" : " ");
  return (
    <div style={{ fontFamily: MONO, fontSize: tokens.font.size.small + 2, overflowX: "auto", ...style }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ display: "flex", alignItems: "stretch", background: bg(ln.type), whiteSpace: "pre" }}>
          {showAccentStrip ? <span style={{ width: 3, background: strip(ln.type), flexShrink: 0 }} /> : null}
          {showLineNumbers ? (
            <span style={{ width: 36, textAlign: "right", padding: "0 6px", color: coloredLineNumbers ? strip(ln.type) || C.text.tertiary : C.text.tertiary, flexShrink: 0 }}>
              {ln.lineNumber ?? ""}
            </span>
          ) : null}
          <span style={{ width: 12, color: C.text.tertiary, flexShrink: 0 }}>{sign(ln.type)}</span>
          <span style={{ color: C.text.primary, padding: "0 8px" }}>{ln.content}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Form controls (interactive) ────────────────────────────────────────── */

export function Button({ children, variant = "primary", disabled, type = "button", onClick, style }: ButtonProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.accent.primary, color: C.text.onAccent, border: `1px solid ${C.accent.primary}` },
    secondary: { background: "transparent", color: C.text.primary, border: `1px solid ${C.stroke.primary}` },
    ghost: { background: "transparent", color: C.text.secondary, border: "1px solid transparent" },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ borderRadius: tokens.radius.sm, padding: "5px 12px", fontSize: tokens.font.size.body + 2, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, ...styles[variant], ...style }}>
      {children}
    </button>
  );
}

export function IconButton({ children, onClick, disabled, title, variant = "default", size = "md", style }: IconButtonProps) {
  const dim = size === "sm" ? 20 : 26;
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{ width: dim, height: dim, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: variant === "circle" ? 999 : tokens.radius.sm, background: variant === "circle" ? C.fill.subtle : "transparent", border: "none", color: C.text.secondary, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}
    >
      {children}
    </button>
  );
}

export function Checkbox({ checked, onChange, disabled, label, style }: CheckboxProps) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "default" : "pointer", ...style }}>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} style={{ accentColor: C.accent.primary, width: 14, height: 14 }} />
      {label ? <span style={{ fontSize: tokens.font.size.body + 2, color: C.text.primary }}>{label}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, disabled, size = "sm", style }: ToggleProps) {
  const track = size === "md" ? { w: 34, h: 20 } : { w: 28, h: 16 };
  const knob = track.h - 4;
  return (
    <button
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{ width: track.w, height: track.h, borderRadius: 999, border: "none", padding: 0, position: "relative", cursor: disabled ? "default" : "pointer", background: checked ? C.accent.primary : C.fill.muted, opacity: disabled ? 0.5 : 1, ...style }}
    >
      <span style={{ position: "absolute", top: 2, left: checked ? track.w - knob - 2 : 2, width: knob, height: knob, borderRadius: 999, background: "#fff", transition: "left 0.15s" }} />
    </button>
  );
}

export function Select({ value, onChange, options, placeholder, disabled, style }: SelectProps) {
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ height: 28, borderRadius: tokens.radius.sm, border: `1px solid ${C.stroke.primary}`, background: C.bg.elevated, color: C.text.primary, padding: "0 8px", fontSize: tokens.font.size.body + 2, ...style }}
    >
      {placeholder ? <option value="" disabled>{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
      ))}
    </select>
  );
}

export function TextInput({ value, onChange, placeholder, disabled, type = "text", style }: TextInputProps) {
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ height: 28, borderRadius: tokens.radius.sm, border: `1px solid ${C.stroke.primary}`, background: C.bg.elevated, color: C.text.primary, padding: "0 10px", fontSize: tokens.font.size.body + 2, ...style }}
    />
  );
}

export function TextArea({ value, onChange, placeholder, disabled, rows = 3, style }: TextAreaProps) {
  return (
    <textarea
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ borderRadius: tokens.radius.sm, border: `1px solid ${C.stroke.primary}`, background: C.bg.elevated, color: C.text.primary, padding: "8px 10px", fontSize: tokens.font.size.body + 2, resize: "vertical", fontFamily: "inherit", ...style }}
    />
  );
}

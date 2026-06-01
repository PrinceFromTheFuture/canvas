import * as React from "react";
import { Text as RpText, View } from "@react-pdf/renderer";
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
const MONO = "Courier";

/** Wrap primitive children in <Text>; react-pdf forbids bare strings in View. */
function asText(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return <RpText style={{ fontSize: tokens.font.size.body, color: C.text.primary }}>{node}</RpText>;
  }
  return node;
}

export function Code({ children }: CodeProps) {
  return <RpText style={{ fontFamily: MONO, fontSize: tokens.font.size.body, color: C.text.primary }}>{children}</RpText>;
}

export function Link({ children }: LinkProps) {
  return <RpText style={{ color: C.text.link, textDecoration: "underline", fontSize: tokens.font.size.body }}>{children}</RpText>;
}

export function Swatch({ color }: SwatchProps) {
  return <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: paletteColor(color) }} />;
}

/** CollapsibleSection — PDF static projection: always expanded. */
export function CollapsibleSection({ title, leading, count, trailing, children }: CollapsibleSectionProps) {
  return (
    <View style={{ flexDirection: "column", gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {leading}
        <RpText style={{ fontWeight: 600, color: C.text.primary, fontSize: tokens.font.size.body }}>{title}</RpText>
        {typeof count === "number" ? <RpText style={{ color: C.text.tertiary, fontSize: tokens.font.size.small }}>{count}</RpText> : null}
        {trailing ? <View style={{ marginLeft: "auto" }}>{asText(trailing)}</View> : null}
      </View>
      <View>{React.Children.map(children, asText)}</View>
    </View>
  );
}

export function UsageBar({ segments, total, topLeftLabel, topRightLabel }: UsageBarProps) {
  const sum = segments.reduce((acc, s) => acc + (Number.isFinite(s.value) && s.value > 0 ? s.value : 0), 0);
  const denom = total > 0 ? total : sum || 1;
  const seq = ["purple", "green", "yellow", "pink", "blue", "orange", "gray"] as const;
  return (
    <View>
      {topLeftLabel || topRightLabel ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <View>{asText(topLeftLabel)}</View>
          <View>{asText(topRightLabel)}</View>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", height: 8, borderRadius: 999, overflow: "hidden", backgroundColor: C.fill.subtle }}>
        {segments.map((seg, i) => {
          const w = ((Number.isFinite(seg.value) && seg.value > 0 ? seg.value : 0) / denom) * 100;
          return <View key={seg.id} style={{ width: `${w}%`, backgroundColor: paletteColor(seg.color ?? seq[i % seq.length]!) }} />;
        })}
      </View>
    </View>
  );
}

const TODO_MARK: Record<TodoItem["status"], { ch: string; color: string }> = {
  completed: { ch: "[x]", color: C.tone.success },
  in_progress: { ch: "[~]", color: C.tone.info },
  pending: { ch: "[ ]", color: C.text.tertiary },
  cancelled: { ch: "[-]", color: C.text.tertiary },
};

export function TodoList({ todos }: TodoListProps) {
  if (todos.length === 0) return null;
  return (
    <View style={{ flexDirection: "column", gap: 3 }}>
      {todos.map((todo) => {
        const m = TODO_MARK[todo.status];
        return (
          <View key={todo.id} style={{ flexDirection: "row", gap: 6, opacity: todo.status === "cancelled" ? 0.55 : 1 }}>
            <RpText style={{ fontFamily: MONO, color: m.color, fontSize: tokens.font.size.body }}>{m.ch}</RpText>
            <RpText style={{ color: C.text.primary, fontSize: tokens.font.size.body, textDecoration: todo.status === "cancelled" ? "line-through" : "none" }}>{todo.content}</RpText>
          </View>
        );
      })}
    </View>
  );
}

export function TodoListCard({ todos }: TodoListCardProps) {
  if (todos.length === 0) return null;
  const done = todos.filter((t) => t.status === "completed").length;
  return (
    <View style={{ borderWidth: 1, borderColor: C.stroke.primary, borderRadius: tokens.radius.md, padding: S.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <RpText style={{ fontWeight: 600, color: C.text.primary, fontSize: tokens.font.size.body }}>Tasks</RpText>
        <RpText style={{ color: C.text.tertiary, fontSize: tokens.font.size.small }}>{`${done} of ${todos.length} done`}</RpText>
      </View>
      <TodoList todos={todos} />
    </View>
  );
}

export function DiffStats({ additions = 0, deletions = 0 }: DiffStatsProps) {
  if (additions === 0 && deletions === 0) return null;
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {additions > 0 ? <RpText style={{ fontFamily: MONO, color: C.tone.success, fontSize: tokens.font.size.small }}>{`+${additions}`}</RpText> : null}
      {deletions > 0 ? <RpText style={{ fontFamily: MONO, color: C.tone.danger, fontSize: tokens.font.size.small }}>{`-${deletions}`}</RpText> : null}
    </View>
  );
}

export function DiffView({ lines, showLineNumbers = true, showAccentStrip = true }: DiffViewProps) {
  const bg = (t: string) => (t === "added" ? "#e6f4ec" : t === "removed" ? "#fbeaec" : "transparent");
  const strip = (t: string) => (t === "added" ? C.tone.success : t === "removed" ? C.tone.danger : "transparent");
  const sign = (t: string) => (t === "added" ? "+" : t === "removed" ? "-" : " ");
  return (
    <View>
      {lines.map((ln, i) => (
        <View key={i} style={{ flexDirection: "row", backgroundColor: bg(ln.type) }}>
          {showAccentStrip ? <View style={{ width: 3, backgroundColor: strip(ln.type) }} /> : null}
          {showLineNumbers ? <RpText style={{ width: 28, textAlign: "right", paddingRight: 6, fontFamily: MONO, color: C.text.tertiary, fontSize: tokens.font.size.small }}>{ln.lineNumber ?? ""}</RpText> : null}
          <RpText style={{ fontFamily: MONO, color: C.text.primary, fontSize: tokens.font.size.small }}>{`${sign(ln.type)} ${ln.content}`}</RpText>
        </View>
      ))}
    </View>
  );
}

/* ── Form controls — static projection (show current value, no interaction) ── */

export function Button({ children, variant = "primary" }: ButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <View style={{ alignSelf: "flex-start", borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: isPrimary ? C.accent.primary : "transparent", borderWidth: variant === "ghost" ? 0 : 1, borderColor: C.stroke.primary }}>
      <RpText style={{ fontSize: tokens.font.size.body, color: isPrimary ? C.text.onAccent : C.text.primary }}>{children}</RpText>
    </View>
  );
}

export function IconButton({ children, size = "md" }: IconButtonProps) {
  const dim = size === "sm" ? 16 : 20;
  return <View style={{ width: dim, height: dim, alignItems: "center", justifyContent: "center" }}>{asText(children)}</View>;
}

export function Checkbox({ checked, label }: CheckboxProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, borderWidth: 1, borderColor: checked ? C.accent.primary : C.stroke.primary, backgroundColor: checked ? C.accent.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
        {checked ? <RpText style={{ fontSize: 8, color: C.text.onAccent, fontFamily: MONO }}>x</RpText> : null}
      </View>
      {label ? <RpText style={{ fontSize: tokens.font.size.body, color: C.text.primary }}>{label}</RpText> : null}
    </View>
  );
}

export function Toggle({ checked, size = "sm" }: ToggleProps) {
  const track = size === "md" ? { w: 28, h: 16 } : { w: 24, h: 14 };
  const knob = track.h - 4;
  return (
    <View style={{ width: track.w, height: track.h, borderRadius: 999, backgroundColor: checked ? C.accent.primary : C.fill.muted, justifyContent: "center" }}>
      <View style={{ width: knob, height: knob, borderRadius: 999, backgroundColor: "#fff", marginLeft: checked ? track.w - knob - 2 : 2 }} />
    </View>
  );
}

export function Select({ value, options, placeholder }: SelectProps) {
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ borderWidth: 1, borderColor: C.stroke.primary, borderRadius: tokens.radius.sm, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: C.bg.elevated }}>
      <RpText style={{ fontSize: tokens.font.size.body, color: selected ? C.text.primary : C.text.tertiary }}>{selected?.label ?? placeholder ?? ""}</RpText>
    </View>
  );
}

export function TextInput({ value, placeholder }: TextInputProps) {
  return (
    <View style={{ borderWidth: 1, borderColor: C.stroke.primary, borderRadius: tokens.radius.sm, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: C.bg.elevated }}>
      <RpText style={{ fontSize: tokens.font.size.body, color: value ? C.text.primary : C.text.tertiary }}>{value || placeholder || ""}</RpText>
    </View>
  );
}

export function TextArea({ value, placeholder, rows = 3 }: TextAreaProps) {
  return (
    <View style={{ borderWidth: 1, borderColor: C.stroke.primary, borderRadius: tokens.radius.sm, padding: 8, minHeight: rows * 14, backgroundColor: C.bg.elevated }}>
      <RpText style={{ fontSize: tokens.font.size.body, color: value ? C.text.primary : C.text.tertiary }}>{value || placeholder || ""}</RpText>
    </View>
  );
}

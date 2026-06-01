import type { CSSProperties, ReactNode } from "react";
import type { Color, PillTone, Tone } from "../tokens";

/**
 * The prop contracts for the vocabulary. Both the web branch (src/web) and
 * the pdf branch (src/pdf) implement these EXACT shapes, so one AI-authored
 * source renders on either target. This is the "language" the AI speaks.
 *
 * The shapes intentionally mirror the public `cursor/canvas` SDK so a report
 * reads like a canvas: same component names, same prop names. Where canvas is
 * interactive (web-only), the pdf branch renders the STATIC PROJECTION.
 */

/* ── Layout ─────────────────────────────────────────────────────────────── */

export interface StackProps {
  children?: ReactNode;
  gap?: number;
  style?: CSSProperties;
}
export interface RowProps {
  children?: ReactNode;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between";
  wrap?: boolean;
  style?: CSSProperties;
}
export interface GridProps {
  children?: ReactNode;
  /** Number of equal columns, or a CSS grid-template-columns string. */
  columns: number | string;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  style?: CSSProperties;
}
export interface DividerProps {
  style?: CSSProperties;
}

/* ── Typography ─────────────────────────────────────────────────────────── */

export interface TextProps {
  children?: ReactNode;
  tone?: "primary" | "secondary" | "tertiary" | "quaternary";
  size?: "body" | "small";
  as?: "p" | "span";
  weight?: "normal" | "medium" | "semibold" | "bold";
  italic?: boolean;
  truncate?: boolean | "start" | "end";
  style?: CSSProperties;
}
export interface HeadingProps {
  children?: ReactNode;
  style?: CSSProperties;
}
export interface CodeProps {
  children?: ReactNode;
  style?: CSSProperties;
}
export interface LinkProps {
  children?: ReactNode;
  href: string;
  style?: CSSProperties;
}

/* ── Surfaces ───────────────────────────────────────────────────────────── */

export interface CardProps {
  children?: ReactNode;
  variant?: "default" | "borderless";
  size?: "base" | "lg";
  stickyHeader?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  style?: CSSProperties;
}
export interface CardHeaderProps {
  children?: ReactNode;
  trailing?: ReactNode;
  style?: CSSProperties;
}
export interface CardBodyProps {
  children?: ReactNode;
  style?: CSSProperties;
}
export interface StatProps {
  value: ReactNode;
  label: string;
  tone?: Tone;
  style?: CSSProperties;
}
export interface PillProps {
  children?: ReactNode;
  tone?: PillTone;
  active?: boolean;
  size?: "sm" | "md";
  leadingContent?: ReactNode;
  keyboardHint?: string;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  style?: CSSProperties;
}
export interface CalloutProps {
  children?: ReactNode;
  tone?: Tone;
  title?: ReactNode;
  icon?: ReactNode;
  style?: CSSProperties;
}
export interface SwatchProps {
  color: Color;
  style?: CSSProperties;
}

/* ── Data ───────────────────────────────────────────────────────────────── */

export interface TableProps {
  headers: ReactNode[];
  rows: ReactNode[][];
  columnAlign?: Array<"left" | "center" | "right" | undefined>;
  rowTone?: Array<Tone | undefined>;
  framed?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
  emptyMessage?: ReactNode;
  style?: CSSProperties;
}

/** Sections: web = one open at a time; pdf = all revealed (static projection). */
export interface SectionItem {
  title: string;
  body: ReactNode;
}
export interface SectionsProps {
  items: SectionItem[];
}

export interface CollapsibleSectionProps {
  title: string;
  leading?: ReactNode;
  count?: number;
  trailing?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}

export interface UsageBarSegment {
  id: string;
  value: number;
  color?: Color;
}
export interface UsageBarProps {
  segments: readonly UsageBarSegment[];
  total: number;
  topLeftLabel?: ReactNode;
  topRightLabel?: ReactNode;
  style?: CSSProperties;
}

export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";
export interface TodoItem {
  id: string;
  content: string;
  status: TodoStatus;
}
export interface TodoListProps {
  todos: readonly TodoItem[];
  dimmedTodoIds?: ReadonlySet<string>;
  onTodoClick?: (todo: TodoItem) => void;
  style?: CSSProperties;
}
export interface TodoListCardProps extends TodoListProps {
  defaultExpanded?: boolean;
}

/* ── Diff ───────────────────────────────────────────────────────────────── */

export interface DiffStatsProps {
  additions?: number;
  deletions?: number;
  style?: CSSProperties;
}
export type DiffLineType = "added" | "removed" | "unchanged";
export interface DiffLineData {
  type: DiffLineType;
  content: string;
  lineNumber?: number;
}
export interface DiffViewProps {
  lines: DiffLineData[];
  path?: string;
  language?: string;
  showLineNumbers?: boolean;
  coloredLineNumbers?: boolean;
  showAccentStrip?: boolean;
  style?: CSSProperties;
}

/* ── Forms (interactive on web; static projection in pdf) ───────────────── */

export interface ButtonProps {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  style?: CSSProperties;
}
export interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "default" | "circle";
  size?: "sm" | "md";
  style?: CSSProperties;
}
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  style?: CSSProperties;
}
export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  style?: CSSProperties;
}
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
}
export interface TextInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password" | "number" | "url" | "search";
  style?: CSSProperties;
}
export interface TextAreaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  style?: CSSProperties;
}

/* ── Charts ─────────────────────────────────────────────────────────────── */

export interface ChartSeries {
  name: string;
  data: number[];
  tone?: Tone;
}
export interface BarChartProps {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  stacked?: boolean;
  horizontal?: boolean;
  normalized?: boolean;
  valueSuffix?: string;
  style?: CSSProperties;
}
export interface LineChartProps {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  fill?: boolean;
  valueSuffix?: string;
  style?: CSSProperties;
}
export interface PieDatum {
  label: string;
  value: number;
  tone?: Tone;
}
export interface PieChartProps {
  data: PieDatum[];
  size?: number;
  donut?: boolean;
  style?: CSSProperties;
}

import * as React from "react";
import { tokens, toneColor, pillToneColor } from "../tokens";
import type {
  BarChartProps,
  CalloutProps,
  CardBodyProps,
  CardHeaderProps,
  CardProps,
  GridProps,
  HeadingProps,
  LineChartProps,
  PieChartProps,
  PillProps,
  RowProps,
  SectionsProps,
  StackProps,
  StatProps,
  TableProps,
  TextProps,
} from "../shared/types";
import { arcPath, computeBarChart, computeLineChart, computePieChart } from "../shared/charts";

export * from "./canvas";

const C = tokens.color;
const S = tokens.space;

export function Stack({ children, gap = S.lg, style }: StackProps) {
  return <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>;
}

export function Row({ children, gap = S.sm, align = "center", justify = "start", wrap, style }: RowProps) {
  const j = justify === "space-between" ? "space-between" : justify === "end" ? "flex-end" : justify === "center" ? "center" : "flex-start";
  const a = align === "start" ? "flex-start" : align === "end" ? "flex-end" : align === "stretch" ? "stretch" : "center";
  return <div style={{ display: "flex", flexDirection: "row", gap, alignItems: a, justifyContent: j, flexWrap: wrap ? "wrap" : "nowrap", ...style }}>{children}</div>;
}

export function Grid({ children, columns, gap = S.lg, align, style }: GridProps) {
  const templ = typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns;
  return <div style={{ display: "grid", gridTemplateColumns: templ, gap, alignItems: align === "start" ? "start" : align === "end" ? "end" : align === "stretch" ? "stretch" : "center", ...style }}>{children}</div>;
}

export function Spacer() {
  return <div style={{ flex: 1 }} />;
}

export function Divider({ style }: { style?: React.CSSProperties }) {
  return <hr style={{ border: "none", borderTop: `1px solid ${C.stroke.secondary}`, margin: 0, ...style }} />;
}

export function Text({ children, tone = "primary", size = "body", weight = "normal", italic, as = "span", truncate, style }: TextProps) {
  const Tag = as === "p" ? "p" : "span";
  const truncStyle: React.CSSProperties = truncate
    ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: truncate === "start" ? "rtl" : undefined }
    : {};
  return (
    <Tag
      style={{
        margin: 0,
        color: tone === "secondary" ? C.text.secondary : tone === "tertiary" || tone === "quaternary" ? C.text.tertiary : C.text.primary,
        fontSize: size === "small" ? tokens.font.size.small + 2 : tokens.font.size.body + 3,
        fontWeight: tokens.font.weight[weight],
        fontStyle: italic ? "italic" : "normal",
        lineHeight: 1.55,
        ...truncStyle,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function H1({ children, style }: HeadingProps) {
  return <h1 style={{ margin: 0, fontSize: tokens.font.size.h1, fontWeight: 700, color: C.text.primary, ...style }}>{children}</h1>;
}
export function H2({ children, style }: HeadingProps) {
  return <h2 style={{ margin: 0, fontSize: tokens.font.size.h2 + 2, fontWeight: 600, color: C.text.primary, ...style }}>{children}</h2>;
}
export function H3({ children, style }: HeadingProps) {
  return <h3 style={{ margin: 0, fontSize: tokens.font.size.h3 + 2, fontWeight: 600, color: C.text.secondary, ...style }}>{children}</h3>;
}

export function Card({ children, variant = "default", collapsible, defaultOpen = true, style }: CardProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const border = variant === "borderless" ? "none" : `1px solid ${C.stroke.primary}`;
  const childArray = React.Children.toArray(children);
  if (collapsible) {
    // Header is the first child; the rest is the body, hidden when closed.
    const [header, ...rest] = childArray;
    return (
      <div style={{ border, borderRadius: tokens.radius.lg, background: C.bg.elevated, overflow: "hidden", ...style }}>
        <div onClick={() => setOpen((o) => !o)} style={{ cursor: "pointer" }}>{header}</div>
        {open ? rest : null}
      </div>
    );
  }
  return <div style={{ border, borderRadius: tokens.radius.lg, background: C.bg.elevated, overflow: "hidden", ...style }}>{children}</div>;
}
export function CardHeader({ children, trailing, style }: CardHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${S.sm}px ${S.lg}px`, borderBottom: `1px solid ${C.stroke.secondary}`, fontSize: tokens.font.size.h3, fontWeight: 600, color: C.text.secondary, ...style }}>
      <span>{children}</span>
      {trailing ? <span>{trailing}</span> : null}
    </div>
  );
}
export function CardBody({ children, style }: CardBodyProps) {
  return <div style={{ padding: S.lg, ...style }}>{children}</div>;
}

export function Stat({ value, label, tone, style }: StatProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, ...style }}>
      <span style={{ fontSize: 26, fontWeight: 700, color: toneColor(tone) }}>{value}</span>
      <span style={{ fontSize: tokens.font.size.small + 2, color: C.text.tertiary }}>{label}</span>
    </div>
  );
}

export function Pill({ children, tone = "neutral", active, size = "md", leadingContent, onClick, disabled, title, style }: PillProps) {
  const col = pillToneColor(tone);
  const small = size === "sm";
  const inner = (
    <>
      {leadingContent ? <span style={{ display: "inline-flex", marginRight: 4 }}>{leadingContent}</span> : null}
      {children}
    </>
  );
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: small ? "1px 8px" : "2px 10px",
    borderRadius: 999,
    border: small ? "none" : `1px solid ${col}`,
    color: active ? C.text.onAccent : col,
    background: active ? col : "transparent",
    fontSize: small ? tokens.font.size.small + 1 : tokens.font.size.small + 2,
    cursor: onClick && !disabled ? "pointer" : "default",
    opacity: disabled ? 0.5 : 1,
    ...style,
  };
  if (onClick) {
    return <button title={title} disabled={disabled} onClick={onClick} style={base}>{inner}</button>;
  }
  return <span title={title} style={base}>{inner}</span>;
}

export function Callout({ children, tone = "info", title, icon, style }: CalloutProps) {
  const col = toneColor(tone);
  return (
    <div style={{ border: `1px solid ${col}`, borderRadius: tokens.radius.md, background: `${col}14`, padding: S.md, ...style }}>
      {title ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 600, color: col, marginBottom: 4 }}>
          {icon ? <span>{icon}</span> : null}
          <span>{title}</span>
        </div>
      ) : null}
      <div style={{ color: C.text.secondary, fontSize: tokens.font.size.body + 3 }}>{children}</div>
    </div>
  );
}

export function Table({ headers, rows, columnAlign, rowTone, striped, emptyMessage, style }: TableProps) {
  return (
    <div style={{ border: `1px solid ${C.stroke.primary}`, borderRadius: tokens.radius.md, overflow: "hidden", ...style }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: tokens.font.size.body + 3 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: columnAlign?.[i] ?? "left", padding: `${S.sm}px ${S.md}px`, borderBottom: `1px solid ${C.stroke.primary}`, background: C.bg.surface, color: C.text.secondary, fontWeight: 600 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && emptyMessage ? (
            <tr><td colSpan={headers.length || 1} style={{ padding: `${S.md}px`, textAlign: "center", color: C.text.tertiary }}>{emptyMessage}</td></tr>
          ) : (
            rows.map((row, ri) => {
              const tone = rowTone?.[ri];
              const stripe = striped && ri % 2 === 1 ? C.bg.surface : "transparent";
              return (
                <tr key={ri} style={{ background: tone ? `${toneColor(tone)}12` : stripe }}>
                  {headers.map((_, ci) => (
                    <td key={ci} style={{ textAlign: columnAlign?.[ci] ?? "left", padding: `${S.sm}px ${S.md}px`, borderBottom: `1px solid ${C.stroke.secondary}`, color: C.text.primary }}>
                      {row[ci]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Sections - web branch: interactive accordion, one section open at a time
 * with a primary control bar. The PDF branch reveals all (static projection).
 */
export function Sections({ items }: SectionsProps) {
  const [active, setActive] = React.useState(0);
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: S.sm }}>
        {items.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              cursor: "pointer",
              border: `1px solid ${i === active ? C.accent.primary : C.stroke.primary}`,
              background: i === active ? C.accent.primary : "transparent",
              color: i === active ? C.text.onAccent : C.text.secondary,
              fontWeight: i === active ? 600 : 400,
            }}
          >
            {s.title}
          </button>
        ))}
      </div>
      <div style={{ border: `1px solid ${C.stroke.secondary}`, borderRadius: tokens.radius.md, padding: S.lg }}>
        {items[active]?.body}
      </div>
    </div>
  );
}

function Axis({ layout, categories, valueSuffix }: { layout: ReturnType<typeof computeBarChart>["layout"]; categories: string[]; valueSuffix?: string }) {
  return (
    <>
      {layout.yTicks.map((t, i) => {
        const y = layout.padding.top + layout.plotHeight - (t / layout.maxValue) * layout.plotHeight;
        return (
          <g key={i}>
            <line x1={layout.padding.left} y1={y} x2={layout.width - layout.padding.right} y2={y} stroke={C.stroke.secondary} strokeWidth={1} />
            <text x={layout.padding.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill={C.text.tertiary}>
              {t}
              {valueSuffix ?? ""}
            </text>
          </g>
        );
      })}
      {categories.map((cat, i) => {
        const gw = layout.plotWidth / Math.max(categories.length, 1);
        const x = layout.padding.left + i * gw + gw / 2;
        return (
          <text key={i} x={x} y={layout.height - layout.padding.bottom + 16} textAnchor="middle" fontSize={9} fill={C.text.tertiary}>
            {cat}
          </text>
        );
      })}
    </>
  );
}

function Legend({ entries }: { entries: { name: string; color: string }[] }) {
  if (entries.length < 2) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: S.md, marginTop: S.sm }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: tokens.font.size.small + 2 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: e.color, display: "inline-block" }} />
          <span style={{ color: C.text.secondary }}>{e.name}</span>
        </div>
      ))}
    </div>
  );
}

export function BarChart(props: BarChartProps) {
  const width = 560;
  const { layout, bars } = computeBarChart(props, width);
  const legend = props.series.map((s) => ({ name: s.name, color: bars.find((b) => b.seriesName === s.name)?.color ?? C.accent.primary }));
  return (
    <div style={props.style}>
      <svg viewBox={`0 0 ${width} ${layout.height}`} width="100%" role="img">
        <Axis layout={layout} categories={props.categories} valueSuffix={props.normalized ? "%" : props.valueSuffix} />
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.width} height={Math.max(b.height, 0)} fill={b.color} rx={2}>
            <title>{`${b.seriesName} - ${b.category}: ${b.value}`}</title>
          </rect>
        ))}
      </svg>
      <Legend entries={legend} />
    </div>
  );
}

export function LineChart(props: LineChartProps) {
  const width = 560;
  const { layout, geoms } = computeLineChart(props, width);
  const baseY = layout.padding.top + layout.plotHeight;
  return (
    <div style={props.style}>
      <svg viewBox={`0 0 ${width} ${layout.height}`} width="100%" role="img">
        <Axis layout={layout} categories={props.categories} valueSuffix={props.valueSuffix} />
        {geoms.map((g, gi) => (
          <g key={gi}>
            {props.fill && g.points.length > 0 ? (
              <path
                d={`M ${g.points[0]!.x} ${baseY} ${g.points.map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${g.points[g.points.length - 1]!.x} ${baseY} Z`}
                fill={g.color}
                fillOpacity={0.12}
                stroke="none"
              />
            ) : null}
            <polyline fill="none" stroke={g.color} strokeWidth={2} points={g.points.map((p) => `${p.x},${p.y}`).join(" ")} />
            {g.points.map((p, pi) => (
              <circle key={pi} cx={p.x} cy={p.y} r={2.5} fill={g.color} />
            ))}
          </g>
        ))}
      </svg>
      <Legend entries={geoms.map((g) => ({ name: g.name, color: g.color }))} />
    </div>
  );
}

export function PieChart(props: PieChartProps) {
  const { size, radius, slices } = computePieChart(props);
  const cx = radius;
  const cy = radius;
  const innerR = props.donut ? radius * 0.6 : 0;
  return (
    <div style={{ display: "flex", gap: S.lg, alignItems: "center", flexWrap: "wrap", ...props.style }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img">
        {slices.map((s, i) => (
          <path key={i} d={arcPath(cx, cy, radius, s.startAngle, s.endAngle, innerR)} fill={s.color} />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: tokens.font.size.body + 2 }}>
            <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, display: "inline-block" }} />
            <span style={{ color: C.text.secondary }}>{s.label}</span>
            <span style={{ color: C.text.tertiary }}>{Math.round(s.percent * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Page wrapper used by the viewer to frame a report. */
export function ReportRoot({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ background: C.bg.page, color: C.text.primary, padding: S.xxl, fontFamily: "Inter", maxWidth: 820, margin: "0 auto" }}>
      <Stack gap={S.xl}>{children}</Stack>
    </div>
  );
}

import * as React from "react";
import { Circle, G, Line, Path, Polyline, Rect, Svg, Text as RpText, View } from "@react-pdf/renderer";
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

/** Wrap primitive children in <Text>; react-pdf forbids bare strings in View. */
function asText(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return <RpText style={{ fontSize: tokens.font.size.body, color: C.text.primary }}>{node}</RpText>;
  }
  return node;
}

export function Stack({ children, gap = S.lg }: StackProps) {
  return <View style={{ display: "flex", flexDirection: "column", gap }}>{React.Children.map(children, asText)}</View>;
}

export function Row({ children, gap = S.sm, align = "center", justify = "start", wrap }: RowProps) {
  const j = justify === "space-between" ? "space-between" : justify === "end" ? "flex-end" : justify === "center" ? "center" : "flex-start";
  const a = align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center";
  return (
    <View style={{ display: "flex", flexDirection: "row", gap, alignItems: a, justifyContent: j, flexWrap: wrap ? "wrap" : "nowrap" }}>
      {React.Children.map(children, asText)}
    </View>
  );
}

export function Grid({ children, columns, gap = S.lg }: GridProps) {
  // react-pdf has no CSS grid; emulate equal columns with flex-basis. A
  // grid-template string (web-only) collapses to a single column in PDF.
  const cols = typeof columns === "number" && columns > 0 ? columns : 1;
  const basis = `${100 / cols}%`;
  return (
    <View style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap }}>
      {React.Children.map(children, (child) => (
        <View style={{ flexBasis: basis, flexGrow: 0, maxWidth: `${100 / cols}%` }}>{asText(child)}</View>
      ))}
    </View>
  );
}

export function Spacer() {
  return <View style={{ flexGrow: 1 }} />;
}

export function Divider() {
  return <View style={{ borderBottomWidth: 1, borderBottomColor: C.stroke.secondary }} />;
}

export function Text({ children, tone = "primary", size = "body", weight = "normal", italic }: TextProps) {
  return (
    <RpText
      style={{
        color: tone === "secondary" ? C.text.secondary : tone === "tertiary" ? C.text.tertiary : C.text.primary,
        fontSize: size === "small" ? tokens.font.size.small : tokens.font.size.body,
        fontWeight: tokens.font.weight[weight],
        fontStyle: italic ? "italic" : "normal",
        lineHeight: 1.5,
      }}
    >
      {children}
    </RpText>
  );
}

export function H1({ children }: HeadingProps) {
  return <RpText style={{ fontSize: tokens.font.size.h1, fontWeight: 700, color: C.text.primary }}>{children}</RpText>;
}
export function H2({ children }: HeadingProps) {
  return <RpText style={{ fontSize: tokens.font.size.h2, fontWeight: 600, color: C.text.primary }}>{children}</RpText>;
}
export function H3({ children }: HeadingProps) {
  return <RpText style={{ fontSize: tokens.font.size.h3, fontWeight: 600, color: C.text.secondary }}>{children}</RpText>;
}

export function Card({ children }: CardProps) {
  return <View style={{ borderWidth: 1, borderColor: C.stroke.primary, borderRadius: tokens.radius.lg, backgroundColor: C.bg.elevated }}>{children}</View>;
}
export function CardHeader({ children, trailing }: CardHeaderProps) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: S.md, borderBottomWidth: 1, borderBottomColor: C.stroke.secondary }}>
      <RpText style={{ fontSize: tokens.font.size.h3, fontWeight: 600, color: C.text.secondary }}>{children}</RpText>
      {trailing ? <View>{asText(trailing)}</View> : null}
    </View>
  );
}
export function CardBody({ children }: CardBodyProps) {
  return <View style={{ padding: S.md }}>{React.Children.map(children, asText)}</View>;
}

export function Stat({ value, label, tone }: StatProps) {
  return (
    <View style={{ flexDirection: "column", gap: 2 }}>
      <RpText style={{ fontSize: 22, fontWeight: 700, color: toneColor(tone) }}>{value}</RpText>
      <RpText style={{ fontSize: tokens.font.size.small, color: C.text.tertiary }}>{label}</RpText>
    </View>
  );
}

export function Pill({ children, tone = "neutral", active }: PillProps) {
  const col = pillToneColor(tone);
  return (
    <View style={{ borderWidth: 1, borderColor: col, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: active ? col : "transparent", alignSelf: "flex-start" }}>
      <RpText style={{ fontSize: tokens.font.size.small, color: active ? C.text.onAccent : col }}>{children}</RpText>
    </View>
  );
}

export function Callout({ children, tone = "info", title }: CalloutProps) {
  const col = toneColor(tone);
  return (
    <View style={{ borderWidth: 1, borderColor: col, borderRadius: tokens.radius.md, backgroundColor: `${col}14`, padding: S.md }}>
      {title ? <RpText style={{ fontWeight: 600, color: col, marginBottom: 4 }}>{title}</RpText> : null}
      <View>{React.Children.map(children, asText)}</View>
    </View>
  );
}

export function Table({ headers, rows, columnAlign, rowTone }: TableProps) {
  const colCount = headers.length || 1;
  const cellW = `${100 / colCount}%`;
  const align = (i: number) => (columnAlign?.[i] === "right" ? "right" : columnAlign?.[i] === "center" ? "center" : "left");
  return (
    <View style={{ borderWidth: 1, borderColor: C.stroke.primary, borderRadius: tokens.radius.md }}>
      <View style={{ flexDirection: "row", backgroundColor: C.bg.surface, borderBottomWidth: 1, borderBottomColor: C.stroke.primary }}>
        {headers.map((h, i) => (
          <View key={i} style={{ width: cellW, padding: 6 }}>
            <RpText style={{ fontSize: tokens.font.size.body, fontWeight: 600, color: C.text.secondary, textAlign: align(i) }}>{h}</RpText>
          </View>
        ))}
      </View>
      {rows.map((row, ri) => {
        const tone = rowTone?.[ri];
        return (
          <View key={ri} style={{ flexDirection: "row", backgroundColor: tone ? `${toneColor(tone)}12` : "transparent", borderBottomWidth: 1, borderBottomColor: C.stroke.secondary }}>
            {headers.map((_, ci) => (
              <View key={ci} style={{ width: cellW, padding: 6 }}>
                {typeof row[ci] === "string" || typeof row[ci] === "number" ? (
                  <RpText style={{ fontSize: tokens.font.size.body, color: C.text.primary, textAlign: align(ci) }}>{row[ci]}</RpText>
                ) : (
                  row[ci]
                )}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Sections - PDF branch: the STATIC PROJECTION. Reveals every section in
 * order. This is the same prop contract as the web accordion; the invariant
 * "PDF shows everything the web view can show" is satisfied by mapping all.
 */
export function Sections({ items }: SectionsProps) {
  if (items.length === 0) return null;
  return (
    <View style={{ flexDirection: "column", gap: S.md }}>
      {items.map((s, i) => (
        <View key={i} style={{ borderWidth: 1, borderColor: C.stroke.secondary, borderRadius: tokens.radius.md, padding: S.md }}>
          <RpText style={{ fontSize: tokens.font.size.h3, fontWeight: 600, color: C.text.primary, marginBottom: 6 }}>{s.title}</RpText>
          <View>{asText(s.body)}</View>
        </View>
      ))}
    </View>
  );
}

function svgAxis(layout: ReturnType<typeof computeBarChart>["layout"], categories: string[], valueSuffix?: string) {
  return (
    <>
      {layout.yTicks.map((t, i) => {
        const y = layout.padding.top + layout.plotHeight - (t / layout.maxValue) * layout.plotHeight;
        return (
          <G key={`y${i}`}>
            <Line x1={layout.padding.left} y1={y} x2={layout.width - layout.padding.right} y2={y} strokeWidth={1} stroke={C.stroke.secondary} />
            <RpText x={layout.padding.left - 6} y={y + 3} style={{ fontSize: 8, color: C.text.tertiary }}>{`${t}${valueSuffix ?? ""}`}</RpText>
          </G>
        );
      })}
      {categories.map((cat, i) => {
        const gw = layout.plotWidth / Math.max(categories.length, 1);
        const x = layout.padding.left + i * gw + gw / 2;
        return (
          <RpText key={`x${i}`} x={x} y={layout.height - layout.padding.bottom + 14} style={{ fontSize: 8, color: C.text.tertiary }}>
            {cat}
          </RpText>
        );
      })}
    </>
  );
}

export function BarChart(props: BarChartProps) {
  const width = 480;
  const { layout, bars } = computeBarChart(props, width);
  return (
    <Svg width={width} height={layout.height} viewBox={`0 0 ${width} ${layout.height}`}>
      {svgAxis(layout, props.categories, props.valueSuffix)}
      {bars.map((b, i) => (
        <Rect key={i} x={b.x} y={b.y} width={b.width} height={Math.max(b.height, 0)} fill={b.color} />
      ))}
    </Svg>
  );
}

export function LineChart(props: LineChartProps) {
  const width = 480;
  const { layout, geoms } = computeLineChart(props, width);
  const baseY = layout.padding.top + layout.plotHeight;
  return (
    <Svg width={width} height={layout.height} viewBox={`0 0 ${width} ${layout.height}`}>
      {svgAxis(layout, props.categories, props.valueSuffix)}
      {geoms.map((g, gi) => (
        <G key={gi}>
          {props.fill && g.points.length > 0 ? (
            <Path
              d={`M ${g.points[0]!.x} ${baseY} ${g.points.map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${g.points[g.points.length - 1]!.x} ${baseY} Z`}
              fill={g.color}
              fillOpacity={0.12}
            />
          ) : null}
          <Polyline points={g.points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={g.color} strokeWidth={2} />
          {g.points.map((p, pi) => (
            <Circle key={pi} cx={p.x} cy={p.y} r={2.5} fill={g.color} />
          ))}
        </G>
      ))}
    </Svg>
  );
}

export function PieChart(props: PieChartProps) {
  const { size, radius, slices } = computePieChart(props);
  const innerR = props.donut ? radius * 0.6 : 0;
  return (
    <View style={{ flexDirection: "row", gap: S.lg, alignItems: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <Path key={i} d={arcPath(radius, radius, radius, s.startAngle, s.endAngle, innerR)} fill={s.color} />
        ))}
      </Svg>
      <View style={{ flexDirection: "column", gap: 4 }}>
        {slices.map((s, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 9, height: 9, backgroundColor: s.color, borderRadius: 2 }} />
            <RpText style={{ fontSize: tokens.font.size.body, color: C.text.secondary }}>{`${s.label}  ${Math.round(s.percent * 100)}%`}</RpText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ReportRoot({ children }: { children?: React.ReactNode }) {
  // The PDF Page/Document wrapper is applied by the export route; here we
  // just provide a content container so the contract matches the web root.
  return <View style={{ flexDirection: "column", gap: S.xl }}>{React.Children.map(children, asText)}</View>;
}

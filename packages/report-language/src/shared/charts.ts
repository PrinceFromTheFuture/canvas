import { seriesColor, toneColor, type Tone } from "../tokens";
import type { BarChartProps, LineChartProps, PieChartProps } from "./types";

/**
 * Pure chart geometry shared by the web (<svg>) and pdf (<Svg>) branches.
 * Computing layout ONCE here is what prevents web/PDF drift: both targets
 * draw the same numbers, only the host elements differ.
 */

export interface BarRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  seriesName: string;
  category: string;
  value: number;
}

export interface ChartLayout {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  plotWidth: number;
  plotHeight: number;
  maxValue: number;
  yTicks: number[];
}

const DEFAULT_PADDING = { top: 16, right: 16, bottom: 36, left: 44 };

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

function baseLayout(width: number, height: number, maxValue: number): ChartLayout {
  const padding = DEFAULT_PADDING;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const max = niceMax(maxValue);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  return { width, height, padding, plotWidth, plotHeight, maxValue: max, yTicks };
}

function colorForSeries(tone: Tone | undefined, index: number): string {
  return tone ? toneColor(tone) : seriesColor(index);
}

export function computeBarChart(props: BarChartProps, width: number) {
  const height = props.height ?? 220;
  const { categories, series } = props;
  const normalized = props.normalized ?? false;
  // Normalized (100%-stacked) implies stacked.
  const stacked = props.stacked || normalized;
  const categoryTotals = categories.map((_, ci) => series.reduce((sum, s) => sum + (s.data[ci] ?? 0), 0));
  const totals = categories.map((_, ci) =>
    normalized
      ? 100
      : stacked
      ? categoryTotals[ci] ?? 0
      : Math.max(...series.map((s) => s.data[ci] ?? 0), 0),
  );
  const layout = baseLayout(width, height, Math.max(...totals, 0));
  const groupWidth = layout.plotWidth / Math.max(categories.length, 1);
  const innerPad = groupWidth * 0.18;
  const bars: BarRect[] = [];

  categories.forEach((category, ci) => {
    const groupX = layout.padding.left + ci * groupWidth + innerPad;
    const usableW = groupWidth - innerPad * 2;
    const catTotal = categoryTotals[ci] || 1;
    if (stacked) {
      let acc = 0;
      series.forEach((s, si) => {
        const raw = s.data[ci] ?? 0;
        const v = normalized ? (raw / catTotal) * 100 : raw;
        const h = (v / layout.maxValue) * layout.plotHeight;
        const y = layout.padding.top + layout.plotHeight - (acc + h);
        bars.push({ x: groupX, y, width: usableW, height: h, color: colorForSeries(s.tone, si), seriesName: s.name, category, value: raw });
        acc += h;
      });
    } else {
      const bw = usableW / Math.max(series.length, 1);
      series.forEach((s, si) => {
        const v = s.data[ci] ?? 0;
        const h = (v / layout.maxValue) * layout.plotHeight;
        const y = layout.padding.top + layout.plotHeight - h;
        bars.push({ x: groupX + si * bw, y, width: bw * 0.9, height: h, color: colorForSeries(s.tone, si), seriesName: s.name, category, value: v });
      });
    }
  });

  return { layout, bars, categoryWidth: groupWidth };
}

export interface LinePoint { x: number; y: number; value: number }
export interface LineSeriesGeom { name: string; color: string; points: LinePoint[] }

export function computeLineChart(props: LineChartProps, width: number) {
  const height = props.height ?? 220;
  const { categories, series } = props;
  const max = Math.max(...series.flatMap((s) => s.data), 0);
  const layout = baseLayout(width, height, max);
  const stepX = layout.plotWidth / Math.max(categories.length - 1, 1);
  const geoms: LineSeriesGeom[] = series.map((s, si) => ({
    name: s.name,
    color: colorForSeries(s.tone, si),
    points: categories.map((_, ci) => {
      const v = s.data[ci] ?? 0;
      return {
        x: layout.padding.left + ci * stepX,
        y: layout.padding.top + layout.plotHeight - (v / layout.maxValue) * layout.plotHeight,
        value: v,
      };
    }),
  }));
  return { layout, geoms };
}

export interface PieSlice { color: string; label: string; value: number; startAngle: number; endAngle: number; percent: number }

export function computePieChart(props: PieChartProps) {
  const size = props.size ?? 200;
  const total = props.data.reduce((s, d) => s + Math.max(d.value, 0), 0) || 1;
  let angle = -Math.PI / 2;
  const slices: PieSlice[] = props.data.map((d, i) => {
    const frac = Math.max(d.value, 0) / total;
    const start = angle;
    const end = angle + frac * Math.PI * 2;
    angle = end;
    return { color: colorForSeries(d.tone, i), label: d.label, value: d.value, startAngle: start, endAngle: end, percent: frac };
  });
  return { size, radius: size / 2, total, slices };
}

/** Build an SVG arc path for a pie slice (shared by web and pdf). */
export function arcPath(cx: number, cy: number, r: number, start: number, end: number, innerR = 0): string {
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  if (innerR <= 0) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }
  const ix1 = cx + innerR * Math.cos(end);
  const iy1 = cy + innerR * Math.sin(end);
  const ix2 = cx + innerR * Math.cos(start);
  const iy2 = cy + innerR * Math.sin(start);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`;
}

/**
 * Renderer-agnostic design tokens. These are plain values (hex strings,
 * numbers) so the SAME token feeds a DOM `style={{}}` object AND a
 * @react-pdf `StyleSheet`. This is the load-bearing reason the vocabulary
 * does NOT use Tailwind: react-pdf has no className, so styling must be
 * expressible as style objects on both targets.
 *
 * Reports are print-first artifacts (they must export to PDF), so the
 * default palette is light/print-friendly.
 */
export const tokens = {
  color: {
    text: {
      primary: "#1a1a1a",
      secondary: "#4a4a4a",
      tertiary: "#767676",
      onAccent: "#ffffff",
      link: "#0b62d6",
    },
    bg: {
      page: "#ffffff",
      surface: "#fafafa",
      elevated: "#ffffff",
    },
    fill: {
      subtle: "#f2f2f2",
      muted: "#ebebeb",
    },
    stroke: {
      primary: "#dcdcdc",
      secondary: "#e8e8e8",
    },
    accent: {
      primary: "#0b62d6",
    },
    tone: {
      success: "#1a7f43",
      danger: "#c0392b",
      warning: "#b8860b",
      info: "#0b62d6",
      neutral: "#767676",
    },
    /** Categorical sequence for charts (single-series-by-category, multi-series). */
    series: ["#0b62d6", "#1a7f43", "#b8860b", "#8e44ad", "#c0392b", "#16a085", "#d35400", "#2c3e50"],
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 4, md: 8, lg: 12 },
  font: {
    family: "Helvetica",
    size: { h1: 24, h2: 18, h3: 14, body: 11, small: 9 },
    weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
} as const;

export type Tone = keyof typeof tokens.color.tone;

export function toneColor(tone: Tone | undefined): string {
  return tone ? tokens.color.tone[tone] : tokens.color.text.primary;
}

export function seriesColor(index: number): string {
  const s = tokens.color.series;
  return s[index % s.length] ?? tokens.color.accent.primary;
}

/**
 * Shared 7-hue category palette. Mirrors `cursor/canvas` `colorPalette` keys so
 * authored reports that target a category color (Swatch, UsageBar segment) read
 * consistently across primitives. Values are print-friendly variants.
 */
export const colorPalette = {
  gray: "#8a8a99",
  purple: "#7b64b8",
  green: "#1f8a65",
  yellow: "#c79a17",
  pink: "#c85898",
  blue: "#2e79b5",
  orange: "#d98026",
} as const;

export type Color = keyof typeof colorPalette;

/** Auto-rotation order for UsageBar segments without an explicit color. */
export const usageColorSequence: readonly Color[] = [
  "purple",
  "green",
  "yellow",
  "pink",
  "blue",
  "orange",
  "gray",
];

/** Ordered sequence for automatic multi-series chart coloring. */
export const chartColorSequence: readonly string[] = tokens.color.series;

export function paletteColor(color: Color): string {
  return colorPalette[color] ?? colorPalette.gray;
}

/**
 * Extended tone set used by `Pill` to match the canvas vocabulary
 * (added/deleted/renamed) on top of the base semantic tones.
 */
export type PillTone = Tone | "added" | "deleted" | "renamed";

export function pillToneColor(tone: PillTone | undefined): string {
  switch (tone) {
    case "added":
      return tokens.color.tone.success;
    case "deleted":
      return tokens.color.tone.danger;
    case "renamed":
      return tokens.color.tone.info;
    case undefined:
      return tokens.color.text.tertiary;
    default:
      return tokens.color.tone[tone];
  }
}

/**
 * A `cursor/canvas` `useHostTheme()`-compatible theme object, built from the
 * print-first report palette. Authored reports may read these tokens for inline
 * styling (the same surface the canvas SDK exposes). Both web and pdf branches
 * use the SAME values so themed inline styles do not drift between targets.
 */
export const canvasTheme = {
  kind: "light",
  bg: {
    editor: tokens.color.bg.page,
    chrome: tokens.color.bg.surface,
    elevated: tokens.color.bg.elevated,
  },
  text: {
    primary: tokens.color.text.primary,
    secondary: tokens.color.text.secondary,
    tertiary: tokens.color.text.tertiary,
    quaternary: tokens.color.text.tertiary,
    link: tokens.color.text.link,
    onAccent: tokens.color.text.onAccent,
  },
  stroke: {
    primary: tokens.color.stroke.primary,
    secondary: tokens.color.stroke.secondary,
    tertiary: tokens.color.stroke.secondary,
  },
  fill: {
    primary: tokens.color.fill.muted,
    secondary: tokens.color.fill.subtle,
    tertiary: tokens.color.fill.subtle,
    quaternary: "#f7f7f7",
  },
  accent: {
    primary: tokens.color.accent.primary,
    control: tokens.color.accent.primary,
    controlHover: tokens.color.accent.primary,
  },
  diff: {
    insertedLine: "#e6f4ec",
    removedLine: "#fbeaec",
    stripAdded: tokens.color.tone.success,
    stripRemoved: tokens.color.tone.danger,
  },
  palette: colorPalette,
} as const;

export type CanvasTheme = typeof canvasTheme;

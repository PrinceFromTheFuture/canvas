import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { DatasetColumn, DatasetProfile } from "@arb/db";

export type Row = Record<string, unknown>;

const SAMPLE_LIMIT = 8;
const PROFILE_SAMPLES = 5;

export interface ParsedDataset {
  rows: Row[];
  profile: DatasetProfile;
}

function detectType(values: unknown[]): DatasetColumn["type"] {
  let sawNumber = false;
  let sawBool = false;
  let sawDate = false;
  let sawString = false;
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    if (typeof v === "boolean") sawBool = true;
    else if (typeof v === "number" && Number.isFinite(v)) sawNumber = true;
    else {
      const s = String(v).trim();
      if (s !== "" && !Number.isNaN(Number(s))) sawNumber = true;
      else if (/^(true|false)$/i.test(s)) sawBool = true;
      else if (!Number.isNaN(Date.parse(s)) && /[-/:]/.test(s)) sawDate = true;
      else sawString = true;
    }
  }
  if (sawString) return "string";
  if (sawDate && !sawNumber) return "date";
  if (sawNumber && !sawBool) return "number";
  if (sawBool && !sawNumber) return "boolean";
  return sawNumber ? "number" : "unknown";
}

/** Coerce numeric-looking strings so aggregation/charts work downstream. */
function coerce(rows: Row[], columns: DatasetColumn[]): Row[] {
  const numericCols = new Set(columns.filter((c) => c.type === "number").map((c) => c.name));
  return rows.map((r) => {
    const out: Row = {};
    for (const [k, v] of Object.entries(r)) {
      if (numericCols.has(k) && v !== null && v !== "" && v !== undefined) {
        const n = Number(v);
        out[k] = Number.isFinite(n) ? n : v;
      } else {
        out[k] = v;
      }
    }
    return out;
  });
}

function profileRows(rows: Row[]): DatasetProfile {
  const keys = rows.length ? Object.keys(rows[0] ?? {}) : [];
  const columns: DatasetColumn[] = keys.map((name) => {
    const values = rows.map((r) => r[name]);
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
    return {
      name,
      type: detectType(values),
      samples: Array.from(new Set(nonNull.slice(0, SAMPLE_LIMIT))) as DatasetColumn["samples"],
      nullCount: values.length - nonNull.length,
    };
  });
  const coerced = coerce(rows, columns);
  return { columns, rowCount: coerced.length, sampleRows: coerced.slice(0, PROFILE_SAMPLES) };
}

export function parseCsv(text: string): ParsedDataset {
  const res = Papa.parse<Row>(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  const rows = (res.data ?? []).filter((r) => r && Object.keys(r).length > 0);
  const profile = profileRows(rows);
  return { rows: coerce(rows, profile.columns), profile };
}

export function parseJson(text: string): ParsedDataset {
  const parsed = JSON.parse(text);
  const rows: Row[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.rows) ? parsed.rows : [parsed];
  const profile = profileRows(rows);
  return { rows: coerce(rows, profile.columns), profile };
}

export function parseExcel(buffer: Buffer): ParsedDataset {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const first = wb.SheetNames[0];
  const sheet = first ? wb.Sheets[first] : undefined;
  const rows: Row[] = sheet ? (XLSX.utils.sheet_to_json(sheet) as Row[]) : [];
  const profile = profileRows(rows);
  return { rows: coerce(rows, profile.columns), profile };
}

/** Dispatch on media type / filename. */
export function parseDataset(input: { filename: string; mediaType: string; bytes: Buffer }): ParsedDataset {
  const name = input.filename.toLowerCase();
  if (name.endsWith(".csv") || input.mediaType.includes("csv")) return parseCsv(input.bytes.toString("utf8"));
  if (name.endsWith(".json") || input.mediaType.includes("json")) return parseJson(input.bytes.toString("utf8"));
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || input.mediaType.includes("sheet") || input.mediaType.includes("excel")) {
    return parseExcel(input.bytes);
  }
  // Fallback: try CSV.
  return parseCsv(input.bytes.toString("utf8"));
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Row } from "./parse";

/**
 * Pluggable blob storage. Dev uses the local filesystem under STORAGE_DIR;
 * a prod implementation would swap this for S3/R2 behind the same interface.
 * We persist the PARSED rows as JSON so the worker can read them back without
 * re-parsing the original upload.
 */
function storageDir(): string {
  return path.resolve(process.env.STORAGE_DIR ?? ".storage");
}

export async function putRows(rows: Row[]): Promise<string> {
  const ref = `datasets/${randomUUID()}.json`;
  const full = path.join(storageDir(), ref);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(rows), "utf8");
  return ref;
}

export async function getRows(storageRef: string): Promise<Row[]> {
  const full = path.join(storageDir(), storageRef);
  try {
    const text = await fs.readFile(full, "utf8");
    return JSON.parse(text) as Row[];
  } catch {
    return [];
  }
}

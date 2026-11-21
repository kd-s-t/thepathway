import { promises as fs } from "node:fs";
import path from "node:path";

export const PATH_MAX = 1000;
export const RECORDS_PATH = path.join(process.cwd(), "data", "records.json");

export type RecordsFile = {
  records: number[];
};

export function normalizeRecords(input: unknown): number[] {
  if (!input || typeof input !== "object") return [];
  const records = (input as RecordsFile).records;
  if (!Array.isArray(records)) return [];
  return records.filter(
    (n): n is number =>
      typeof n === "number" &&
      Number.isFinite(n) &&
      Number.isInteger(n) &&
      n >= 1 &&
      n <= PATH_MAX,
  );
}

export async function readRecords(): Promise<number[]> {
  const raw = await fs.readFile(RECORDS_PATH, "utf8");
  return normalizeRecords(JSON.parse(raw) as unknown);
}

export async function writeRecords(records: number[]): Promise<number[]> {
  const next: RecordsFile = { records };
  await fs.writeFile(RECORDS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return records;
}

export function parseRecordValue(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(n) || n < 1 || n > PATH_MAX) {
    throw new Error(`Record must be an integer from 1 to ${PATH_MAX}`);
  }

  return n;
}

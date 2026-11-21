import { promises as fs } from "node:fs";
import path from "node:path";
import {
  normalizeRecords,
  type PathRecord,
  type RecordsFile,
} from "@/lib/path-record";

export {
  PATH_MAX,
  createRecord,
  formatAddedAt,
  normalizeRecords,
  parseRecordValue,
  type PathRecord,
  type RecordsFile,
} from "@/lib/path-record";

const SEED_PATH = path.join(process.cwd(), "data", "records.json");
const RUNTIME_PATH =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "thepathway-records.json")
    : SEED_PATH;

async function readJsonFile(filePath: string): Promise<PathRecord[]> {
  const raw = await fs.readFile(filePath, "utf8");
  return normalizeRecords(JSON.parse(raw) as unknown);
}

export async function readRecords(): Promise<PathRecord[]> {
  try {
    return await readJsonFile(RUNTIME_PATH);
  } catch {
    if (RUNTIME_PATH === SEED_PATH) throw new Error("Could not read records");
    const seeded = await readJsonFile(SEED_PATH);
    await writeRecords(seeded);
    return seeded;
  }
}

export async function writeRecords(records: PathRecord[]): Promise<PathRecord[]> {
  const next: RecordsFile = { records };
  await fs.writeFile(
    RUNTIME_PATH,
    `${JSON.stringify(next, null, 2)}\n`,
    "utf8",
  );
  return records;
}

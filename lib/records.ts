import { promises as fs } from "node:fs";
import path from "node:path";
import { getDatabaseUrl, getSql } from "@/lib/db";
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
const FILE_PATH = SEED_PATH;

async function readSeedRecords(): Promise<PathRecord[]> {
  const raw = await fs.readFile(SEED_PATH, "utf8");
  return normalizeRecords(JSON.parse(raw) as unknown);
}

async function readJsonFile(filePath: string): Promise<PathRecord[]> {
  const raw = await fs.readFile(filePath, "utf8");
  return normalizeRecords(JSON.parse(raw) as unknown);
}

async function ensureRecordsTable(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS pathway_records (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      records JSONB NOT NULL
    )
  `;
}

async function readRecordsFromDb(): Promise<PathRecord[]> {
  await ensureRecordsTable();
  const sql = getSql();
  const rows = await sql`
    SELECT records FROM pathway_records WHERE id = 1 LIMIT 1
  `;

  if (rows.length === 0) {
    const seeded = await readSeedRecords();
    await writeRecordsToDb(seeded);
    return seeded;
  }

  return normalizeRecords({ records: rows[0].records });
}

async function writeRecordsToDb(records: PathRecord[]): Promise<PathRecord[]> {
  await ensureRecordsTable();
  const sql = getSql();
  await sql`
    INSERT INTO pathway_records (id, records)
    VALUES (1, ${JSON.stringify(records)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET records = EXCLUDED.records
  `;
  return records;
}

async function readRecordsFromFile(): Promise<PathRecord[]> {
  try {
    return await readJsonFile(FILE_PATH);
  } catch {
    throw new Error("Could not read records");
  }
}

async function writeRecordsToFile(records: PathRecord[]): Promise<PathRecord[]> {
  const next: RecordsFile = { records };
  await fs.writeFile(FILE_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return records;
}

function mustUseDatabase(): boolean {
  return Boolean(getDatabaseUrl()) || process.env.VERCEL === "1";
}

export async function readRecords(): Promise<PathRecord[]> {
  if (mustUseDatabase()) {
    if (!getDatabaseUrl()) {
      throw new Error(
        "DATABASE_URL is required on Vercel. Connect a Postgres database in the Vercel project.",
      );
    }
    return readRecordsFromDb();
  }
  return readRecordsFromFile();
}

export async function writeRecords(records: PathRecord[]): Promise<PathRecord[]> {
  if (mustUseDatabase()) {
    if (!getDatabaseUrl()) {
      throw new Error(
        "DATABASE_URL is required on Vercel. Connect a Postgres database in the Vercel project.",
      );
    }
    return writeRecordsToDb(records);
  }
  return writeRecordsToFile(records);
}

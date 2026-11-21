export const PATH_MAX = 999;

export type PathRecord = {
  value: number;
  addedAt: string;
};

export type RecordsFile = {
  records: PathRecord[];
};

function isValidValue(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= PATH_MAX
  );
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function normalizeRecords(input: unknown): PathRecord[] {
  if (!input || typeof input !== "object") return [];
  const records = (input as { records?: unknown }).records;
  if (!Array.isArray(records)) return [];

  return records.flatMap((entry, index) => {
    if (isValidValue(entry)) {
      const stamp = new Date(Date.now() - (records.length - index) * 60_000);
      return [{ value: entry, addedAt: stamp.toISOString() }];
    }

    if (
      entry &&
      typeof entry === "object" &&
      isValidValue((entry as PathRecord).value)
    ) {
      const value = (entry as PathRecord).value;
      const addedAt = isValidDate((entry as PathRecord).addedAt)
        ? (entry as PathRecord).addedAt
        : new Date().toISOString();
      return [{ value, addedAt }];
    }

    return [];
  });
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

export function createRecord(value: number, addedAt = new Date().toISOString()): PathRecord {
  return { value, addedAt };
}

export function formatAddedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

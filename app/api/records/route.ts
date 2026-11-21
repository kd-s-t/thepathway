import {
  createRecord,
  parseRecordValue,
  readRecords,
  writeRecords,
} from "@/lib/records";

function parseIndex(value: unknown, length: number): number {
  const index =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new Error("Record index is out of range");
  }

  return index;
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export async function GET() {
  const records = await readRecords();
  return Response.json({ records });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid JSON body" },
      { status: 400 },
    );
  }

  const value =
    body && typeof body === "object" && "value" in body
      ? (body as { value: unknown }).value
      : body;

  let recordValue: number;
  try {
    recordValue = parseRecordValue(value);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid record" },
      { status: 400 },
    );
  }

  const records = await readRecords();
  const added = createRecord(recordValue);
  records.push(added);
  await writeRecords(records);

  return Response.json({ records, added });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Expected index and value" }, { status: 400 });
  }

  const { index: rawIndex, value } = body as {
    index?: unknown;
    value?: unknown;
  };

  const records = await readRecords();

  try {
    const index = parseIndex(rawIndex, records.length);
    records[index] = {
      ...records[index],
      value: parseRecordValue(value),
    };
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid update" },
      { status: 400 },
    );
  }

  await writeRecords(records);
  return Response.json({ records });
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid JSON body" },
      { status: 400 },
    );
  }

  const rawIndex =
    body && typeof body === "object" && "index" in body
      ? (body as { index: unknown }).index
      : body;

  const records = await readRecords();

  try {
    const index = parseIndex(rawIndex, records.length);
    records.splice(index, 1);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid delete" },
      { status: 400 },
    );
  }

  await writeRecords(records);
  return Response.json({ records });
}

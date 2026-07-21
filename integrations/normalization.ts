import type { NormalizedSourceRecord, SourceName } from "@/types/sourcing";

type Matrix = Array<Array<unknown>>;

const aliases = {
  sourceId: ["hotel id", "property id", "supplier id", "hotel code", "id"],
  hotelName: ["hotel name", "property name", "supplier name", "hotel", "property"],
  legalName: ["legal name", "legal entity", "company name"],
  airport: ["iata", "airport code", "airport", "port code", "port"],
  city: ["city", "market city"],
  country: ["country", "country name"],
  region: ["region", "sourcing region", "market region"],
  owner: ["owner", "sourcing owner", "sourcing manager", "assigned to"],
  status: ["status", "rfp status", "agreement status", "contract status"],
  rate: ["dpax rate", "room rate", "proposed rate", "rate", "adr"],
  currency: ["currency", "currency code"],
  commission: ["commission", "commission %", "commission percent"],
  roomNights: ["room nights", "roomnights", "production", "rn"],
  breakfast: ["breakfast included", "breakfast"],
  lra: ["lra", "last room availability"],
  vcc: ["vcc", "vcc accepted", "virtual credit card"],
} as const;

type CanonicalKey = keyof typeof aliases;

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, " ").replace(/[^a-z0-9 %]/g, "");
}

function findHeaderRow(matrix: Matrix) {
  let best = { index: 0, matches: 0 };
  matrix.slice(0, 20).forEach((row, index) => {
    const headers = row.map(normalizeHeader);
    const matches = Object.values(aliases).filter((options) => options.some((alias) => headers.includes(alias))).length;
    if (matches > best.matches) best = { index, matches };
  });
  return best;
}

function columnMap(headers: unknown[]) {
  const normalized = headers.map(normalizeHeader);
  return Object.fromEntries(Object.entries(aliases).map(([key, options]) => [key, normalized.findIndex((header) => (options as readonly string[]).includes(header))])) as Record<CanonicalKey, number>;
}

function stringValue(row: unknown[], index: number) {
  return index < 0 ? "" : String(row[index] ?? "").trim();
}

function numberValue(row: unknown[], index: number) {
  if (index < 0) return null;
  const cleaned = String(row[index] ?? "").replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(row: unknown[], index: number) {
  if (index < 0) return null;
  const value = normalizeHeader(row[index]);
  if (["yes", "y", "true", "included", "accepted", "1"].includes(value)) return true;
  if (["no", "n", "false", "excluded", "declined", "0"].includes(value)) return false;
  return null;
}

export function normalizeMatrix(source: SourceName, matrix: Matrix, sourceRowOffset = 0): NormalizedSourceRecord[] {
  if (!matrix.length) return [];
  const header = findHeaderRow(matrix);
  if (header.matches < 2) return [];
  const columns = columnMap(matrix[header.index] ?? []);

  return matrix.slice(header.index + 1).map((row, offset) => {
    const hotelName = stringValue(row, columns.hotelName);
    const sourceId = stringValue(row, columns.sourceId);
    const airport = stringValue(row, columns.airport).toUpperCase();
    const availableKeys = [hotelName, sourceId, airport].filter(Boolean).length;
    return {
      source,
      sourceId: sourceId || `${source.toLowerCase()}-${header.index + offset + 2}`,
      hotelName,
      legalName: stringValue(row, columns.legalName),
      airport,
      city: stringValue(row, columns.city),
      country: stringValue(row, columns.country),
      region: stringValue(row, columns.region),
      owner: stringValue(row, columns.owner),
      status: stringValue(row, columns.status),
      rate: numberValue(row, columns.rate),
      currency: stringValue(row, columns.currency) || "USD",
      commission: numberValue(row, columns.commission),
      roomNights: numberValue(row, columns.roomNights),
      breakfast: booleanValue(row, columns.breakfast),
      lra: booleanValue(row, columns.lra),
      vcc: booleanValue(row, columns.vcc),
      sourceRow: sourceRowOffset + header.index + offset + 2,
      confidence: availableKeys === 3 ? 98 : availableKeys === 2 ? 84 : 62,
    };
  }).filter((record) => record.hotelName || !record.sourceId.startsWith(`${source.toLowerCase()}-`));
}

function excelColumnIndex(column: string) {
  return column.toUpperCase().split("").reduce((value, character) => value * 26 + character.charCodeAt(0) - 64, 0) - 1;
}

export function sliceMatrixByRange(matrix: Matrix, range: string) {
  const match = range.trim().match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) return { matrix, rowOffset: 0 };
  const startColumn = excelColumnIndex(match[1]);
  const startRow = Math.max(0, Number(match[2]) - 1);
  const endColumn = excelColumnIndex(match[3]);
  const endRow = Math.max(startRow, Number(match[4]) - 1);
  return {
    matrix: matrix.slice(startRow, endRow + 1).map((row) => row.slice(startColumn, endColumn + 1)),
    rowOffset: startRow,
  };
}

export function parseCsvMatrix(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];
    if (character === '"' && quoted && next === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(value); value = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else value += character;
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

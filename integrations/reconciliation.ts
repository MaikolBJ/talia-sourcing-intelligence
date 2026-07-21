import type { NormalizedSourceRecord, ReconciledRuntimeHotel, RiskLevel, SourceName } from "@/types/sourcing";

const sourceOrder: SourceName[] = ["SharePoint", "Cvent", "StormX"];

function normalizedName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(sa|sas|llc|ltd|inc|company|co)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function nameTokens(value: string) {
  return new Set(normalizedName(value).split(" ").filter((token) => token.length > 1 && !["hotel", "the", "by"].includes(token)));
}

function tokenSimilarity(left: string, right: string) {
  const a = nameTokens(left);
  const b = nameTokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}

function canonicalKey(record: NormalizedSourceRecord) {
  const name = normalizedName(record.hotelName || record.legalName);
  return `${record.airport || "unknown"}|${name || record.sourceId.toLowerCase()}`;
}

function pick<T>(records: NormalizedSourceRecord[], selector: (record: NormalizedSourceRecord) => T | null | undefined, priority = sourceOrder) {
  for (const source of priority) {
    const value = records.filter((record) => record.source === source).map(selector).find((candidate) => candidate !== null && candidate !== undefined && candidate !== "");
    if (value !== undefined) return value;
  }
  return null;
}

function distinct(values: Array<string | number | boolean | null>) {
  return new Set(values.filter((value) => value !== null && value !== "").map(String)).size;
}

function riskFor(commission: number | null, breakfast: boolean | null, lra: boolean | null, vcc: boolean | null, discrepancies: number): RiskLevel {
  if (lra === false || (commission !== null && commission < 10)) return "Critical";
  if (breakfast === false || vcc === false || lra === null || commission === null) return "High";
  if (discrepancies > 0 || breakfast === null || vcc === null) return "Medium";
  return "Low";
}

export function reconcileRuntimeRecords(records: NormalizedSourceRecord[]): ReconciledRuntimeHotel[] {
  const groups: Array<{ key: string; records: NormalizedSourceRecord[] }> = [];

  records.forEach((record) => {
    const key = canonicalKey(record);
    const name = record.hotelName || record.legalName;
    const exactId = normalizedName(record.sourceId);
    const group = groups.find((candidate) => {
      if (candidate.key === key) return true;
      const representative = candidate.records[0];
      const candidateId = normalizedName(representative.sourceId);
      if (exactId.length >= 4 && exactId === candidateId && (!record.airport || !representative.airport || representative.airport === record.airport)) return true;
      return Boolean(record.airport && representative.airport === record.airport && tokenSimilarity(name, representative.hotelName || representative.legalName) >= 0.66);
    });
    if (group) group.records.push(record);
    else groups.push({ key, records: [record] });
  });

  return groups.map((group) => {
    const groupRecords = group.records;
    const sources = sourceOrder.filter((source) => groupRecords.some((record) => record.source === source));
    const sourceRows = Object.fromEntries(sources.map((source) => [source, groupRecords.filter((record) => record.source === source).map((record) => record.sourceRow)])) as Partial<Record<SourceName, number[]>>;
    const rates = Object.fromEntries(sources.map((source) => [source, groupRecords.find((record) => record.source === source && record.rate !== null)?.rate]).filter((entry) => entry[1] !== undefined)) as Partial<Record<SourceName, number>>;
    const commission = pick(groupRecords, (record) => record.commission) as number | null;
    const breakfast = pick(groupRecords, (record) => record.breakfast) as boolean | null;
    const lra = pick(groupRecords, (record) => record.lra) as boolean | null;
    const vcc = pick(groupRecords, (record) => record.vcc) as boolean | null;
    const discrepancyCount = [
      distinct(Object.values(rates)),
      distinct(groupRecords.map((record) => record.commission)),
      distinct(groupRecords.map((record) => record.breakfast)),
      distinct(groupRecords.map((record) => record.lra)),
      distinct(groupRecords.map((record) => record.vcc)),
      distinct(groupRecords.map((record) => record.status.toLowerCase())),
    ].filter((count) => count > 1).length;
    const evidence = [commission !== null, breakfast !== null, lra !== null, vcc !== null];
    const passed = [commission !== null && commission >= 10, breakfast === true, lra === true, vcc === true];

    return {
      key: group.key,
      hotelName: String(pick(groupRecords, (record) => record.hotelName) || pick(groupRecords, (record) => record.legalName) || group.key),
      legalName: String(pick(groupRecords, (record) => record.legalName) || ""),
      airport: String(pick(groupRecords, (record) => record.airport) || ""),
      city: String(pick(groupRecords, (record) => record.city) || ""),
      country: String(pick(groupRecords, (record) => record.country) || ""),
      region: String(pick(groupRecords, (record) => record.region) || ""),
      owner: String(pick(groupRecords, (record) => record.owner) || "Unassigned"),
      status: String(pick(groupRecords, (record) => record.status) || "Unmapped"),
      sources,
      sourceRows,
      rates,
      currency: String(pick(groupRecords, (record) => record.currency) || "USD"),
      commission,
      roomNights: pick(groupRecords, (record) => record.roomNights, ["StormX", "SharePoint", "Cvent"]) as number | null,
      breakfast,
      lra,
      vcc,
      complianceScore: Math.round((passed.filter(Boolean).length / passed.length) * 100),
      completenessScore: Math.round((evidence.filter(Boolean).length / evidence.length) * 100),
      matchConfidence: Math.round(groupRecords.reduce((sum, record) => sum + record.confidence, 0) / groupRecords.length),
      discrepancyCount,
      risk: riskFor(commission, breakfast, lra, vcc, discrepancyCount),
    };
  }).sort((left, right) => {
    const riskRank: Record<RiskLevel, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return riskRank[right.risk] - riskRank[left.risk] || (right.roomNights ?? 0) - (left.roomNights ?? 0);
  });
}

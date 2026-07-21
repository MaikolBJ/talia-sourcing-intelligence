import type { NormalizedSourceRecord, SourceName } from "@/types/sourcing";

function record(source: SourceName, values: Partial<NormalizedSourceRecord>): NormalizedSourceRecord {
  return {
    source,
    sourceId: `${source.toUpperCase()}-DEMO`,
    hotelName: "Synthetic Airport Hotel",
    legalName: "Synthetic Hospitality Holdings",
    airport: "SCL",
    city: "Santiago",
    country: "Chile",
    region: "LATAM",
    owner: "Demo Sourcing Manager",
    status: "Negotiation",
    rate: null,
    currency: "USD",
    commission: null,
    roomNights: null,
    breakfast: null,
    lra: null,
    vcc: null,
    sourceRow: 2,
    confidence: 98,
    ...values,
  };
}

export const runtimeDemoRecords: NormalizedSourceRecord[] = [
  record("SharePoint", { sourceId: "SP-DEMO-01", rate: 104, commission: 10, breakfast: true, lra: true, vcc: true, sourceRow: 8 }),
  record("Cvent", { sourceId: "CV-DEMO-01", hotelName: "Synthetic Airport Hotel Santiago", rate: 116, commission: 8, breakfast: true, lra: true, vcc: true, sourceRow: 14 }),
  record("StormX", { sourceId: "SX-DEMO-01", hotelName: "Synthetic Airport Hotel Santiago", rate: 97, roomNights: 2840, sourceRow: 31 }),
  record("SharePoint", { sourceId: "SP-DEMO-02", hotelName: "Sample Lima Gateway", legalName: "Sample Lima Gateway SAC", airport: "LIM", city: "Lima", country: "Peru", rate: 91, commission: 10, breakfast: false, lra: false, vcc: true, status: "Review", sourceRow: 19 }),
  record("Cvent", { sourceId: "CV-DEMO-02", hotelName: "Sample Gateway Lima Hotel", legalName: "Sample Lima Gateway SAC", airport: "LIM", city: "Lima", country: "Peru", rate: 99, commission: 10, breakfast: false, lra: false, vcc: true, status: "Submitted", sourceRow: 42 }),
  record("StormX", { sourceId: "SX-DEMO-02", hotelName: "Sample Lima Gateway Airport", legalName: "Sample Lima Gateway SAC", airport: "LIM", city: "Lima", country: "Peru", rate: 86, roomNights: 1920, status: "Active", sourceRow: 55 }),
  record("SharePoint", { sourceId: "SP-DEMO-03", hotelName: "Example Bogota Central", legalName: "Example Colombia SAS", airport: "BOG", city: "Bogota", country: "Colombia", rate: 82, commission: 10, breakfast: true, lra: true, vcc: null, status: "Negotiation", sourceRow: 27 }),
  record("Cvent", { sourceId: "CV-DEMO-03", hotelName: "Example Central Bogota", legalName: "Example Colombia SAS", airport: "BOG", city: "Bogota", country: "Colombia", rate: 88, commission: 10, breakfast: true, lra: true, vcc: false, status: "Submitted", sourceRow: 63 }),
];

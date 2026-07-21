import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMatrix, parseCsvMatrix, sliceMatrixByRange } from "../integrations/normalization";
import { reconcileRuntimeRecords } from "../integrations/reconciliation";
import type { NormalizedSourceRecord, SourceName } from "../types/sourcing";

test("CSV parser preserves quoted commas and escaped quotes", () => {
  const rows = parseCsvMatrix('Hotel ID,Hotel Name,Notes\r\nCV-1,"Cloud Hotel, Airport","Said ""yes"""');
  assert.deepEqual(rows, [["Hotel ID", "Hotel Name", "Notes"], ["CV-1", "Cloud Hotel, Airport", 'Said "yes"']]);
});

test("normalization finds a delayed header and maps source aliases", () => {
  const matrix = [
    ["DPAX sourcing export"],
    ["Generated", "2026-07-21"],
    ["Property ID", "Property Name", "Port Code", "Proposed Rate", "Commission Percent", "RoomNights", "Breakfast", "Last Room Availability", "Virtual Credit Card", "RFP Status"],
    ["SP-22", "Cloud Airport Hotel", "SCL", "$98.50", "10%", "1,850", "Yes", "Accepted", "True", "Submitted"],
  ];
  const records = normalizeMatrix("SharePoint", matrix);
  assert.equal(records.length, 1);
  const { sourceId, hotelName, airport, rate, commission, roomNights, breakfast, lra, vcc, status, sourceRow } = records[0];
  assert.deepEqual({ sourceId, hotelName, airport, rate, commission, roomNights, breakfast, lra, vcc, status, sourceRow }, {
    sourceId: "SP-22",
    hotelName: "Cloud Airport Hotel",
    airport: "SCL",
    rate: 98.5,
    commission: 10,
    roomNights: 1850,
    breakfast: true,
    lra: true,
    vcc: true,
    status: "Submitted",
    sourceRow: 4,
  });
});

test("bounded workbook range preserves original worksheet row provenance", () => {
  const matrix = Array.from({ length: 20 }, (_, index) => [`Row ${index + 1}`, index + 1, "unused"]);
  const bounded = sliceMatrixByRange(matrix, "A5:B10");
  assert.equal(bounded.rowOffset, 4);
  assert.equal(bounded.matrix.length, 6);
  assert.deepEqual(bounded.matrix[0], ["Row 5", 5]);
});

function record(source: SourceName, values: Partial<NormalizedSourceRecord>): NormalizedSourceRecord {
  return {
    source,
    sourceId: `${source}-22`,
    hotelName: "Cloud Hotel Santiago",
    legalName: "",
    airport: "SCL",
    city: "Santiago",
    country: "Chile",
    region: "LATAM",
    owner: "Sourcing Team",
    status: "Submitted",
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

test("reconciliation creates one canonical hotel with source authority and conflicts", () => {
  const reconciled = reconcileRuntimeRecords([
    record("SharePoint", { rate: 100, commission: 10, breakfast: true, lra: true, vcc: true, sourceRow: 8 }),
    record("Cvent", { hotelName: "Cloud Santiago Hotel", rate: 110, commission: 8, breakfast: true, lra: true, vcc: true, sourceRow: 14 }),
    record("StormX", { hotelName: "Cloud Hotel Santiago Airport", rate: 95, roomNights: 2400, sourceRow: 31 }),
  ]);
  assert.equal(reconciled.length, 1);
  assert.deepEqual(reconciled[0].sources, ["SharePoint", "Cvent", "StormX"]);
  assert.deepEqual(reconciled[0].rates, { SharePoint: 100, Cvent: 110, StormX: 95 });
  assert.equal(reconciled[0].commission, 10);
  assert.equal(reconciled[0].roomNights, 2400);
  assert.equal(reconciled[0].complianceScore, 100);
  assert.ok(reconciled[0].discrepancyCount >= 2);
  assert.equal(reconciled[0].risk, "Medium");
  assert.deepEqual(reconciled[0].sourceRows, { SharePoint: [8], Cvent: [14], StormX: [31] });
});

test("same hotel name at different airports remains separate", () => {
  const reconciled = reconcileRuntimeRecords([
    record("SharePoint", { sourceId: "SP-1", airport: "SCL" }),
    record("Cvent", { sourceId: "CV-1", airport: "LIM" }),
  ]);
  assert.equal(reconciled.length, 2);
});

test("LRA rejection creates a critical sourcing risk", () => {
  const [hotel] = reconcileRuntimeRecords([record("SharePoint", { commission: 10, breakfast: true, lra: false, vcc: true })]);
  assert.equal(hotel.risk, "Critical");
  assert.equal(hotel.complianceScore, 75);
});

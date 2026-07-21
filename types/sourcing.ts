export type UserRole = "Platform Admin" | "Sourcing Manager";
export type SourceName = "SharePoint" | "Cvent" | "StormX";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type MatchStatus = "Matched" | "Review" | "Unmatched";
export type RfpStatus = "Draft" | "Invited" | "Submitted" | "Review" | "Negotiation" | "Approved" | "Rejected";

export interface SourcePresence {
  sharePoint: boolean;
  cvent: boolean;
  stormX: boolean;
}

export interface SourcingHotel {
  id: string;
  hotel: string;
  legalName: string;
  airport: string;
  city: string;
  country: string;
  region: string;
  owner: string;
  status: RfpStatus;
  rooms: number;
  roomNights: number;
  currentRate: number;
  cventRate: number;
  stormXAdr: number;
  marketBenchmark: number;
  currency: "USD";
  commission: number;
  breakfast: boolean;
  lra: boolean;
  staticRate: boolean;
  vcc: boolean;
  directBilling: boolean;
  compliance: number;
  commercialScore: number;
  operationalScore: number;
  completeness: number;
  matchConfidence: number;
  matchStatus: MatchStatus;
  risk: RiskLevel;
  source: SourcePresence;
  lastUpdated: string;
  nextAction: string;
  deadline: string;
}

export interface SourceHealth {
  name: SourceName;
  purpose: string;
  mode: "Read only";
  status: "Connected" | "Needs configuration" | "Snapshot ready";
  freshness: string;
  records: number;
  coverage: number;
  color: string;
}

export interface SourcingOpportunity {
  id: string;
  hotelId: string;
  title: string;
  detail: string;
  value: string;
  impact: "High" | "Medium";
  lever: string;
}

export interface ActionItem {
  id: string;
  hotelId: string;
  title: string;
  detail: string;
  due: string;
  priority: "Critical" | "High" | "Medium";
  completed: boolean;
}

export interface SourceLinks {
  sharePoint: string;
  cvent: string;
  stormX: string;
  support: string;
}

export interface Microsoft365Config {
  tenantId: string;
  clientId: string;
  sharePointHostname: string;
  sitePath: string;
  driveId: string;
  workbookItemId: string;
  worksheetName: string;
  workbookRange: string;
  searchTerm: string;
}

export interface GraphSiteSummary {
  id: string;
  displayName: string;
  webUrl: string;
}

export interface GraphDriveSummary {
  id: string;
  name: string;
  webUrl?: string;
}

export interface GraphFileSummary {
  id: string;
  name: string;
  webUrl: string;
  lastModifiedDateTime: string;
  size: number;
}

export interface NormalizedSourceRecord {
  source: SourceName;
  sourceId: string;
  hotelName: string;
  legalName: string;
  airport: string;
  city: string;
  country: string;
  region: string;
  owner: string;
  status: string;
  rate: number | null;
  currency: string;
  commission: number | null;
  roomNights: number | null;
  breakfast: boolean | null;
  lra: boolean | null;
  vcc: boolean | null;
  sourceRow: number;
  confidence: number;
}

export interface ReconciledRuntimeHotel {
  key: string;
  hotelName: string;
  legalName: string;
  airport: string;
  city: string;
  country: string;
  region: string;
  owner: string;
  status: string;
  sources: SourceName[];
  sourceRows: Partial<Record<SourceName, number[]>>;
  rates: Partial<Record<SourceName, number>>;
  currency: string;
  commission: number | null;
  roomNights: number | null;
  breakfast: boolean | null;
  lra: boolean | null;
  vcc: boolean | null;
  complianceScore: number;
  completenessScore: number;
  matchConfidence: number;
  discrepancyCount: number;
  risk: RiskLevel;
}

export interface Microsoft365Snapshot {
  accountName: string;
  site: GraphSiteSummary;
  drives: GraphDriveSummary[];
  files: GraphFileSummary[];
  selectedDriveId: string;
  refreshedAt: string;
  records: NormalizedSourceRecord[];
  worksheet?: string;
  range?: string;
}

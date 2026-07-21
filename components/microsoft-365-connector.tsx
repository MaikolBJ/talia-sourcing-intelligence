"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CloudDownload,
  Database,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  Link2,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { disconnectMicrosoft365, readMicrosoft365Snapshot } from "@/integrations/microsoft-graph";
import { Badge, Button, Field, Input, Notice, SectionHeading, Surface } from "@/components/ui";
import type { Microsoft365Config, Microsoft365Snapshot, UserRole } from "@/types/sourcing";

const storageKey = "talia-m365-readonly-config-v1";

const blankConfig: Microsoft365Config = {
  tenantId: "",
  clientId: "",
  sharePointHostname: "",
  sitePath: "",
  driveId: "",
  workbookItemId: "",
  worksheetName: "",
  workbookRange: "A1:Z250",
  searchTerm: "DPAX",
};

type ConnectorState = "idle" | "connecting" | "live" | "error";

export function Microsoft365Connector({
  role,
  snapshot,
  onSnapshot,
  onNotice,
}: {
  role: UserRole;
  snapshot: Microsoft365Snapshot | null;
  onSnapshot: (snapshot: Microsoft365Snapshot | null) => void;
  onNotice: (message: string) => void;
}) {
  const [config, setConfig] = useState(blankConfig);
  const [draft, setDraft] = useState(blankConfig);
  const [state, setState] = useState<ConnectorState>("idle");
  const [error, setError] = useState("");
  const isAdmin = role === "Platform Admin";
  const configured = Boolean(config.tenantId && config.clientId && config.sharePointHostname && config.sitePath);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const next = { ...blankConfig, ...JSON.parse(saved) } as Microsoft365Config;
      setConfig(next);
      setDraft(next);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  function saveConfiguration() {
    if (!isAdmin) return;
    if (!draft.tenantId.trim() || !draft.clientId.trim() || !draft.sharePointHostname.trim() || !draft.sitePath.trim()) {
      onNotice("Tenant ID, client ID, SharePoint hostname and site path are required.");
      return;
    }
    const safeConfig = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])) as unknown as Microsoft365Config;
    setConfig(safeConfig);
    window.localStorage.setItem(storageKey, JSON.stringify(safeConfig));
    onNotice("Read-only Microsoft 365 configuration saved in this browser. It contains no password, token or client secret.");
  }

  async function connectAndRefresh() {
    setState("connecting");
    setError("");
    onNotice("Waiting for Microsoft 365 sign-in and delegated read-only consent...");
    try {
      const next = await readMicrosoft365Snapshot(config);
      onSnapshot(next);
      setState("live");
      onNotice(`Live SharePoint refresh completed for ${next.site.displayName}. Private records remain in runtime memory only.`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Microsoft 365 connection failed.";
      setError(message);
      setState("error");
      onNotice(`Microsoft 365 connection error: ${message}`);
    }
  }

  async function disconnect() {
    try { await disconnectMicrosoft365(config); } catch { /* Local session is cleared below even if the popup is closed. */ }
    onSnapshot(null);
    setState("idle");
    onNotice("Microsoft 365 runtime session disconnected. No private source records remain in the workspace.");
  }

  function update<K extends keyof Microsoft365Config>(key: K, value: Microsoft365Config[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return <div className="grid gap-5">
    <Surface className="relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-300 to-transparent" />
      <SectionHeading eyebrow="Microsoft 365 live connector" title="Authenticated SharePoint intelligence" description="Authorization Code with PKCE, delegated read-only Graph scopes and session-only tokens keep the public GitHub Pages shell separate from private tenant data." action={<Badge tone={snapshot ? "green" : configured ? "amber" : "blue"}>{snapshot ? "Live authenticated" : configured ? "Ready to connect" : "Setup required"}</Badge>} />

      {snapshot ? <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ConnectorMetric label="Signed in as" value={snapshot.accountName} detail="Delegated user context" />
          <ConnectorMetric label="SharePoint site" value={snapshot.site.displayName} detail="Read-only site resolution" />
          <ConnectorMetric label="Libraries" value={String(snapshot.drives.length)} detail="Readable document libraries" />
          <ConnectorMetric label="Normalized rows" value={String(snapshot.records.length)} detail={snapshot.worksheet ? `${snapshot.worksheet} / ${snapshot.range}` : "Configure workbook preview"} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={connectAndRefresh} disabled={state === "connecting"}><RefreshCw size={15} className={state === "connecting" ? "animate-spin" : ""} /> Refresh live source</Button>
          <Button onClick={() => window.open(snapshot.site.webUrl, "_blank", "noopener,noreferrer")}><ExternalLink size={15} /> Open SharePoint</Button>
          <Button variant="ghost" onClick={disconnect}><LogOut size={15} /> Disconnect</Button>
        </div>
      </div> : <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-3">
          <ConnectorPrinciple icon={KeyRound} title="PKCE sign-in" detail="No browser client secret." />
          <ConnectorPrinciple icon={ShieldCheck} title="Read only" detail="Sites.Read.All and Files.Read.All delegated scopes." />
          <ConnectorPrinciple icon={CloudDownload} title="Runtime only" detail="Live rows are never committed or persisted." />
        </div>
        <Button variant="primary" onClick={connectAndRefresh} disabled={!configured || state === "connecting"}>{state === "connecting" ? <LoaderCircle size={16} className="animate-spin" /> : <Link2 size={16} />}{state === "connecting" ? "Connecting" : "Connect Microsoft 365"}</Button>
      </div>}

      {error ? <div className="mt-4"><Notice tone="danger" title="Connection could not be completed">{error} Verify the SPA redirect URI, delegated Graph permissions and admin consent.</Notice></div> : null}
    </Surface>

    {snapshot ? <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Surface><SectionHeading eyebrow="Live discovery" title="Recent matching source files" description={`Search term: ${config.searchTerm || "DPAX"}. File content is not stored by Talia.`} />
        <div className="grid gap-2">{snapshot.files.length ? snapshot.files.slice(0, 8).map((file) => <button key={file.id} className="row-card flex items-center gap-3 rounded-2xl p-3 text-left" onClick={() => window.open(file.webUrl, "_blank", "noopener,noreferrer")}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-400/10 text-red-200"><FileSpreadsheet size={17} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-white">{file.name}</strong><span className="mt-1 block text-[10px] text-slate-500">Updated {new Date(file.lastModifiedDateTime).toLocaleString("en-US")} / {(file.size / 1024).toFixed(0)} KB</span></span><ExternalLink size={14} className="text-slate-600" /></button>) : <EmptyConnectorState />}</div>
      </Surface>
      <Surface><SectionHeading eyebrow="Session data" title="Normalized workbook preview" description="Only the configured worksheet range is mapped; source row numbers preserve traceability." />
        {snapshot.records.length ? <div className="overflow-x-auto"><table className="data-table min-w-[650px]"><thead><tr><th>Hotel</th><th>IATA</th><th>Rate</th><th>Status</th><th>Source row</th></tr></thead><tbody>{snapshot.records.slice(0, 8).map((record) => <tr key={`${record.sourceId}-${record.sourceRow}`}><td><strong>{record.hotelName || record.legalName || record.sourceId}</strong><span>{record.sourceId}</span></td><td><strong>{record.airport || "Missing"}</strong><span>{record.city || record.country || "No market"}</span></td><td><strong>{record.rate === null ? "Missing" : `${record.currency} ${record.rate.toFixed(2)}`}</strong><span>{record.commission === null ? "No commission" : `${record.commission}% commission`}</span></td><td><Badge tone={/approved|accepted|active/i.test(record.status) ? "green" : "amber"}>{record.status || "Unmapped"}</Badge></td><td><strong>{record.sourceRow}</strong><span>{record.confidence}% identity</span></td></tr>)}</tbody></table></div> : <EmptyConnectorState label="Add a workbook item ID and worksheet name, then refresh to normalize a controlled range." />}
      </Surface>
    </div> : null}

    <Surface>
      <SectionHeading eyebrow="Platform Admin" title="Read-only connector configuration" description="Register the exact GitHub Pages workspace URL below as a Microsoft Entra Single-page application redirect URI. Tenant and resource identifiers are local configuration; secrets are never accepted." />
      {!isAdmin ? <Notice tone="warning" title="Configuration is locked">Sourcing Managers can use a saved connection and view governed results, but only Platform Admin can change Microsoft 365 identifiers.</Notice> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Tenant ID or verified domain" hint="Microsoft Entra tenant for TA Connections."><Input disabled={!isAdmin} value={draft.tenantId} onChange={(event) => update("tenantId", event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" /></Field>
        <Field label="SPA application client ID" hint="Public client ID only. Never enter a client secret."><Input disabled={!isAdmin} value={draft.clientId} onChange={(event) => update("clientId", event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" /></Field>
        <Field label="SharePoint hostname"><Input disabled={!isAdmin} value={draft.sharePointHostname} onChange={(event) => update("sharePointHostname", event.target.value)} placeholder="tenant.sharepoint.com" /></Field>
        <Field label="Site path"><Input disabled={!isAdmin} value={draft.sitePath} onChange={(event) => update("sitePath", event.target.value)} placeholder="/sites/SourcingTeam" /></Field>
        <Field label="Document library drive ID" hint="Optional; Documents is selected automatically."><Input disabled={!isAdmin} value={draft.driveId} onChange={(event) => update("driveId", event.target.value)} placeholder="Optional Graph drive ID" /></Field>
        <Field label="Workbook item ID" hint="Optional until row-level preview is required."><Input disabled={!isAdmin} value={draft.workbookItemId} onChange={(event) => update("workbookItemId", event.target.value)} placeholder="Graph drive item ID" /></Field>
        <Field label="Worksheet name"><Input disabled={!isAdmin} value={draft.worksheetName} onChange={(event) => update("worksheetName", event.target.value)} placeholder="DPAX Sourcing" /></Field>
        <Field label="Controlled range" hint="Limit scope for performance and privacy."><Input disabled={!isAdmin} value={draft.workbookRange} onChange={(event) => update("workbookRange", event.target.value)} placeholder="A1:Z250" /></Field>
        <Field label="File discovery term"><Input disabled={!isAdmin} value={draft.searchTerm} onChange={(event) => update("searchTerm", event.target.value)} placeholder="DPAX" /></Field>
        <Field label="Required SPA redirect URI" hint="Add exactly this value in Entra App Registration."><Input readOnly value={typeof window === "undefined" ? "" : `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/workspace/`} /></Field>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2"><Button disabled={!isAdmin} onClick={() => { setDraft(blankConfig); setConfig(blankConfig); window.localStorage.removeItem(storageKey); onSnapshot(null); onNotice("Local Microsoft 365 configuration cleared."); }}>Clear local setup</Button><Button variant="primary" disabled={!isAdmin} onClick={saveConfiguration}><Check size={15} /> Save connector setup</Button></div>
    </Surface>
  </div>;
}

function ConnectorMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="row-card rounded-2xl p-4"><span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">{label}</span><strong className="mt-2 block truncate text-sm text-white">{value}</strong><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>;
}

function ConnectorPrinciple({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return <div className="row-card flex gap-3 rounded-2xl p-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[.05] text-slate-400"><Icon size={16} /></span><div><strong className="text-xs text-white">{title}</strong><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div></div>;
}

function EmptyConnectorState({ label = "No matching files were returned by the configured read-only search." }: { label?: string }) {
  return <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-6 text-center"><div><Database size={22} className="mx-auto text-slate-700" /><p className="mt-3 max-w-sm text-xs leading-5 text-slate-500">{label}</p></div></div>;
}

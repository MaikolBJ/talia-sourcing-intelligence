"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CloudDownload,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  Gauge,
  GitCompareArrows,
  Home,
  Info,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  PanelRightClose,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { hotels, initialActions, opportunities, pipelineData, sourceHealth } from "@/data/sourcing-data";
import { runtimeDemoRecords } from "@/data/runtime-demo";
import { LeverageScatterChart, NegotiationChart, PipelineChart, ProductionChart, RateComparisonChart, RegionalChart, RuntimePolicyChart, RuntimeRateChart, RuntimeSourceChart, SourceCoverageChart } from "@/components/charts";
import { Microsoft365Connector } from "@/components/microsoft-365-connector";
import { Badge, Button, Eyebrow, Field, IconButton, Input, MetricCard, Modal, Notice, Progress, SectionHeading, Select, Surface, type Tone } from "@/components/ui";
import { normalizeMatrix, parseCsvMatrix } from "@/integrations/normalization";
import { reconcileRuntimeRecords } from "@/integrations/reconciliation";
import { cn, csvEscape, formatMoney, formatNumber } from "@/lib/utils";
import type { ActionItem, Microsoft365Snapshot, NormalizedSourceRecord, RiskLevel, SourceLinks, SourceName, SourcingHotel, UserRole } from "@/types/sourcing";

type TabId = "overview" | "hotels" | "pipeline" | "negotiations" | "explorer" | "reports" | "sources";
type NavItem = { id: TabId; label: string; detail: string; icon: LucideIcon; count?: string };

const navigation: NavItem[] = [
  { id: "overview", label: "Command Center", detail: "Portfolio health and priorities", icon: LayoutDashboard },
  { id: "hotels", label: "Hotel Intelligence", detail: "Canonical property records", icon: Building2, count: "184" },
  { id: "pipeline", label: "RFP Pipeline", detail: "Campaign and workflow control", icon: FileCheck2, count: "27" },
  { id: "negotiations", label: "Negotiations", detail: "Rounds, leverage and terms", icon: MessageSquare, count: "08" },
  { id: "explorer", label: "Cross-Source Explorer", detail: "Cvent + StormX + SharePoint", icon: GitCompareArrows },
  { id: "reports", label: "Reports", detail: "Performance and opportunity", icon: BarChart3 },
  { id: "sources", label: "Data Sources / Admin", detail: "Read-only connectors and links", icon: Settings },
];

const defaultLinks: SourceLinks = { sharePoint: "", cvent: "", stormX: "", support: "" };
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function riskTone(risk: RiskLevel): Tone {
  return risk === "Low" ? "green" : risk === "Medium" ? "amber" : "red";
}

function statusTone(status: SourcingHotel["status"]): Tone {
  return status === "Approved" ? "green" : status === "Negotiation" || status === "Review" ? "amber" : status === "Rejected" ? "red" : "blue";
}

export function SourcingWorkspace() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [role, setRole] = useState<UserRole>("Sourcing Manager");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<SourcingHotel | null>(null);
  const [actions, setActions] = useState<ActionItem[]>(initialActions);
  const [links, setLinks] = useState<SourceLinks>(defaultLinks);
  const [microsoftSnapshot, setMicrosoftSnapshot] = useState<Microsoft365Snapshot | null>(null);
  const [importedRecords, setImportedRecords] = useState<Record<SourceName, NormalizedSourceRecord[]>>({ SharePoint: [], Cvent: [], StormX: [] });
  const [lastRefresh, setLastRefresh] = useState("Today, 14:56 UTC");
  const [notice, setNotice] = useState("Synthetic demo records are active. No private tenant data is published.");

  useEffect(() => {
    const savedRole = window.localStorage.getItem("talia-sourcing-role") as UserRole | null;
    const savedLinks = window.localStorage.getItem("talia-source-links");
    if (savedRole === "Platform Admin" || savedRole === "Sourcing Manager") setRole(savedRole);
    if (savedLinks) {
      try { setLinks({ ...defaultLinks, ...JSON.parse(savedLinks) }); } catch { /* Ignore invalid local demo settings. */ }
    }
  }, []);

  function changeRole(nextRole: UserRole) {
    setRole(nextRole);
    window.localStorage.setItem("talia-sourcing-role", nextRole);
    setNotice(`Workspace switched to ${nextRole}.`);
  }

  function selectTab(tab: TabId) {
    setActiveTab(tab);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function refreshSources() {
    setActiveTab("sources");
    setNotice("Use the authenticated Microsoft 365 connector or local CSV controls to refresh read-only source data.");
  }

  function completeAction(id: string) {
    setActions((current) => current.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
    setNotice("Action queue updated in this browser.");
  }

  const current = navigation.find((item) => item.id === activeTab) ?? navigation[0];

  return <div className="min-h-screen lg:grid lg:grid-cols-[292px_minmax(0,1fr)]">
    <button aria-label="Close navigation" className={cn("fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden", mobileOpen ? "block" : "hidden")} onClick={() => setMobileOpen(false)} />
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r border-white/[.07] bg-[#080c12]/97 p-4 backdrop-blur-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex items-start justify-between gap-3 px-2 pt-2">
        <button className="text-left" onClick={() => selectTab("overview")}><Image src={`${publicBasePath}/ta-connections-logo.svg`} alt="TA Connections" width={215} height={50} priority className="h-auto w-[190px]" /><Eyebrow>Sourcing intelligence</Eyebrow><h1 className="font-display mt-1 text-2xl font-semibold tracking-[-.055em] text-white">Talia</h1></button>
        <IconButton label="Close navigation" className="lg:hidden" onClick={() => setMobileOpen(false)}><X size={18} /></IconButton>
      </div>

      <div className="source-strip mx-1 mt-5 rounded-2xl p-3.5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-extrabold text-slate-200">Unified source layer</span><Badge tone="green">Read only</Badge></div><div className="mt-3 flex gap-2">{[["SP", "red"], ["CV", "amber"], ["SX", "blue"]].map(([label, tone]) => <span key={label} className={cn("grid size-8 place-items-center rounded-xl border text-[10px] font-black", tone === "red" ? "border-red-400/20 bg-red-400/10 text-red-100" : tone === "amber" ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-sky-300/20 bg-sky-300/10 text-sky-100")}>{label}</span>)}</div><p className="mt-3 text-[11px] leading-5 text-slate-500">{lastRefresh}</p></div>

      <nav className="scrollbar-thin mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Sourcing navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return <button key={item.id} onClick={() => selectTab(item.id)} className={cn("group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition", active ? "border-white/10 bg-white/[.07] text-white" : "border-transparent text-slate-400 hover:bg-white/[.04] hover:text-white")}><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", active ? "bg-red-400/15 text-red-100" : "bg-white/[.035] text-slate-500")}><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{item.label}</span><span className="block truncate text-[10px] text-slate-600">{item.detail}</span></span>{item.count ? <span className="text-[10px] font-black text-slate-600">{item.count}</span> : null}</button>;
        })}
      </nav>

      <div className="mt-3 grid gap-2"><Button variant="secondary" className="w-full justify-start" onClick={refreshSources}><RefreshCw size={15} /> Open data sources</Button><Button variant="ghost" className="w-full justify-start" onClick={() => { window.localStorage.removeItem("talia-sourcing-role"); router.push("/"); }}><LogOut size={15} /> Exit workspace</Button></div>
    </aside>

    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-white/[.06] bg-[#080c12]/84 px-4 py-3 backdrop-blur-2xl md:px-6 xl:px-8"><div className="mx-auto flex max-w-[1720px] items-center gap-3"><IconButton label="Open navigation" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={18} /></IconButton><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-600"><span>Sourcing workspace</span><ChevronRight size={11} /><span className="text-slate-400">{current.label}</span></div><h2 className="font-display truncate text-lg font-semibold tracking-[-.04em] text-white">{current.label}</h2></div>{links.support ? <Button variant="ghost" className="hidden md:inline-flex" onClick={() => window.open(links.support, "_blank", "noopener,noreferrer")}><ExternalLink size={15} /> Platform link</Button> : null}<IconButton label="Notifications"><Bell size={18} /><span className="absolute" /></IconButton><Select aria-label="Workspace role" className="hidden w-auto min-w-44 rounded-full xl:block" value={role} onChange={(event) => changeRole(event.target.value as UserRole)}><option>Sourcing Manager</option><option>Platform Admin</option></Select><span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-red-300 to-red-700 text-xs font-black text-white">MB</span></div></header>

      <div className="border-b border-white/[.055] bg-red-500/[.035] px-4 py-2 text-center text-[11px] font-semibold text-slate-400"><Info size={13} className="mr-1.5 inline text-red-300" />{notice}</div>
      <main className="mx-auto max-w-[1720px] p-4 md:p-6 xl:p-8">
        {activeTab === "overview" ? <Overview actions={actions} onComplete={completeAction} onOpenHotel={setSelectedHotel} onNavigate={selectTab} /> : null}
        {activeTab === "hotels" ? <HotelIntelligence onOpenHotel={setSelectedHotel} /> : null}
        {activeTab === "pipeline" ? <PipelineWorkspace onOpenHotel={setSelectedHotel} /> : null}
        {activeTab === "negotiations" ? <NegotiationWorkspace onOpenHotel={setSelectedHotel} /> : null}
        {activeTab === "explorer" ? <CrossSourceExplorer onOpenHotel={setSelectedHotel} runtimeRecords={[...(microsoftSnapshot?.records ?? []), ...Object.values(importedRecords).flat()]} /> : null}
        {activeTab === "reports" ? <ReportsWorkspace /> : null}
        {activeTab === "sources" ? <SourcesAdmin role={role} links={links} setLinks={setLinks} snapshot={microsoftSnapshot} setSnapshot={(next) => { setMicrosoftSnapshot(next); if (next) setLastRefresh(`Live: ${new Date(next.refreshedAt).toLocaleTimeString("en-US")}`); }} importedRecords={importedRecords} setImportedRecords={setImportedRecords} setNotice={setNotice} /> : null}
      </main>
    </div>
    <HotelDetail hotel={selectedHotel} onClose={() => setSelectedHotel(null)} />
  </div>;
}

function PageHero({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="hero-panel mb-5 overflow-hidden rounded-[30px] p-6 md:p-8"><div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Eyebrow>{eyebrow}</Eyebrow><h1 className="font-display mt-3 max-w-[16ch] text-4xl font-semibold leading-[.98] tracking-[-.065em] text-white md:text-5xl">{title}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">{description}</p></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</div></div>;
}

function Overview({ actions, onComplete, onOpenHotel, onNavigate }: { actions: ActionItem[]; onComplete: (id: string) => void; onOpenHotel: (hotel: SourcingHotel) => void; onNavigate: (tab: TabId) => void }) {
  const activeActions = actions.filter((item) => !item.completed);
  return <>
    <PageHero eyebrow="Portfolio command center" title="Turn fragmented sourcing data into leverage." description="A portfolio-level view of commercial opportunity, policy compliance, production evidence and actions that need a sourcing decision." actions={<><Button variant="primary" onClick={() => onNavigate("negotiations")}><Sparkles size={16} /> Review opportunities</Button><Button onClick={() => onNavigate("explorer")}><GitCompareArrows size={16} /> Open data explorer</Button></>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Active hotels" value="184" detail="Across 63 priority ports" change="+12" tone="blue" /><MetricCard label="Addressable savings" value="$412K" detail="Rate and term opportunities" change="8.9%" tone="green" /><MetricCard label="Policy compliant" value="87%" detail="16 records have blocking gaps" change="+4 pts" tone="green" /><MetricCard label="In negotiation" value="58" detail="8 rounds require action" change="8 due" tone="amber" /><MetricCard label="Matched records" value="92%" detail="Across all three sources" change="17 review" tone="amber" /></div>
    <div className="mt-5 grid gap-5 2xl:grid-cols-[1.25fr_.75fr]"><Surface><SectionHeading eyebrow="Production signal" title="Room-night production trend" description="StormX production evidence makes negotiation leverage visible before a counteroffer is sent." action={<Badge tone="green">+37% YTD</Badge>} /><ProductionChart /></Surface><Surface><SectionHeading eyebrow="Workflow" title="RFP conversion" description="Hotels progressing from invitation to approved terms." /><PipelineChart /></Surface></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><Surface><SectionHeading eyebrow="Priority actions" title="What needs a decision now" description={`${activeActions.length} open actions sorted by commercial and compliance impact.`} action={<Button variant="ghost" onClick={() => onNavigate("pipeline")}>View pipeline <ArrowRight size={14} /></Button>} /><div className="grid gap-2">{actions.map((item) => { const hotel = hotels.find((record) => record.id === item.hotelId)!; return <article key={item.id} className={cn("row-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center", item.completed && "opacity-45")}><button aria-label={`Mark ${item.title} complete`} onClick={() => onComplete(item.id)} className={cn("grid size-9 shrink-0 place-items-center rounded-xl border", item.completed ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[.04] text-slate-500")}><Check size={16} /></button><button className="min-w-0 flex-1 text-left" onClick={() => onOpenHotel(hotel)}><div className="flex flex-wrap items-center gap-2"><strong className={cn("text-sm text-white", item.completed && "line-through")}>{item.title}</strong><Badge tone={item.priority === "Critical" ? "red" : item.priority === "High" ? "amber" : "neutral"}>{item.priority}</Badge></div><p className="mt-1 text-xs leading-5 text-slate-500">{hotel.airport} / {hotel.hotel} / {item.detail}</p></button><span className="text-xs font-bold text-slate-500">{item.due}</span></article>; })}</div></Surface><Surface><SectionHeading eyebrow="Negotiation intelligence" title="Highest-value opportunities" description="Rules combine benchmark variance, room nights, compliance and source confidence." /><div className="grid gap-3">{opportunities.map((item) => { const hotel = hotels.find((record) => record.id === item.hotelId)!; return <button key={item.id} className="row-card rounded-2xl p-4 text-left" onClick={() => onOpenHotel(hotel)}><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-white">{item.title}</strong><Badge tone={item.impact === "High" ? "red" : "amber"}>{item.impact}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-500">{hotel.airport} / {item.detail}</p><span className="mt-3 inline-flex text-[10px] font-black uppercase tracking-[.12em] text-slate-600">Lever: {item.lever}</span></div><strong className="font-display text-xl text-red-200">{item.value}</strong></div></button>; })}</div></Surface></div>
  </>;
}

function HotelIntelligence({ onOpenHotel }: { onOpenHotel: (hotel: SourcingHotel) => void }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All regions");
  const [risk, setRisk] = useState("All risk");
  const filtered = hotels.filter((hotel) => `${hotel.hotel} ${hotel.airport} ${hotel.city} ${hotel.owner}`.toLowerCase().includes(query.toLowerCase()) && (region === "All regions" || hotel.region === region) && (risk === "All risk" || hotel.risk === risk));
  const exportAction = (
    <Button variant="primary" onClick={() => exportHotels(filtered)}>
      <Download size={15} /> Export view
    </Button>
  );

  return (
    <>
      <PageHero
        eyebrow="Canonical hotel master"
        title="One hotel. Every sourcing signal."
        description="Search the normalized portfolio and open a complete record with commercial, operational, compliance and source-level evidence."
        actions={exportAction}
      />
      <Surface>
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-600" />
            <Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hotel, port, owner or city..." />
          </div>
          <Select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option>All regions</option>
            {Array.from(new Set(hotels.map((item) => item.region))).map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={risk} onChange={(event) => setRisk(event.target.value)}>
            <option>All risk</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[1120px]">
            <thead>
              <tr>{["Hotel", "Port / Region", "Owner", "Status", "Rate vs benchmark", "Room nights", "Compliance", "Sources", "Risk", ""].map((item) => <th key={item}>{item}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((hotel) => {
                const variance = ((hotel.currentRate - hotel.marketBenchmark) / hotel.marketBenchmark) * 100;
                return (
                  <tr key={hotel.id}>
                    <td><button className="text-left" onClick={() => onOpenHotel(hotel)}><strong>{hotel.hotel}</strong><span>{hotel.id} / {hotel.city}</span></button></td>
                    <td><strong>{hotel.airport}</strong><span>{hotel.region}</span></td>
                    <td><span className="text-slate-300">{hotel.owner}</span></td>
                    <td><Badge tone={statusTone(hotel.status)}>{hotel.status}</Badge></td>
                    <td><strong>{formatMoney(hotel.currentRate)}</strong><span className={variance > 0 ? "text-red-300!" : "text-emerald-300!"}>{variance > 0 ? "+" : ""}{variance.toFixed(1)}%</span></td>
                    <td><strong>{formatNumber(hotel.roomNights)}</strong><span>annual</span></td>
                    <td><strong>{hotel.compliance}%</strong><Progress value={hotel.compliance} color={hotel.compliance >= 90 ? "green" : hotel.compliance >= 75 ? "amber" : "red"} /></td>
                    <td><SourceDots hotel={hotel} /></td>
                    <td><Badge tone={riskTone(hotel.risk)}>{hotel.risk}</Badge></td>
                    <td><IconButton label={`Open ${hotel.hotel}`} onClick={() => onOpenHotel(hotel)}><ChevronRight size={16} /></IconButton></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <div className="py-16 text-center"><Search className="mx-auto text-slate-700" /><strong className="mt-4 block text-white">No hotels match this view</strong><p className="mt-2 text-sm text-slate-500">Clear one or more filters to restore the portfolio.</p></div> : null}
      </Surface>
    </>
  );
}

function PipelineWorkspace({ onOpenHotel }: { onOpenHotel: (hotel: SourcingHotel) => void }) {
  return <><PageHero eyebrow="RFP pipeline" title="Move every hotel with control." description="A sourcing-first pipeline with clear deadlines, owner accountability, compliance gates and formal outcomes." actions={<Button variant="primary"><Zap size={15} /> Create sourcing wave</Button>} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{pipelineData.map((item, index) => <MetricCard key={item.stage} label={item.stage} value={String(item.value)} detail={index === 0 ? "Hotels invited" : `${Math.round((item.value / pipelineData[index - 1].value) * 100)}% stage conversion`} change={index === 4 ? "22% awarded" : undefined} tone={index === 4 ? "green" : "neutral"} />)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[.75fr_1.25fr]"><Surface><SectionHeading eyebrow="Cycle conversion" title="2026-2027 sourcing wave" description="Formal pipeline stages with no hidden email-only state." /><PipelineChart /></Surface><Surface><SectionHeading eyebrow="Active records" title="Deadline and gate control" description="Blocking terms stop an agreement before approval." /><div className="grid gap-2">{hotels.filter((item) => item.status !== "Approved").slice(0, 7).map((hotel) => { const blockers = [!hotel.lra && "LRA", hotel.commission < 10 && "Commission", !hotel.breakfast && "Breakfast", !hotel.staticRate && "Static rate", !hotel.vcc && "VCC"].filter(Boolean); return <button key={hotel.id} onClick={() => onOpenHotel(hotel)} className="row-card grid gap-3 rounded-2xl p-4 text-left md:grid-cols-[1.2fr_.65fr_.55fr_1fr_auto] md:items-center"><div><strong className="text-sm text-white">{hotel.hotel}</strong><p className="mt-1 text-xs text-slate-500">{hotel.airport} / {hotel.owner}</p></div><Badge tone={statusTone(hotel.status)}>{hotel.status}</Badge><span className="text-xs font-bold text-slate-300">Due {hotel.deadline}</span><div className="flex flex-wrap gap-1">{blockers.length ? blockers.map((item) => <Badge key={String(item)} tone="red">{String(item)}</Badge>) : <Badge tone="green">No blockers</Badge>}</div><ChevronRight size={16} className="text-slate-600" /></button>; })}</div></Surface></div></>;
}

function NegotiationWorkspace({ onOpenHotel }: { onOpenHotel: (hotel: SourcingHotel) => void }) {
  const [hotelId, setHotelId] = useState("HTL-EZE-014");
  const hotel = hotels.find((item) => item.id === hotelId) ?? hotels[0];
  const lines = [
    { field: "Room rate", original: formatMoney(hotel.cventRate), requested: formatMoney(hotel.marketBenchmark), response: formatMoney(hotel.currentRate), result: hotel.currentRate <= hotel.marketBenchmark ? "Accepted" : "Counter" },
    { field: "Commission", original: `${hotel.commission}%`, requested: "10% minimum", response: `${hotel.commission}%`, result: hotel.commission >= 10 ? "Accepted" : "Blocking" },
    { field: "Breakfast", original: hotel.breakfast ? "Included" : "Excluded", requested: "Included", response: hotel.breakfast ? "Included" : "Excluded", result: hotel.breakfast ? "Accepted" : "Blocking" },
    { field: "Last room availability", original: hotel.lra ? "Accepted" : "Rejected", requested: "Required", response: hotel.lra ? "Accepted" : "Rejected", result: hotel.lra ? "Accepted" : "Blocking" },
    { field: "Payment", original: hotel.vcc ? "VCC" : "Direct billing", requested: "VCC + direct billing", response: hotel.vcc ? "VCC accepted" : "VCC declined", result: hotel.vcc ? "Accepted" : "Blocking" },
  ];
  return <><PageHero eyebrow="Structured negotiations" title="Negotiate the term, not the email thread." description="Every round preserves original, requested and hotel response values with policy gates and evidence-based recommendations." actions={<><Select value={hotelId} onChange={(event) => setHotelId(event.target.value)} className="min-w-64 rounded-full">{hotels.filter((item) => item.status === "Negotiation" || item.status === "Review").map((item) => <option key={item.id} value={item.id}>{item.airport} / {item.hotel}</option>)}</Select><Button variant="primary"><Sparkles size={15} /> Build next counter</Button></>} /><div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]"><Surface><SectionHeading eyebrow="Round trajectory" title={`${hotel.airport} / ${hotel.hotel}`} description="Rate movement against the benchmark across five decision points." /><NegotiationChart /></Surface><Surface className="red-grid"><SectionHeading eyebrow="Talia recommendation" title="Hold the compliance line" description="The recommendation is generated from policy, source confidence, market benchmark and historic production." /><div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Target rate" value={formatMoney(hotel.marketBenchmark)} detail="Market-aligned ceiling" /><MetricCard label="Annual volume" value={formatNumber(hotel.roomNights)} detail="StormX room nights" /><MetricCard label="Leverage score" value={`${hotel.commercialScore}/100`} detail="Commercial strength" /></div><Notice tone={hotel.risk === "Critical" || hotel.risk === "High" ? "danger" : "warning"} title={hotel.nextAction}>Use a two-year commitment and historic production as the trade. Do not concede on LRA, 10% commission, breakfast, static rates or VCC.</Notice><Button className="mt-4 w-full" onClick={() => onOpenHotel(hotel)}>Open full hotel evidence <ArrowRight size={15} /></Button></Surface></div><Surface className="mt-5"><SectionHeading eyebrow="Round comparison" title="Original / TA request / hotel response" description="Structured terms make commercial movement and unresolved policy gaps immediately visible." /><div className="overflow-x-auto"><table className="data-table min-w-[860px]"><thead><tr>{["Negotiated field", "Original", "TA requested", "Hotel response", "Outcome"].map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{lines.map((line) => <tr key={line.field}><td><strong>{line.field}</strong></td><td><span className="text-slate-400">{line.original}</span></td><td><strong>{line.requested}</strong></td><td><span className="text-slate-200">{line.response}</span></td><td><Badge tone={line.result === "Accepted" ? "green" : line.result === "Blocking" ? "red" : "amber"}>{line.result}</Badge></td></tr>)}</tbody></table></div></Surface></>;
}

function CrossSourceExplorer({ onOpenHotel, runtimeRecords }: { onOpenHotel: (hotel: SourcingHotel) => void; runtimeRecords: NormalizedSourceRecord[] }) {
  const [query, setQuery] = useState("");
  const [match, setMatch] = useState("All matches");
  const rows = hotels.filter((hotel) => `${hotel.hotel} ${hotel.airport} ${hotel.id}`.toLowerCase().includes(query.toLowerCase()) && (match === "All matches" || hotel.matchStatus === match));
  return <><PageHero eyebrow="Cross-source explorer" title="Make every discrepancy explainable." description="Compare canonical SharePoint terms with Cvent proposal values and StormX production without losing field-level provenance." actions={<Button variant="primary" onClick={() => exportHotels(rows)}><Download size={15} /> Export reconciled view</Button>} /><div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]"><Surface><SectionHeading eyebrow="Match coverage" title="Canonical identity quality" description="Property ID, IATA port and normalized hotel name drive matching." /><SourceCoverageChart /><div className="grid grid-cols-3 gap-2">{[["Matched", 7, "green"], ["Review", 2, "amber"], ["Unmatched", 1, "red"]].map(([label, value, tone]) => <div key={String(label)} className="row-card rounded-xl p-3 text-center"><strong className="font-display text-2xl text-white">{String(value)}</strong><p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${tone === "green" ? "text-emerald-300" : tone === "amber" ? "text-amber-200" : "text-red-200"}`}>{String(label)}</p></div>)}</div></Surface><Surface><SectionHeading eyebrow="Rate variance" title="Proposed vs benchmark vs realized ADR" description="A red bar above benchmark highlights a renegotiation candidate; StormX ADR adds operational context." /><RateComparisonChart /></Surface></div><Surface className="mt-5"><div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]"><div className="relative"><Search size={16} className="absolute left-3.5 top-3.5 text-slate-600" /><Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search property ID, hotel or IATA..." /></div><Select value={match} onChange={(event) => setMatch(event.target.value)}><option>All matches</option><option>Matched</option><option>Review</option><option>Unmatched</option></Select></div><div className="overflow-x-auto"><table className="data-table min-w-[1220px]"><thead><tr>{["Canonical property", "Source identity", "SharePoint rate", "Cvent rate", "StormX ADR", "Benchmark", "Variance", "Confidence", "Updated", ""].map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.map((hotel) => { const variance = ((hotel.currentRate - hotel.marketBenchmark) / hotel.marketBenchmark) * 100; return <tr key={hotel.id}><td><button className="text-left" onClick={() => onOpenHotel(hotel)}><strong>{hotel.hotel}</strong><span>{hotel.id} / {hotel.airport}</span></button></td><td><SourceDots hotel={hotel} /></td><td><strong>{formatMoney(hotel.currentRate)}</strong><span>Contract master</span></td><td><strong>{formatMoney(hotel.cventRate)}</strong><span>Hotel proposal</span></td><td><strong>{hotel.stormXAdr ? formatMoney(hotel.stormXAdr) : "Missing"}</strong><span>Realized ADR</span></td><td><strong>{formatMoney(hotel.marketBenchmark)}</strong><span>Market model</span></td><td><Badge tone={variance > 8 ? "red" : variance > 0 ? "amber" : "green"}>{variance > 0 ? "+" : ""}{variance.toFixed(1)}%</Badge></td><td><strong>{hotel.matchConfidence}%</strong><span>{hotel.matchStatus}</span></td><td><span className="text-slate-400">{new Date(hotel.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></td><td><IconButton label={`Open ${hotel.hotel}`} onClick={() => onOpenHotel(hotel)}><ChevronRight size={16} /></IconButton></td></tr>; })}</tbody></table></div></Surface>{runtimeRecords.length ? <RuntimeRecordsPanel records={runtimeRecords} /> : <div className="mt-5"><Notice tone="warning" title="No authenticated runtime rows yet">The visual portfolio above is synthetic. Connect Microsoft 365 or parse a Cvent or StormX CSV in Data Sources to add private, session-only records here.</Notice></div>}</>;
}

function RuntimeRecordsPanel({ records }: { records: NormalizedSourceRecord[] }) {
  const [query, setQuery] = useState("");
  const reconciled = reconcileRuntimeRecords(records);
  const filtered = reconciled.filter((hotel) => `${hotel.hotelName} ${hotel.legalName} ${hotel.airport} ${hotel.city} ${hotel.country}`.toLowerCase().includes(query.toLowerCase()));
  const threeSourceMatches = reconciled.filter((hotel) => hotel.sources.length === 3).length;
  const urgentRisks = reconciled.filter((hotel) => hotel.risk === "Critical" || hotel.risk === "High").length;
  const discrepancies = reconciled.filter((hotel) => hotel.discrepancyCount > 0).length;

  return <div className="mt-5 grid gap-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Canonical hotels" value={formatNumber(reconciled.length)} detail={`${formatNumber(records.length)} normalized source rows`} tone="blue" />
      <MetricCard label="Three-source matches" value={formatNumber(threeSourceMatches)} detail="SharePoint + Cvent + StormX evidence" tone="green" />
      <MetricCard label="Urgent policy risks" value={formatNumber(urgentRisks)} detail="Critical or high sourcing intervention" tone={urgentRisks ? "red" : "green"} />
      <MetricCard label="Source discrepancies" value={formatNumber(discrepancies)} detail="Rates, terms or status require review" tone={discrepancies ? "amber" : "green"} />
    </div>
    <div className="grid gap-5 xl:grid-cols-3">
      <Surface><SectionHeading eyebrow="Runtime coverage" title="Rows by source" description="The active session only; no private rows are persisted." /><RuntimeSourceChart records={records} /></Surface>
      <Surface><SectionHeading eyebrow="Policy evidence" title="Compliance and missing terms" description="10% commission, breakfast, LRA and VCC evidence." /><RuntimePolicyChart hotels={reconciled} /></Surface>
      <Surface><SectionHeading eyebrow="Commercial comparison" title="Rates by canonical hotel" description="Side-by-side source rates expose negotiation gaps." /><RuntimeRateChart hotels={reconciled} /></Surface>
    </div>
    <Surface>
      <SectionHeading eyebrow="Authenticated and local runtime layer" title="Reconciled sourcing decision records" description="Deterministic matching combines property ID, IATA and normalized hotel identity. Every result retains source-row provenance." action={<Badge tone="green">{filtered.length} canonical hotels</Badge>} />
      <div className="mb-4 relative"><Search size={16} className="absolute left-3.5 top-3.5 text-slate-600" /><Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search live hotel, market or IATA..." /></div>
      <div className="overflow-x-auto"><table className="data-table min-w-[1320px]"><thead><tr>{["Canonical hotel", "Sources", "Rate evidence", "Production", "Policy score", "Required terms", "Discrepancies", "Status / owner", "Trace"].map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{filtered.slice(0, 100).map((hotel) => <tr key={hotel.key}>
        <td><strong>{hotel.hotelName}</strong><span>{hotel.airport || "Missing IATA"} / {[hotel.city, hotel.country].filter(Boolean).join(", ") || hotel.region || "Unmapped market"}</span></td>
        <td><div className="flex flex-wrap gap-1">{hotel.sources.map((source) => <Badge key={source} tone={source === "SharePoint" ? "red" : source === "Cvent" ? "amber" : "blue"}>{source}</Badge>)}</div></td>
        <td><strong>{hotel.currency} {hotel.rates.SharePoint?.toFixed(2) ?? "--"} / {hotel.rates.Cvent?.toFixed(2) ?? "--"} / {hotel.rates.StormX?.toFixed(2) ?? "--"}</strong><span>SharePoint / Cvent / StormX</span></td>
        <td><strong>{hotel.roomNights === null ? "Missing" : formatNumber(hotel.roomNights)}</strong><span>StormX-first room-night authority</span></td>
        <td><strong>{hotel.complianceScore}% compliance</strong><span>{hotel.completenessScore}% term completeness</span></td>
        <td><strong>{hotel.commission === null ? "Commission ?" : `${hotel.commission}% commission`}</strong><span>{[`Breakfast ${hotel.breakfast === null ? "?" : hotel.breakfast ? "Y" : "N"}`, `LRA ${hotel.lra === null ? "?" : hotel.lra ? "Y" : "N"}`, `VCC ${hotel.vcc === null ? "?" : hotel.vcc ? "Y" : "N"}`].join(" / ")}</span></td>
        <td><Badge tone={hotel.discrepancyCount ? "amber" : "green"}>{hotel.discrepancyCount} conflicts</Badge><span>{hotel.matchConfidence}% identity confidence</span></td>
        <td><Badge tone={riskTone(hotel.risk)}>{hotel.risk} risk</Badge><span>{hotel.status} / {hotel.owner}</span></td>
        <td><strong>{hotel.sources.flatMap((source) => hotel.sourceRows[source]?.map((row) => `${source} ${row}`) ?? []).join(" / ")}</strong><span>Source row provenance</span></td>
      </tr>)}</tbody></table></div>
      {filtered.length > 100 ? <p className="mt-3 text-xs text-slate-500">Showing the first 100 matching canonical hotels.</p> : null}
    </Surface>
  </div>;
}

function ReportsWorkspace() {
  return <><PageHero eyebrow="Portfolio analytics" title="Measure savings, compliance and sourcing leverage." description="Executive-ready reporting connects sourcing activity with proposal quality, policy outcomes and operational production." actions={<Button variant="primary" onClick={() => window.print()}><Download size={15} /> Print report</Button>} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Negotiated savings" value="$1.26M" detail="Annualized portfolio impact" change="+18.4%" tone="green" /><MetricCard label="Average rate movement" value="-8.9%" detail="Original to latest response" change="2.1 pts" tone="green" /><MetricCard label="Awarded compliance" value="97%" detail="No blocking policy exceptions" change="+5 pts" tone="green" /><MetricCard label="Median cycle" value="18 days" detail="Invitation to award" change="-4 days" tone="blue" /></div><div className="mt-5 grid gap-5 xl:grid-cols-2"><Surface><SectionHeading eyebrow="Commercial leverage" title="Rate variance vs room-night production" description="High-volume hotels above benchmark belong in the top-right negotiation queue." /><LeverageScatterChart /></Surface><Surface><SectionHeading eyebrow="Regional health" title="Compliance by sourcing region" description="Policy adherence across the active hotel portfolio." /><RegionalChart /></Surface><Surface><SectionHeading eyebrow="Market view" title="Rate comparison by priority port" description="Proposed, benchmark and realized ADR values provide a common commercial baseline." /><RateComparisonChart /></Surface><Surface><SectionHeading eyebrow="Source reliability" title="Cross-source record coverage" description="Visibility into how many canonical hotels have all required source evidence." /><SourceCoverageChart /></Surface></div></>;
}

function SourcesAdmin({ role, links, setLinks, snapshot, setSnapshot, importedRecords, setImportedRecords, setNotice }: { role: UserRole; links: SourceLinks; setLinks: (links: SourceLinks) => void; snapshot: Microsoft365Snapshot | null; setSnapshot: (snapshot: Microsoft365Snapshot | null) => void; importedRecords: Record<SourceName, NormalizedSourceRecord[]>; setImportedRecords: (records: Record<SourceName, NormalizedSourceRecord[]>) => void; setNotice: (message: string) => void }) {
  const [draft, setDraft] = useState(links);
  const [uploads, setUploads] = useState<Record<string, { rows: number; columns: number; mapped: number; file: string }>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [importSource, setImportSource] = useState<SourceName>("Cvent");
  const isAdmin = role === "Platform Admin";

  useEffect(() => setDraft(links), [links]);

  function saveLinks() {
    if (!isAdmin) return;
    const invalid = Object.values(draft).find((value) => value && !value.startsWith("https://"));
    if (invalid) { setNotice("Source links must use HTTPS before they can be saved."); return; }
    setLinks(draft);
    window.localStorage.setItem("talia-source-links", JSON.stringify(draft));
    setNotice("Admin links saved locally in this browser. No URL or credential was published.");
  }

  function chooseImport(source: SourceName) {
    if (!isAdmin) return;
    setImportSource(source);
    fileRef.current?.click();
  }

  function parseCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const matrix = parseCsvMatrix(text);
      const normalized = normalizeMatrix(importSource, matrix);
      const columns = Math.max(0, ...matrix.map((row) => row.length));
      const summary = { rows: Math.max(0, matrix.length - 1), columns, mapped: normalized.length, file: file.name };
      setUploads((current) => ({ ...current, [importSource]: summary }));
      setImportedRecords({ ...importedRecords, [importSource]: normalized });
      setNotice(`${importSource} CSV parsed locally: ${summary.rows} rows, ${summary.columns} columns and ${summary.mapped} normalized hotel records. No file was uploaded or persisted.`);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function loadSafePreview() {
    if (!isAdmin) return;
    const next = {
      SharePoint: runtimeDemoRecords.filter((record) => record.source === "SharePoint"),
      Cvent: runtimeDemoRecords.filter((record) => record.source === "Cvent"),
      StormX: runtimeDemoRecords.filter((record) => record.source === "StormX"),
    };
    setImportedRecords(next);
    setUploads(Object.fromEntries(Object.entries(next).map(([source, rows]) => [source, { rows: rows.length, columns: 16, mapped: rows.length, file: "Safe synthetic session preview" }])));
    setNotice("Safe synthetic source rows loaded in runtime memory. Open Cross-Source Explorer to review reconciliation, policy risks and live charts.");
  }

  function clearLocalRuntime() {
    if (!isAdmin) return;
    setImportedRecords({ SharePoint: [], Cvent: [], StormX: [] });
    setUploads({});
    setNotice("Local CSV and synthetic preview rows cleared. Authenticated SharePoint data, if connected, remains in the current session.");
  }

  return <><PageHero eyebrow="Data sources and administration" title="Connect safely. Govern visibly." description="Authenticated SharePoint discovery, controlled workbook ranges and local Cvent or StormX snapshots create a traceable sourcing view without publishing private tenant data." />
    {!isAdmin ? <div className="mb-5"><Notice tone="warning" title="Sourcing Manager view is read only">You can connect with an approved saved configuration and consume runtime records. Platform Admin controls identifiers, links and local source imports.</Notice></div> : <div className="mb-5"><Notice tone="safe" title="Platform Admin controls">Configuration is local to this browser. Microsoft tokens use session storage; workbook rows remain in memory and are cleared when the page closes.</Notice></div>}
    <Microsoft365Connector role={role} snapshot={snapshot} onSnapshot={setSnapshot} onNotice={setNotice} />
    <Surface className="mt-5"><SectionHeading eyebrow="Safe public preview" title="Exercise the reconciliation engine" description="Load clearly synthetic SharePoint, Cvent and StormX rows into this session to demonstrate canonical matching, source conflicts, policy scoring and runtime graphs." action={<Badge tone="blue">No tenant data</Badge>} /><div className="flex flex-wrap gap-2"><Button variant="primary" disabled={!isAdmin} onClick={loadSafePreview}><Sparkles size={15} /> Load synthetic source preview</Button><Button disabled={!isAdmin || Object.values(importedRecords).every((records) => records.length === 0)} onClick={clearLocalRuntime}><X size={15} /> Clear local runtime</Button></div></Surface>
    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={parseCsv} />
    <div className="mt-5 grid gap-5 xl:grid-cols-3">{sourceHealth.map((source) => { const key = source.name === "SharePoint" ? "sharePoint" : source.name === "StormX" ? "stormX" : "cvent"; const upload = uploads[source.name]; const runtimeCount = importedRecords[source.name].length + (source.name === "SharePoint" ? snapshot?.records.length ?? 0 : 0); const live = source.name === "SharePoint" && Boolean(snapshot); return <Surface key={source.name} className="relative overflow-hidden"><span className="absolute inset-x-0 top-0 h-1" style={{ background: source.color }} /><div className="flex items-start justify-between gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-white/[.05] text-slate-300">{source.name === "SharePoint" ? <Database size={21} /> : source.name === "Cvent" ? <FileSpreadsheet size={21} /> : <Activity size={21} />}</span><Badge tone={live || runtimeCount ? "green" : "blue"}>{live ? "Live authenticated" : runtimeCount ? "Local runtime" : "Demo sample"}</Badge></div><h2 className="font-display mt-5 text-xl font-semibold tracking-[-.04em] text-white">{source.name}</h2><p className="mt-2 min-h-14 text-xs leading-5 text-slate-500">{source.purpose}</p><div className="mt-5 grid grid-cols-2 gap-2"><div className="row-card rounded-xl p-3"><span className="text-[9px] uppercase tracking-wider text-slate-600">Access</span><strong className="mt-1 block text-xs text-white">Read only</strong></div><div className="row-card rounded-xl p-3"><span className="text-[9px] uppercase tracking-wider text-slate-600">Runtime rows</span><strong className="mt-1 block text-xs text-white">{formatNumber(runtimeCount)}</strong></div></div>{upload ? <div className="mt-3 rounded-xl border border-sky-300/15 bg-sky-300/[.06] p-3 text-[10px] leading-5 text-sky-100">{upload.file}<br />{upload.rows} rows / {upload.columns} columns / {upload.mapped} mapped</div> : <p className="mt-3 text-[10px] leading-5 text-slate-600">{live ? `Live refresh ${new Date(snapshot!.refreshedAt).toLocaleString("en-US")}` : "Synthetic portfolio visuals remain clearly separated from runtime source rows."}</p>}<div className="mt-4 flex gap-2"><Button className="flex-1" disabled={!isAdmin} onClick={() => chooseImport(source.name)}><Upload size={14} /> Parse local CSV</Button>{draft[key] ? <IconButton label={`Open ${source.name}`} onClick={() => window.open(draft[key], "_blank", "noopener,noreferrer")}><ExternalLink size={15} /></IconButton> : null}</div></Surface>; })}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.85fr]"><Surface><SectionHeading eyebrow="Admin links" title="Platform and source destinations" description="Configure approved HTTPS links without embedding credentials or tenant content in the public repository." /><div className="grid gap-4 sm:grid-cols-2"><Field label="SharePoint sourcing site" hint="Opens the source in a separate authenticated browser tab."><Input disabled={!isAdmin} value={draft.sharePoint} onChange={(event) => setDraft({ ...draft, sharePoint: event.target.value })} placeholder="https://tenant.sharepoint.com/sites/..." /></Field><Field label="Cvent workspace"><Input disabled={!isAdmin} value={draft.cvent} onChange={(event) => setDraft({ ...draft, cvent: event.target.value })} placeholder="https://..." /></Field><Field label="StormX / HMT workspace"><Input disabled={!isAdmin} value={draft.stormX} onChange={(event) => setDraft({ ...draft, stormX: event.target.value })} placeholder="https://..." /></Field><Field label="Primary platform link" hint="Displayed in the workspace header for all sourcing users."><Input disabled={!isAdmin} value={draft.support} onChange={(event) => setDraft({ ...draft, support: event.target.value })} placeholder="https://..." /></Field></div><div className="mt-5 flex justify-end"><Button variant="primary" disabled={!isAdmin} onClick={saveLinks}><Check size={15} /> Save local configuration</Button></div></Surface><Surface><SectionHeading eyebrow="Canonical matching" title="Source reconciliation rules" description="Transparent rules prevent silent duplicates and preserve field ownership." /><div className="grid gap-3">{[["1", "Property ID exact match", "StormX property ID or governed hotel ID", "Authoritative"], ["2", "IATA + normalized legal name", "Port plus punctuation-free legal entity", "High confidence"], ["3", "IATA + address proximity", "Port plus geospatial and name similarity", "Manual review"], ["4", "No reliable key", "Keep record unmatched and open a data-quality task", "Blocked"]].map(([order, title, detail, result]) => <article key={order} className="row-card flex gap-4 rounded-2xl p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[.05] text-xs font-black text-red-200">{order}</span><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-white">{title}</strong><Badge tone={result === "Blocked" ? "red" : result === "Manual review" ? "amber" : "green"}>{result}</Badge></div><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div></article>)}</div></Surface></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-3"><Surface><SectionHeading eyebrow="Security" title="Public-safe architecture" /><Control icon={ShieldCheck} title="No client-side secrets" detail="The SPA uses PKCE. Passwords and application secrets are never requested or embedded." /><Control icon={Database} title="Read-only source scope" detail="Delegated Graph permissions retrieve approved data but cannot modify SharePoint." /><Control icon={Users} title="Role separation" detail="Platform Admin configures sources; Sourcing Managers consume governed intelligence." /></Surface><Surface><SectionHeading eyebrow="Data ownership" title="Field authority" /><Control icon={Database} title="SharePoint" detail="Contract status, owner, evidence and governed documents." /><Control icon={FileSpreadsheet} title="Cvent" detail="Original hotel response, proposal terms and RFP lifecycle." /><Control icon={Activity} title="StormX" detail="Operational production, room nights and realized ADR." /></Surface><Surface><SectionHeading eyebrow="Runtime pipeline" title="Secure refresh design" /><Control icon={CloudDownload} title="Authenticated extractor" detail="The signed-in user reads only tenant resources they are authorized to access." /><Control icon={GitCompareArrows} title="Normalization service" detail="Canonical aliases map source columns and preserve source row provenance." /><Control icon={Gauge} title="In-memory analytics" detail="Private rows power the session and disappear when the browser session closes." /></Surface></div>
  </>;
}

function Control({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return <div className="mb-3 flex gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4 last:mb-0"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[.05] text-slate-400"><Icon size={16} /></span><div><strong className="text-xs text-white">{title}</strong><p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p></div></div>;
}

function SourceDots({ hotel }: { hotel: SourcingHotel }) {
  return <div className="flex items-center gap-1.5" title="SharePoint / Cvent / StormX"><span className={cn("grid size-7 place-items-center rounded-lg border text-[8px] font-black", hotel.source.sharePoint ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-white/[.06] text-slate-700")}>SP</span><span className={cn("grid size-7 place-items-center rounded-lg border text-[8px] font-black", hotel.source.cvent ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-white/[.06] text-slate-700")}>CV</span><span className={cn("grid size-7 place-items-center rounded-lg border text-[8px] font-black", hotel.source.stormX ? "border-sky-300/20 bg-sky-300/10 text-sky-100" : "border-white/[.06] text-slate-700")}>SX</span></div>;
}

function HotelDetail({ hotel, onClose }: { hotel: SourcingHotel | null; onClose: () => void }) {
  if (!hotel) return null;
  const variance = ((hotel.currentRate - hotel.marketBenchmark) / hotel.marketBenchmark) * 100;
  const rules = [["2-year term", true], ["Static rates", hotel.staticRate], ["LRA required", hotel.lra], ["10% commission", hotel.commission >= 10], ["Breakfast included", hotel.breakfast], ["VCC accepted", hotel.vcc]] as Array<[string, boolean]>;
  return <Modal open={Boolean(hotel)} onClose={onClose} wide title={hotel.hotel} description={`${hotel.id} / ${hotel.airport} / ${hotel.city}, ${hotel.country}`}><div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><div className="grid gap-4"><div className="grid gap-3 sm:grid-cols-4"><MetricCard label="Current rate" value={formatMoney(hotel.currentRate)} detail={`${variance > 0 ? "+" : ""}${variance.toFixed(1)}% vs benchmark`} /><MetricCard label="Room nights" value={formatNumber(hotel.roomNights)} detail="StormX annual production" /><MetricCard label="Compliance" value={`${hotel.compliance}%`} detail="Policy score" /><MetricCard label="Match" value={`${hotel.matchConfidence}%`} detail={hotel.matchStatus} /></div><Surface><SectionHeading eyebrow="Commercial evidence" title="Source-level rate view" /><div className="grid gap-3 sm:grid-cols-4">{[["SharePoint", hotel.currentRate, "Governed current"], ["Cvent", hotel.cventRate, "Original proposal"], ["StormX", hotel.stormXAdr, "Realized ADR"], ["Benchmark", hotel.marketBenchmark, "Target ceiling"]].map(([label, value, detail]) => <div key={String(label)} className="row-card rounded-xl p-4"><span className="text-[9px] font-black uppercase tracking-wider text-slate-600">{String(label)}</span><strong className="font-display mt-2 block text-2xl text-white">{Number(value) ? formatMoney(Number(value)) : "Missing"}</strong><p className="mt-1 text-[10px] text-slate-500">{String(detail)}</p></div>)}</div></Surface><Surface><SectionHeading eyebrow="Next best action" title={hotel.nextAction} description="Talia combines policy rules, benchmark variance, volume and source confidence." /><div className="flex flex-wrap gap-2"><Badge tone={riskTone(hotel.risk)}>{hotel.risk} risk</Badge><Badge tone={statusTone(hotel.status)}>{hotel.status}</Badge><Badge tone="blue">Owner: {hotel.owner}</Badge><Badge>Due {hotel.deadline}</Badge></div></Surface></div><div className="grid gap-4"><Surface><SectionHeading eyebrow="Policy gate" title="Required DPAX terms" /><div className="grid gap-2">{rules.map(([label, passed]) => <div key={label} className="row-card flex items-center justify-between rounded-xl p-3"><span className="text-xs font-bold text-slate-300">{label}</span><span className={cn("grid size-7 place-items-center rounded-full", passed ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200")}>{passed ? <Check size={14} /> : <X size={14} />}</span></div>)}</div></Surface><Surface><SectionHeading eyebrow="Data quality" title="Canonical record health" /><div className="grid gap-4">{[["Completeness", hotel.completeness], ["Identity confidence", hotel.matchConfidence], ["Commercial score", hotel.commercialScore], ["Operational score", hotel.operationalScore]].map(([label, value]) => <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="text-slate-400">{String(label)}</span><strong className="text-white">{Number(value)}%</strong></div><Progress value={Number(value)} color={Number(value) >= 90 ? "green" : Number(value) >= 75 ? "amber" : "red"} /></div>)}</div><div className="mt-5 flex items-center justify-between"><SourceDots hotel={hotel} /><span className="text-[10px] text-slate-600">Updated {new Date(hotel.lastUpdated).toLocaleString("en-US")}</span></div></Surface></div></div></Modal>;
}

function exportHotels(rows: SourcingHotel[]) {
  const headers = ["Hotel ID", "Hotel", "Airport", "Region", "Owner", "Status", "Current Rate", "Cvent Rate", "StormX ADR", "Benchmark", "Room Nights", "Compliance", "Match Confidence", "Risk"];
  const body = rows.map((hotel) => [hotel.id, hotel.hotel, hotel.airport, hotel.region, hotel.owner, hotel.status, hotel.currentRate, hotel.cventRate, hotel.stormXAdr, hotel.marketBenchmark, hotel.roomNights, hotel.compliance, hotel.matchConfidence, hotel.risk]);
  const csv = [headers, ...body].map((row) => row.map(csvEscape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "talia-sourcing-view.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

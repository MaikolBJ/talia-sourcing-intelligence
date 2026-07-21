"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { hotels, negotiationRounds, pipelineData, productionTrend, regionalPerformance } from "@/data/sourcing-data";
import type { NormalizedSourceRecord, ReconciledRuntimeHotel, SourceName } from "@/types/sourcing";

const tooltipStyle = { background: "#111821", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, color: "#f8fafc", fontSize: 12 };
const axis = { fill: "#64748b", fontSize: 10 };

export function ProductionChart() {
  return <div className="h-[285px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={productionTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="roomNights" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ef2b32" stopOpacity={0.45} /><stop offset="1" stopColor="#ef2b32" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} /><XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="roomNights" name="Room nights" stroke="#ff4d54" strokeWidth={2.5} fill="url(#roomNights)" /></AreaChart></ResponsiveContainer></div>;
}

export function PipelineChart() {
  return <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={pipelineData} layout="vertical" margin={{ top: 0, right: 15, left: 6, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,.05)" horizontal={false} /><XAxis type="number" tick={axis} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="stage" tick={axis} axisLine={false} tickLine={false} width={72} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,.035)" }} /><Bar dataKey="value" name="Hotels" radius={[0, 8, 8, 0]}>{pipelineData.map((item) => <Cell key={item.stage} fill={item.fill} />)}</Bar></BarChart></ResponsiveContainer></div>;
}

export function RateComparisonChart() {
  const rows = hotels.slice(0, 7).map((hotel) => ({ port: hotel.airport, proposed: hotel.currentRate, benchmark: hotel.marketBenchmark, realized: hotel.stormXAdr || null }));
  return <div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{ top: 12, right: 5, left: -18, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="port" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} domain={[70, "auto"]} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} /><Bar dataKey="benchmark" name="Benchmark" fill="#475569" radius={[6, 6, 0, 0]} /><Bar dataKey="proposed" name="Proposed" fill="#ef2b32" radius={[6, 6, 0, 0]} /><Bar dataKey="realized" name="StormX ADR" fill="#38bdf8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

export function RegionalChart() {
  return <div className="h-[290px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={regionalPerformance} margin={{ top: 10, right: 6, left: -18, bottom: 26 }}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="region" tick={axis} axisLine={false} tickLine={false} angle={-18} textAnchor="end" /><YAxis tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="compliance" name="Compliance %" fill="#22c55e" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

export function SourceCoverageChart() {
  const data = [
    { name: "All 3 sources", value: hotels.filter((item) => item.source.sharePoint && item.source.cvent && item.source.stormX).length, color: "#22c55e" },
    { name: "2 sources", value: hotels.filter((item) => [item.source.sharePoint, item.source.cvent, item.source.stormX].filter(Boolean).length === 2).length, color: "#f59e0b" },
    { name: "1 source", value: hotels.filter((item) => [item.source.sharePoint, item.source.cvent, item.source.stormX].filter(Boolean).length === 1).length, color: "#ef2b32" },
  ];
  return <div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4} stroke="none">{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} /></PieChart></ResponsiveContainer></div>;
}

export function NegotiationChart() {
  return <div className="h-[295px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={negotiationRounds} margin={{ top: 10, right: 12, left: -18, bottom: 14 }}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="round" tick={axis} axisLine={false} tickLine={false} angle={-12} textAnchor="end" /><YAxis tick={axis} axisLine={false} tickLine={false} domain={[90, 135]} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} /><Line type="monotone" dataKey="rate" name="Rate" stroke="#ef2b32" strokeWidth={3} dot={{ r: 4, fill: "#ef2b32" }} /><Line type="monotone" dataKey="benchmark" name="Benchmark" stroke="#64748b" strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer></div>;
}

export function LeverageScatterChart() {
  const data = hotels.map((hotel) => ({ name: hotel.airport, variance: Number((((hotel.currentRate - hotel.marketBenchmark) / hotel.marketBenchmark) * 100).toFixed(1)), roomNights: hotel.roomNights, score: hotel.commercialScore }));
  return <div className="h-[310px] w-full"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 8, right: 18, left: -10, bottom: 10 }}><CartesianGrid stroke="rgba(255,255,255,.05)" /><XAxis type="number" dataKey="variance" name="Rate variance" unit="%" tick={axis} axisLine={false} /><YAxis type="number" dataKey="roomNights" name="Room nights" tick={axis} axisLine={false} /><ZAxis type="number" dataKey="score" range={[80, 420]} /><Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} /><Scatter name="Hotel leverage" data={data} fill="#ef2b32" /></ScatterChart></ResponsiveContainer></div>;
}

export function RuntimeSourceChart({ records }: { records: NormalizedSourceRecord[] }) {
  const colors: Record<SourceName, string> = { SharePoint: "#ef2b32", Cvent: "#f59e0b", StormX: "#38bdf8" };
  const data = (["SharePoint", "Cvent", "StormX"] as SourceName[]).map((source) => ({ source, records: records.filter((record) => record.source === source).length, color: colors[source] }));
  return <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="source" tick={axis} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,.035)" }} /><Bar dataKey="records" name="Runtime rows" radius={[7, 7, 0, 0]}>{data.map((item) => <Cell key={item.source} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div>;
}

export function RuntimePolicyChart({ hotels: runtimeHotels }: { hotels: ReconciledRuntimeHotel[] }) {
  const data = [
    { term: "Commission", compliant: runtimeHotels.filter((hotel) => hotel.commission !== null && hotel.commission >= 10).length, nonCompliant: runtimeHotels.filter((hotel) => hotel.commission !== null && hotel.commission < 10).length, missing: runtimeHotels.filter((hotel) => hotel.commission === null).length },
    { term: "Breakfast", compliant: runtimeHotels.filter((hotel) => hotel.breakfast === true).length, nonCompliant: runtimeHotels.filter((hotel) => hotel.breakfast === false).length, missing: runtimeHotels.filter((hotel) => hotel.breakfast === null).length },
    { term: "LRA", compliant: runtimeHotels.filter((hotel) => hotel.lra === true).length, nonCompliant: runtimeHotels.filter((hotel) => hotel.lra === false).length, missing: runtimeHotels.filter((hotel) => hotel.lra === null).length },
    { term: "VCC", compliant: runtimeHotels.filter((hotel) => hotel.vcc === true).length, nonCompliant: runtimeHotels.filter((hotel) => hotel.vcc === false).length, missing: runtimeHotels.filter((hotel) => hotel.vcc === null).length },
  ];
  return <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="term" tick={axis} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} /><Bar stackId="policy" dataKey="compliant" name="Compliant" fill="#22c55e" radius={[0, 0, 0, 0]} /><Bar stackId="policy" dataKey="missing" name="Missing" fill="#475569" /><Bar stackId="policy" dataKey="nonCompliant" name="Non-compliant" fill="#ef2b32" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

export function RuntimeRateChart({ hotels: runtimeHotels }: { hotels: ReconciledRuntimeHotel[] }) {
  const data = runtimeHotels.filter((hotel) => Object.keys(hotel.rates).length).slice(0, 9).map((hotel) => ({ hotel: `${hotel.airport || "--"} / ${hotel.hotelName.slice(0, 12)}`, SharePoint: hotel.rates.SharePoint, Cvent: hotel.rates.Cvent, StormX: hotel.rates.StormX }));
  return <div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 42 }}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="hotel" tick={axis} axisLine={false} tickLine={false} angle={-22} textAnchor="end" interval={0} /><YAxis tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} /><Bar dataKey="SharePoint" fill="#ef2b32" radius={[5, 5, 0, 0]} /><Bar dataKey="Cvent" fill="#f59e0b" radius={[5, 5, 0, 0]} /><Bar dataKey="StormX" fill="#38bdf8" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

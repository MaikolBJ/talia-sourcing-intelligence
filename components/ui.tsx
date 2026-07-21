import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { AlertTriangle, CheckCircle2, CircleX, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "red" | "green" | "amber" | "blue";

const tones: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/[.05] text-slate-300",
  red: "border-red-400/20 bg-red-400/10 text-red-100",
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  blue: "border-sky-300/20 bg-sky-300/10 text-sky-100",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.08em]", tones[tone], className)}>{children}</span>;
}

export function Button({ children, variant = "secondary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const variants = {
    primary: "border-red-400/20 bg-gradient-to-br from-[#ff454b] to-[#a90d15] text-white shadow-[0_15px_35px_rgba(239,43,50,.2)] hover:brightness-110",
    secondary: "border-white/10 bg-white/[.055] text-white hover:border-white/20 hover:bg-white/[.08]",
    ghost: "border-transparent bg-transparent text-slate-400 hover:bg-white/[.05] hover:text-white",
    danger: "border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/15",
  };
  return <button className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-extrabold transition disabled:pointer-events-none disabled:opacity-40", variants[variant], className)} {...props}>{children}</button>;
}

export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} title={label} className={cn("grid size-10 place-items-center rounded-full border border-white/10 bg-white/[.045] text-slate-300 transition hover:border-white/20 hover:text-white", className)} {...props}>{children}</button>;
}

export function Surface({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("glass-panel rounded-[26px] p-5 md:p-6", className)} {...props}>{children}</section>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-red-300">{children}</p>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div>{eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}<h2 className="font-display mt-2 text-xl font-semibold tracking-[-.045em] text-white md:text-2xl">{title}</h2>{description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}</div>{action ? <div className="shrink-0">{action}</div> : null}</div>;
}

export function MetricCard({ label, value, detail, change, tone = "neutral" }: { label: string; value: string; detail: string; change?: string; tone?: Tone }) {
  return <article className="metric-card rounded-[22px] p-4"><div className="flex items-start justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-500">{label}</p>{change ? <Badge tone={tone}>{change}</Badge> : null}</div><strong className="font-display mt-4 block text-3xl tracking-[-.06em] text-white">{value}</strong><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></article>;
}

export function Progress({ value, color = "red" }: { value: number; color?: "red" | "green" | "blue" | "amber" }) {
  const colors = { red: "from-red-600 to-red-300", green: "from-emerald-600 to-emerald-300", blue: "from-sky-600 to-sky-300", amber: "from-amber-600 to-amber-300" };
  return <div className="h-1.5 overflow-hidden rounded-full bg-white/[.07]"><div className={cn("h-full rounded-full bg-gradient-to-r", colors[color])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-400/50 focus:ring-2 focus:ring-red-500/10", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-11 w-full rounded-xl border border-white/10 bg-[#10151d] px-3.5 text-sm text-white outline-none focus:border-red-400/50", className)} {...props}>{children}</select>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="grid gap-2"><span className="text-xs font-bold text-slate-300">{label}</span>{children}{hint ? <span className="text-[11px] leading-5 text-slate-600">{hint}</span> : null}</label>;
}

export function Modal({ open, onClose, title, description, children, wide = false }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={cn("glass-panel animate-enter my-auto w-full rounded-[28px] p-5 md:p-6", wide ? "max-w-6xl" : "max-w-2xl")}><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold tracking-[-.05em] text-white">{title}</h2>{description ? <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p> : null}</div><IconButton label="Close" onClick={onClose}><X size={18} /></IconButton></div>{children}</div></div>;
}

export function Notice({ tone, title, children }: { tone: "safe" | "warning" | "danger"; title: string; children: ReactNode }) {
  const config = tone === "safe" ? { icon: CheckCircle2, classes: "border-emerald-400/20 bg-emerald-400/[.07] text-emerald-100" } : tone === "warning" ? { icon: AlertTriangle, classes: "border-amber-300/20 bg-amber-300/[.07] text-amber-100" } : { icon: CircleX, classes: "border-red-400/20 bg-red-400/[.07] text-red-100" };
  const Icon = config.icon;
  return <div className={cn("rounded-2xl border p-4", config.classes)}><div className="flex gap-3"><Icon size={18} className="mt-0.5 shrink-0" /><div><strong className="text-sm">{title}</strong><div className="mt-1 text-xs leading-5 opacity-75">{children}</div></div></div></div>;
}

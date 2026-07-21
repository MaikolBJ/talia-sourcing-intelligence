"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BarChart3, Database, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, Button, Eyebrow, Notice } from "@/components/ui";
import type { UserRole } from "@/types/sourcing";

const accessModes: Array<{ role: UserRole; title: string; detail: string; icon: typeof ShieldCheck }> = [
  { role: "Sourcing Manager", title: "Sourcing workspace", detail: "Portfolio, rates, pipeline, negotiations and data explorer", icon: BarChart3 },
  { role: "Platform Admin", title: "Platform administration", detail: "All sourcing views plus source links, mapping and refresh controls", icon: ShieldCheck },
];

export default function AccessPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("Sourcing Manager");

  function enter() {
    window.localStorage.setItem("talia-sourcing-role", role);
    router.push("/workspace");
  }

  return <main className="login-shell min-h-screen p-4 sm:p-7 lg:p-10">
    <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-[1560px] overflow-hidden rounded-[36px] border border-white/[.08] bg-[#090d13]/92 shadow-[0_50px_140px_rgba(0,0,0,.55)] lg:grid-cols-[1.18fr_.82fr]">
      <section className="login-hero relative flex min-h-[560px] flex-col justify-between overflow-hidden p-7 sm:p-11 lg:p-14">
        <div className="relative z-10">
          <Image src="/ta-connections-logo.svg" alt="TA Connections" width={290} height={70} priority className="h-auto w-[215px] sm:w-[265px]" />
          <div className="mt-20 max-w-4xl lg:mt-28">
            <Eyebrow>Sourcing intelligence / public prototype</Eyebrow>
            <h1 className="font-display mt-5 max-w-[11ch] text-[clamp(3.4rem,7vw,7.5rem)] font-semibold leading-[.88] tracking-[-.075em] text-white">See the deal before you make it.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Talia unifies hotel proposals, operational production and governed SharePoint records into one decisive sourcing workspace.</p>
          </div>
        </div>
        <div className="relative z-10 mt-12 grid gap-3 sm:grid-cols-3">
          {[[Database, "Three-source view"], [Sparkles, "Negotiation signals"], [ShieldCheck, "Read-only by design"]].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof Database;
            return <div key={String(label)} className="flex items-center gap-2 text-sm font-bold text-slate-300"><span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-red-200"><FeatureIcon size={15} /></span>{String(label)}</div>;
          })}
        </div>
      </section>

      <section className="flex items-center border-t border-white/[.07] bg-black/20 p-5 sm:p-9 lg:border-l lg:border-t-0 lg:p-12">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-start justify-between gap-3"><div><Eyebrow>Workspace access</Eyebrow><h2 className="font-display mt-3 text-3xl font-semibold tracking-[-.05em] text-white">Choose your view</h2><p className="mt-2 text-sm leading-6 text-slate-400">This public build uses demonstration access. Production access is designed for Microsoft Entra ID and RBAC.</p></div><Badge tone="green">Safe demo</Badge></div>
          <div className="mt-7 grid gap-3">
            {accessModes.map((item) => {
              const Icon = item.icon;
              const selected = role === item.role;
              return <button key={item.role} type="button" onClick={() => setRole(item.role)} className={`rounded-[22px] border p-5 text-left transition ${selected ? "border-red-400/35 bg-red-400/[.09]" : "border-white/[.08] bg-white/[.025] hover:bg-white/[.05]"}`}><div className="flex items-start gap-4"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${selected ? "bg-red-400/15 text-red-100" : "bg-white/[.05] text-slate-400"}`}><Icon size={20} /></span><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-white">{item.title}</strong>{selected ? <Badge tone="red">Selected</Badge> : null}</div><p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p></div></div></button>;
            })}
          </div>
          <Button variant="primary" className="mt-6 w-full" onClick={enter}>Enter as {role}<ArrowRight size={16} /></Button>
          <div className="mt-5"><Notice tone="safe" title="No private records are exposed">This deployment contains synthetic hotel data. Source URLs and CSV previews remain in your browser and are never committed to GitHub.</Notice></div>
        </div>
      </section>
    </div>
  </main>;
}

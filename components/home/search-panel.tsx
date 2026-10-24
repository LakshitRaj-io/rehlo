"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search, Wallet, BedDouble } from "lucide-react";
import { ACCOMMODATION_TYPES } from "@/types";
import { BUDGET_PRESETS, LOCALITIES } from "@/data/site";
import { cn } from "@/lib/utils";

export function SearchPanel({ className }: { className?: string }) {
  const router = useRouter();
  const [locality, setLocality] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (locality) p.set("locality", locality);
    if (type) p.set("type", type);
    const preset = BUDGET_PRESETS[budget];
    if (preset.min != null) p.set("min", String(preset.min));
    if (preset.max != null) p.set("max", String(preset.max));
    const qs = p.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  };

  const cell = "flex flex-col gap-1 px-4 py-3.5 md:py-2.5";
  const lab = "label flex items-center gap-1.5 text-muted";

  return (
    <form
      role="search"
      aria-label="Search stays"
      onSubmit={submit}
      className={cn(
        "grid border-2 border-ink bg-warm shadow-[var(--shadow-hard-lg)] md:grid-cols-[1.3fr_1fr_1fr_auto]",
        className,
      )}
    >
      <div className={cn(cell, "border-b-2 border-ink md:border-b-0 md:border-r-2")}>
        <label htmlFor="hero-location" className={lab}>
          <MapPin className="size-3.5" aria-hidden="true" /> Location
        </label>
        <select id="hero-location" className="w-full appearance-none bg-transparent py-1 font-display text-lg font-bold outline-none focus-visible:underline" value={locality} onChange={(e) => setLocality(e.target.value)}>
          <option value="">SRM KTR, all nearby</option>
          {LOCALITIES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className={cn(cell, "border-b-2 border-ink md:border-b-0 md:border-r-2")}>
        <label htmlFor="hero-type" className={lab}>
          <BedDouble className="size-3.5" aria-hidden="true" /> Type
        </label>
        <select id="hero-type" className="w-full appearance-none bg-transparent py-1 font-display text-lg font-bold outline-none focus-visible:underline" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {ACCOMMODATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className={cn(cell, "border-b-2 border-ink md:border-b-0 md:border-r-2")}>
        <label htmlFor="hero-budget" className={lab}>
          <Wallet className="size-3.5" aria-hidden="true" /> Monthly budget
        </label>
        <select id="hero-budget" className="price w-full appearance-none bg-transparent py-1 font-display text-lg font-bold outline-none focus-visible:underline" value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
          {BUDGET_PRESETS.map((b, i) => (
            <option key={b.label} value={i}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
      <div className="p-2">
        <button type="submit" className="btn btn-lime btn-lg h-full w-full min-h-[48px] md:min-w-[13rem]" data-cursor="cta">
          <Search className="size-5" strokeWidth={3} aria-hidden="true" />
          Find my place
        </button>
      </div>
    </form>
  );
}

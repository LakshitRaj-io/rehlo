import { Moon, Sparkles, Sun, Utensils, Wallet } from "lucide-react";
import type { FlatmateProfile } from "@/types";
import { cn, formatINR } from "@/lib/utils";

const TINTS = ["bg-lime", "bg-orange", "bg-blue text-warm", "bg-warm"];

export function Monogram({ name, index = 0, className }: { name: string; index?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("display grid shrink-0 place-items-center border-2 border-ink text-3xl", TINTS[index % TINTS.length], className)}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** A sample profile laid out like a campus ID card. */
export function ProfileCard({ profile: p, index = 0, className, children }: { profile: FlatmateProfile; index?: number; className?: string; children?: React.ReactNode }) {
  const SleepIcon = p.sleep === "Night owl" ? Moon : Sun;
  return (
    <article className={cn("flex flex-col border-2 border-ink bg-warm shadow-[var(--shadow-hard)]", className)}>
      <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-3 py-1.5 text-warm">
        <span className="label">Sample profile</span>
        <span className="label text-lime">Not a real student</span>
      </div>
      <div className="flex gap-4 p-4">
        <Monogram name={p.displayName} index={index} className="size-16" />
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-extrabold leading-none">{p.displayName}</h3>
          <p className="mt-1 text-sm text-muted">
            {p.year}, {p.course}
          </p>
          <p className="mt-1 text-sm font-semibold">Prefers {p.locality}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px border-t-2 border-ink bg-ink text-sm">
        <div className="flex items-center gap-2 bg-warm p-3">
          <Wallet className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Budget</dt>
          <dd className="price font-semibold">~{formatINR(p.budget)}/mo</dd>
        </div>
        <div className="flex items-center gap-2 bg-warm p-3">
          <SleepIcon className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Sleep schedule</dt>
          <dd className="font-semibold">{p.sleep}</dd>
        </div>
        <div className="flex items-center gap-2 bg-warm p-3">
          <Sparkles className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Cleanliness</dt>
          <dd className="font-semibold">{p.cleanliness}</dd>
        </div>
        <div className="flex items-center gap-2 bg-warm p-3">
          <Utensils className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Kitchen habits</dt>
          <dd className="font-semibold">{p.kitchen}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-1.5 border-t-2 border-ink p-3">
        {p.interests.map((i) => (
          <span key={i} className="tag">
            {i}
          </span>
        ))}
      </div>
      {children}
    </article>
  );
}

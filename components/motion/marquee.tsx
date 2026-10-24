import { Asterisk } from "lucide-react";
import { cn } from "@/lib/utils";

/** CSS-only loop: one track holding two copies, translated -50%. Static under reduced motion. */
export function Marquee({
  items,
  className,
  tone = "ink",
}: {
  items: string[];
  className?: string;
  tone?: "ink" | "lime";
}) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={`${t}-${i}`} className="flex items-center">
          <span className="display px-5 text-3xl md:px-8 md:text-5xl">{t}</span>
          <Asterisk className={cn("size-7 md:size-9", tone === "ink" ? "text-lime" : "text-ink")} strokeWidth={3} aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className={cn(
        "marquee relative overflow-hidden border-y-2 border-ink py-4 md:py-5",
        tone === "ink" ? "bg-ink text-warm" : "bg-lime text-ink",
        className,
      )}
    >
      <p className="sr-only">{items.join(". ")}.</p>
      <div className="marquee-track flex w-max" aria-hidden="true">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

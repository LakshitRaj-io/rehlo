import { cn } from "@/lib/utils";

/** REHLO set in the display face; the O becomes a lime "door" — the brand's one mark. */
export function Wordmark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("display inline-flex items-center leading-none", className)} aria-label="REHLO" role="img">
      <span aria-hidden="true">REHL</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative ml-[0.04em] inline-block h-[0.74em] w-[0.6em] rounded-t-full border-[0.09em] bg-lime",
          inverted ? "border-warm" : "border-ink",
        )}
      >
        <span className={cn("absolute bottom-[18%] right-[18%] size-[0.1em] rounded-full", inverted ? "bg-ink" : "bg-ink")} />
      </span>
    </span>
  );
}

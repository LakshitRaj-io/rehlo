"use client";

import Link from "next/link";
import { LOCALITIES } from "@/data/site";
import { usePublishedListings } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LocationGrid() {
  const listings = usePublishedListings();
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {LOCALITIES.map((loc, i) => {
        const count = listings.filter((l) => l.locality === loc).length;
        return (
          <li key={loc} className={cn(i === 0 && "sm:col-span-2 sm:row-span-2")}>
            <Link
              href={`/explore?locality=${encodeURIComponent(loc)}`}
              className={cn(
                "group flex h-full min-h-[7.5rem] flex-col justify-between gap-3 border-2 border-ink p-4 transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[var(--shadow-hard)]",
                i === 0 ? "bg-ink text-warm" : "bg-warm",
              )}
            >
              <span className={cn("display hyphens-auto [overflow-wrap:anywhere]", i === 0 ? "text-5xl md:text-7xl" : "text-xl md:text-2xl")}>{loc}</span>
              <span className={cn("price text-sm font-semibold", i === 0 ? "text-lime" : "text-muted")}>
                {count === 0 ? "Coming soon" : `${count} ${count === 1 ? "stay" : "stays"}`}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

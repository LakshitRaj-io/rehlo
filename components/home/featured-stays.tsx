"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePublishedListings } from "@/lib/store";
import { ListingCard } from "@/components/listings/listing-card";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

const FEATURED_IDS: string[] = [];
const LAYOUT = [
  { span: "lg:col-span-7", shape: "wide" as const },
  { span: "lg:col-span-5 lg:row-span-2", shape: "tall" as const },
  { span: "lg:col-span-7", shape: "wide" as const },
  { span: "lg:col-span-6", shape: "wide" as const },
  { span: "lg:col-span-6", shape: "wide" as const },
];

export function FeaturedStays() {
  const published = usePublishedListings();
  const reduce = useReducedMotion();
  const picked = FEATURED_IDS.map((id) => published.find((l) => l.id === id)).filter((l): l is Listing => l !== undefined);
  const extra = published.filter((l) => !picked.includes(l)).slice(0, Math.max(0, 5 - picked.length));
  const featured = [...picked, ...extra];

  return (
    <section aria-labelledby="featured-title" className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
      <div className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h2 id="featured-title" className="display text-[clamp(2.6rem,7vw,6rem)]">
            Good places.
            <br />
            Real possibilities.
          </h2>
          <p className="mt-4 max-w-md text-lg">Spaces worth checking out around your campus.</p>
        </div>
        <Link href="/explore" className="btn btn-ink btn-lg w-full self-start sm:w-auto md:self-end" data-cursor="cta">
          See all stays
          <ArrowUpRight className="size-5" aria-hidden="true" />
        </Link>
      </div>

      {featured.length === 0 ? (
        <p className="border-2 border-dashed border-ink p-8 text-center">Stays will appear here shortly. Check back soon!</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          {featured.map((l, i) => (
            <motion.li
              key={l.id}
              className={cn(LAYOUT[i]?.span ?? "lg:col-span-4", i === 1 && "md:row-span-2")}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
            >
              <ListingCard listing={l} shape={LAYOUT[i]?.shape ?? "default"} />
            </motion.li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-muted">
        Distances are approximate estimates from SRM KTR campus.
      </p>
    </section>
  );
}

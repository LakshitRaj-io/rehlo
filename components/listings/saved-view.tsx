"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { pruneSaved, useAppState, useHydrated } from "@/lib/store";
import { ListingCard } from "./listing-card";
import { formatINR } from "@/lib/utils";
import type { Listing } from "@/types";

export function SavedView() {
  const hydrated = useHydrated();
  const { saved, listings } = useAppState();

  // Drop ids for listings that are no longer published. Skipped when the list is empty,
  // so a temporary outage can't wipe someone's shortlist.
  useEffect(() => {
    if (hydrated && listings.length > 0) pruneSaved(listings);
  }, [hydrated, listings]);

  const items = saved
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is Listing => l !== undefined && l.published);
  const hiddenCount = saved.filter((id) => listings.some((l) => l.id === id && !l.published)).length;
  const cheapest = items.length ? Math.min(...items.map((l) => l.monthlyRent)) : null;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 md:px-8 md:pt-14">
      <header className="mb-10 grid gap-6 border-b-2 border-ink pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="display text-[clamp(2.8rem,8vw,7rem)]">Your shortlist.</h1>
          <p className="mt-3 text-lg">Saved on this device. Compare, enquire, or let go.</p>
        </div>
        {hydrated && items.length > 1 && cheapest != null && (
          <p className="border-2 border-ink bg-lime px-4 py-3 font-semibold">
            {items.length} saved, from <span className="price">{formatINR(cheapest)}</span>/month
          </p>
        )}
      </header>

      {!hydrated ? (
        <p className="display text-4xl" aria-busy="true">Loading your saved stays…</p>
      ) : items.length === 0 ? (
        <div className="mx-auto max-w-2xl border-2 border-ink bg-warm p-10 text-center shadow-[var(--shadow-hard)]">
          <Heart className="mx-auto size-12" strokeWidth={2.5} aria-hidden="true" />
          <p className="display mt-4 text-4xl">Nothing saved yet</p>
          <p className="mx-auto mt-3 max-w-sm text-muted">Tap the heart on any stay and it&apos;ll wait for you here.</p>
          <Link href="/explore" className="btn btn-lime btn-lg mt-8">
            Explore stays
          </Link>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((l) => (
            <li key={l.id}>
              <ListingCard listing={l} />
            </li>
          ))}
        </ul>
      )}
      {hydrated && hiddenCount > 0 && (
        <p className="mt-8 text-sm text-muted">
          {hiddenCount} saved {hiddenCount === 1 ? "stay is" : "stays are"} currently unpublished and hidden.
        </p>
      )}
    </div>
  );
}

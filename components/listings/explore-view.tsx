"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { applyFilters, countActiveFilters, EMPTY_FILTERS, filtersToQuery, parseFilters, SHARING_BUCKETS, type ListingFilters, type SortKey } from "@/lib/filters";
import { usePublishedListings } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { ListingCard } from "./listing-card";
import { ListingFiltersPanel } from "./listing-filters";
import { Modal } from "@/components/ui/modal";

type Chip = { key: string; label: string; clear: Partial<ListingFilters> };

function chipsFor(f: ListingFilters): Chip[] {
  const chips: Chip[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, clear: { q: "" } });
  if (f.locality) chips.push({ key: "locality", label: f.locality, clear: { locality: "" } });
  if (f.kind) chips.push({ key: "kind", label: f.kind === "vacancy" ? "Vacancies in flats" : "Whole places", clear: { kind: "" } });
  if (f.type) chips.push({ key: "type", label: f.type, clear: { type: "" } });
  if (f.min != null) chips.push({ key: "min", label: `From ${formatINR(f.min)}`, clear: { min: null } });
  if (f.max != null) chips.push({ key: "max", label: `Up to ${formatINR(f.max)}`, clear: { max: null } });
  if (f.sharing) chips.push({ key: "sharing", label: SHARING_BUCKETS.find((b) => b.value === f.sharing)?.label ?? f.sharing, clear: { sharing: "" } });
  if (f.furnishing) chips.push({ key: "furnishing", label: f.furnishing, clear: { furnishing: "" } });
  if (f.gender) chips.push({ key: "gender", label: f.gender === "Any" ? "Open to all" : f.gender, clear: { gender: "" } });
  for (const a of f.amenities) chips.push({ key: `a-${a}`, label: a, clear: { amenities: f.amenities.filter((x) => x !== a) } });
  if (f.verified) {
    const label = f.verified === "owner" ? "Landlord verified" : f.verified === "listing" ? "Details checked" : "Both checks done";
    chips.push({ key: "verified", label, clear: { verified: "" } });
  }
  return chips;
}

export function ExploreView() {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const listings = usePublishedListings();
  const filters = useMemo(() => parseFilters(params), [params]);
  const results = useMemo(() => applyFilters(listings, filters), [listings, filters]);
  const active = countActiveFilters(filters);
  const chips = chipsFor(filters);
  const [drawer, setDrawer] = useState(false);
  const showGender = listings.some((l) => l.genderRestriction != null);

  const commit = (patch: Partial<ListingFilters>) => {
    const qs = filtersToQuery({ ...filters, ...patch });
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  };
  const clearAll = () => router.replace(filters.sort !== "relevance" ? `/explore?sort=${filters.sort}` : "/explore", { scroll: false });
  const resetEverything = () => commit({ ...EMPTY_FILTERS, sort: filters.sort });

  const where = filters.locality || "SRM KTR, Kattankulathur";

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 md:px-8 md:pt-14">
      <header className="mb-8 border-b-2 border-ink pb-8">
        <h1 className="display text-[clamp(2.8rem,8vw,7rem)]">
          Find your kind
          <br />
          of place.
        </h1>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-lg" aria-live="polite">
          <span className="price font-display text-2xl font-extrabold">{results.length}</span>
          <span>
            verified {results.length === 1 ? "stay" : "stays"} around <strong>{where}</strong>
          </span>
        </p>
        <p className="mt-1 text-sm text-muted">Every stay is listed by a REHLO agent. Enquire and we&apos;ll handle the rest.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[18rem_1fr] xl:grid-cols-[20rem_1fr]">
        {/* Desktop filters */}
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold">Filters</h2>
              {active > 0 && (
                <button type="button" onClick={resetEverything} className="link-underline text-sm font-bold">
                  Clear all
                </button>
              )}
            </div>
            <ListingFiltersPanel filters={filters} onChange={commit} idPrefix="desk" showGender={showGender} />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form
              role="search"
              className="relative flex-1"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="explore-q" className="sr-only">
                Search by name, locality or description
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2" aria-hidden="true" />
              <input
                id="explore-q"
                type="search"
                className="field pl-10"
                placeholder="Search: AC, Potheri, meals…"
                defaultValue={filters.q}
                key={filters.q === "" ? "empty" : "q"}
                onChange={(e) => commit({ q: e.target.value })}
              />
            </form>
            <div className="flex gap-3">
              <button type="button" className="btn flex-1 lg:hidden" onClick={() => setDrawer(true)} aria-haspopup="dialog">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Filters{active > 0 ? ` (${active})` : ""}
              </button>
              <label htmlFor="explore-sort" className="sr-only">
                Sort results
              </label>
              <select
                id="explore-sort"
                className="field flex-1 sm:w-56 sm:flex-none"
                value={filters.sort}
                onChange={(e) => commit({ sort: e.target.value as SortKey })}
              >
                <option value="relevance">Sort: Recommended</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="newest">Recently updated</option>
              </select>
            </div>
          </div>

          {/* Active chips */}
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              <AnimatePresence initial={false} mode="popLayout">
                {chips.map((c) => (
                  <motion.button
                    key={c.key}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    className="chip bg-lime"
                    onClick={() => commit(c.clear)}
                    aria-label={`Remove filter: ${c.label}`}
                  >
                    {c.label}
                    <X className="size-3.5" aria-hidden="true" />
                  </motion.button>
                ))}
              </AnimatePresence>
              <button type="button" className="link-underline ml-1 text-sm font-bold" onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}

          {/* Results */}
          {results.length === 0 ? (
            <div className="mt-10 border-2 border-ink bg-warm p-8 text-center shadow-[var(--shadow-hard)] md:p-14">
              <p className="display text-4xl md:text-5xl">Nothing matches. Yet.</p>
              <p className="mx-auto mt-4 max-w-md text-muted">
                Try widening your budget, dropping an amenity or two, or looking in a nearby locality like Potheri or Guduvanchery.
              </p>
              <button type="button" className="btn btn-lime btn-lg mt-8" onClick={resetEverything}>
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
                >
                  <ListingCard listing={l} priority={i < 3} />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal open={drawer} onClose={() => setDrawer(false)} title="Filters" eyebrow={`${results.length} matching`} tone="paper">
        <ListingFiltersPanel filters={filters} onChange={commit} idPrefix="mob" showGender={showGender} />
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex gap-3 border-t-2 border-ink bg-warm px-5 py-4">
          <button type="button" className="btn flex-1" onClick={resetEverything} disabled={active === 0}>
            Clear
          </button>
          <button type="button" className="btn btn-lime flex-[2]" onClick={() => setDrawer(false)}>
            Show {results.length} {results.length === 1 ? "stay" : "stays"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

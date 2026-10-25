"use client";

import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, CalendarDays, Check, MapPin, MessageSquareText, PhoneCall, Users } from "lucide-react";
import type { Listing } from "@/types";
import { formatDate, formatINR, vacancies } from "@/lib/utils";
import { useHydrated, usePublishedListings } from "@/lib/store";
import { VerificationList } from "@/components/ui/badges";
import { ListingGallery } from "./listing-gallery";
import { VideoTours } from "./video-tours";
import { SaveButton } from "./save-button";
import { distanceText, ListingCard, vacancyText } from "./listing-card";
import { openEnquiry } from "@/components/enquiry/enquiry-store";

function Fact({ label, value, Icon }: { label: string; value: React.ReactNode; Icon?: typeof BedDouble }) {
  return (
    <div className="flex flex-col gap-1 border-2 border-ink bg-warm p-3">
      <dt className="label flex items-center gap-1.5 text-muted">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="font-display text-lg font-extrabold leading-tight">{value}</dd>
    </div>
  );
}

/** The public detail layout. `preview` disables actions so admins can see it before publishing. */
export function StayDetail({ listing: l, preview = false }: { listing: Listing; preview?: boolean }) {
  const v = vacancies(l.capacity, l.occupied);
  const charges: { label: string; value: string }[] = [
    { label: "Monthly rent (per person)", value: formatINR(l.monthlyRent) },
    { label: "Security deposit", value: l.deposit != null ? formatINR(l.deposit) : "Not stated" },
  ];
  if (l.maintenance != null) charges.push({ label: "Maintenance (monthly)", value: formatINR(l.maintenance) });
  if (l.otherCharges) charges.push({ label: "Other charges", value: l.otherCharges });

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-32 pt-8 md:px-8 md:pt-10 lg:pb-24">
      {!preview && (
        <Link href="/explore" className="link-underline mb-6 inline-flex items-center gap-2 font-bold">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to all stays
        </Link>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="border-2 border-ink bg-lime px-2 py-0.5">
          <span className="label">{l.accommodationType}</span>
        </span>
        {l.isVacancy && (
          <span className="border-2 border-ink bg-orange px-2 py-0.5">
            <span className="label">Vacancy in an occupied flat</span>
          </span>
        )}
        {!l.published && (
          <span className="label border-2 border-ink bg-ink px-2 py-1 text-warm">Draft: not visible to students</span>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_26rem]">
        <div className="min-w-0">
          <h1 className="display text-[clamp(2.4rem,6vw,5rem)]">{l.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg">
            <span className="inline-flex items-center gap-1.5 font-bold">
              <MapPin className="size-5" aria-hidden="true" />
              {l.locality}
            </span>
            {l.landmark && <span className="text-muted">{l.landmark}</span>}
          </p>

          <div className="mt-8">
            <ListingGallery images={l.images} title={l.title} />
          </div>

          <VideoTours videos={l.videos} title={l.title} />

          <dl className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Fact label="Sharing" value={l.sharingType} Icon={Users} />
            <Fact label="Furnishing" value={l.furnishing} />
            <Fact label="Vacancy" value={vacancyText(l)} />
            <Fact label="Available from" value={l.availableFrom ? formatDate(l.availableFrom) : "Ask us"} Icon={CalendarDays} />
            {l.bedrooms != null && <Fact label="Bedrooms" value={l.bedrooms} Icon={BedDouble} />}
            {l.bathrooms != null && <Fact label="Bathrooms" value={l.bathrooms} Icon={Bath} />}
            {l.genderRestriction && <Fact label="Open to" value={l.genderRestriction === "Any" ? "Everyone" : l.genderRestriction} />}
          </dl>

          <section aria-labelledby="about" className="mt-12">
            <h2 id="about" className="display text-3xl md:text-4xl">About the place</h2>
            <p className="mt-4 max-w-[65ch] text-lg">{l.description}</p>
          </section>

          <section aria-labelledby="amen" className="mt-12">
            <h2 id="amen" className="display text-3xl md:text-4xl">What&apos;s included</h2>
            {l.amenities.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {l.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 border-b-2 border-dashed border-ink/25 py-2 font-semibold">
                    <Check className="size-4 shrink-0 text-success" strokeWidth={3} aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">No amenities listed yet. Ask us when you enquire.</p>
            )}
          </section>

          <section aria-labelledby="rules" className="mt-12">
            <h2 id="rules" className="display text-3xl md:text-4xl">House rules</h2>
            {l.houseRules.length ? (
              <ul className="mt-4 flex flex-col gap-2">
                {l.houseRules.map((r) => (
                  <li key={r} className="border-l-4 border-lime bg-warm px-4 py-2 font-semibold">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">No house rules supplied. Ask before you commit.</p>
            )}
          </section>

          <section aria-labelledby="area" className="mt-12">
            <h2 id="area" className="display text-3xl md:text-4xl">The area</h2>
            <p className="mt-4 max-w-[65ch]">
              {l.locality}
              {distanceText(l) ? `, ${distanceText(l)?.toLowerCase()}` : ""}. Distance is approximate — check
              the actual route and travel time before deciding.
            </p>
          </section>

          <section aria-labelledby="checks" className="mt-12 border-2 border-ink bg-warm p-5">
            <h2 id="checks" className="font-display text-2xl font-extrabold">Listing status</h2>
            <div className="mt-4">
              <VerificationList listing={l} />
            </div>
            <p className="mt-4 text-sm text-muted">
              Listed and managed by REHLO. Last updated {formatDate(l.updatedAt)}.
            </p>
          </section>
        </div>

        {/* Sticky enquiry panel */}
        <aside className="hidden lg:block" aria-label="Enquire">
          <div className="sticky top-24 flex flex-col gap-4 border-2 border-ink bg-warm p-5 shadow-[var(--shadow-hard-lg)]">
            <div>
              <p className="price font-display text-5xl font-extrabold">{formatINR(l.monthlyRent)}</p>
              <p className="text-sm text-muted">per person, per month</p>
            </div>
            {l.pricingNotes && <p className="border-l-4 border-orange pl-3 text-sm">{l.pricingNotes}</p>}
            <dl className="flex flex-col divide-y-2 divide-dashed divide-ink/20 border-y-2 border-ink">
              {charges.map((c) => (
                <div key={c.label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-muted">{c.label}</dt>
                  <dd className="price text-right font-bold">{c.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm font-semibold">{v === 0 ? "Full right now. You can still ask about the next opening." : vacancyText(l)}</p>
            <button
              type="button"
              className="btn btn-lime btn-lg w-full"
              disabled={preview}
              onClick={() => openEnquiry("enquiry", l)}
              data-cursor="cta"
            >
              <MessageSquareText className="size-5" aria-hidden="true" />
              Enquire about this place
            </button>
            <div className="flex gap-3">
              <button type="button" className="btn flex-1" disabled={preview} onClick={() => openEnquiry("callback", l)}>
                <PhoneCall className="size-4" aria-hidden="true" />
                Request callback
              </button>
              {!preview && <SaveButton id={l.id} title={l.title} />}
            </div>
            <p className="text-xs text-muted">No account needed. A REHLO agent handles your enquiry from start to move-in.</p>
          </div>
        </aside>
      </div>

      {/* Mobile action bar */}
      {!preview && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-warm px-4 py-3 lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="price font-display text-2xl font-extrabold leading-none">{formatINR(l.monthlyRent)}</p>
            <p className="text-xs text-muted">per person / month</p>
          </div>
          <SaveButton id={l.id} title={l.title} />
          <button type="button" className="btn" aria-label="Request callback" onClick={() => openEnquiry("callback", l)}>
            <PhoneCall className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-lime" onClick={() => openEnquiry("enquiry", l)}>
            Enquire
          </button>
        </div>
      )}
    </div>
  );
}

export function StayView({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const published = usePublishedListings();
  const listing = published.find((l) => l.slug === slug);

  if (!listing) {
    if (!hydrated) {
      return (
        <div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8" aria-busy="true">
          <p className="display text-5xl">Loading stay…</p>
        </div>
      );
    }
    return <StayNotFound />;
  }

  const similar = published
    .filter((l) => l.id !== listing.id && (l.locality === listing.locality || l.accommodationType === listing.accommodationType))
    .slice(0, 3);

  return (
    <>
      <StayDetail listing={listing} />
      {similar.length > 0 && (
        <section aria-labelledby="similar" className="border-t-2 border-ink bg-paper-deep">
          <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8">
            <h2 id="similar" className="display text-4xl md:text-5xl">Also worth a look</h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {similar.map((s) => (
                <li key={s.id}>
                  <ListingCard listing={s} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function StayNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-8">
      <p className="display text-6xl md:text-7xl">This stay isn&apos;t here.</p>
      <p className="mx-auto mt-5 max-w-md text-lg text-muted">
        It may have been unpublished or removed, or the link is mistyped. Plenty of other places are still listed.
      </p>
      <Link href="/explore" className="btn btn-lime btn-lg mt-8">
        Browse stays
      </Link>
    </div>
  );
}

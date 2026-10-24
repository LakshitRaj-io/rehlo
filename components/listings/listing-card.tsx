"use client";

import Link from "next/link";
import { MapPin, MessageSquareText, PhoneCall, Video } from "lucide-react";
import type { Listing } from "@/types";
import { cn, formatINR, vacancies } from "@/lib/utils";
import { SafeImage } from "@/components/ui/safe-image";
import { VerificationList } from "@/components/ui/badges";
import { SaveButton } from "./save-button";
import { openEnquiry } from "@/components/enquiry/enquiry-store";

export function vacancyText(l: Listing): string {
  const v = vacancies(l.capacity, l.occupied);
  if (v == null) return "Vacancy not listed";
  if (v === 0) return "Full right now";
  return `${v} of ${l.capacity} ${l.capacity === 1 ? "space" : "spaces"} open`;
}

export function distanceText(l: Listing): string | null {
  if (l.approxDistanceKm == null) return null;
  return `About ${l.approxDistanceKm} km from SRM KTR`;
}

type Props = {
  listing: Listing;
  /** "tall" and "wide" vary proportions in editorial grids */
  shape?: "default" | "tall" | "wide";
  priority?: boolean;
  /** Preview mode for admin: no saving or enquiry actions, link disabled */
  preview?: boolean;
  className?: string;
};

export function ListingCard({ listing: l, shape = "default", priority, preview = false, className }: Props) {
  const aspect = shape === "tall" ? "aspect-[4/5] lg:aspect-auto lg:min-h-[22rem] lg:flex-1"  : shape === "wide" ? "aspect-[16/10] lg:aspect-[2/1]" : "aspect-[4/3]";
  const v = vacancies(l.capacity, l.occupied);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col border-2 border-ink bg-warm shadow-[var(--shadow-hard)] transition-[transform,box-shadow] duration-200",
        !preview && "focus-within:-translate-y-1 focus-within:shadow-[var(--shadow-hard-lg)] hover:-translate-y-1 hover:shadow-[var(--shadow-hard-lg)]",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden border-b-2 border-ink", aspect)} data-cursor="view">
        <SafeImage
          src={l.images[0]}
          alt={`${l.title}: ${l.accommodationType.toLowerCase()} in ${l.locality}`}
          priority={priority}
          className="absolute inset-0 size-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="border-2 border-ink bg-lime px-2 py-0.5">
            <span className="label">{l.accommodationType}</span>
          </span>
          {l.videos.length > 0 && (
            <span className="flex items-center gap-1 border-2 border-ink bg-ink px-2 py-0.5 text-warm">
              <Video className="size-3.5" aria-hidden="true" />
              <span className="label">Video tour</span>
            </span>
          )}
        </div>
        {!preview && (
          <div className="absolute right-3 top-3">
            <SaveButton id={l.id} title={l.title} />
          </div>
        )}
        <span
          aria-hidden="true"
          className="label absolute bottom-3 right-3 translate-y-2 border-2 border-ink bg-ink px-2.5 py-1.5 text-lime opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        >
          View stay
        </span>
      </div>

      <div className={cn("flex flex-col gap-3 p-4", shape !== "tall" && "flex-1")}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-extrabold leading-tight tracking-tight">
            {preview ? (
              <span>{l.title}</span>
            ) : (
              <Link href={`/stay/${l.slug}`} className="outline-none after:absolute after:inset-0 after:z-10 after:content-['']">
                {l.title}
              </Link>
            )}
          </h3>
          <p className="shrink-0 text-right">
            <span className="price block font-display text-xl font-extrabold">{formatINR(l.monthlyRent)}</span>
            <span className="text-xs text-muted">per person / month</span>
          </p>
        </div>

        <p className="flex items-start gap-1.5 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-bold">{l.locality}</span>
            {distanceText(l) && <span className="block text-muted">{distanceText(l)}, roughly</span>}
          </span>
        </p>

        <ul className="relative z-20 flex flex-wrap gap-1.5" aria-label="Key details">
          <li className="tag">{l.furnishing}</li>
          <li className="tag">{l.sharingType}</li>
          <li className={cn("tag", v === 0 && "bg-paper-deep")}>{vacancyText(l)}</li>
          {l.genderRestriction && l.genderRestriction !== "Any" && <li className="tag">{l.genderRestriction}</li>}
        </ul>

        <div className="mt-auto pt-1">
          <VerificationList listing={l} compact />
        </div>

        {!preview && (
          <div className="relative z-20 grid grid-cols-2 gap-2 border-t-2 border-dashed border-ink/30 pt-3 [&>button]:min-h-[44px]">
            <button type="button" className="btn btn-sm" onClick={() => openEnquiry("enquiry", l)}>
              <MessageSquareText className="size-4" aria-hidden="true" />
              Send enquiry
            </button>
            <button type="button" className="btn btn-sm btn-ghost border-ink" onClick={() => openEnquiry("callback", l)}>
              <PhoneCall className="size-4" aria-hidden="true" />
              Callback
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

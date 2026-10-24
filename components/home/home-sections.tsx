import Link from "next/link";
import { ArrowUpRight, Bug, Droplets, FileText, IndianRupee, Plug, SprayCan, UserCheck, ClipboardCheck, WashingMachine, Zap } from "lucide-react";
import { SAMPLE_FLATMATES } from "@/data/flatmates";
import { SERVICE_CATEGORY_META } from "@/data/services";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/types";
import { ProfileCard } from "@/components/flatmates/profile-card";
import { Reveal } from "@/components/motion/reveal";
import { LocationGrid } from "./location-grid";

/* ---------------- Flatmates ---------------- */

export function FlatmateSection() {
  const sample = [SAMPLE_FLATMATES[0], SAMPLE_FLATMATES[1], SAMPLE_FLATMATES[4]].filter(Boolean);
  return (
    <section aria-labelledby="fm-title" className="relative overflow-hidden border-y-2 border-ink bg-paper-deep">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <h2 id="fm-title" className="display text-[clamp(2.6rem,6.5vw,5.6rem)] !leading-[1.02]">
            A room is good.
            <br />
            <span className="bg-ink px-2 py-0.5 text-lime [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">The right roommate</span>
            <br />
            is better.
          </h2>
          <p className="mt-6 max-w-md text-lg">Find people who match your budget, habits and everyday rhythm.</p>
          <Link href="/flatmates" className="btn btn-lime btn-lg mt-8" data-cursor="cta">
            Find your flatmate
          </Link>
          <p className="mt-4 text-sm text-muted">Based on real preferences of students around SRM KTR.</p>
        </div>

        {sample.length > 0 ? (
          <ul className="relative grid gap-5 sm:grid-cols-2" aria-label="Sample flatmate profiles">
            {sample.map((p, i) => (
              <li
                key={p.id}
                className={
                  i === 0
                    ? "sm:rotate-[-2deg]"
                    : i === 1
                      ? "sm:translate-y-10 sm:rotate-[2deg]"
                      : "sm:col-span-2 sm:mx-auto sm:mt-12 sm:w-[60%] sm:-rotate-1"
                }
              >
                <ProfileCard profile={p} index={i} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-2 border-dashed border-ink p-8 text-center bg-warm">
            <p className="font-display text-lg font-bold">Flatmate matching is live.</p>
            <p className="mt-2 text-sm text-muted">Use the finder to set your preferences and connect with students near SRM KTR.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */

const SERVICE_ICONS: Record<ServiceCategory, typeof Zap> = {
  cleaning: SprayCan,
  plumbing: Droplets,
  electrical: Plug,
  appliance: WashingMachine,
  "pest-control": Bug,
};

export function ServicesSection() {
  return (
    <section aria-labelledby="svc-title" className="bg-ink text-warm">
      <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h2 id="svc-title" className="display text-[clamp(2.6rem,6.5vw,5.6rem)]">
            The flat is yours.
            <br />
            <span className="text-lime">The fixes? We&apos;ve got you.</span>
          </h2>
          <p className="max-w-md text-lg text-warm/80 lg:justify-self-end">
            Tell us what&apos;s broken and when suits you. We&apos;ll connect you with trusted local service providers.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-px border-2 border-warm/30 bg-warm/30 md:grid-cols-5">
          {SERVICE_CATEGORIES.map((c, i) => {
            const Icon = SERVICE_ICONS[c];
            return (
              <li key={c} className={i === 4 ? "col-span-2 md:col-span-1" : undefined}>
                <Link
                  href={`/services?category=${c}`}
                  className="group flex h-full min-h-[11rem] flex-col justify-between gap-6 bg-ink p-5 transition-colors hover:bg-lime hover:text-ink focus-visible:bg-lime focus-visible:text-ink"
                >
                  <Icon className="size-9 transition-transform duration-300 group-hover:-rotate-12" strokeWidth={2} aria-hidden="true" />
                  <span>
                    <span className="display block text-2xl md:text-3xl">{SERVICE_CATEGORY_META[c].label}</span>
                    <span className="mt-1 block text-sm opacity-75">{SERVICE_CATEGORY_META[c].blurb}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Trust ---------------- */

const PRINCIPLES = [
  {
    Icon: FileText,
    title: "Clear listing information",
    body: "Rent, sharing, furnishing, house rules and vacancies in the same place on every listing — no “DM for details”.",
  },
  {
    Icon: UserCheck,
    title: "Transparent checks",
    body: "Two separate checks, shown separately. A listing never looks “verified” just because it's published.",
  },
  {
    Icon: IndianRupee,
    title: "Honest prices",
    body: "Deposit, maintenance and extra charges sit next to the rent, so the first month doesn't surprise you.",
  },
];

const PROCESS = [
  { title: "Listed by a REHLO agent", body: "Only our agents post flats, PGs and hostels. Nothing goes live straight from a landlord.", label: "Not yet reviewed" },
  { title: "Visited and checked", body: "The agent checks rent, rooms and photos in person against what's listed.", label: "Details checked by REHLO", Icon: ClipboardCheck },
  { title: "Landlord verified", body: "A separate check that the landlord is who they say they are.", label: "Landlord verified by REHLO", Icon: UserCheck },
];

export function TrustSection() {
  return (
    <section aria-labelledby="trust-title" className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
      <h2 id="trust-title" className="display max-w-4xl text-[clamp(2.6rem,6.5vw,5.6rem)]">
        No guesswork.
        <br />
        More clarity.
      </h2>

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {PRINCIPLES.map(({ Icon, title, body }, i) => (
          <Reveal as="li" key={title} delay={i * 0.06} className="border-t-4 border-ink pt-5">
            <Icon className="size-8" aria-hidden="true" />
            <h3 className="mt-4 font-display text-2xl font-extrabold">{title}</h3>
            <p className="mt-2 max-w-sm text-muted">{body}</p>
          </Reveal>
        ))}
      </ul>

      <div className="mt-16 border-2 border-ink bg-warm p-5 shadow-[var(--shadow-hard)] md:p-8">
        <h3 className="font-display text-2xl font-extrabold">How a listing earns its labels</h3>
        <ol className="mt-6 grid gap-6 md:grid-cols-3 md:gap-0">
          {PROCESS.map((step, i) => (
            <li key={step.title} className="relative md:border-l-2 md:border-ink md:px-6 md:first:border-l-0 md:first:pl-0">
              <span className="display text-6xl text-ink/15" aria-hidden="true">
                {i + 1}
              </span>
              <p className="mt-1 font-display text-xl font-extrabold">{step.title}</p>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 border-2 border-ink bg-paper px-2 py-1 text-xs font-bold">
                {step.Icon ? <step.Icon className="size-3.5 text-success" aria-hidden="true" /> : null}
                Shows as “{step.label}”
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t-2 border-dashed border-ink/30 pt-4 text-sm text-muted">
          Each check is done independently. A listing is never labelled &ldquo;verified&rdquo; just because it&apos;s published.
        </p>
      </div>
    </section>
  );
}

/* ---------------- Location ---------------- */

export function LocationSection() {
  return (
    <section aria-labelledby="loc-title" className="border-y-2 border-ink bg-lime">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 md:px-8 md:py-20 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 id="loc-title" className="display text-[clamp(2.6rem,6.5vw,5.2rem)]">
            Starting
            <br />
            around SRM KTR
          </h2>
          <p className="mt-5 max-w-sm text-lg">
            The neighbourhoods we cover around SRM KTR campus.
          </p>
        </div>
        <LocationGrid />
      </div>
    </section>
  );
}

/* ---------------- Vacancy CTA ---------------- */

export function OwnerCta() {
  return (
    <section aria-labelledby="owner-title" className="border-b-2 border-warm/15 bg-ink text-warm">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-20 md:flex-row md:items-end md:justify-between md:px-8 md:py-28">
        <div>
          <h2 id="owner-title" className="display text-[clamp(3rem,9vw,8rem)] text-lime">
            Room free
            <br />
            in your flat?
          </h2>
          <p className="mt-5 max-w-md text-lg text-warm/85">Post the vacancy. A REHLO agent verifies it and handles every enquiry, so your number stays private.</p>
        </div>
        <Link href="/post-a-vacancy" className="btn btn-lime btn-lg shrink-0 self-start md:self-end" data-cursor="cta">
          Post a vacancy
          <ArrowUpRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

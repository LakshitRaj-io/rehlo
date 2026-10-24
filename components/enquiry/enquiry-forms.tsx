"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Loader2, PhoneCall } from "lucide-react";
import type { AccommodationRequirement, Listing, StudentEnquiry } from "@/types";
import { BUDGET_BANDS, LOCALITIES, YEARS_OF_STUDY } from "@/data/site";
import { submitCallback, submitEnquiry } from "@/app/actions/public";
import { formatDate, formatINR, todayISO } from "@/lib/utils";
import {
  CALLBACK_REQUIREMENT_OPTIONS,
  CALLBACK_TIMES,
  callbackFormSchema,
  enquiryFormSchema,
  GROUP_SIZE_OPTIONS,
  OCCUPANTS_FOR,
  REQUIREMENT_LABELS,
  REQUIREMENT_OPTIONS,
  type CallbackFormValues,
  type EnquiryFormValues,
} from "@/lib/validation";
import { useZodForm } from "@/lib/use-zod-form";
import { ChoiceGroup, describe, Field, FieldError } from "@/components/ui/field";
import { SafeImage } from "@/components/ui/safe-image";

function requirementFromListing(l: Listing | null): AccommodationRequirement | "" {
  if (!l) return "";
  switch (l.accommodationType) {
    case "PG": return "pg";
    case "Hostel": return "hostel";
    case "Flat": return "full-flat";
    case "Shared Room": return "shared-room";
    case "Private Room": return "private-room";
  }
}

const YES_NO = ["Yes", "No"] as const;

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

export function ListingSummary({ listing }: { listing: Listing | null }) {
  if (!listing) {
    return (
      <div className="border-2 border-dashed border-ink/40 p-3 text-sm text-muted">
        General enquiry, not tied to a specific listing.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 border-2 border-ink bg-paper p-2.5">
      <SafeImage src={listing.images[0]} alt="" className="size-14 shrink-0 border-2 border-ink" />
      <div className="min-w-0">
        <p className="label text-muted">Enquiring about</p>
        <p className="truncate font-display text-lg font-extrabold leading-tight">{listing.title}</p>
        <p className="price text-sm">
          {listing.locality}, {formatINR(listing.monthlyRent)}/month
        </p>
      </div>
    </div>
  );
}

function MoveInField({
  id,
  date,
  flexible,
  onDate,
  onFlexible,
  error,
}: {
  id: string;
  date: string;
  flexible: boolean;
  onDate: (v: string) => void;
  onFlexible: (v: boolean) => void;
  error?: string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-sm font-bold">Preferred move-in date</legend>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          className="field max-w-[13rem]"
          min={todayISO()}
          value={date}
          disabled={flexible}
          onChange={(e) => onDate(e.target.value)}
          aria-label="Move-in date"
          {...describe(id, error)}
        />
        <label className="chip">
          <input type="checkbox" className="sr-only" checked={flexible} onChange={(e) => onFlexible(e.target.checked)} />
          Flexible
        </label>
      </div>
      {error && (
        <div className="mt-1.5">
          <FieldError id={`${id}-error`}>{error}</FieldError>
        </div>
      )}
    </fieldset>
  );
}

function GroupSizeField({
  id,
  size,
  exact,
  onSize,
  onExact,
  errorSize,
  errorExact,
}: {
  id: string;
  size: string;
  exact: string;
  onSize: (v: (typeof GROUP_SIZE_OPTIONS)[number]) => void;
  onExact: (v: string) => void;
  errorSize?: string;
  errorExact?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div>
      <ChoiceGroup
        id={`${id}-groupSize`}
        legend="How many people are moving in?"
        options={GROUP_SIZE_OPTIONS.map((g) => ({ value: g, label: g === "1" ? "1 person" : `${g} people` }))}
        value={size as (typeof GROUP_SIZE_OPTIONS)[number] | ""}
        onChange={onSize}
        error={errorSize}
      />
      <AnimatePresence initial={false}>
        {size === "5+" && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Field id={`${id}-groupSizeExact`} label="Exact number of people" error={errorExact} className="mt-3 max-w-[12rem]">
              <input
                type="number"
                inputMode="numeric"
                min={5}
                max={30}
                className="field"
                value={exact}
                onChange={(e) => onExact(e.target.value)}
                {...describe(`${id}-groupSizeExact`, errorExact)}
              />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="overflow-hidden"
        >
          <div className="mt-1 flex flex-col gap-5 border-l-4 border-lime bg-paper py-4 pl-4 pr-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Full enquiry                                                        */
/* ------------------------------------------------------------------ */

export function EnquiryForm({
  listing,
  onDone,
  onSwitchToCallback,
}: {
  listing: Listing | null;
  onDone: (e: StudentEnquiry) => void;
  onSwitchToCallback: () => void;
}) {
  const initial = useMemo(
    () =>
      ({
        fullName: "",
        mobile: "",
        whatsappPreferred: false,
        email: "",
        yearOfStudy: "",
        accommodationRequirement: requirementFromListing(listing),
        groupSize: "",
        groupSizeExact: "",
        occupantsFor: "",
        preferredBedrooms: "",
        wholeFlatTogether: "",
        vacanciesNeeded: "",
        sharedCommonAreasOk: "",
        joiningWith: "",
        pgSharing: "",
        mealsRequired: "",
        budget: "",
        preferredLocality: listing?.locality ?? "",
        additionalRequirements: "",
        moveInFlexible: false,
        moveInDate: "",
      }) as unknown as EnquiryFormValues,
    [listing],
  );
  const form = useZodForm(enquiryFormSchema, initial, "enq");
  const { values: v, set, errors: e } = form;
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const lock = useRef(false);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (lock.current) return;
    if (!form.validate()) return;
    lock.current = true;
    setSubmitting(true);
    setServerError(null);
    submitEnquiry(form.values, listing?.id ?? null)
      .then((r) => {
        if (r.ok) return onDone(r.data);
        form.setErrors(r.errors);
        setServerError(r.message ?? (Object.keys(r.errors).length ? null : "Something went wrong. Please try again."));
      })
      .catch(() => setServerError("We couldn't reach the server. Check your connection and try again."))
      .finally(() => {
        lock.current = false;
        setSubmitting(false);
      });
  };

  const req = v.accommodationRequirement as string;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <ListingSummary listing={listing} />

      <section aria-labelledby="enq-you" className="flex flex-col gap-4">
        <h3 id="enq-you" className="label border-b-2 border-ink pb-1.5">About you</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={form.id("fullName")} label="Full name" error={e.fullName}>
            <input className="field" autoComplete="name" value={v.fullName} onChange={(x) => set("fullName", x.target.value)} data-autofocus {...describe(form.id("fullName"), e.fullName)} />
          </Field>
          <Field id={form.id("mobile")} label="Mobile number" error={e.mobile} hint="Indian 10-digit, or international with +">
            <input className="field price" type="tel" inputMode="tel" autoComplete="tel" value={v.mobile} onChange={(x) => set("mobile", x.target.value)} {...describe(form.id("mobile"), e.mobile, true)} />
          </Field>
        </div>
        <label className="chip w-fit">
          <input type="checkbox" className="sr-only" checked={v.whatsappPreferred} onChange={(x) => set("whatsappPreferred", x.target.checked)} />
          WhatsApp is fine for follow-up
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={form.id("email")} label="Email" optional error={e.email}>
            <input className="field" type="email" autoComplete="email" value={v.email} onChange={(x) => set("email", x.target.value)} {...describe(form.id("email"), e.email)} />
          </Field>
          <Field id={form.id("yearOfStudy")} label="Year of study" error={e.yearOfStudy}>
            <select className="field" value={v.yearOfStudy} onChange={(x) => set("yearOfStudy", x.target.value)} {...describe(form.id("yearOfStudy"), e.yearOfStudy)}>
              <option value="">Choose…</option>
              {YEARS_OF_STUDY.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section aria-labelledby="enq-need" className="flex flex-col gap-5">
        <h3 id="enq-need" className="label border-b-2 border-ink pb-1.5">What you need</h3>
        <ChoiceGroup
          id={form.id("accommodationRequirement")}
          legend="What are you looking for?"
          options={REQUIREMENT_OPTIONS}
          value={req as (typeof REQUIREMENT_OPTIONS)[number]["value"] | ""}
          onChange={(val) => set("accommodationRequirement", val)}
          error={e.accommodationRequirement}
        />

        <Reveal show={req === "full-flat"}>
          <ChoiceGroup id={form.id("preferredBedrooms")} legend="Preferred number of bedrooms" options={["1", "2", "3", "4+"] as const} value={v.preferredBedrooms as "1" | ""} onChange={(val) => set("preferredBedrooms", val)} error={e.preferredBedrooms} />
          <ChoiceGroup id={form.id("wholeFlatTogether")} legend="Must the entire flat be available together?" options={YES_NO} value={v.wholeFlatTogether as "Yes" | ""} onChange={(val) => set("wholeFlatTogether", val)} error={e.wholeFlatTogether} />
        </Reveal>
        <Reveal show={req === "vacant-room"}>
          <ChoiceGroup id={form.id("vacanciesNeeded")} legend="How many vacancies do you need?" options={["1", "2", "3", "4"] as const} value={v.vacanciesNeeded as "1" | ""} onChange={(val) => set("vacanciesNeeded", val)} error={e.vacanciesNeeded} />
          <ChoiceGroup id={form.id("sharedCommonAreasOk")} legend="Comfortable sharing kitchen and living areas?" options={YES_NO} value={v.sharedCommonAreasOk as "Yes" | ""} onChange={(val) => set("sharedCommonAreasOk", val)} error={e.sharedCommonAreasOk} />
          <ChoiceGroup id={form.id("joiningWith")} legend="Joining alone or with friends?" options={["Alone", "With friends"] as const} value={v.joiningWith as "Alone" | ""} onChange={(val) => set("joiningWith", val)} error={e.joiningWith} />
        </Reveal>
        <Reveal show={req === "pg"}>
          <ChoiceGroup id={form.id("pgSharing")} legend="Preferred sharing" options={["Single", "Twin", "Triple", "Any"] as const} value={v.pgSharing as "Single" | ""} onChange={(val) => set("pgSharing", val)} error={e.pgSharing} />
          <ChoiceGroup id={form.id("mealsRequired")} legend="Do you need meals?" options={YES_NO} value={v.mealsRequired as "Yes" | ""} onChange={(val) => set("mealsRequired", val)} error={e.mealsRequired} />
        </Reveal>

        <GroupSizeField
          id="enq"
          size={v.groupSize}
          exact={v.groupSizeExact}
          onSize={(val) => set("groupSize", val)}
          onExact={(val) => set("groupSizeExact", val)}
          errorSize={e.groupSize}
          errorExact={e.groupSizeExact}
        />
        <ChoiceGroup id={form.id("occupantsFor")} legend="Who is this accommodation for?" options={OCCUPANTS_FOR} value={v.occupantsFor as (typeof OCCUPANTS_FOR)[number] | ""} onChange={(val) => set("occupantsFor", val)} error={e.occupantsFor} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={form.id("budget")} label="Monthly budget per person" error={e.budget}>
            <select className="field" value={v.budget} onChange={(x) => set("budget", x.target.value)} {...describe(form.id("budget"), e.budget)}>
              <option value="">Choose…</option>
              {BUDGET_BANDS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field id={form.id("preferredLocality")} label="Preferred locality" error={e.preferredLocality} hint="Pick one or type your own">
            <input className="field" list="enq-localities" value={v.preferredLocality} onChange={(x) => set("preferredLocality", x.target.value)} {...describe(form.id("preferredLocality"), e.preferredLocality, true)} />
            <datalist id="enq-localities">
              {LOCALITIES.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>
        </div>

        <MoveInField
          id={form.id("moveInDate")}
          date={v.moveInDate}
          flexible={v.moveInFlexible}
          onDate={(val) => set("moveInDate", val)}
          onFlexible={(val) => set("moveInFlexible", val)}
          error={e.moveInDate}
        />

        <Field id={form.id("additionalRequirements")} label="Anything else?" optional error={e.additionalRequirements} hint="Specific needs, like ground floor or a quiet room">
          <textarea className="field" rows={3} maxLength={500} value={v.additionalRequirements} onChange={(x) => set("additionalRequirements", x.target.value)} {...describe(form.id("additionalRequirements"), e.additionalRequirements, true)} />
        </Field>
      </section>

      {Object.keys(e).length > 0 && (
        <p role="alert" className="border-2 border-danger bg-danger/10 p-3 text-sm font-semibold text-danger">
          {Object.keys(e).length === 1 ? "One field needs attention." : `${Object.keys(e).length} fields need attention.`} Your answers are kept.
        </p>
      )}

      {serverError && (
        <p role="alert" className="border-2 border-danger bg-danger/10 p-3 text-sm font-semibold text-danger">
          {serverError}
        </p>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col gap-3 border-t-2 border-ink bg-warm px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:-mx-6 md:px-6">
        <button type="button" onClick={onSwitchToCallback} className="link-underline inline-flex items-center gap-2 self-start text-sm font-bold">
          <PhoneCall className="size-4" aria-hidden="true" />
          Just want a call back instead?
        </button>
        <button type="submit" className="btn btn-lime btn-lg" disabled={submitting} aria-busy={submitting} data-cursor="cta">
          {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
          {submitting ? "Sending…" : "Send enquiry"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Callback                                                            */
/* ------------------------------------------------------------------ */

export function CallbackForm({ listing, onDone }: { listing: Listing | null; onDone: (e: StudentEnquiry) => void }) {
  const initial = useMemo(() => {
    const r = requirementFromListing(listing);
    return {
      fullName: "",
      mobile: "",
      yearOfStudy: "",
      groupSize: "",
      groupSizeExact: "",
      accommodationRequirement: r === "pg" || r === "hostel" ? "pg-hostel" : r === "flexible" ? "" : r,
      preferredCallbackTime: "",
      budget: "",
      whatsappPreferred: false,
      note: "",
      moveInFlexible: false,
      moveInDate: "",
    } as unknown as CallbackFormValues;
  }, [listing]);
  const form = useZodForm(callbackFormSchema, initial, "cb");
  const { values: v, set, errors: e } = form;
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const lock = useRef(false);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (lock.current) return;
    if (!form.validate()) return;
    lock.current = true;
    setSubmitting(true);
    setServerError(null);
    submitCallback(form.values, listing?.id ?? null)
      .then((r) => {
        if (r.ok) return onDone(r.data);
        form.setErrors(r.errors);
        setServerError(r.message ?? (Object.keys(r.errors).length ? null : "Something went wrong. Please try again."));
      })
      .catch(() => setServerError("We couldn't reach the server. Check your connection and try again."))
      .finally(() => {
        lock.current = false;
        setSubmitting(false);
      });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <ListingSummary listing={listing} />
      <p className="text-sm text-muted">Seven quick answers. Leave the long version for the call.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={form.id("fullName")} label="Full name" error={e.fullName}>
          <input className="field" autoComplete="name" value={v.fullName} onChange={(x) => set("fullName", x.target.value)} data-autofocus {...describe(form.id("fullName"), e.fullName)} />
        </Field>
        <Field id={form.id("mobile")} label="Mobile number" error={e.mobile} hint="Indian 10-digit, or international with +">
          <input className="field price" type="tel" inputMode="tel" autoComplete="tel" value={v.mobile} onChange={(x) => set("mobile", x.target.value)} {...describe(form.id("mobile"), e.mobile, true)} />
        </Field>
      </div>
      <Field id={form.id("yearOfStudy")} label="Year of study" error={e.yearOfStudy} className="sm:max-w-[50%]">
        <select className="field" value={v.yearOfStudy} onChange={(x) => set("yearOfStudy", x.target.value)} {...describe(form.id("yearOfStudy"), e.yearOfStudy)}>
          <option value="">Choose…</option>
          {YEARS_OF_STUDY.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </Field>
      <GroupSizeField
        id="cb"
        size={v.groupSize}
        exact={v.groupSizeExact}
        onSize={(val) => set("groupSize", val)}
        onExact={(val) => set("groupSizeExact", val)}
        errorSize={e.groupSize}
        errorExact={e.groupSizeExact}
      />
      <ChoiceGroup
        id={form.id("accommodationRequirement")}
        legend="What do you need?"
        options={CALLBACK_REQUIREMENT_OPTIONS}
        value={v.accommodationRequirement as (typeof CALLBACK_REQUIREMENT_OPTIONS)[number]["value"] | ""}
        onChange={(val) => set("accommodationRequirement", val)}
        error={e.accommodationRequirement}
      />
      <ChoiceGroup
        id={form.id("preferredCallbackTime")}
        legend="Best time to call"
        options={CALLBACK_TIMES}
        value={v.preferredCallbackTime as (typeof CALLBACK_TIMES)[number] | ""}
        onChange={(val) => set("preferredCallbackTime", val)}
        error={e.preferredCallbackTime}
      />
      <MoveInField
        id={form.id("moveInDate")}
        date={v.moveInDate}
        flexible={v.moveInFlexible}
        onDate={(val) => set("moveInDate", val)}
        onFlexible={(val) => set("moveInFlexible", val)}
        error={e.moveInDate}
      />

      <details className="group border-2 border-ink bg-paper">
        <summary className="label flex cursor-pointer list-none items-center justify-between px-3 py-3">
          Optional extras: budget, WhatsApp, a note
          <span className="text-lg transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <div className="flex flex-col gap-4 border-t-2 border-ink p-3">
          <Field id={form.id("budget")} label="Budget per person" optional>
            <select className="field" value={v.budget} onChange={(x) => set("budget", x.target.value)} id={form.id("budget")}>
              <option value="">Not sure yet</option>
              {BUDGET_BANDS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <label className="chip w-fit">
            <input type="checkbox" className="sr-only" checked={v.whatsappPreferred} onChange={(x) => set("whatsappPreferred", x.target.checked)} />
            WhatsApp is fine too
          </label>
          <Field id={form.id("note")} label="Short note" optional error={e.note}>
            <textarea className="field" rows={2} maxLength={300} value={v.note} onChange={(x) => set("note", x.target.value)} {...describe(form.id("note"), e.note)} />
          </Field>
        </div>
      </details>

      {serverError && (
        <p role="alert" className="border-2 border-danger bg-danger/10 p-3 text-sm font-semibold text-danger">
          {serverError}
        </p>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 border-t-2 border-ink bg-warm px-5 py-4 md:-mx-6 md:px-6">
        <button type="submit" className="btn btn-lime btn-lg w-full" disabled={submitting} aria-busy={submitting} data-cursor="cta">
          {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <PhoneCall className="size-5" aria-hidden="true" />}
          {submitting ? "Saving…" : "Request callback"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation                                                        */
/* ------------------------------------------------------------------ */

export function EnquiryConfirmation({ enquiry, listing, onClose }: { enquiry: StudentEnquiry; listing: Listing | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const isCallback = enquiry.type === "callback";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
      role="status"
    >
      <div className="flex items-center gap-4">
        <motion.span
          initial={reduce ? false : { scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
          className="grid size-14 shrink-0 place-items-center border-2 border-ink bg-lime"
        >
          <Check className="size-8" strokeWidth={3} aria-hidden="true" />
        </motion.span>
        <div>
          <p className="display text-3xl">{isCallback ? "Callback requested" : "Enquiry sent"}</p>
          <p className="text-sm text-muted">Received {formatDate(enquiry.createdAt)}</p>
        </div>
      </div>

      <div className="border-2 border-ink bg-ink p-5 text-warm">
        <p className="label text-lime">Your reference</p>
        <p className="price mt-1 font-display text-4xl font-extrabold tracking-wide md:text-5xl">{enquiry.id}</p>
        <button
          type="button"
          className="btn btn-sm mt-4"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(enquiry.id);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy reference"}
        </button>
      </div>

      <ListingSummary listing={listing} />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">Looking for</dt>
        <dd className="font-semibold">{REQUIREMENT_LABELS[enquiry.accommodationRequirement]}</dd>
        <dt className="text-muted">People</dt>
        <dd className="font-semibold">{enquiry.groupSize}</dd>
        <dt className="text-muted">Move-in</dt>
        <dd className="font-semibold">{enquiry.moveInFlexible ? "Flexible" : formatDate(enquiry.moveInDate)}</dd>
        {enquiry.preferredCallbackTime && (
          <>
            <dt className="text-muted">Call time</dt>
            <dd className="font-semibold">{enquiry.preferredCallbackTime}</dd>
          </>
        )}
      </dl>

      <div className="border-2 border-ink bg-lime/40 p-4 text-sm">
        <p className="font-bold">What happens next</p>
        <p className="mt-1">
          {isCallback
            ? `The REHLO team will call you${enquiry.preferredCallbackTime && enquiry.preferredCallbackTime !== "Any time" ? ` in the ${enquiry.preferredCallbackTime.toLowerCase()}` : ""}. Keep your reference handy.`
            : "The REHLO team will check availability and get back to you, usually within a day. Quote your reference if you follow up."}
        </p>
      </div>

      <button type="button" className="btn btn-ink btn-lg" onClick={onClose}>
        Back to browsing
      </button>
    </motion.div>
  );
}

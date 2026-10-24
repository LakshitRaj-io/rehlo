"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { FURNISHING, GENDER_RESTRICTIONS } from "@/types";
import { AMENITIES, LOCALITIES, YEARS_OF_STUDY } from "@/data/site";
import { VACANCY_TYPES, vacancyFormSchema, type VacancyFormValues } from "@/lib/validation";
import { MAX_IMAGES, MAX_VIDEOS } from "@/lib/media";
import { useZodForm } from "@/lib/use-zod-form";
import { todayISO } from "@/lib/utils";
import { createVacancyUpload, submitVacancy } from "@/app/actions/public";
import { ChoiceGroup, describe, Field, FieldError } from "@/components/ui/field";
import { MediaUploader } from "./media-uploader";

const INITIAL = {
  ownerName: "",
  phone: "",
  email: "",
  yearOfStudy: "",
  locality: "",
  accommodationType: "",
  rooms: "1",
  flatmates: "",
  monthlyRent: "",
  deposit: "",
  furnishing: "",
  availableFrom: "",
  genderRestriction: "",
  amenities: [],
  description: "",
  acknowledge: false,
} as unknown as VacancyFormValues;

/** Public form: a student posts a room or bed that's free in the flat they live in. */
export function VacancyForm() {
  const form = useZodForm(vacancyFormSchema, INITIAL, "vac");
  const { values: v, set, errors: e } = form;
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [uploading, setUploading] = useState({ image: false, video: false });
  const [state, setState] = useState<"idle" | "sending" | { ref: string }>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const lock = useRef(false);
  const reduce = useReducedMotion();
  const busy = uploading.image || uploading.video;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (lock.current || busy) return;
    if (!form.validate()) return;
    lock.current = true;
    setState("sending");
    setServerError(null);
    submitVacancy(form.values, { images, videos })
      .then((r) => {
        if (r.ok) return setState({ ref: r.data.ref });
        form.setErrors(r.errors);
        setServerError(r.message ?? (Object.keys(r.errors).length ? null : "Something went wrong. Please try again."));
        setState("idle");
      })
      .catch(() => {
        setServerError("We couldn't reach the server. Check your connection and try again.");
        setState("idle");
      })
      .finally(() => {
        lock.current = false;
      });
  };

  if (typeof state === "object") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-2 border-ink bg-warm p-6 shadow-[var(--shadow-hard-lg)] md:p-10"
        role="status"
      >
        <span className="grid size-16 place-items-center border-2 border-ink bg-lime">
          <Check className="size-9" strokeWidth={3} aria-hidden="true" />
        </span>
        <p className="display mt-6 text-5xl md:text-6xl">Vacancy received.</p>
        <p className="mt-2 text-muted">Reference</p>
        <p className="price font-display text-3xl font-extrabold">{state.ref}</p>
        <div className="mt-6 border-2 border-ink bg-lime/40 p-4">
          <p className="font-bold">What happens next</p>
          <p className="mt-1 text-sm">
            A REHLO agent will call you to check the details and arrange a quick visit. It goes live only after that, and
            every enquiry comes through us, so your number is never shown publicly.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-ink">
            Back to home
          </Link>
          <button
            type="button"
            className="btn"
            onClick={() => {
              form.reset();
              setImages([]);
              setVideos([]);
              setState("idle");
            }}
          >
            Post another vacancy
          </button>
        </div>
      </motion.div>
    );
  }

  const section = "flex flex-col gap-4 border-t-2 border-ink pt-6";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8 border-2 border-ink bg-warm p-5 shadow-[var(--shadow-hard-lg)] md:p-8">
      <section className="flex flex-col gap-4" aria-labelledby="vac-you">
        <h2 id="vac-you" className="font-display text-2xl font-extrabold">You</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={form.id("ownerName")} label="Your name" error={e.ownerName}>
            <input className="field" autoComplete="name" value={v.ownerName} onChange={(x) => set("ownerName", x.target.value)} {...describe(form.id("ownerName"), e.ownerName)} />
          </Field>
          <Field id={form.id("phone")} label="Mobile number" error={e.phone} hint="Only REHLO sees this">
            <input className="field price" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={(x) => set("phone", x.target.value)} {...describe(form.id("phone"), e.phone, true)} />
          </Field>
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

      <section className={section} aria-labelledby="vac-room">
        <h2 id="vac-room" className="font-display text-2xl font-extrabold">The vacancy</h2>
        <ChoiceGroup
          id={form.id("accommodationType")}
          legend="What's free?"
          options={VACANCY_TYPES}
          value={v.accommodationType as (typeof VACANCY_TYPES)[number] | ""}
          onChange={(val) => set("accommodationType", val)}
          error={e.accommodationType}
        />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field id={form.id("locality")} label="Locality" error={e.locality}>
            <select className="field" value={v.locality} onChange={(x) => set("locality", x.target.value)} {...describe(form.id("locality"), e.locality)}>
              <option value="">Choose…</option>
              {LOCALITIES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field id={form.id("rooms")} label="Spots free" error={e.rooms} hint="Beds or rooms open">
            <input className="field price" type="number" inputMode="numeric" min={1} max={10} value={v.rooms} onChange={(x) => set("rooms", x.target.value)} {...describe(form.id("rooms"), e.rooms, true)} />
          </Field>
          <Field id={form.id("flatmates")} label="People already living there" error={e.flatmates}>
            <input className="field price" type="number" inputMode="numeric" min={0} max={20} value={v.flatmates} onChange={(x) => set("flatmates", x.target.value)} {...describe(form.id("flatmates"), e.flatmates)} />
          </Field>
          <Field id={form.id("availableFrom")} label="Available from" optional>
            <input className="field" type="date" min={todayISO()} value={v.availableFrom} onChange={(x) => set("availableFrom", x.target.value)} id={form.id("availableFrom")} />
          </Field>
          <Field id={form.id("genderRestriction")} label="Open to" optional>
            <select className="field" value={v.genderRestriction} onChange={(x) => set("genderRestriction", x.target.value as VacancyFormValues["genderRestriction"])} id={form.id("genderRestriction")}>
              <option value="">Not specified</option>
              {GENDER_RESTRICTIONS.map((g) => (
                <option key={g} value={g}>{g === "Any" ? "Anyone" : g}</option>
              ))}
            </select>
          </Field>
        </div>
        <ChoiceGroup
          id={form.id("furnishing")}
          legend="Furnishing"
          options={FURNISHING}
          value={v.furnishing as (typeof FURNISHING)[number] | ""}
          onChange={(val) => set("furnishing", val)}
          error={e.furnishing}
        />
      </section>

      <section className={section} aria-labelledby="vac-money">
        <h2 id="vac-money" className="font-display text-2xl font-extrabold">Money</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={form.id("monthlyRent")} label="Rent per person, per month (₹)" error={e.monthlyRent}>
            <input className="field price" type="number" inputMode="numeric" min={0} step={100} value={v.monthlyRent} onChange={(x) => set("monthlyRent", x.target.value)} {...describe(form.id("monthlyRent"), e.monthlyRent)} />
          </Field>
          <Field id={form.id("deposit")} label="Deposit (₹)" optional error={e.deposit}>
            <input className="field price" type="number" inputMode="numeric" min={0} step={500} value={v.deposit} onChange={(x) => set("deposit", x.target.value)} {...describe(form.id("deposit"), e.deposit)} />
          </Field>
        </div>
      </section>

      <section className={section} aria-labelledby="vac-details">
        <h2 id="vac-details" className="font-display text-2xl font-extrabold">Details</h2>
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Amenities</legend>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const on = v.amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  className="chip"
                  aria-pressed={on}
                  onClick={() => set("amenities", on ? v.amenities.filter((x: string) => x !== a) : [...v.amenities, a])}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Field id={form.id("description")} label="About the room and flat" error={e.description} hint="Floor, who you live with, food, house rules, distance to campus">
          <textarea className="field" rows={4} maxLength={800} value={v.description} onChange={(x) => set("description", x.target.value)} {...describe(form.id("description"), e.description, true)} />
        </Field>
      </section>

      <section className={section} aria-labelledby="vac-media">
        <div>
          <h2 id="vac-media" className="font-display text-2xl font-extrabold">Photos and video</h2>
          <p className="text-sm text-muted">Optional, but vacancies with a quick walkthrough video get verified and filled faster.</p>
        </div>
        <MediaUploader kind="image" urls={images} onChange={setImages} max={MAX_IMAGES} getTicket={createVacancyUpload} onBusyChange={(b) => setUploading((u) => ({ ...u, image: b }))} />
        <MediaUploader kind="video" urls={videos} onChange={setVideos} max={MAX_VIDEOS} getTicket={createVacancyUpload} onBusyChange={(b) => setUploading((u) => ({ ...u, video: b }))} />
      </section>

      <div className="border-2 border-ink bg-paper p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            id={form.id("acknowledge")}
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-ink"
            checked={v.acknowledge === true}
            onChange={(x) => set("acknowledge", x.target.checked as true)}
            aria-describedby={e.acknowledge ? `${form.id("acknowledge")}-error` : undefined}
          />
          <span className="text-sm">
            I live in this flat and can share the room. I understand a REHLO agent will verify it before it&apos;s listed,
            and that all enquiries and deals go through REHLO.
          </span>
        </label>
        {e.acknowledge && (
          <div className="mt-2">
            <FieldError id={`${form.id("acknowledge")}-error`}>{e.acknowledge}</FieldError>
          </div>
        )}
      </div>

      {serverError && (
        <p role="alert" className="border-2 border-danger bg-danger/10 p-3 text-sm font-semibold text-danger">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-lime btn-lg w-full sm:w-auto sm:self-start"
        disabled={state === "sending" || busy}
        aria-busy={state === "sending"}
        data-cursor="cta"
      >
        {(state === "sending" || busy) && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {busy ? "Waiting for uploads…" : state === "sending" ? "Sending…" : "Post vacancy"}
      </button>
    </form>
  );
}

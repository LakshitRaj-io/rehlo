"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bug, Check, Droplets, Loader2, Plug, SprayCan, WashingMachine } from "lucide-react";
import { SERVICE_CATEGORY_META } from "@/data/services";
import { LOCALITIES } from "@/data/site";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/types";
import { serviceFormSchema, type ServiceFormValues } from "@/lib/validation";
import { useZodForm } from "@/lib/use-zod-form";
import { cn, todayISO } from "@/lib/utils";
import { submitServiceRequest } from "@/app/actions/public";
import { ChoiceGroup, describe, Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

const ICONS: Record<ServiceCategory, typeof Bug> = {
  cleaning: SprayCan,
  plumbing: Droplets,
  electrical: Plug,
  appliance: WashingMachine,
  "pest-control": Bug,
};

function isCategory(v: string | null): v is ServiceCategory {
  return !!v && (SERVICE_CATEGORIES as readonly string[]).includes(v);
}

export function ServicesView() {
  const params = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const raw = params.get("category");
  const category: ServiceCategory | "all" = isCategory(raw) ? raw : "all";
  const [active, setActive] = useState<{ category: ServiceCategory | "" } | null>(null);

  const shown = category === "all" ? SERVICE_CATEGORIES : [category];
  const pick = (c: ServiceCategory | "all") =>
    router.replace(c === "all" ? "/services" : `/services?category=${c}`, { scroll: false });

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 md:px-8 md:pt-14">
      <header className="mb-10 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <h1 className="display text-[clamp(2.8rem,8vw,7rem)]">
          Fix it.
          <br />
          Clean it.
          <br />
          <span className="outline-text">Sorted.</span>
        </h1>
        <div>
          <p className="text-lg">
            Pick what needs doing, tell us when, and keep your weekend. We&apos;ll confirm the price with you before anyone visits.
          </p>
          <button type="button" className="btn btn-lime btn-lg mt-6" onClick={() => setActive({ category: category === "all" ? "" : category })} data-cursor="cta">
            Request a service
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Service categories" className="mb-8 flex gap-2 overflow-x-auto border-b-2 border-ink pb-4">
        {(["all", ...SERVICE_CATEGORIES] as const).map((c) => {
          const Icon = c === "all" ? null : ICONS[c];
          const selected = category === c;
          return (
            <button
              key={c}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => pick(c)}
              className={cn("chip shrink-0 !min-h-11 !px-4", selected && "!bg-ink !text-lime")}
            >
              {Icon && <Icon className="size-4" aria-hidden="true" />}
              {c === "all" ? "Everything" : SERVICE_CATEGORY_META[c].label}
            </button>
          );
        })}
      </div>

      {category !== "all" && (
        <p className="mb-6 max-w-xl text-lg" aria-live="polite">
          <strong>{SERVICE_CATEGORY_META[category].label}:</strong> {SERVICE_CATEGORY_META[category].blurb}
        </p>
      )}

      <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" role="tabpanel" aria-label={category === "all" ? "All services" : SERVICE_CATEGORY_META[category].label}>
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((c) => {
            const Icon = ICONS[c];
            return (
              <motion.li
                key={c}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={() => setActive({ category: c })}
                  className="group flex h-full w-full flex-col border-2 border-ink bg-warm text-left shadow-[var(--shadow-hard)] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[var(--shadow-hard-lg)]"
                >
                  <span className="flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-3">
                    <span className="label">Home service</span>
                    <Icon className="size-6 transition-transform group-hover:rotate-12" aria-hidden="true" />
                  </span>
                  <span className="flex flex-1 flex-col gap-3 p-4">
                    <span className="font-display text-2xl font-extrabold leading-tight">{SERVICE_CATEGORY_META[c].label}</span>
                    <span className="text-muted">{SERVICE_CATEGORY_META[c].blurb}</span>
                  </span>
                  <span className="label border-t-2 border-ink px-4 py-3 transition-colors group-hover:bg-lime">Request this service</span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <p className="mt-10 max-w-2xl text-sm text-muted">
        Requests go to the REHLO team, who match you with a local professional and confirm the visit and price with you
        first. Nothing is booked until you agree.
      </p>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        size="lg"
        eyebrow={active?.category ? SERVICE_CATEGORY_META[active.category].label : "Home services"}
        title="Request a service"
      >
        {active && <ServiceRequestForm key={active.category || "general"} preset={active.category} onClose={() => setActive(null)} />}
      </Modal>
    </div>
  );
}

function ServiceRequestForm({ preset, onClose }: { preset: string; onClose: () => void }) {
  const initial = useMemo(
    () => ({ category: preset, locality: "", issue: "", date: "", contactPreference: "", contact: "" }) as unknown as ServiceFormValues,
    [preset],
  );
  const form = useZodForm(serviceFormSchema, initial, "svc");
  const { values: v, set, errors: e } = form;
  const [state, setState] = useState<"idle" | "sending" | { ref: string }>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const lock = useRef(false);
  const reduce = useReducedMotion();

  if (typeof state === "object") {
    return (
      <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5" role="status">
        <span className="grid size-14 place-items-center border-2 border-ink bg-lime">
          <Check className="size-8" strokeWidth={3} aria-hidden="true" />
        </span>
        <p className="display text-4xl">Request received</p>
        <p className="price border-2 border-ink bg-ink p-4 font-display text-3xl font-extrabold text-warm">{state.ref}</p>
        <p className="border-2 border-orange bg-orange/10 p-4 text-sm">
          We&apos;ll contact you to confirm the visit and the price. Nothing is booked until you agree. Quote this
          reference if you follow up.
        </p>
        <button type="button" className="btn btn-ink btn-lg" onClick={onClose}>
          Done
        </button>
      </motion.div>
    );
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (lock.current) return;
    if (!form.validate()) return;
    lock.current = true;
    setState("sending");
    setServerError(null);
    submitServiceRequest(form.values)
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

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field id={form.id("category")} label="Service" error={e.category}>
        <select className="field" value={v.category} onChange={(x) => set("category", x.target.value)} {...describe(form.id("category"), e.category)}>
          <option value="">Choose…</option>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SERVICE_CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={form.id("locality")} label="Your locality" error={e.locality}>
          <select className="field" value={v.locality} onChange={(x) => set("locality", x.target.value)} {...describe(form.id("locality"), e.locality)}>
            <option value="">Choose…</option>
            {LOCALITIES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field id={form.id("date")} label="Preferred date" error={e.date}>
          <input type="date" min={todayISO()} className="field" value={v.date} onChange={(x) => set("date", x.target.value)} {...describe(form.id("date"), e.date)} />
        </Field>
      </div>
      <Field id={form.id("issue")} label="What's the problem?" error={e.issue} hint="A sentence or two is plenty">
        <textarea className="field" rows={3} maxLength={500} value={v.issue} onChange={(x) => set("issue", x.target.value)} {...describe(form.id("issue"), e.issue, true)} />
      </Field>
      <ChoiceGroup
        id={form.id("contactPreference")}
        legend="How should we reach you?"
        options={["Phone call", "WhatsApp", "Email"] as const}
        value={v.contactPreference as "Phone call" | ""}
        onChange={(val) => set("contactPreference", val)}
        error={e.contactPreference}
      />
      <Field id={form.id("contact")} label={v.contactPreference === "Email" ? "Email address" : "Mobile number"} error={e.contact}>
        <input
          className="field"
          type={v.contactPreference === "Email" ? "email" : "tel"}
          value={v.contact}
          onChange={(x) => set("contact", x.target.value)}
          {...describe(form.id("contact"), e.contact)}
        />
      </Field>
      {serverError && (
        <p role="alert" className="border-2 border-danger bg-danger/10 p-3 text-sm font-semibold text-danger">
          {serverError}
        </p>
      )}
      <button type="submit" className="btn btn-lime btn-lg" disabled={state === "sending"} aria-busy={state === "sending"}>
        {state === "sending" && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {state === "sending" ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Check, ChevronDown, Copy, Inbox, Loader2, MessageCircle, Phone, Search, Trash2 } from "lucide-react";
import type { EnquiryStatus, EnquiryWithFeedback, StudentEnquiry } from "@/types";
import { addEnquiryFeedback, deleteEnquiry } from "@/app/actions/admin";
import { feedbackSchema } from "@/lib/validation";
import { useAdmin } from "./admin-context";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { REQUIREMENT_LABELS } from "@/lib/validation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { STATUS_META, StatusBadge } from "./status-badge";

const STATUS_TABS: { id: EnquiryStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "follow-up", label: "Follow-up required" },
  { id: "closed", label: "Closed" },
];

function moveIn(e: StudentEnquiry) {
  return e.moveInFlexible ? "Flexible" : formatDate(e.moveInDate);
}

export function enquirySummary(e: StudentEnquiry): string {
  return [
    `Student: ${e.fullName}`,
    `Phone: ${e.mobile}${e.whatsappPreferred ? " (WhatsApp OK)" : ""}`,
    `Year: ${e.yearOfStudy}`,
    `Requirement: ${REQUIREMENT_LABELS[e.accommodationRequirement] ?? e.accommodationRequirement}`,
    `Group size: ${e.groupSize}`,
    `Budget per person: ${e.budget}`,
    `Move-in: ${moveIn(e)}`,
    e.preferredCallbackTime ? `Call time: ${e.preferredCallbackTime}` : null,
    `Property: ${e.listingTitleSnapshot ?? "General enquiry"}`,
    `Enquiry ID: ${e.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function AdminEnquiries() {
  const { enquiries, isAdmin, dropEnquiry } = useAdmin();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<EnquiryStatus | "all">("all");
  const [q, setQ] = useState("");
  const [listingFilter, setListingFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "property-enquiry" | "callback">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<EnquiryWithFeedback | null>(null);

  const listingOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of enquiries) if (e.listingId) map.set(e.listingId, e.listingTitleSnapshot ?? e.listingId);
    return [...map.entries()];
  }, [enquiries]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: enquiries.length };
    for (const e of enquiries) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [enquiries]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/\s+/g, "");
    const r = enquiries.filter((e) => {
      if (tab !== "all" && e.status !== tab) return false;
      if (needle && !`${e.fullName}${e.mobile}${e.id}`.toLowerCase().replace(/\s+/g, "").includes(needle)) return false;
      if (listingFilter === "__none" && e.listingId) return false;
      if (listingFilter && listingFilter !== "__none" && e.listingId !== listingFilter) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      const day = e.createdAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
    return [...r].sort((a, b) => (sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
  }, [enquiries, tab, q, listingFilter, typeFilter, from, to, sort]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-5xl md:text-7xl">Enquiries</h1>

      <div role="tablist" aria-label="Filter by status" className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("chip shrink-0", tab === t.id && "!bg-ink !text-lime")}
          >
            {t.label}
            <span className="price text-xs opacity-80">{counts[t.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 border-2 border-ink bg-warm p-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr_1fr]">
        <div className="relative">
          <label htmlFor="enq-q" className="sr-only">Search by name, phone or enquiry ID</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
          <input id="enq-q" type="search" className="field pl-9" placeholder="Name, phone or ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label htmlFor="enq-listing" className="sr-only">Listing</label>
        <select id="enq-listing" className="field" value={listingFilter} onChange={(e) => setListingFilter(e.target.value)}>
          <option value="">All listings</option>
          <option value="__none">General (no listing)</option>
          {listingOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
        <label htmlFor="enq-type" className="sr-only">Request type</label>
        <select id="enq-type" className="field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
          <option value="">All types</option>
          <option value="property-enquiry">Enquiries</option>
          <option value="callback">Callbacks</option>
        </select>
        <div className="relative">
          <label htmlFor="enq-from" className="label pointer-events-none absolute -top-2 left-2 bg-warm px-1 !text-[0.65rem]">From</label>
          <input id="enq-from" type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="relative">
          <label htmlFor="enq-to" className="label pointer-events-none absolute -top-2 left-2 bg-warm px-1 !text-[0.65rem]">To</label>
          <input id="enq-to" type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <label htmlFor="enq-sort" className="sr-only">Sort</label>
        <select id="enq-sort" className="field" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {enquiries.length === 0 ? (
        <div className="border-2 border-dashed border-ink p-10 text-center">
          <Inbox className="mx-auto size-10" aria-hidden="true" />
          <p className="display mt-3 text-3xl">No enquiries yet</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Enquiries and callback requests from the public site land here, for every agent to pick up.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="border-2 border-dashed border-ink p-10 text-center">
          <p className="display text-3xl">No enquiries match</p>
          <p className="mt-2 text-muted">Clear the search or filters to see more.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((e) => {
            const open = expanded === e.id;
            // listing_id is cleared when a listing is deleted; the title snapshot stays.
            const removed = e.listingId == null && e.listingTitleSnapshot != null;
            return (
              <motion.li key={e.id} layout={!reduce} className={cn("border-2 border-ink bg-warm", open && "shadow-[var(--shadow-hard)]")}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`enq-${e.id}`}
                  onClick={() => setExpanded(open ? null : e.id)}
                  className="grid w-full gap-x-4 gap-y-1 p-4 text-left md:grid-cols-[9rem_1.3fr_1.6fr_1fr_auto] md:items-center"
                >
                  <span className="flex flex-col">
                    <span className="price font-bold">{e.id}</span>
                    <span className="text-xs text-muted">{formatDateTime(e.createdAt)}</span>
                  </span>
                  <span className="flex flex-col">
                    <span className="font-display text-lg font-extrabold leading-tight">{e.fullName}</span>
                    <span className="price text-sm">{e.mobile}</span>
                    <span className="text-xs text-muted">{e.yearOfStudy}</span>
                  </span>
                  <span className="flex flex-col text-sm">
                    <span className="flex flex-wrap items-center gap-1.5 font-semibold">
                      {e.listingTitleSnapshot ?? "General enquiry"}
                      {removed && (
                        <span className="inline-flex items-center gap-1 border-2 border-ink bg-orange px-1 text-xs font-bold">
                          <AlertTriangle className="size-3" aria-hidden="true" /> Listing removed
                        </span>
                      )}
                    </span>
                    <span className="text-muted">
                      {REQUIREMENT_LABELS[e.accommodationRequirement]}, {e.groupSize} {e.groupSize === 1 ? "person" : "people"}, {e.budget}
                    </span>
                    <span className="text-muted">Move-in: {moveIn(e)}</span>
                    {e.feedback.length > 0 && (
                      <span className="mt-0.5 text-xs text-muted">
                        Last update by {e.feedback[e.feedback.length - 1].authorName}, {formatDateTime(e.feedback[e.feedback.length - 1].createdAt)}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className={cn("inline-flex items-center gap-1 border-2 border-ink px-1.5 py-0.5 text-xs font-bold", e.type === "callback" ? "bg-ink text-warm" : "bg-paper")}>
                      {e.type === "callback" && <Phone className="size-3" aria-hidden="true" />}
                      {e.type === "callback" ? "Callback" : "Enquiry"}
                    </span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={e.status} initial={reduce ? false : { y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <StatusBadge status={e.status} />
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <ChevronDown className={cn("hidden size-5 transition-transform md:block", open && "rotate-180")} aria-hidden="true" />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`enq-${e.id}`}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <EnquiryDetail enquiry={e} onDelete={isAdmin ? () => setDeleting(e) : undefined} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this enquiry?"
        confirmLabel="Delete enquiry"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          const target = deleting;
          setDeleting(null);
          if (!target) return;
          try {
            const r = await deleteEnquiry(target.id);
            if (!r.ok) return toast(r.message ?? "Couldn't delete the enquiry.", "info");
            dropEnquiry(target.id);
            toast(`Deleted ${target.id}.`);
          } catch {
            toast("Couldn't reach the server. Try again.", "info");
          }
        }}
      >
        <p>
          <strong>{deleting?.id}</strong> from {deleting?.fullName} will be removed permanently, with its feedback history.
          Use this for spam or test submissions; for real ones, mark them closed instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}

const STATUS_CHOICES: { id: EnquiryStatus; label: string }[] = [
  { id: "contacted", label: "Contacted" },
  { id: "follow-up", label: "Follow-up required" },
  { id: "closed", label: "Closed" },
  { id: "new", label: "Back to new" },
];

function waLink(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

function EnquiryDetail({ enquiry: e, onDelete }: { enquiry: EnquiryWithFeedback; onDelete?: () => void }) {
  const { putEnquiry } = useAdmin();
  const [status, setStatus] = useState<EnquiryStatus>(e.status === "new" ? "contacted" : e.status);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const rows: [string, string | null][] = [
    ["Request type", e.type === "callback" ? "Callback request" : "Property enquiry"],
    ["Email", e.email],
    ["WhatsApp preferred", e.whatsappPreferred ? "Yes" : "No"],
    ["Who it's for", e.occupantsFor],
    ["Preferred locality", e.preferredLocality],
    ["Preferred bedrooms", e.preferredBedrooms != null ? String(e.preferredBedrooms) : null],
    ["Whole flat together", e.wholeFlatTogether == null ? null : e.wholeFlatTogether ? "Yes" : "No"],
    ["Vacancies needed", e.vacanciesNeeded != null ? String(e.vacanciesNeeded) : null],
    ["OK sharing common areas", e.sharedCommonAreasOk == null ? null : e.sharedCommonAreasOk ? "Yes" : "No"],
    ["Joining", e.joiningWith],
    ["PG sharing", e.pgSharing],
    ["Meals required", e.mealsRequired == null ? null : e.mealsRequired ? "Yes" : "No"],
    ["Callback time", e.preferredCallbackTime],
    ["Additional requirements", e.additionalRequirements],
    ["Last updated", formatDateTime(e.updatedAt)],
  ];

  const save = async () => {
    const parsed = feedbackSchema.safeParse({ status, body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the note");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await addEnquiryFeedback(e.id, parsed.data);
      if (!r.ok) {
        setError(r.errors.body ?? r.message ?? "Couldn't save. Try again.");
        return;
      }
      putEnquiry(r.data.enquiry, r.data.feedback);
      setBody("");
      toast(`${e.id} marked ${STATUS_META[r.data.enquiry.status].label.toLowerCase()}.`);
    } catch {
      setError("Couldn't reach the server. Your note is still here; try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 border-t-2 border-ink bg-paper p-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${e.mobile}`} className="btn btn-sm btn-lime">
            <Phone className="size-4" aria-hidden="true" />
            Call {e.mobile}
          </a>
          {e.whatsappPreferred && (
            <a href={waLink(e.mobile)} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          )}
        </div>
        <dl className="grid grid-cols-[minmax(0,9rem)_1fr] content-start gap-x-4 gap-y-1.5 text-sm">
          {rows
            .filter(([, v]) => v != null && v !== "")
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold [overflow-wrap:anywhere]">{v}</dd>
              </div>
            ))}
        </dl>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <section aria-labelledby={`fb-${e.id}`}>
          <h3 id={`fb-${e.id}`} className="label mb-2">Feedback history</h3>
          {e.feedback.length === 0 ? (
            <p className="border-2 border-dashed border-ink/40 p-3 text-sm text-muted">Nobody has followed up yet.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {e.feedback.map((f) => (
                <li key={f.id} className="border-2 border-ink bg-warm p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={f.status} />
                    <span className="font-bold">{f.authorName}</span>
                    <span className="text-xs text-muted">{formatDateTime(f.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line [overflow-wrap:anywhere]">{f.body}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <fieldset className="flex flex-col gap-3 border-2 border-ink bg-warm p-3">
          <legend className="label px-1">Add an update</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="New status">
            {STATUS_CHOICES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={status === c.id}
                className={cn("chip", status === c.id && "!bg-ink !text-lime")}
                onClick={() => setStatus(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <label htmlFor={`fb-body-${e.id}`} className="text-sm font-bold">
            What did the student say?
          </label>
          <textarea
            id={`fb-body-${e.id}`}
            className="field"
            rows={3}
            maxLength={1000}
            value={body}
            onChange={(x) => {
              setBody(x.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Called at 4pm. Interested, wants to visit Saturday. Budget firm at ₹9k."
            aria-invalid={error ? true : undefined}
          />
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <button type="button" className="btn btn-lime self-start" disabled={saving} onClick={save}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save update
          </button>
        </fieldset>

        <div className="flex flex-wrap gap-2 border-t-2 border-dashed border-ink/30 pt-4">
          <button
            type="button"
            className="btn btn-sm"
            onClick={async () => {
              const ok = await copyText(enquirySummary(e));
              setCopied(ok);
              toast(ok ? "Details copied for follow-up." : "Couldn't copy. Select the details manually.", ok ? "success" : "info");
              if (ok) window.setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy details"}
          </button>
          {onDelete && (
            <button type="button" className="btn btn-sm btn-ghost !border-danger !text-danger" onClick={onDelete}>
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

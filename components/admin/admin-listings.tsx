"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BedSingle, Eye, EyeOff, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import type { Listing } from "@/types";
import { ACCOMMODATION_TYPES } from "@/types";
import { assignListing, deleteListing, setListingPublished } from "@/app/actions/admin";
import { useAdmin } from "./admin-context";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { SafeImage } from "@/components/ui/safe-image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { ListingCard, vacancyText } from "@/components/listings/listing-card";
import { StayDetail } from "@/components/listings/stay-detail";
import { ListingEditor, type ListingKind } from "./listing-editor";
import { PublishBadge } from "./status-badge";

type SortKey = "updated" | "rent-asc" | "rent-desc" | "title";

function Checks({ l }: { l: Listing }) {
  return (
    <ul className="flex flex-col gap-0.5 text-xs font-semibold">
      <li className={l.ownerIdentityChecked ? "text-success" : "text-muted"}>
        {l.ownerIdentityChecked ? "✓ Landlord verified" : "○ Landlord not verified"}
      </li>
      <li className={l.listingDetailsReviewed ? "text-success" : "text-muted"}>
        {l.listingDetailsReviewed ? "✓ Details checked" : "○ Details not checked"}
      </li>
    </ul>
  );
}

export function AdminListings({ onCreate }: { onCreate: (kind: ListingKind) => void }) {
  const { listings, enquiries, isAdmin, agents, agentName, putListing, dropListing } = useAdmin();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft" | "vacancies" | "vacancy">("all");
  const [type, setType] = useState("");
  const [checks, setChecks] = useState<"" | "none" | "partial" | "both">("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [editing, setEditing] = useState<Listing | null>(null);
  const [previewing, setPreviewing] = useState<Listing | null>(null);
  const [previewMode, setPreviewMode] = useState<"card" | "page">("card");
  const [deleting, setDeleting] = useState<Listing | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = listings.filter((l) => {
      if (needle && !`${l.title} ${l.locality} ${l.slug} ${l.ownerName ?? ""} ${agentName(l.agentId)}`.toLowerCase().includes(needle)) return false;
      if (status === "published" && !l.published) return false;
      if (status === "draft" && l.published) return false;
      if (status === "vacancies" && !l.isVacancy) return false;
      if (status === "vacancy" && l.source !== "public-vacancy") return false;
      if (type && l.accommodationType !== type) return false;
      const n = Number(l.ownerIdentityChecked) + Number(l.listingDetailsReviewed);
      if (checks === "none" && n !== 0) return false;
      if (checks === "partial" && n !== 1) return false;
      if (checks === "both" && n !== 2) return false;
      return true;
    });
    return [...r].sort((a, b) => {
      if (sort === "rent-asc") return a.monthlyRent - b.monthlyRent;
      if (sort === "rent-desc") return b.monthlyRent - a.monthlyRent;
      if (sort === "title") return a.title.localeCompare(b.title);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [listings, q, status, type, checks, sort, agentName]);

  const togglePublish = async (l: Listing) => {
    try {
      const r = await setListingPublished(l.id, !l.published);
      if (!r.ok) return toast(r.message ?? "Couldn't change the listing.", "info");
      putListing(r.data);
      toast(l.published ? `Unpublished “${l.title}”. Students can't see it now.` : `Published “${l.title}”.`);
    } catch {
      toast("Couldn't reach the server. Try again.", "info");
    }
  };

  const assign = async (l: Listing, agentId: string) => {
    try {
      const r = await assignListing(l.id, agentId || null);
      if (!r.ok) return toast(r.message ?? "Couldn't assign the listing.", "info");
      putListing(r.data);
      toast(agentId ? `Assigned to ${agentName(agentId)}.` : "Unassigned.");
    } catch {
      toast("Couldn't reach the server. Try again.", "info");
    }
  };

  const owner = (l: Listing) =>
    isAdmin ? (
      <label className="flex flex-col gap-1 text-xs font-semibold">
        <span className="sr-only">Assigned agent for {l.title}</span>
        <select className="field !min-h-9 !py-1 text-sm" value={l.agentId ?? ""} onChange={(e) => assign(l, e.target.value)}>
          <option value="">{l.source === "public-vacancy" ? "Unassigned" : "Site admin"}</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id} disabled={!a.active}>
              {a.displayName}
              {a.active ? "" : " (inactive)"}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  const sourceTag = (l: Listing) =>
    l.source === "public-vacancy" ? (
      <span className="label border-2 border-ink bg-orange px-1.5 py-0.5">Student vacancy</span>
    ) : l.isVacancy ? (
      <span className="label border-2 border-ink bg-lime px-1.5 py-0.5">Vacancy</span>
    ) : null;

  const linkedCount = deleting ? enquiries.filter((e) => e.listingId === deleting.id).length : 0;

  const renderActions = (l: Listing) => (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" className="btn btn-sm" onClick={() => setEditing(l)} aria-label={`Edit ${l.title}`}>
        <Pencil className="size-3.5" aria-hidden="true" />
        Edit
      </button>
      <button type="button" className="btn btn-sm" onClick={() => { setPreviewMode("card"); setPreviewing(l); }} aria-label={`Preview ${l.title}`}>
        <Eye className="size-3.5" aria-hidden="true" />
        Preview
      </button>
      <button type="button" className={cn("btn btn-sm", !l.published && "btn-lime")} onClick={() => togglePublish(l)}>
        {l.published ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Send className="size-3.5" aria-hidden="true" />}
        {l.published ? "Unpublish" : "Publish"}
      </button>
      <button type="button" className="btn btn-sm btn-ghost !border-danger !text-danger" onClick={() => setDeleting(l)} aria-label={`Delete ${l.title}`}>
        <Trash2 className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="display text-5xl md:text-7xl">{isAdmin ? "Listings" : "My listings"}</h1>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-lime btn-lg" onClick={() => onCreate("listing")} data-cursor="cta">
            <Plus className="size-5" strokeWidth={3} aria-hidden="true" />
            Add listing
          </button>
          <button type="button" className="btn btn-lg" onClick={() => onCreate("vacancy")}>
            <BedSingle className="size-5" aria-hidden="true" />
            Add vacancy
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="grid gap-3 border-2 border-ink bg-warm p-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="relative">
          <label htmlFor="adm-q" className="sr-only">Search listings</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
          <input id="adm-q" type="search" className="field pl-9" placeholder={isAdmin ? "Search title, locality, agent" : "Search title or locality"} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="sr-only" htmlFor="adm-status">Status</label>
        <select id="adm-status" className="field" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="vacancies">Vacancies</option>
          {isAdmin && <option value="vacancy">Student vacancies</option>}
        </select>
        <label className="sr-only" htmlFor="adm-type">Type</label>
        <select id="adm-type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {ACCOMMODATION_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="adm-checks">Checks</label>
        <select id="adm-checks" className="field" value={checks} onChange={(e) => setChecks(e.target.value as typeof checks)}>
          <option value="">Any checks</option>
          <option value="none">No checks done</option>
          <option value="partial">One check done</option>
          <option value="both">Both checks done</option>
        </select>
        <label className="sr-only" htmlFor="adm-sort">Sort</label>
        <select id="adm-sort" className="field" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="updated">Last updated</option>
          <option value="rent-asc">Rent: low to high</option>
          <option value="rent-desc">Rent: high to low</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        Showing {rows.length} of {listings.length} listings
      </p>

      {rows.length === 0 ? (
        <div className="border-2 border-dashed border-ink p-10 text-center">
          <p className="display text-3xl">No listings match</p>
          <p className="mt-2 text-muted">{listings.length === 0 ? "Nothing here yet. Add your first listing." : "Change the filters, or add a new listing."}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto border-2 border-ink bg-warm shadow-[var(--shadow-hard)] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink text-warm">
                <tr>
                  {["Photo", "Listing", "Type", "Rent", "Occupancy", "Checks", "Status", ...(isAdmin ? ["Agent"] : []), "Updated", "Actions"].map((h) => (
                    <th key={h} scope="col" className="label px-3 py-3 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((l) => (
                    <motion.tr
                      key={l.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn("border-t-2 border-ink/15 align-top", !l.published && "bg-paper")}
                    >
                      <td className="px-3 py-3">
                        <SafeImage src={l.images[0]} alt="" className="h-14 w-20 border-2 border-ink" />
                      </td>
                      <td className="max-w-[16rem] px-3 py-3">
                        <p className="font-display text-base font-extrabold leading-tight">{l.title}</p>
                        <p className="text-muted">{l.locality}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">/{l.slug}</p>
                        <div className="mt-1">{sourceTag(l)}</div>
                      </td>
                      <td className="px-3 py-3 font-semibold">{l.accommodationType}</td>
                      <td className="price px-3 py-3 font-bold">{formatINR(l.monthlyRent)}</td>
                      <td className="px-3 py-3">{vacancyText(l)}</td>
                      <td className="px-3 py-3"><Checks l={l} /></td>
                      <td className="px-3 py-3"><PublishBadge published={l.published} /></td>
                      {isAdmin && <td className="min-w-[10rem] px-3 py-3">{owner(l)}</td>}
                      <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(l.updatedAt)}</td>
                      <td className="px-3 py-3">{renderActions(l)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-4 lg:hidden">
            {rows.map((l) => (
              <li key={l.id} className={cn("border-2 border-ink p-3 shadow-[var(--shadow-hard-sm)]", l.published ? "bg-warm" : "bg-paper")}>
                <div className="flex gap-3">
                  <SafeImage src={l.images[0]} alt="" className="size-20 shrink-0 border-2 border-ink" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PublishBadge published={l.published} />
                      {sourceTag(l)}
                      <span className="text-xs font-bold">{l.accommodationType}</span>
                    </div>
                    <p className="mt-1 font-display text-lg font-extrabold leading-tight">{l.title}</p>
                    <p className="price text-sm">
                      {l.locality}, {formatINR(l.monthlyRent)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-2 border-t-2 border-dashed border-ink/20 pt-3 text-sm">
                  <Checks l={l} />
                  <div className="text-right text-xs text-muted">
                    <p>{vacancyText(l)}</p>
                    <p>Updated {formatDate(l.updatedAt)}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="mt-3">
                    {owner(l)}
                  </div>
                )}
                <div className="mt-3">
                  {renderActions(l)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ListingEditor open={editing !== null} listing={editing} onClose={() => setEditing(null)} />

      <Modal
        open={previewing !== null}
        onClose={() => setPreviewing(null)}
        size="xl"
        tone="paper"
        eyebrow={previewing?.published ? "Live for students" : "Draft: students can't see this yet"}
        title="Student preview"
      >
        {previewing && (
          <div className="flex flex-col gap-5">
            <div role="tablist" aria-label="Preview type" className="flex gap-2">
              {(["card", "page"] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={previewMode === m} className={cn("chip", previewMode === m && "!bg-ink !text-lime")} onClick={() => setPreviewMode(m)}>
                  {m === "card" ? "Listing card" : "Detail page"}
                </button>
              ))}
            </div>
            {previewMode === "card" ? (
              <div className="max-w-sm">
                <ListingCard listing={previewing} preview />
              </div>
            ) : (
              <div className="-mx-5 border-y-2 border-ink bg-paper md:-mx-6">
                <StayDetail listing={previewing} preview />
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete listing?"
        confirmLabel="Delete listing"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const target = deleting;
          setDeleting(null);
          try {
            const r = await deleteListing(target.id);
            if (!r.ok) return toast(r.message ?? "Couldn't delete the listing.", "info");
            dropListing(target.id);
            toast(`Deleted “${target.title}”.`);
          } catch {
            toast("Couldn't reach the server. Try again.", "info");
          }
        }}
      >
        <p>
          <strong>{deleting?.title}</strong> will be removed from the staff area and the public site, along with its uploaded
          photos and videos. This can&apos;t be undone.
        </p>
        {linkedCount > 0 ? (
          <p className="border-2 border-ink bg-lime/40 p-3 text-sm">
            {linkedCount} {linkedCount === 1 ? "enquiry is" : "enquiries are"} linked to it. They&apos;ll be kept, with the
            listing title saved, and marked “listing removed”.
          </p>
        ) : (
          <p className="text-sm text-muted">No enquiries are linked to this listing.</p>
        )}
      </ConfirmDialog>
    </div>
  );
}

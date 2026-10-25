"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, UserCheck, ClipboardCheck } from "lucide-react";
import type { Listing } from "@/types";
import { ACCOMMODATION_TYPES, FURNISHING, GENDER_RESTRICTIONS } from "@/types";
import { AMENITIES, LOCALITIES } from "@/data/site";
import { createStaffUpload, saveListing } from "@/app/actions/admin";
import { MAX_IMAGES, MAX_VIDEOS } from "@/lib/media";
import { listingFormSchema, type ListingFormValues } from "@/lib/validation";
import { listingToFormValues } from "@/lib/records";
import { useZodForm } from "@/lib/use-zod-form";
import { cn, isValidHttpUrl, slugify, vacancies } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { describe, Field, FieldError } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ListingCard } from "@/components/listings/listing-card";
import { MediaUploader } from "@/components/forms/media-uploader";
import { useAdmin } from "./admin-context";

const n = (v: string) => (v.trim() === "" ? null : Number(v));

type Props = { open: boolean; listing: Listing | null; onClose: () => void; onSaved?: () => void };

export function ListingEditor({ open, listing, onClose, onSaved }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      tone="paper"
      eyebrow={listing ? (listing.published ? "Editing a published listing" : "Editing a draft") : "New listing"}
      title={listing ? listing.title : "Add listing"}
    >
      {open && <EditorBody key={listing?.id ?? "new"} listing={listing} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="flex flex-col gap-4 border-2 border-ink bg-warm p-4 md:p-5">
      <div>
        <h3 className="font-display text-xl font-extrabold">{title}</h3>
        {note && <p className="text-sm text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function EditorBody({ listing, onClose, onSaved }: { listing: Listing | null; onClose: () => void; onSaved?: () => void }) {
  const initial = useMemo(() => listingToFormValues(listing), [listing]);
  const form = useZodForm(listingFormSchema, initial, "lst");
  const { values: v, set, errors: e, setErrors } = form;
  const [slugTouched, setSlugTouched] = useState(!!listing);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ image: false, video: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const lock = useRef(false);
  const { staff, isAdmin, putListing } = useAdmin();
  const busy = uploading.image || uploading.video;

  const vac = vacancies(n(v.capacity), n(v.occupied));

  /** Local copy of the form as a Listing, used only for the live card preview. The server builds the saved record. */
  const preview = (published: boolean): Listing => {
    const now = new Date().toISOString();
    return {
      id: listing?.id ?? "preview",
      slug: v.slug.trim(),
      title: v.title.trim(),
      description: v.description.trim(),
      locality: v.locality.trim(),
      landmark: v.landmark.trim() || null,
      approxDistanceKm: n(v.approxDistanceKm),
      accommodationType: (v.accommodationType || "PG") as Listing["accommodationType"],
      furnishing: (v.furnishing || "Furnished") as Listing["furnishing"],
      sharingType: v.sharingType.trim(),
      monthlyRent: Number(v.monthlyRent) || 0,
      deposit: n(v.deposit),
      maintenance: n(v.maintenance),
      otherCharges: v.otherCharges.trim() || null,
      pricingNotes: v.pricingNotes.trim() || null,
      capacity: n(v.capacity),
      occupied: n(v.occupied),
      availableFrom: v.availableFrom || null,
      bedrooms: n(v.bedrooms),
      bathrooms: n(v.bathrooms),
      amenities: v.amenities,
      houseRules: v.houseRules.split("\n").map((r: string) => r.trim()).filter(Boolean),
      genderRestriction: v.genderRestriction || null,
      images: v.images,
      videos: v.videos,
      ownerName: v.ownerName.trim() || null,
      ownerContact: v.ownerContact.trim() || null,
      ownerIdentityChecked: v.ownerIdentityChecked,
      listingDetailsReviewed: v.listingDetailsReviewed,
      verificationNotes: v.verificationNotes.trim(),
      published,
      source: listing?.source ?? (isAdmin ? "admin" : "agent"),
      agentId: listing?.agentId ?? staff.id,
      createdAt: listing?.createdAt ?? now,
      updatedAt: now,
    };
  };

  const save = async (published: boolean, verb: string) => {
    if (lock.current || busy) return;
    if (!form.validate()) return;
    lock.current = true;
    setSaving(true);
    setServerError(null);
    try {
      const r = await saveListing(form.values, listing?.id ?? null, published);
      if (!r.ok) {
        setErrors(r.errors);
        const first = Object.keys(r.errors)[0];
        if (first) document.getElementById(`lst-${first}`)?.focus();
        setServerError(r.message ?? null);
        return;
      }
      putListing(r.data);
      toast(`${verb}: “${r.data.title}”${r.data.published ? "" : " (draft)"}`);
      onSaved?.();
      onClose();
    } catch {
      setServerError("Couldn't reach the server. Your changes are still here; try again.");
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };

  const addImage = (url: string) => {
    const u = url.trim();
    if (!isValidHttpUrl(u)) {
      setImageError("Use a full https:// image URL.");
      return;
    }
    if (v.images.length >= MAX_IMAGES) {
      setImageError(`Use up to ${MAX_IMAGES} photos.`);
      return;
    }
    if (v.images.includes(u)) {
      setImageError("That photo is already added.");
      return;
    }
    set("images", [...v.images, u]);
    setImageUrl("");
    setImageError(null);
  };

  const errorCount = Object.keys(e).length;

  return (
    <form
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        save(listing ? listing.published : true, listing ? "Updated" : "Published");
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <Section title="Basic information">
          <Field id={form.id("title")} label="Listing title" error={e.title}>
            <input
              className="field"
              value={v.title}
              data-autofocus
              onChange={(x) => {
                set("title", x.target.value);
                if (!slugTouched) set("slug", slugify(x.target.value));
              }}
              {...describe(form.id("title"), e.title)}
            />
          </Field>
          <Field id={form.id("slug")} label="URL slug" error={e.slug} hint={`Public link: /stay/${v.slug || "…"}`}>
            <div className="flex gap-2">
              <input
                className="field price"
                value={v.slug}
                onChange={(x) => {
                  setSlugTouched(true);
                  set("slug", x.target.value.toLowerCase());
                }}
                {...describe(form.id("slug"), e.slug, true)}
              />
              <button type="button" className="btn btn-sm shrink-0" onClick={() => { setSlugTouched(false); set("slug", slugify(v.title)); }}>
                From title
              </button>
            </div>
          </Field>
          <Field id={form.id("description")} label="Description" error={e.description}>
            <textarea className="field" rows={4} value={v.description} onChange={(x) => set("description", x.target.value)} {...describe(form.id("description"), e.description)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id={form.id("locality")} label="Locality" error={e.locality}>
              <input className="field" list="lst-localities" value={v.locality} onChange={(x) => set("locality", x.target.value)} {...describe(form.id("locality"), e.locality)} />
              <datalist id="lst-localities">
                {LOCALITIES.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </Field>
            <Field id={form.id("landmark")} label="Approximate address or landmark" optional>
              <input className="field" value={v.landmark} onChange={(x) => set("landmark", x.target.value)} id={form.id("landmark")} />
            </Field>
            <Field id={form.id("accommodationType")} label="Accommodation type" error={e.accommodationType}>
              <select className="field" value={v.accommodationType} onChange={(x) => set("accommodationType", x.target.value as ListingFormValues["accommodationType"])} {...describe(form.id("accommodationType"), e.accommodationType)}>
                <option value="">Choose…</option>
                {ACCOMMODATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t === "Flat" ? "Full flat" : t}</option>
                ))}
              </select>
            </Field>
            <Field id={form.id("furnishing")} label="Furnishing" error={e.furnishing}>
              <select className="field" value={v.furnishing} onChange={(x) => set("furnishing", x.target.value as ListingFormValues["furnishing"])} {...describe(form.id("furnishing"), e.furnishing)}>
                <option value="">Choose…</option>
                {FURNISHING.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field id={form.id("approxDistanceKm")} label="Rough distance to SRM KTR (km)" optional error={e.approxDistanceKm} hint="Shown as approximate">
              <input className="field price" type="number" min={0} step={0.1} value={v.approxDistanceKm} onChange={(x) => set("approxDistanceKm", x.target.value)} {...describe(form.id("approxDistanceKm"), e.approxDistanceKm, true)} />
            </Field>
          </div>
        </Section>

        <Section title="Pricing">
          <div className="grid gap-4 md:grid-cols-3">
            <Field id={form.id("monthlyRent")} label="Monthly rent per person (₹)" error={e.monthlyRent}>
              <input className="field price" type="number" min={0} step={100} value={v.monthlyRent} onChange={(x) => set("monthlyRent", x.target.value)} {...describe(form.id("monthlyRent"), e.monthlyRent)} />
            </Field>
            <Field id={form.id("deposit")} label="Security deposit (₹)" optional error={e.deposit}>
              <input className="field price" type="number" min={0} step={500} value={v.deposit} onChange={(x) => set("deposit", x.target.value)} {...describe(form.id("deposit"), e.deposit)} />
            </Field>
            <Field id={form.id("maintenance")} label="Maintenance / month (₹)" optional error={e.maintenance}>
              <input className="field price" type="number" min={0} step={100} value={v.maintenance} onChange={(x) => set("maintenance", x.target.value)} {...describe(form.id("maintenance"), e.maintenance)} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id={form.id("otherCharges")} label="Other mandatory charges" optional>
              <input className="field" value={v.otherCharges} onChange={(x) => set("otherCharges", x.target.value)} id={form.id("otherCharges")} placeholder="e.g. Electricity billed separately" />
            </Field>
            <Field id={form.id("pricingNotes")} label="Pricing notes" optional>
              <input className="field" value={v.pricingNotes} onChange={(x) => set("pricingNotes", x.target.value)} id={form.id("pricingNotes")} placeholder="e.g. Whole flat ₹26,000/month" />
            </Field>
          </div>
        </Section>

        <Section title="Occupancy" note="Vacancies are worked out from capacity minus occupied spaces.">
          <div className="grid gap-4 md:grid-cols-4">
            <Field id={form.id("capacity")} label="Total capacity" optional error={e.capacity}>
              <input className="field price" type="number" min={0} value={v.capacity} onChange={(x) => set("capacity", x.target.value)} {...describe(form.id("capacity"), e.capacity)} />
            </Field>
            <Field id={form.id("occupied")} label="Occupied spaces" optional error={e.occupied}>
              <input className="field price" type="number" min={0} value={v.occupied} onChange={(x) => set("occupied", x.target.value)} {...describe(form.id("occupied"), e.occupied)} />
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Available vacancies</span>
              <output className="price grid min-h-[2.9rem] items-center border-2 border-dashed border-ink bg-paper px-3 font-display text-xl font-extrabold" aria-live="polite">
                {vac == null ? "—" : vac}
              </output>
            </div>
            <Field id={form.id("availableFrom")} label="Available from" optional>
              <input className="field" type="date" value={v.availableFrom} onChange={(x) => set("availableFrom", x.target.value)} id={form.id("availableFrom")} />
            </Field>
          </div>
          <Field id={form.id("sharingType")} label="Occupancy arrangement" error={e.sharingType} hint="e.g. Twin sharing, Single occupancy, Whole flat (3–4 people)">
            <input className="field" value={v.sharingType} onChange={(x) => set("sharingType", x.target.value)} {...describe(form.id("sharingType"), e.sharingType, true)} />
          </Field>
        </Section>

        <Section title="Property details">
          <div className="grid gap-4 md:grid-cols-3">
            <Field id={form.id("bedrooms")} label="Bedrooms" optional error={e.bedrooms}>
              <input className="field price" type="number" min={0} value={v.bedrooms} onChange={(x) => set("bedrooms", x.target.value)} {...describe(form.id("bedrooms"), e.bedrooms)} />
            </Field>
            <Field id={form.id("bathrooms")} label="Bathrooms" optional error={e.bathrooms}>
              <input className="field price" type="number" min={0} value={v.bathrooms} onChange={(x) => set("bathrooms", x.target.value)} {...describe(form.id("bathrooms"), e.bathrooms)} />
            </Field>
            <Field id={form.id("genderRestriction")} label="Who it's open to" optional hint="Only if the owner states it">
              <select className="field" value={v.genderRestriction} onChange={(x) => set("genderRestriction", x.target.value as ListingFormValues["genderRestriction"])} id={form.id("genderRestriction")}>
                <option value="">Not specified</option>
                {GENDER_RESTRICTIONS.map((g) => (
                  <option key={g} value={g}>{g === "Any" ? "Open to all" : g}</option>
                ))}
              </select>
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-bold">Amenities</legend>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const on = v.amenities.includes(a);
                return (
                  <button key={a} type="button" className="chip" aria-pressed={on} onClick={() => set("amenities", on ? v.amenities.filter((x: string) => x !== a) : [...v.amenities, a])}>
                    {a}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Field id={form.id("houseRules")} label="House rules" optional hint="One rule per line">
            <textarea className="field" rows={3} value={v.houseRules} onChange={(x) => set("houseRules", x.target.value)} id={form.id("houseRules")} />
          </Field>
        </Section>

        <Section title="Photos" note={`Upload up to ${MAX_IMAGES}. The first photo is the cover.`}>
          <MediaUploader
            kind="image"
            urls={v.images}
            onChange={(urls) => set("images", urls)}
            max={MAX_IMAGES}
            getTicket={createStaffUpload}
            onBusyChange={(b) => setUploading((u) => ({ ...u, image: b }))}
            error={e.images}
            fieldId="lst-images"
          />
          <details className="border-2 border-ink">
            <summary className="label cursor-pointer px-3 py-2.5">Or add a photo by link</summary>
            <div className="flex flex-col gap-2 border-t-2 border-ink p-3 sm:flex-row">
              <label htmlFor="lst-image-url" className="sr-only">Image URL</label>
              <input
                id="lst-image-url"
                className="field"
                type="url"
                placeholder="https://…"
                value={imageUrl}
                onChange={(x) => { setImageUrl(x.target.value); setImageError(null); }}
                onKeyDown={(x) => { if (x.key === "Enter") { x.preventDefault(); addImage(imageUrl); } }}
                aria-invalid={imageError ? true : undefined}
                aria-describedby={imageError ? "lst-image-url-error" : undefined}
              />
              <button type="button" className="btn shrink-0" onClick={() => addImage(imageUrl)}>
                <ImagePlus className="size-4" aria-hidden="true" />
                Add link
              </button>
            </div>
            {imageError && <div className="px-3 pb-3"><FieldError id="lst-image-url-error">{imageError}</FieldError></div>}
          </details>
        </Section>

        <Section title="Video tours" note={`Optional. Up to ${MAX_VIDEOS} short walkthroughs; they play on the listing page.`}>
          <MediaUploader
            kind="video"
            urls={v.videos}
            onChange={(urls) => set("videos", urls)}
            max={MAX_VIDEOS}
            getTicket={createStaffUpload}
            onBusyChange={(b) => setUploading((u) => ({ ...u, video: b }))}
            error={e.videos}
            fieldId="lst-videos"
          />
        </Section>

        <Section title="Landlord and verification" note="Internal only. None of this appears on public pages.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field id={form.id("ownerName")} label="Landlord or current tenant name" optional>
              <input className="field" value={v.ownerName} onChange={(x) => set("ownerName", x.target.value)} id={form.id("ownerName")} />
            </Field>
            <Field id={form.id("ownerContact")} label="Their contact details" optional>
              <input className="field" value={v.ownerContact} onChange={(x) => set("ownerContact", x.target.value)} id={form.id("ownerContact")} />
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { key: "ownerIdentityChecked" as const, label: "Landlord verified", body: "Tick only after confirming who the landlord is.", Icon: UserCheck },
              { key: "listingDetailsReviewed" as const, label: "Details checked", body: "Tick only after checking rent, rooms and photos in person.", Icon: ClipboardCheck },
            ].map((c) => (
              <label key={c.key} className={cn("flex items-start gap-3 border-2 border-ink p-3", isAdmin ? "cursor-pointer" : "cursor-not-allowed opacity-75", v[c.key] ? "bg-lime/50" : "bg-paper")}>
                <input type="checkbox" className="mt-1 size-5 shrink-0 accent-ink" checked={v[c.key]} disabled={!isAdmin} onChange={(x) => set(c.key, x.target.checked)} />
                <span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <c.Icon className="size-4" aria-hidden="true" />
                    {c.label}
                  </span>
                  <span className="block text-sm text-muted">{c.body}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-sm font-semibold">
            {isAdmin
              ? "These checks are independent of publishing. Publishing never ticks them."
              : "Only the site admin can tick these. Add what you checked to the notes below."}
          </p>
          <Field id={form.id("verificationNotes")} label="Verification notes" optional>
            <textarea className="field" rows={2} value={v.verificationNotes} onChange={(x) => set("verificationNotes", x.target.value)} id={form.id("verificationNotes")} />
          </Field>
        </Section>

      </div>

      <aside className="hidden lg:block" aria-label="Live card preview">
        <div className="sticky top-0 flex flex-col gap-3">
          <p className="label">Live card preview</p>
          <ListingCard listing={preview(listing?.published ?? false)} preview />
          <p className="text-xs text-muted">Exactly how students will see the card once it&apos;s published.</p>
        </div>
      </aside>
      </div>

        {serverError && (
          <p role="alert" className="border-2 border-danger bg-danger/10 p-3 text-sm font-semibold text-danger">
            {serverError}
          </p>
        )}

        {errorCount > 0 && (
          <p role="alert" className="border-2 border-danger bg-danger/10 p-3 text-sm font-semibold text-danger">
            {errorCount === 1 ? "One field needs attention" : `${errorCount} fields need attention`} before saving.
          </p>
        )}

        <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap justify-end gap-3 border-t-2 border-ink bg-paper px-5 py-4 md:-mx-6 md:px-6">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          {listing ? (
            <>
              <button type="button" className="btn" disabled={saving || busy} onClick={() => save(!listing.published, listing.published ? "Moved to drafts" : "Published")}>
                {listing.published ? "Save as draft" : "Update & publish"}
              </button>
              <button type="submit" className="btn btn-lime" disabled={saving || busy}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Update listing
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn" disabled={saving || busy} onClick={() => save(false, "Saved as draft")}>
                Save as draft
              </button>
              <button type="submit" className="btn btn-lime" disabled={saving || busy}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Publish listing
              </button>
            </>
          )}
        </div>
    </form>
  );
}

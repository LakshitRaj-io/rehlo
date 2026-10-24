"use client";

import { ACCOMMODATION_TYPES, FURNISHING, GENDER_RESTRICTIONS } from "@/types";
import { AMENITIES, LOCALITIES } from "@/data/site";
import { SHARING_BUCKETS, type ListingFilters, type VerifiedFilter } from "@/lib/filters";
import { cn } from "@/lib/utils";

type Props = {
  filters: ListingFilters;
  onChange: (patch: Partial<ListingFilters>) => void;
  idPrefix: string;
  /** Genders only appear when listing data actually carries a restriction */
  showGender: boolean;
};

function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={cn("border-t-2 border-ink pt-4", className)}>
      <legend className="label float-left mb-3 w-full">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function ToggleChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

export function ListingFiltersPanel({ filters: f, onChange, idPrefix, showGender }: Props) {
  const toggleAmenity = (a: string) =>
    onChange({ amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] });

  const numberInput = (key: "min" | "max", label: string) => (
    <div className="flex-1">
      <label htmlFor={`${idPrefix}-${key}`} className="mb-1 block text-xs font-bold text-muted">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold" aria-hidden="true">₹</span>
        <input
          id={`${idPrefix}-${key}`}
          type="number"
          inputMode="numeric"
          min={0}
          step={500}
          className="field price pl-7"
          placeholder={key === "min" ? "0" : "Any"}
          value={f[key] ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            const n = raw === "" ? null : Math.max(0, Math.round(Number(raw)));
            onChange({ [key]: Number.isFinite(n as number) || n === null ? n : null } as Partial<ListingFilters>);
          }}
        />
      </div>
    </div>
  );

  const verifiedOptions: { value: VerifiedFilter; label: string }[] = [
    { value: "", label: "Any" },
    { value: "owner", label: "Landlord verified" },
    { value: "listing", label: "Listing details reviewed" },
    { value: "both", label: "Both checks done" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Group title="Locality">
        <label htmlFor={`${idPrefix}-locality`} className="sr-only">
          Locality
        </label>
        <select id={`${idPrefix}-locality`} className="field" value={f.locality} onChange={(e) => onChange({ locality: e.target.value })}>
          <option value="">All around SRM KTR</option>
          {LOCALITIES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </Group>

      <Group title="Type">
        <div className="flex flex-wrap gap-2">
          <ToggleChip pressed={f.type === ""} onClick={() => onChange({ type: "" })}>
            All
          </ToggleChip>
          {ACCOMMODATION_TYPES.map((t) => (
            <ToggleChip key={t} pressed={f.type === t} onClick={() => onChange({ type: f.type === t ? "" : t })}>
              {t}
            </ToggleChip>
          ))}
        </div>
      </Group>

      <Group title="Monthly rent per person">
        <div className="flex gap-3">
          {numberInput("min", "Min")}
          {numberInput("max", "Max")}
        </div>
        {f.min != null && f.max != null && f.min > f.max && (
          <p className="mt-2 text-sm font-semibold text-danger" role="alert">
            Min is higher than max, so nothing can match.
          </p>
        )}
      </Group>

      <Group title="Sharing">
        <div className="flex flex-wrap gap-2">
          {SHARING_BUCKETS.map((b) => (
            <ToggleChip key={b.value} pressed={f.sharing === b.value} onClick={() => onChange({ sharing: f.sharing === b.value ? "" : b.value })}>
              {b.label}
            </ToggleChip>
          ))}
        </div>
      </Group>

      <Group title="Furnishing">
        <div className="flex flex-wrap gap-2">
          {FURNISHING.map((x) => (
            <ToggleChip key={x} pressed={f.furnishing === x} onClick={() => onChange({ furnishing: f.furnishing === x ? "" : x })}>
              {x}
            </ToggleChip>
          ))}
        </div>
      </Group>

      {showGender && (
        <Group title="Who it's open to">
          <div className="flex flex-wrap gap-2">
            {GENDER_RESTRICTIONS.map((g) => (
              <ToggleChip key={g} pressed={f.gender === g} onClick={() => onChange({ gender: f.gender === g ? "" : g })}>
                {g === "Any" ? "Open to all" : g}
              </ToggleChip>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">As confirmed by the REHLO agent on the listing.</p>
        </Group>
      )}

      <Group title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <ToggleChip key={a} pressed={f.amenities.includes(a)} onClick={() => toggleAmenity(a)}>
              {a}
            </ToggleChip>
          ))}
        </div>
      </Group>

      <Group title="Checks">
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Verification checks">
          {verifiedOptions.map((o) => (
            <label key={o.value || "any"} className="chip justify-start">
              <input
                type="radio"
                className="sr-only"
                name={`${idPrefix}-verified`}
                checked={f.verified === o.value}
                onChange={() => onChange({ verified: o.value })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </Group>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Inbox, Loader2, Phone, Trash2 } from "lucide-react";
import type { EnquiryStatus, ServiceRequest } from "@/types";
import { deleteServiceRequest, updateServiceRequest } from "@/app/actions/admin";
import { SERVICE_CATEGORY_META } from "@/data/services";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { useAdmin } from "./admin-context";
import { STATUS_META, StatusBadge } from "./status-badge";

const STATUSES: EnquiryStatus[] = ["new", "contacted", "follow-up", "closed"];

function categoryLabel(c: string): string {
  return SERVICE_CATEGORY_META[c as keyof typeof SERVICE_CATEGORY_META]?.label ?? c;
}

/** Admin only: home-service requests from the public Services page. */
export function AdminServices() {
  const { services, putService, dropService } = useAdmin();
  const [filter, setFilter] = useState<EnquiryStatus | "all">("all");
  const [deleting, setDeleting] = useState<ServiceRequest | null>(null);
  const rows = filter === "all" ? services : services.filter((s) => s.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-5xl md:text-7xl">Service requests</h1>

      <div role="tablist" aria-label="Filter by status" className="flex gap-2 overflow-x-auto pb-1">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={filter === s}
            onClick={() => setFilter(s)}
            className={cn("chip shrink-0", filter === s && "!bg-ink !text-lime")}
          >
            {s === "all" ? "All" : STATUS_META[s].label}
            <span className="price text-xs opacity-80">{s === "all" ? services.length : services.filter((x) => x.status === s).length}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="border-2 border-dashed border-ink p-10 text-center">
          <Inbox className="mx-auto size-10" aria-hidden="true" />
          <p className="display mt-3 text-3xl">{services.length === 0 ? "No requests yet" : "None with this status"}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((s) => (
            <ServiceRow key={s.id} request={s} onChange={putService} onDelete={() => setDeleting(s)} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this request?"
        confirmLabel="Delete request"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          const target = deleting;
          setDeleting(null);
          if (!target) return;
          try {
            const r = await deleteServiceRequest(target.id);
            if (!r.ok) return toast(r.message ?? "Couldn't delete the request.", "info");
            dropService(target.id);
            toast(`Deleted ${target.id}.`);
          } catch {
            toast("Couldn't reach the server. Try again.", "info");
          }
        }}
      >
        <p>
          <strong>{deleting?.id}</strong> will be removed permanently. For real requests, mark them closed instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function ServiceRow({ request: s, onChange, onDelete }: { request: ServiceRequest; onChange: (s: ServiceRequest) => void; onDelete: () => void }) {
  const [note, setNote] = useState(s.internalNote);
  const [saving, setSaving] = useState(false);

  const save = async (patch: { status?: EnquiryStatus; internalNote?: string }, message: string) => {
    setSaving(true);
    try {
      const r = await updateServiceRequest(s.id, patch);
      if (!r.ok) return toast(r.message ?? "Couldn't save.", "info");
      onChange(r.data);
      toast(message);
    } catch {
      toast("Couldn't reach the server. Try again.", "info");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="grid gap-4 border-2 border-ink bg-warm p-4 md:grid-cols-[1.2fr_1fr]">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="price font-bold">{s.id}</span>
          <StatusBadge status={s.status} />
          <span className="text-xs text-muted">{formatDateTime(s.createdAt)}</span>
        </div>
        <p className="font-display text-xl font-extrabold">
          {categoryLabel(s.category)} in {s.locality}
        </p>
        <p className="[overflow-wrap:anywhere]">{s.issue}</p>
        <p className="text-sm text-muted">
          Preferred date {formatDate(s.preferredDate)}. Contact by {s.contactPreference.toLowerCase()}: <strong className="text-ink">{s.contact}</strong>
        </p>
        {s.contactPreference !== "Email" && (
          <a href={`tel:${s.contact}`} className="btn btn-sm btn-lime mt-1 self-start">
            <Phone className="size-4" aria-hidden="true" />
            Call
          </a>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              disabled={saving}
              className={cn("btn btn-sm", s.status === st && "!bg-ink !text-lime")}
              aria-pressed={s.status === st}
              onClick={() => save({ status: st }, `${s.id} marked ${STATUS_META[st].label.toLowerCase()}.`)}
            >
              {STATUS_META[st].label}
            </button>
          ))}
        </div>
        <label htmlFor={`svc-note-${s.id}`} className="text-sm font-bold">
          Internal note
        </label>
        <textarea id={`svc-note-${s.id}`} className="field" rows={2} maxLength={2000} value={note} onChange={(x) => setNote(x.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm btn-lime" disabled={saving || note === s.internalNote} onClick={() => save({ internalNote: note.trim() }, "Note saved.")}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save note
          </button>
          <button type="button" className="btn btn-sm btn-ghost !border-danger !text-danger" onClick={onDelete} aria-label={`Delete ${s.id}`}>
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUp, ImagePlus, Loader2, Trash2, Video, X } from "lucide-react";
import { checkMedia, formatBytes, MEDIA_RULES, type MediaKind } from "@/lib/media";
import type { UploadTicket } from "@/lib/db/uploads";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/safe-image";
import { FieldError } from "@/components/ui/field";

type Pending = { key: string; name: string; size: number; progress: number; error: string | null; xhr: XMLHttpRequest | null };

type Props = {
  kind: MediaKind;
  urls: string[];
  onChange: (urls: string[]) => void;
  max: number;
  /** Server action that returns a one-off signed upload URL. */
  getTicket: (kind: MediaKind, contentType: string, size: number) => Promise<UploadTicket>;
  /** Lets the parent block submitting while files are still uploading. */
  onBusyChange?: (busy: boolean) => void;
  error?: string;
  fieldId?: string;
};

/** PUT the file straight to Supabase Storage, reporting progress. */
function putFile(url: string, file: File, onProgress: (pct: number) => void, register: (xhr: XMLHttpRequest) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    register(xhr);
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(file);
  });
}

export function MediaUploader({ kind, urls, onChange, max, getTicket, onBusyChange, error, fieldId }: Props) {
  const rule = MEDIA_RULES[kind];
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  // Uploads finish out of order; keep the latest list so concurrent completions don't overwrite each other.
  const latest = useRef(urls);
  useEffect(() => {
    latest.current = urls;
  }, [urls]);
  const active = useRef(0);

  const busy = (delta: number) => {
    active.current += delta;
    onBusyChange?.(active.current > 0);
  };
  const patch = (key: string, p: Partial<Pending>) => setPending((list) => list.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const upload = async (file: File) => {
    const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
    const local = checkMedia(kind, file.type, file.size);
    setPending((list) => [...list, { key, name: file.name, size: file.size, progress: 0, error: local, xhr: null }]);
    if (local) return;
    busy(1);
    try {
      const ticket = await getTicket(kind, file.type, file.size);
      if (!ticket.ok) throw new Error(ticket.error);
      await putFile(ticket.signedUrl, file, (progress) => patch(key, { progress }), (xhr) => patch(key, { xhr }));
      const next = [...latest.current, ticket.publicUrl];
      latest.current = next;
      onChange(next);
      setPending((list) => list.filter((x) => x.key !== key));
    } catch (e) {
      patch(key, { error: e instanceof Error ? e.message : "Upload failed", xhr: null });
    } finally {
      busy(-1);
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const room = max - urls.length - pending.filter((p) => !p.error).length;
    Array.from(files).slice(0, Math.max(0, room)).forEach(upload);
    if (inputRef.current) inputRef.current.value = "";
  };

  const full = urls.length + pending.filter((p) => !p.error).length >= max;
  const Icon = kind === "video" ? Video : ImagePlus;

  return (
    <div className="flex flex-col gap-3" data-field={fieldId}>
      {urls.length > 0 && (
        <ul className={cn("grid gap-3", kind === "video" ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
          {urls.map((url, i) => (
            <li key={url} className="relative border-2 border-ink bg-paper">
              {kind === "video" ? (
                <video src={url} controls playsInline preload="metadata" className="aspect-video w-full bg-ink" aria-label={`Video ${i + 1}`} />
              ) : (
                <SafeImage src={url} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full" />
              )}
              {kind === "image" && i === 0 && <span className="label absolute left-1 top-1 border-2 border-ink bg-lime px-1">Cover</span>}
              <div className="flex border-t-2 border-ink">
                {kind === "image" && (
                  <button
                    type="button"
                    className="grid h-10 flex-1 place-items-center hover:bg-lime disabled:opacity-40"
                    disabled={i === 0}
                    onClick={() => onChange([url, ...urls.filter((x) => x !== url)])}
                    aria-label={`Make photo ${i + 1} the cover`}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  className={cn("grid h-10 flex-1 place-items-center hover:bg-danger hover:text-white", kind === "image" && "border-l-2 border-ink")}
                  onClick={() => onChange(urls.filter((x) => x !== url))}
                  aria-label={`Remove ${kind === "video" ? "video" : "photo"} ${i + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending.length > 0 && (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {pending.map((p) => (
            <li key={p.key} className={cn("flex items-center gap-3 border-2 px-3 py-2 text-sm", p.error ? "border-danger bg-danger/10" : "border-ink bg-warm")}>
              {!p.error && <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{p.name}</span>
                {p.error ? (
                  <span className="block text-danger">{p.error}</span>
                ) : (
                  <span className="mt-1 block h-2 border border-ink bg-paper" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${p.name}`}>
                    <span className="block h-full bg-lime transition-[width]" style={{ width: `${p.progress}%` }} />
                  </span>
                )}
              </span>
              <span className="price shrink-0 text-xs text-muted">{p.error ? formatBytes(p.size) : `${p.progress}%`}</span>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center hover:bg-paper-deep"
                onClick={() => {
                  p.xhr?.abort();
                  setPending((list) => list.filter((x) => x.key !== p.key));
                }}
                aria-label={p.error ? `Dismiss ${p.name}` : `Cancel upload of ${p.name}`}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center gap-1 border-2 border-dashed border-ink bg-paper px-4 py-6 text-center transition-colors hover:bg-lime/40 focus-within:outline focus-within:outline-[3px] focus-within:outline-blue"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
        >
          <Icon className="size-6" aria-hidden="true" />
          <span className="font-bold">{kind === "video" ? "Add a video tour" : "Add photos"}</span>
          <span className="text-xs text-muted">
            {rule.label}. {max - urls.length} more allowed.
          </span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={rule.accept}
            multiple={kind === "image"}
            className="sr-only"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      )}
      {error && <FieldError id={fieldId ? `${fieldId}-error` : `${inputId}-error`}>{error}</FieldError>}
    </div>
  );
}

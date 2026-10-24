"use client";

import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { Listing } from "@/types";
import { savedSchema } from "./schemas";
import { readStored, STORAGE_KEYS, writeStored } from "./storage";

/**
 * Client-side state for the public site.
 *
 * - Published listings come from Supabase on the server and are handed down through
 *   <ListingsProvider>, so pages render real data on first paint (good for SEO).
 * - Saved stays are a per-device shortlist kept in localStorage, read through
 *   useSyncExternalStore so server and first client render match.
 */

/* ---------------- published listings ---------------- */

const ListingsContext = createContext<Listing[]>([]);

export function ListingsProvider({ listings, children }: { listings: Listing[]; children: ReactNode }) {
  return createElement(ListingsContext.Provider, { value: listings }, children);
}

export function usePublishedListings(): Listing[] {
  return useContext(ListingsContext);
}

/* ---------------- saved (localStorage) ---------------- */

let saved: string[] | null = null;
const listeners = new Set<() => void>();
const SERVER_SAVED: string[] = [];

function loadSaved(): string[] {
  const parsed = savedSchema.safeParse(readStored(STORAGE_KEYS.saved));
  return parsed.success ? Array.from(new Set(parsed.data)) : [];
}

function getSaved(): string[] {
  if (saved === null) saved = loadSaved();
  return saved;
}

function emit() {
  for (const l of listeners) l();
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEYS.saved) return;
  saved = loadSaved();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function setSaved(next: string[]) {
  saved = next;
  writeStored(STORAGE_KEYS.saved, next);
  emit();
}

function useSavedIds(): string[] {
  return useSyncExternalStore(subscribe, getSaved, () => SERVER_SAVED);
}

const noopSubscribe = () => () => {};
/** false during SSR and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Published listings plus this device's saved ids. */
export function useAppState(): { listings: Listing[]; saved: string[] } {
  return { listings: usePublishedListings(), saved: useSavedIds() };
}

export function useSaved() {
  const ids = useSavedIds();
  const listings = usePublishedListings();
  const hydrated = useHydrated();
  const published = new Set(listings.map((l) => l.id));
  const valid = ids.filter((id) => published.has(id));
  return { saved: valid, count: hydrated ? valid.length : 0, isSaved: (id: string) => ids.includes(id) };
}

export function toggleSaved(id: string): boolean {
  const current = getSaved();
  const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
  setSaved(next);
  return next.includes(id);
}

/** Drop saved ids whose listing is no longer published. */
export function pruneSaved(listings: Listing[]) {
  const ids = new Set(listings.map((l) => l.id));
  const current = getSaved();
  const next = current.filter((s) => ids.has(s));
  if (next.length !== current.length) setSaved(next);
}

/**
 * Versioned local-storage helpers (only the per-device saved shortlist lives here now).
 * Every value is wrapped as { v, data } so a future schema change can be detected
 * instead of crashing on old data. Safe to call during SSR (no-ops without `window`).
 */
export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  saved: "rehlo:saved",
} as const;

type Envelope = { v: number; data: unknown };

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/** Returns the stored data, or undefined when missing, unreadable or from another version. */
export function readStored(key: string): unknown {
  if (!hasStorage()) return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return undefined;
    const parsed = JSON.parse(raw) as Envelope;
    if (!parsed || typeof parsed !== "object" || parsed.v !== STORAGE_VERSION) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}

export function writeStored(key: string, data: unknown): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: STORAGE_VERSION, data } satisfies Envelope));
    return true;
  } catch {
    return false;
  }
}

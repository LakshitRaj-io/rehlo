"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Info } from "lucide-react";

type Toast = { id: number; message: string; tone: "success" | "info" };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, tone: Toast["tone"] = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, tone }].slice(-3);
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3600);
}

const EMPTY: Toast[] = [];

export function Toaster() {
  const items = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
  const reduce = useReducedMotion();
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:items-end"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            role="status"
            className="pointer-events-auto flex max-w-sm items-center gap-3 border-2 border-ink bg-ink px-4 py-3 text-warm shadow-[4px_4px_0_0_var(--color-lime)]"
          >
            <span className="grid size-6 shrink-0 place-items-center bg-lime text-ink">
              {t.tone === "success" ? <Check className="size-4" aria-hidden="true" /> : <Info className="size-4" aria-hidden="true" />}
            </span>
            <span className="text-sm font-semibold">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

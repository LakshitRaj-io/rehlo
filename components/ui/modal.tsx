"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
  /** Visual tone of the header strip */
  tone?: "lime" | "ink" | "paper";
};

let openCount = 0;

export function Modal({ open, onClose, title, eyebrow, children, size = "md", tone = "lime" }: ModalProps) {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openCount += 1;
    const html = document.documentElement;
    const scrollbar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;

    const focusFirst = window.setTimeout(() => {
      const node = dialogRef.current;
      if (!node) return;
      const target = node.querySelector<HTMLElement>("[data-autofocus]") ?? node.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? node).focus();
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      const node = dialogRef.current;
      if (!node) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(focusFirst);
      document.removeEventListener("keydown", onKey);
      openCount -= 1;
      if (openCount === 0) {
        html.style.overflow = "";
        html.style.paddingRight = "";
      }
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!hydrated) return null;

  const width = size === "xl" ? "md:max-w-5xl" : size === "lg" ? "md:max-w-3xl" : "md:max-w-xl";
  const headerTone =
    tone === "ink" ? "bg-ink text-warm" : tone === "paper" ? "bg-paper text-ink" : "bg-lime text-ink";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
              "relative flex h-[100dvh] w-full flex-col bg-warm outline-none md:h-auto md:max-h-[90dvh] md:border-2 md:border-ink md:shadow-[8px_8px_0_0_var(--color-ink)]",
              width,
            )}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className={cn("flex items-start justify-between gap-4 border-b-2 border-ink px-5 py-4 md:px-6", headerTone)}>
              <div className="min-w-0">
                {eyebrow && <p className="label mb-1 opacity-80">{eyebrow}</p>}
                <h2 id={titleId} className="display text-2xl md:text-3xl">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "grid size-10 shrink-0 place-items-center border-2 transition-transform hover:rotate-90",
                  tone === "ink" ? "border-warm" : "border-ink bg-warm",
                )}
                aria-label="Close dialog"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

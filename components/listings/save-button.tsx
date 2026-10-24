"use client";

import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toggleSaved, useAppState, useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export function SaveButton({ id, title, className, withLabel = false }: { id: string; title: string; className?: string; withLabel?: boolean }) {
  const { saved } = useAppState();
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const isSaved = hydrated && saved.includes(id);

  return (
    <motion.button
      type="button"
      data-cursor="save"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${title} from saved` : `Save ${title}`}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const now = toggleSaved(id);
        toast(now ? "Saved. Find it under Saved." : "Removed from saved.", now ? "success" : "info");
      }}
      whileTap={reduce ? undefined : { scale: 0.85 }}
      className={cn(
        "relative z-20 inline-flex items-center justify-center gap-2 border-2 border-ink font-bold transition-colors",
        withLabel ? "h-11 px-4" : "size-11",
        isSaved ? "bg-lime" : "bg-warm hover:bg-lime/60",
        className,
      )}
    >
      <motion.span
        key={isSaved ? "on" : "off"}
        initial={reduce ? false : { scale: 0.4, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 18 }}
        className="grid place-items-center"
      >
        <Heart className="size-5" aria-hidden="true" fill={isSaved ? "currentColor" : "none"} strokeWidth={2.5} />
      </motion.span>
      {withLabel && <span className="label !text-sm">{isSaved ? "Saved" : "Save"}</span>}
    </motion.button>
  );
}

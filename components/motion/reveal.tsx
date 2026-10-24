"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** One-time, small upward reveal. Used on a handful of sections, not everywhere. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const reduce = useReducedMotion();
  const Comp = as === "section" ? motion.section : as === "li" ? motion.li : motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </Comp>
  );
}

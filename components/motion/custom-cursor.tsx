"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Heart, MoveHorizontal } from "lucide-react";
import { useMediaQuery } from "@/lib/use-media-query";

type Mode = "default" | "link" | "view" | "save" | "cta" | "drag" | "hidden";

/**
 * Brand cursor for fine pointers only. Elements opt into a state with
 * data-cursor="view|save|cta|drag"; any other link/button gets "link".
 * Native cursor returns over text inputs. Reduced motion = no interpolation.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("default");
  const enabled = useMediaQuery("(hover: hover) and (pointer: fine)");

  useEffect(() => {
    if (!enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let x = -100, y = -100, tx = -100, ty = -100;
    let visible = false;
    let current: Mode = "default";

    const setM = (m: Mode) => {
      if (m !== current) {
        current = m;
        setMode(m);
      }
    };

    const loop = () => {
      const ease = reduced.matches ? 1 : 0.28;
      x += (tx - x) * ease;
      y += (ty - y) * ease;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(loop);
      else raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        x = tx;
        y = ty;
        if (dotRef.current) dotRef.current.style.opacity = "1";
      }
      const target = e.target as Element | null;
      if (!target || !target.closest) return;
      if (target.closest("input, textarea, select, [contenteditable='true'], [data-cursor='native']")) setM("hidden");
      else {
        const tagged = target.closest<HTMLElement>("[data-cursor]");
        const t = tagged?.dataset.cursor as Mode | undefined;
        if (t && ["view", "save", "cta", "drag"].includes(t)) setM(t);
        else if (target.closest("a, button, [role='button'], label, summary")) setM("link");
        else setM("default");
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onLeave = () => {
      visible = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
    };

    document.documentElement.classList.add("has-custom-cursor");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  const size =
    mode === "view" ? 64 : mode === "save" ? 56 : mode === "cta" ? 44 : mode === "drag" ? 60 : mode === "link" ? 26 : 14;
  const bg = mode === "save" ? "var(--color-lime)" : "var(--color-ink)";
  const fg = mode === "save" ? "var(--color-ink)" : "var(--color-lime)";

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[200]"
      style={{ opacity: 0, transition: "opacity 0.15s" }}
    >
      <div
        className="grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-warm"
        style={{
          width: size,
          height: size,
          background: bg,
          color: fg,
          opacity: mode === "hidden" ? 0 : 1,
          transition: "width 0.18s ease, height 0.18s ease, background-color 0.18s ease, opacity 0.12s",
        }}
      >
        {mode === "default" && <span className="block size-1 rounded-full bg-lime" />}
        {mode === "view" && <span className="label !text-[0.7rem]">View</span>}
        {mode === "save" && (
          <span className="flex flex-col items-center leading-none">
            <Heart className="size-3.5" strokeWidth={3} />
            <span className="label !text-[0.65rem]">Save</span>
          </span>
        )}
        {mode === "cta" && <ArrowUpRight className="size-5" strokeWidth={3} />}
        {mode === "drag" && <MoveHorizontal className="size-5" strokeWidth={3} />}
      </div>
    </div>
  );
}

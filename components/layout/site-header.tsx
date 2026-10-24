"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart, Menu, X } from "lucide-react";
import { Wordmark } from "./wordmark";
import { useSaved } from "@/lib/store";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { href: "/explore", label: "Find a Stay" },
  { href: "/flatmates", label: "Find a Flatmate" },
  { href: "/services", label: "Home Services" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useSaved();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the menu when the route changes (derived during render, no effect needed).
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const toggle = toggleRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>("a, button"));
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = "";
      toggle?.focus();
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) || (href === "/explore" && pathname.startsWith("/stay/"));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b-2 transition-[background-color,border-color,box-shadow] duration-200",
          scrolled ? "border-ink bg-paper/95 shadow-[0_4px_0_0_var(--color-ink)] backdrop-blur-sm" : "border-transparent bg-paper",
        )}
      >
        <motion.div
          className={cn("mx-auto flex max-w-[1440px] items-center gap-4 px-4 transition-[height] duration-200 md:px-8", scrolled ? "h-16" : "h-[4.5rem] md:h-20")}
          initial={reduce ? false : { y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Link href="/" className="shrink-0 text-[2rem] md:text-[2.4rem]" aria-label="REHLO home">
            <Wordmark />
          </Link>

          <nav aria-label="Primary" className="ml-6 hidden lg:block">
            <ul className="flex items-center gap-1">
              {PRIMARY.map((item) => (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="group relative block px-3 py-2 text-[0.95rem] font-bold"
                  >
                    <span className="relative z-10">{item.label}</span>
                    {isActive(item.href) ? (
                      <motion.span
                        layoutId={reduce ? undefined : "nav-active"}
                        className="absolute inset-x-1 bottom-1 top-1 -z-0 border-2 border-ink bg-lime"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    ) : (
                      <span className="absolute inset-x-3 bottom-1 h-[3px] origin-left scale-x-0 bg-ink transition-transform duration-200 group-hover:scale-x-100" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <Link
              href="/saved"
              className={cn(
                "relative flex h-11 items-center gap-2 border-2 border-ink px-3 font-bold transition-transform hover:-translate-y-0.5",
                isActive("/saved") ? "bg-lime" : "bg-warm",
              )}
              aria-label={`Saved stays, ${count} saved`}
            >
              <Heart className="size-4" aria-hidden="true" fill={count ? "currentColor" : "none"} />
              <span className="hidden sm:inline">Saved</span>
              <span className="price grid min-w-6 place-items-center bg-ink px-1 text-xs text-warm" aria-hidden="true">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={count}
                    initial={reduce ? false : { y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </span>
            </Link>
            <Link
              href="/post-a-vacancy"
              className={cn("link-underline hidden px-1 py-1 font-bold xl:block", isActive("/post-a-vacancy") && "bg-[length:100%_2px]")}
              aria-current={isActive("/post-a-vacancy") ? "page" : undefined}
            >
              Post a Vacancy
            </Link>
            <Link href="/explore" className="btn btn-lime hidden md:inline-flex" data-cursor="cta">
              Find my place
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className="grid size-11 place-items-center border-2 border-ink bg-warm lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => {
                setOpenedAt(pathname);
                setOpen((o) => !o);
              }}
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[80] flex flex-col bg-ink text-warm lg:hidden"
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.32, ease: [0.7, 0, 0.2, 1] }}
          >
            <div className="flex h-[4.5rem] items-center justify-between border-b-2 border-warm/20 px-4">
              <Link href="/" className="text-[2rem]" onClick={() => setOpen(false)} aria-label="REHLO home">
                <Wordmark inverted />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center border-2 border-warm"
                aria-label="Close menu"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-8">
              <ul className="flex flex-col gap-1">
                {[...PRIMARY, { href: "/saved", label: `Saved (${count})` }, { href: "/post-a-vacancy", label: "Post a Vacancy" }].map(
                  (item, i) => (
                    <motion.li
                      key={item.href}
                      initial={reduce ? false : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={cn(
                          "display block py-2 text-5xl sm:text-6xl",
                          isActive(item.href) ? "text-lime" : "text-warm hover:text-lime",
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  ),
                )}
              </ul>
              <Link href="/explore" onClick={() => setOpen(false)} className="btn btn-lime btn-lg mt-8 w-full">
                Find my place
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

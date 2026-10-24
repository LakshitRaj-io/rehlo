"use client";

import { motion, useReducedMotion } from "motion/react";
import { SafeImage } from "@/components/ui/safe-image";
import { HERO_PHOTOS } from "@/data/images";
import { SearchPanel } from "./search-panel";

const ease = [0.2, 0.8, 0.2, 1] as const;

export function HeroSection() {
  const reduce = useReducedMotion();
  const line = (i: number) =>
    reduce
      ? {}
      : {
          initial: { y: "105%" },
          animate: { y: "0%" },
          transition: { duration: 0.6, delay: 0.12 + i * 0.09, ease },
        };
  const photoReveal = (i: number) =>
    reduce
      ? {}
      : {
          initial: { clipPath: "inset(100% 0 0 0)" },
          animate: { clipPath: "inset(0% 0 0 0)" },
          transition: { duration: 0.7, delay: 0.3 + i * 0.12, ease },
        };

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b-2 border-ink">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1440px] gap-10 px-4 pb-12 pt-8 md:px-8 md:pb-16 md:pt-12 lg:grid-cols-12 lg:gap-6">
        {/* Copy */}
        <div className="order-1 lg:col-span-7 lg:pt-6">
          <motion.p
            className="label mb-5 inline-flex items-center gap-2 border-2 border-ink bg-warm px-2.5 py-1.5"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <span className="inline-block size-2 bg-orange" aria-hidden="true" />
            Built for the campus life
          </motion.p>

          <h1 id="hero-title" className="display text-[clamp(2.6rem,8.4vw,8.4rem)]">
            <span className="block overflow-hidden pb-[0.04em]">
              <motion.span className="block" {...line(0)}>Your next</motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.04em]">
              <motion.span className="block" {...line(1)}>place.</motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.04em]">
              <motion.span className="block" {...line(2)}>Your next</motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <motion.span className="relative inline-block" {...line(3)}>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-[-0.08em] bottom-[0.06em] top-[0.32em] -z-0 -skew-x-6 bg-lime"
                />
                <span className="outline-text relative">chapter.</span>
              </motion.span>
            </span>
          </h1>

          <motion.p
            className="mt-7 max-w-[34ch] text-lg md:text-xl"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.5 }}
          >
            PGs, flats, flatmates and the little things that make a new city feel like home.
          </motion.p>
        </div>

        {/* Photo collage */}
        <div className="relative order-3 min-h-[22rem] sm:min-h-[28rem] lg:order-2 lg:col-span-5 lg:min-h-[34rem]" aria-label="Photos of student rooms and shared flats" role="group">
          <motion.div
            className="absolute right-0 top-0 w-[72%] rotate-[2deg] border-2 border-ink bg-warm p-2 shadow-[var(--shadow-hard-lg)]"
            {...photoReveal(0)}
          >
            <SafeImage src={HERO_PHOTOS.bedroom} alt="A bright student bedroom with a made bed by the window" priority className="aspect-[4/5] w-full" />
          </motion.div>
          <motion.div
            className="absolute bottom-6 left-0 w-[52%] -rotate-[3deg] border-2 border-ink bg-warm p-2 shadow-[var(--shadow-hard)]"
            {...photoReveal(1)}
          >
            <SafeImage src={HERO_PHOTOS.kitchen} alt="A shared kitchen with a long counter" priority className="aspect-square w-full" />
          </motion.div>
          <motion.div
            className="absolute bottom-0 right-[8%] w-[38%] rotate-[4deg] border-2 border-ink bg-warm p-2 shadow-[var(--shadow-hard)]"
            {...photoReveal(2)}
          >
            <SafeImage src={HERO_PHOTOS.study} alt="A study corner with a desk and chair" className="aspect-[3/4] w-full" />
          </motion.div>

          <motion.p
            className="sticker absolute left-[4%] top-[12%] z-10 max-w-[10rem] sm:max-w-[12rem] md:left-[2%]"
            initial={reduce ? false : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.85 }}
          >
            <span className="label block !text-xs sm:!text-sm">Starting at</span>
            <span className="display block text-xl sm:text-2xl">SRM KTR, Chennai</span>
          </motion.p>
        </div>

        {/* Search */}
        <motion.div
          className="relative order-2 md:mt-12 lg:order-3 lg:col-span-11"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute -top-12 left-2 hidden items-end gap-1 md:flex">
            <span className="label rotate-[-4deg] pb-5">Start here</span>
            <svg viewBox="0 0 70 50" className="h-12 w-16 text-ink">
              <path d="M4 6 C 30 4, 52 14, 58 40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M48 32 L 58 42 L 66 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <SearchPanel />
        </motion.div>
      </div>
    </section>
  );
}

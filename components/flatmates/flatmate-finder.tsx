"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Info, RotateCcw, X } from "lucide-react";
import type {
  Cleanliness,
  FlatmatePreferences,
  KitchenHabit,
  MoveInTimeline,
  NoiseTolerance,
  SharingPref,
  SleepSchedule,
  SmokingPref,
} from "@/types";
import { INTEREST_OPTIONS, SAMPLE_FLATMATES } from "@/data/flatmates";
import { LOCALITIES } from "@/data/site";
import { MATCH_WEIGHTS, rankMatches, type MatchResult } from "@/lib/matching";
import { cn, formatINR } from "@/lib/utils";
import { ChoiceGroup } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Monogram, ProfileCard } from "./profile-card";

const STEPS = ["Basics", "Habits", "Interests"] as const;

const DEFAULT_PREFS: FlatmatePreferences = {
  budget: 8000,
  locality: "",
  sharing: "Open to anything",
  sleep: "Flexible",
  cleanliness: "Tidy enough",
  kitchen: "Cooks sometimes",
  smoking: "",
  noise: "Some noise is fine",
  moveIn: "Within a month",
  interests: [],
};

export function FlatmateFinder() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<FlatmatePreferences>(DEFAULT_PREFS);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [viewing, setViewing] = useState<MatchResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const formTop = useRef<HTMLDivElement>(null);

  const set = <K extends keyof FlatmatePreferences>(k: K, v: FlatmatePreferences[K]) => setPrefs((p) => ({ ...p, [k]: v }));

  const goStep = (n: number) => {
    setStep(n);
    formTop.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const findMatches = () => {
    setResults(rankMatches(prefs, SAMPLE_FLATMATES));
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      resultsRef.current?.focus({ preventScroll: true });
    }, 60);
  };

  return (
    <>
      <div ref={formTop} id="finder" className="scroll-mt-24 border-2 border-ink bg-warm shadow-[var(--shadow-hard-lg)]">
        {/* Step indicator — this genuinely is a sequence, so it's numbered */}
        <ol className="grid grid-cols-3 border-b-2 border-ink" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className={cn("border-ink", i > 0 && "border-l-2")}>
              <button
                type="button"
                onClick={() => goStep(i)}
                aria-current={step === i ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-3 text-left transition-colors md:px-5",
                  step === i ? "bg-lime" : i < step ? "bg-paper" : "bg-warm hover:bg-paper",
                )}
              >
                <span className="display text-2xl md:text-3xl">{i + 1}</span>
                <span className="label">{s}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="p-5 md:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-7"
            >
              {step === 0 && (
                <>
                  <div>
                    <label htmlFor="fm-budget" className="mb-2 flex items-baseline justify-between text-sm font-bold">
                      <span>Monthly accommodation budget</span>
                      <span className="price font-display text-3xl font-extrabold">{formatINR(prefs.budget)}</span>
                    </label>
                    <input
                      id="fm-budget"
                      type="range"
                      min={3000}
                      max={25000}
                      step={500}
                      value={prefs.budget}
                      onChange={(e) => set("budget", Number(e.target.value))}
                      className="h-3 w-full cursor-pointer appearance-none border-2 border-ink bg-paper accent-ink"
                      aria-valuetext={formatINR(prefs.budget)}
                    />
                    <div className="price mt-1 flex justify-between text-xs text-muted">
                      <span>₹3,000</span>
                      <span>₹25,000</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="fm-locality" className="mb-1.5 block text-sm font-bold">
                      Preferred locality
                    </label>
                    <select id="fm-locality" className="field md:max-w-sm" value={prefs.locality} onChange={(e) => set("locality", e.target.value)}>
                      <option value="">No preference</option>
                      {LOCALITIES.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <ChoiceGroup<SharingPref>
                    id="fm-sharing"
                    legend="Preferred sharing arrangement"
                    options={["Twin sharing", "Triple sharing", "Own room in a shared flat", "Open to anything"]}
                    value={prefs.sharing}
                    onChange={(v) => set("sharing", v)}
                  />
                  <ChoiceGroup<MoveInTimeline>
                    id="fm-movein"
                    legend="When are you moving?"
                    options={["Right away", "Within a month", "Next semester"]}
                    value={prefs.moveIn}
                    onChange={(v) => set("moveIn", v)}
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <ChoiceGroup<SleepSchedule> id="fm-sleep" legend="Sleep schedule" options={["Early riser", "Night owl", "Flexible"]} value={prefs.sleep} onChange={(v) => set("sleep", v)} />
                  <ChoiceGroup<Cleanliness> id="fm-clean" legend="How tidy are you?" options={["Very tidy", "Tidy enough", "Relaxed"]} value={prefs.cleanliness} onChange={(v) => set("cleanliness", v)} />
                  <ChoiceGroup<KitchenHabit> id="fm-kitchen" legend="Kitchen habits" options={["Cooks most days", "Cooks sometimes", "Mostly eats out"]} value={prefs.kitchen} onChange={(v) => set("kitchen", v)} />
                  <ChoiceGroup<NoiseTolerance> id="fm-noise" legend="Noise tolerance" options={["Likes it quiet", "Some noise is fine", "Lively is good"]} value={prefs.noise} onChange={(v) => set("noise", v)} />
                  <ChoiceGroup<SmokingPref>
                    id="fm-smoking"
                    legend="Smoking"
                    optional
                    options={["Non-smoker", "Smoker", "Prefer not to say"]}
                    value={prefs.smoking}
                    onChange={(v) => set("smoking", v)}
                  />
                </>
              )}

              {step === 2 && (
                <fieldset>
                  <legend className="mb-1.5 flex w-full items-baseline justify-between text-sm font-bold">
                    <span>Interests</span>
                    <span className="text-xs font-medium text-muted">Optional</span>
                  </legend>
                  <p className="mb-3 text-sm text-muted">Pick a few. Shared interests nudge the score a little.</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((i) => {
                      const on = prefs.interests.includes(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          className="chip"
                          aria-pressed={on}
                          onClick={() => set("interests", on ? prefs.interests.filter((x) => x !== i) : [...prefs.interests, i])}
                        >
                          {i}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t-2 border-ink pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-muted">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Matches use only what you choose to share here. They aren&apos;t a guarantee you&apos;ll get along.
            </p>
            <div className="flex gap-3">
              {step > 0 && (
                <button type="button" className="btn" onClick={() => goStep(step - 1)}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" className="btn btn-ink" onClick={() => goStep(step + 1)}>
                  Next
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="btn btn-lime btn-lg" onClick={findMatches} data-cursor="cta">
                  Find my match
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {results && (
        <div ref={resultsRef} tabIndex={-1} className="mt-16 scroll-mt-24 outline-none" aria-labelledby="matches-title">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="matches-title" className="display text-5xl md:text-6xl">Your sample matches</h2>
              <p className="mt-2 max-w-xl text-muted">
                Ranked against {SAMPLE_FLATMATES.length} fictional profiles. The score is a simple weighted comparison
                (budget {MATCH_WEIGHTS.budget}, locality {MATCH_WEIGHTS.locality}, sleep {MATCH_WEIGHTS.sleep}, cleanliness {MATCH_WEIGHTS.cleanliness}, and smaller weights for the rest), not a validated test.
              </p>
            </div>
            <button
              type="button"
              className="btn self-start"
              onClick={() => {
                setPrefs(DEFAULT_PREFS);
                setResults(null);
                goStep(0);
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Start over
            </button>
          </div>

          <ol className="grid gap-5 md:grid-cols-2">
            {results.map((r, i) => (
              <motion.li
                key={r.profile.id}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.05 }}
                className="flex flex-col border-2 border-ink bg-warm shadow-[var(--shadow-hard)]"
              >
                <div className="flex items-center gap-4 p-4">
                  <Monogram name={r.profile.displayName} index={i} className="size-14" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-2xl font-extrabold leading-none">{r.profile.displayName}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {r.profile.year}, prefers {r.profile.locality}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="price display text-4xl">{r.score}</p>
                    <p className="label text-muted">of 100</p>
                  </div>
                </div>
                <div className="h-3 border-y-2 border-ink bg-paper" aria-hidden="true">
                  <motion.div
                    className="h-full bg-lime"
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${r.score}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + Math.min(i, 6) * 0.05 }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  {r.reasons.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Why it matches">
                      {r.reasons.map((x) => (
                        <li key={x} className="tag bg-lime/50">{x}</li>
                      ))}
                    </ul>
                  )}
                  {r.differences.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Where you differ">
                      {r.differences.map((x) => (
                        <li key={x} className="tag border-dashed bg-transparent text-muted">
                          <X className="size-3" aria-hidden="true" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className="btn mt-auto self-start" onClick={() => setViewing(r)}>
                    View profile
                  </button>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `${viewing.profile.displayName}, sample profile` : ""} eyebrow={viewing ? `${viewing.score}/100 match` : undefined}>
        {viewing && (
          <div className="flex flex-col gap-5">
            <ProfileCard profile={viewing.profile} />
            <p className="text-lg">{viewing.profile.bio}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Budget</dt>
              <dd className="price font-semibold">~{formatINR(viewing.profile.budget)}/month</dd>
              <dt className="text-muted">Sharing</dt>
              <dd className="font-semibold">{viewing.profile.sharing}</dd>
              <dt className="text-muted">Noise</dt>
              <dd className="font-semibold">{viewing.profile.noise}</dd>
              <dt className="text-muted">Moving</dt>
              <dd className="font-semibold">{viewing.profile.moveIn}</dd>
              {viewing.profile.smoking && (
                <>
                  <dt className="text-muted">Smoking</dt>
                  <dd className="font-semibold">{viewing.profile.smoking}</dd>
                </>
              )}
            </dl>
            <p className="border-2 border-orange bg-orange/10 p-4 text-sm">
              This is a fictional sample for the demo. There&apos;s no real person behind it, so there&apos;s no contact
              option and no messaging.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

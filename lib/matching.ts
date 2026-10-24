import type {
  Cleanliness,
  FlatmatePreferences,
  FlatmateProfile,
  NoiseTolerance,
  SleepSchedule,
} from "@/types";

/**
 * Deterministic compatibility score from declared preferences. The weights are a
 * simple product heuristic, not a validated model, and the UI says so.
 */
export const MATCH_WEIGHTS = {
  budget: 30,
  locality: 20,
  sleep: 15,
  cleanliness: 15,
  noise: 8,
  kitchen: 4,
  moveIn: 4,
  interests: 4,
} as const;

export type MatchResult = {
  profile: FlatmateProfile;
  score: number;
  reasons: string[];
  differences: string[];
};

const CLEAN_ORDER: Cleanliness[] = ["Very tidy", "Tidy enough", "Relaxed"];
const NOISE_ORDER: NoiseTolerance[] = ["Likes it quiet", "Some noise is fine", "Lively is good"];

function sleepScore(a: SleepSchedule, b: SleepSchedule): number {
  if (a === b) return 1;
  if (a === "Flexible" || b === "Flexible") return 0.6;
  return 0;
}

function ladderScore<T>(order: T[], a: T, b: T): number {
  const d = Math.abs(order.indexOf(a) - order.indexOf(b));
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
}

export function scoreProfile(prefs: FlatmatePreferences, p: FlatmateProfile): MatchResult {
  const reasons: string[] = [];
  const differences: string[] = [];
  let score = 0;

  // Budget: full marks within 15%, tapering to zero at 50% apart.
  const diff = Math.abs(prefs.budget - p.budget) / Math.max(prefs.budget, 1);
  const budgetPart = diff <= 0.15 ? 1 : diff >= 0.5 ? 0 : 1 - (diff - 0.15) / 0.35;
  score += budgetPart * MATCH_WEIGHTS.budget;
  if (budgetPart >= 0.7) reasons.push("Similar budget");
  else if (budgetPart < 0.3) differences.push("Budgets are far apart");

  if (prefs.locality && prefs.locality === p.locality) {
    score += MATCH_WEIGHTS.locality;
    reasons.push(`Same preferred locality (${p.locality})`);
  } else if (prefs.locality) {
    differences.push(`Prefers ${p.locality}`);
  } else {
    score += MATCH_WEIGHTS.locality * 0.5;
  }

  const s = sleepScore(prefs.sleep, p.sleep);
  score += s * MATCH_WEIGHTS.sleep;
  if (s === 1) reasons.push("Matching sleep schedule");
  else if (s === 0) differences.push(`Sleep: ${p.sleep.toLowerCase()}`);

  const c = ladderScore(CLEAN_ORDER, prefs.cleanliness, p.cleanliness);
  score += c * MATCH_WEIGHTS.cleanliness;
  if (c === 1) reasons.push("Same cleanliness standard");
  else if (c === 0.5) reasons.push("Compatible cleanliness preference");
  else differences.push(`Cleanliness: ${p.cleanliness.toLowerCase()}`);

  const n = ladderScore(NOISE_ORDER, prefs.noise, p.noise);
  score += n * MATCH_WEIGHTS.noise;
  if (n === 1) reasons.push("Same noise tolerance");
  else if (n === 0) differences.push(`Noise: ${p.noise.toLowerCase()}`);

  if (prefs.kitchen === p.kitchen) {
    score += MATCH_WEIGHTS.kitchen;
    reasons.push("Similar kitchen habits");
  }
  if (prefs.moveIn === p.moveIn) {
    score += MATCH_WEIGHTS.moveIn;
    reasons.push("Same move-in timeline");
  }

  const shared = prefs.interests.filter((i) => p.interests.includes(i));
  if (shared.length) {
    score += Math.min(1, shared.length / 2) * MATCH_WEIGHTS.interests;
    reasons.push(`Shared interests: ${shared.join(", ")}`);
  }

  // Smoking is only compared when both sides chose to share it.
  if (prefs.smoking && prefs.smoking !== "Prefer not to say" && p.smoking && p.smoking !== "Prefer not to say") {
    if (prefs.smoking !== p.smoking) differences.push(`Smoking: ${p.smoking.toLowerCase()}`);
  }

  return { profile: p, score: Math.round(score), reasons, differences };
}

export function rankMatches(prefs: FlatmatePreferences, profiles: FlatmateProfile[]): MatchResult[] {
  return profiles
    .map((p) => scoreProfile(prefs, p))
    .sort((a, b) => b.score - a.score || a.profile.displayName.localeCompare(b.profile.displayName));
}

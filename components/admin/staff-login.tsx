"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, User } from "lucide-react";
import { staffLogin } from "@/app/actions/admin";
import { Wordmark } from "@/components/layout/wordmark";
import { FieldError } from "@/components/ui/field";

export function StaffLogin() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lock, setLock] = useState(0);
  const [sending, setSending] = useState(false);
  const [shake, setShake] = useState(0);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lock <= 0) return;
    const t = window.setTimeout(() => setLock((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [lock]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lock > 0 || sending) return;
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const r = await staffLogin(username, password);
      if (r.ok) {
        router.refresh();
        return;
      }
      setPassword("");
      setShake((s) => s + 1);
      if (r.reason === "locked") {
        setLock(r.lockSeconds);
        setError("Too many wrong attempts.");
      } else if (r.reason === "error") {
        setError("Sign-in is unavailable right now. Try again shortly.");
      } else {
        setError(`That username or password isn't right. ${r.remainingAttempts} ${r.remainingAttempts === 1 ? "attempt" : "attempts"} left before a short lockout.`);
        passwordRef.current?.focus();
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-ink p-6 text-warm md:p-10" aria-hidden="true">
        <span className="text-5xl">
          <Wordmark inverted />
        </span>
        <p className="display my-12 text-[clamp(4rem,12vw,10rem)] leading-[0.82] text-lime lg:my-0">
          Staff
          <br />
          <span className="outline-text [-webkit-text-stroke-color:var(--color-lime)]">only.</span>
        </p>
        <p className="label text-warm/60">Listings, enquiries and agents</p>
      </section>

      <section className="flex items-center justify-center p-4 py-12 md:p-10">
        <motion.div
          key={shake}
          animate={reduce || shake === 0 ? undefined : { x: [0, -10, 10, -6, 6, 0] }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <form onSubmit={submit} noValidate className="border-2 border-ink bg-warm shadow-[var(--shadow-hard-lg)]">
            <div className="flex items-center gap-3 border-b-2 border-ink bg-lime px-5 py-4">
              <Lock className="size-5" aria-hidden="true" />
              <h1 className="display text-3xl">Staff sign in</h1>
            </div>
            <div className="flex flex-col gap-5 p-5 md:p-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-username" className="text-sm font-bold">
                  Username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="staff-username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    className="field pl-9"
                    value={username}
                    disabled={lock > 0}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-password" className="text-sm font-bold">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
                  <input
                    ref={passwordRef}
                    id="staff-password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    className="field pl-9 pr-12"
                    value={password}
                    disabled={lock > 0}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "staff-login-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    aria-pressed={show}
                  >
                    {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {error && <FieldError id="staff-login-error">{lock > 0 ? `Too many wrong attempts. Try again in ${lock}s.` : error}</FieldError>}
              <button type="submit" className="btn btn-ink btn-lg" disabled={lock > 0 || sending}>
                {sending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                {lock > 0 ? `Locked for ${lock}s` : sending ? "Signing in…" : "Sign in"}
              </button>
              <p className="text-xs text-muted">Agents: ask the site admin if you&apos;ve forgotten your password.</p>
            </div>
          </form>
          <Link href="/" className="link-underline mt-6 inline-flex items-center gap-2 font-bold">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to the site
          </Link>
        </motion.div>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";
import { KeyRound, Loader2, Power, Trash2, UserPlus, Users } from "lucide-react";
import type { StaffAgent } from "@/types";
import { createAgent, deleteAgent, updateAgent } from "@/app/actions/admin";
import { cn, formatDateTime } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { useAdmin } from "./admin-context";

/** Admin only: create agent logins, reset passwords, deactivate or remove agents. */
export function AdminAgents() {
  const { agents, listings, putAgent, dropAgent } = useAdmin();
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<StaffAgent | null>(null);
  const [removing, setRemoving] = useState<StaffAgent | null>(null);

  const toggleActive = async (a: StaffAgent) => {
    try {
      const r = await updateAgent(a.id, { active: !a.active });
      if (!r.ok) return toast(r.message ?? "Couldn't update the agent.", "info");
      putAgent(r.data);
      toast(r.data.active ? `${a.displayName} can sign in again.` : `${a.displayName} is deactivated and signed out.`);
    } catch {
      toast("Couldn't reach the server. Try again.", "info");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="display text-5xl md:text-7xl">Agents</h1>
          <p className="mt-2 max-w-xl text-muted">
            Agents can add and manage their own listings and work every enquiry. They can&apos;t see other agents&apos; listings,
            tick verification checks, delete enquiries or manage accounts.
          </p>
        </div>
        <button type="button" className="btn btn-lime btn-lg self-start" onClick={() => setCreating(true)}>
          <UserPlus className="size-5" aria-hidden="true" />
          Add agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="border-2 border-dashed border-ink p-10 text-center">
          <Users className="mx-auto size-10" aria-hidden="true" />
          <p className="display mt-3 text-3xl">No agents yet</p>
          <p className="mt-2 text-muted">Add one to give them their own sign-in.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => {
            const count = listings.filter((l) => l.agentId === a.id).length;
            return (
              <li key={a.id} className={cn("flex flex-col gap-3 border-2 border-ink p-4 shadow-[var(--shadow-hard-sm)]", a.active ? "bg-warm" : "bg-paper-deep")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-xl font-extrabold leading-tight [overflow-wrap:anywhere]">{a.displayName}</p>
                    <p className="price text-sm text-muted">@{a.username}</p>
                  </div>
                  <span className={cn("label shrink-0 border-2 border-ink px-1.5 py-0.5", a.active ? "bg-lime" : "bg-warm text-muted")}>
                    {a.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted">Listings</dt>
                  <dd className="price font-bold">{count}</dd>
                  <dt className="text-muted">Last sign-in</dt>
                  <dd className="font-semibold">{a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}</dd>
                </dl>
                <div className="mt-auto flex flex-wrap gap-2 border-t-2 border-dashed border-ink/30 pt-3">
                  <button type="button" className="btn btn-sm" onClick={() => setResetting(a)}>
                    <KeyRound className="size-4" aria-hidden="true" />
                    Reset password
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => toggleActive(a)}>
                    <Power className="size-4" aria-hidden="true" />
                    {a.active ? "Deactivate" : "Reactivate"}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost !border-danger !text-danger" onClick={() => setRemoving(a)} aria-label={`Remove ${a.displayName}`}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Add agent" eyebrow="New sign-in">
        {creating && (
          <AgentForm
            onDone={(a) => {
              putAgent(a);
              setCreating(false);
              toast(`${a.displayName} can now sign in as @${a.username}.`);
            }}
          />
        )}
      </Modal>

      <Modal open={resetting !== null} onClose={() => setResetting(null)} title="Reset password" eyebrow={resetting ? `@${resetting.username}` : ""}>
        {resetting && (
          <ResetForm
            agent={resetting}
            onDone={(a) => {
              putAgent(a);
              setResetting(null);
              toast(`New password set for ${a.displayName}. Share it with them privately.`);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title="Remove this agent?"
        confirmLabel="Remove agent"
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          const target = removing;
          setRemoving(null);
          if (!target) return;
          try {
            const r = await deleteAgent(target.id);
            if (!r.ok) return toast(r.message ?? "Couldn't remove the agent.", "info");
            dropAgent(target.id);
            toast(`Removed ${target.displayName}.`);
          } catch {
            toast("Couldn't reach the server. Try again.", "info");
          }
        }}
      >
        <p>
          <strong>{removing?.displayName}</strong> will lose access straight away. Their listings stay on the site and become
          unassigned, and their past feedback keeps their name. To pause access instead, deactivate them.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function PasswordHint() {
  return <span>At least 10 characters, with letters and numbers. Share it with the agent privately.</span>;
}

function AgentForm({ onDone }: { onDone: (a: StaffAgent) => void }) {
  const [values, setValues] = useState({ username: "", displayName: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof values, v: string) => {
    setValues((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const r = await createAgent(values);
      if (r.ok) return onDone(r.data);
      setErrors(r.errors);
      setMessage(r.message ?? null);
    } catch {
      setMessage("Couldn't reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="agent-displayName" label="Full name" error={errors.displayName || undefined}>
        <input id="agent-displayName" className="field" data-autofocus value={values.displayName} onChange={(e) => set("displayName", e.target.value)} />
      </Field>
      <Field id="agent-username" label="Username" error={errors.username || undefined} hint="Lowercase letters, numbers, dot, dash or underscore">
        <input
          id="agent-username"
          className="field price"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          value={values.username}
          onChange={(e) => set("username", e.target.value.toLowerCase())}
        />
      </Field>
      <Field id="agent-password" label="Password" error={errors.password || undefined} hint={<PasswordHint />}>
        <input id="agent-password" className="field" type="text" autoComplete="new-password" value={values.password} onChange={(e) => set("password", e.target.value)} />
      </Field>
      {message && <FieldError id="agent-form-error">{message}</FieldError>}
      <button type="submit" className="btn btn-lime btn-lg" disabled={saving}>
        {saving && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        Create agent
      </button>
    </form>
  );
}

function ResetForm({ agent, onDone }: { agent: StaffAgent; onDone: (a: StaffAgent) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const r = await updateAgent(agent.id, { password });
      if (r.ok) return onDone(r.data);
      setError(r.errors.password ?? r.message ?? "Couldn't reset the password.");
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="reset-password" label={`New password for ${agent.displayName}`} error={error ?? undefined} hint={<PasswordHint />}>
        <input id="reset-password" className="field" type="text" autoComplete="new-password" data-autofocus value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-lime btn-lg" disabled={saving}>
        {saving && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        Set new password
      </button>
    </form>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint + error, wired with aria-describedby by convention. */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-bold">
        <span>{label}</span>
        {optional && <span className="text-xs font-medium text-muted">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm font-semibold text-danger">
      <span aria-hidden="true" className="mt-[3px] inline-block size-3 shrink-0 rotate-45 bg-danger" />
      {children}
    </p>
  );
}

/** Props helper for a control inside <Field>. */
export function describe(id: string, error?: string, hasHint?: boolean) {
  const ids = [error ? `${id}-error` : null, !error && hasHint ? `${id}-hint` : null].filter(Boolean).join(" ");
  return {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": ids || undefined,
  };
}

type ChoiceGroupProps<T extends string> = {
  id: string;
  legend: ReactNode;
  options: readonly { value: T; label: ReactNode }[] | readonly T[];
  value: T | "";
  onChange: (value: T) => void;
  error?: string;
  optional?: boolean;
  className?: string;
  columns?: string;
};

/** Radio group styled as chunky chips. Arrow keys work natively. */
export function ChoiceGroup<T extends string>({
  id,
  legend,
  options,
  value,
  onChange,
  error,
  optional,
  className,
  columns,
}: ChoiceGroupProps<T>) {
  const normalized = (options as readonly (T | { value: T; label: ReactNode })[]).map((o) =>
    typeof o === "string" ? { value: o as T, label: o as ReactNode } : o,
  );
  return (
    <fieldset className={cn("min-w-0", className)} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-1.5 flex w-full items-baseline justify-between gap-2 text-sm font-bold">
        <span>{legend}</span>
        {optional && <span className="text-xs font-medium text-muted">Optional</span>}
      </legend>
      <div className={cn("flex flex-wrap gap-2", columns)}>
        {normalized.map((o, i) => (
          <label key={o.value} className="chip">
            <input
              type="radio"
              className="sr-only"
              name={id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              id={i === 0 ? id : undefined}
              data-field={i === 0 ? id : undefined}
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <div className="mt-1.5">
          <FieldError id={`${id}-error`}>{error}</FieldError>
        </div>
      )}
    </fieldset>
  );
}

"use client";

import { useCallback, useState } from "react";
import type { z } from "zod";
import { fieldErrors } from "./validation";

/**
 * Minimal form state + zod validation. Values stay in state when validation fails,
 * errors are keyed by top-level field, and the first invalid field gets focus.
 * Field ids follow `${formId}-${field}`.
 */
export function useZodForm<S extends z.ZodTypeAny>(schema: S, initial: z.input<S>, formId: string) {
  type V = z.input<S>;
  const [values, setValues] = useState<V>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((prev: V) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }, []);

  const validate = useCallback((): z.output<S> | null => {
    const result = schema.safeParse(values);
    if (!result.success) {
      const errs = fieldErrors(result.error);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      if (first && typeof document !== "undefined") {
        const el = document.getElementById(`${formId}-${first}`) ?? document.querySelector<HTMLElement>(`[data-field="${formId}-${first}"]`);
        el?.focus({ preventScroll: false });
      }
      return null;
    }
    setErrors({});
    return result.data;
  }, [schema, values, formId]);

  const reset = useCallback((next?: V) => {
    setValues(next ?? initial);
    setErrors({});
  }, [initial]);

  return { values, set, setValues, errors, setErrors, validate, reset, id: (field: string) => `${formId}-${field}` };
}

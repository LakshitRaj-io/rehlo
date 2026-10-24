/**
 * Table columns are the snake_case form of the TypeScript field names
 * (approxDistanceKm ↔ approx_distance_km), so rows convert mechanically.
 */
const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function toRow(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[toSnake(k)] = v;
  return out;
}

export function fromRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v;
  return out as T;
}

export function columns(fields: readonly string[]): string {
  return fields.map(toSnake).join(",");
}

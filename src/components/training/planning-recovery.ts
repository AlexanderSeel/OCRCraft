import { z } from "zod";

export interface PlanningSnapshot<T> { readonly version: 1; readonly savedAt: string; readonly value: T; }
export const MAX_RECOVERY_SIZE = 128_000;
export function readPlanningSnapshot<T>(schema: z.ZodType<T>, raw: string): PlanningSnapshot<T> | null {
  if (raw.length > MAX_RECOVERY_SIZE) return null;
  try {
    const parsed = z.object({ version: z.literal(1), savedAt: z.string().datetime(), value: schema }).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}
export function createPlanningSnapshot<T>(schema: z.ZodType<T>, value: unknown): PlanningSnapshot<T> | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? { version: 1, savedAt: new Date().toISOString(), value: parsed.data } : null;
}

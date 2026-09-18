const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MEDIA_BATCH_MAX_EXERCISES = 50;

export function normalizeMediaBatchExerciseIds(
  values: readonly unknown[],
  limit = MEDIA_BATCH_MAX_EXERCISES,
): readonly string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") continue;
    const id = value.trim().toLowerCase();
    if (!UUID_PATTERN.test(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
    if (normalized.length >= Math.max(1, limit)) break;
  }

  return normalized;
}

/** Image storyboards support at most seven frames. Preserve the opening and
 * closing instructions while folding any extra middle steps into the final
 * frame so imported guidance remains usable for generation. */
export function normalizeImageExecutionSteps(steps: readonly string[], maximum = 7): string[] {
  if (steps.length <= maximum) return [...steps];
  const head = steps.slice(0, maximum - 1);
  return [...head, steps.slice(maximum - 1).join(" ")];
}

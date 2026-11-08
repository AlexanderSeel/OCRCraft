/** Source scopes and the distinction between evidence and club heuristics are documented in docs/catalog-startup-review.md. */
export const SPORTS_PLANNING_REFERENCES = [
  { title: "CrossFit: mechanics, consistency, intensity", url: "https://www.crossfit.com/essentials/mechanics-consistency-intensity-part-1-what-does-it-mean", scope: "Movement quality and scaling before intensity; not a universal youth loading prescription." },
  { title: "ACSM 2026 resistance-training position stand", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/", scope: "Individualized resistance training for healthy adults; do not extrapolate adult prescriptions to children." },
  { title: "World Athletics Kids Athletics", url: "https://worldathletics.org/kids-athletics", scope: "Inclusive, playful fundamental movement development for children." },
] as const;

export const SPORTS_PLANNING_PRINCIPLES = [
  "Prioritize repeatable movement mechanics before adding load, speed, volume or coordination complexity; scale the exercise to the athlete while preserving the intended training objective.",
  "For children prioritize inclusive games and fundamental movement skills. Do not extrapolate healthy-adult strength prescriptions to children or imply that every sport needs the same load or intensity.",
  "An outdoor label does not establish local suitability: confirm available equipment, surface, weather, clearances, travel paths and supervision. Never invent obstacle measurements, usable lane lengths or equipment stock.",
  "Warm-up must progressively prepare the movement patterns and body regions used in the main part without pre-fatiguing the group.",
  "The main part must prioritize the stated training objective instead of maximizing unrelated variety.",
  "Technically demanding, balance-sensitive or complex coordination work should normally happen before fatigue-heavy conditioning when the session goal permits it.",
  "Avoid unnecessary consecutive high-impact or high-risk selections and avoid three consecutive exercises loading the same local body region.",
  "Balance repeated movement patterns with useful counterparts such as push/pull, squat/hinge and rotate/brace where this fits the stated objective.",
  "When a muscle group is explicitly focused, include a typical antagonist or balancing pattern when appropriate rather than treating secondary muscles as antagonists.",
  "For mixed groups prefer one movement pattern with approved Level 1/2/3 variants over unrelated exercises; harder must not simply mean riskier.",
  "Respect age, location, equipment stock, station capacity, supervision/risk metadata and trainer-declared avoid regions as hard constraints.",
  "Cooldown should reduce intensity and relate to the demands of the main part using suitable recovery or mobility work.",
  "Prefer coherent purposeful exercise selections and recent-use variety over a random catalogue of movements.",
] as const;

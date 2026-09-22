export interface SourceCatalogRecord {
  readonly name: string;
  readonly category?: string | null;
  readonly bodyPart?: string | null;
  readonly equipment?: string | readonly string[] | null;
  readonly target?: string | readonly string[] | null;
  readonly instructions?: string | readonly string[] | Record<string, unknown> | null;
  readonly media?: string | null;
}

const normalize = (value: string): string => value
  .normalize("NFKC")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

function tokenDice(left: string, right: string): number {
  const a = new Set(normalize(left).split(/\s+/).filter(Boolean));
  const b = new Set(normalize(right).split(/\s+/).filter(Boolean));
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return (2 * overlap) / (a.size + b.size);
}

function editRatio(left: string, right: string): number {
  const a = normalize(left);
  const b = normalize(right);
  if (a === b) return 1;
  if (!a || !b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const previous = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = previous;
    }
  }
  return 1 - row[b.length] / Math.max(a.length, b.length);
}

export function sourceCatalogMatchScore(left: SourceCatalogRecord, right: SourceCatalogRecord): number {
  const a = normalize(left.name);
  const b = normalize(right.name);
  if (a === b) return 1;
  return Math.max(tokenDice(a, b), editRatio(a, b));
}

export function sourceCatalogCompleteness(record: SourceCatalogRecord): number {
  const values = [record.name, record.category, record.bodyPart, record.equipment, record.target, record.instructions, record.media];
  return values.reduce((score, value) => {
    if (Array.isArray(value)) return score + (value.length > 0 ? 1 : 0);
    if (value && typeof value === "object") return score + (Object.keys(value).length > 0 ? 1 : 0);
    return score + (String(value ?? "").trim() ? 1 : 0);
  }, 0);
}

export function findBestSourceCatalogMatch<T extends SourceCatalogRecord>(input: SourceCatalogRecord, candidates: readonly T[], threshold = 0.7): { readonly candidate: T; readonly score: number } | null {
  let best: { candidate: T; score: number } | null = null;
  for (const candidate of candidates) {
    const score = sourceCatalogMatchScore(input, candidate);
    if (!best || score > best.score || (score === best.score && sourceCatalogCompleteness(candidate) > sourceCatalogCompleteness(best.candidate))) {
      best = { candidate, score };
    }
  }
  return best && best.score >= threshold ? best : null;
}

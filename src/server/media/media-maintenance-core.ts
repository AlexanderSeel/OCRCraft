export interface MediaStorageDiff {
  readonly orphanedKeys: readonly string[];
  readonly missingKeys: readonly string[];
}

function normalizeKey(value: string): string {
  return value.trim().replaceAll("\\", "/").replace(/^\/+/, "");
}

export function diffMediaStorageKeys(
  storedKeys: readonly string[],
  referencedKeys: readonly string[],
): MediaStorageDiff {
  const stored = new Set(storedKeys.map(normalizeKey).filter(Boolean));
  const referenced = new Set(referencedKeys.map(normalizeKey).filter(Boolean));
  return {
    orphanedKeys: [...stored].filter((key) => !referenced.has(key)).sort(),
    missingKeys: [...referenced].filter((key) => !stored.has(key)).sort(),
  };
}

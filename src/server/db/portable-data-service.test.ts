import { describe, expect, it } from "vitest";
import { parsePortableImport } from "./portable-data-core";

describe("portable data contract", () => {
  it("accepts versioned section exports", () => {
    const result = parsePortableImport({ schema: "ocrcraft-portable", version: 1, exportedAt: "2026-01-01T00:00:00.000Z", sections: { exercises: [{ _table: "exercises", id: "1" }] } });
    expect(result.ok).toBe(true);
  });

  it("rejects unknown schemas before any database write", () => {
    const result = parsePortableImport({ schema: "other", version: 1, exportedAt: "now", sections: {} });
    expect(result).toEqual({ ok: false, errors: expect.any(Array) });
  });
});

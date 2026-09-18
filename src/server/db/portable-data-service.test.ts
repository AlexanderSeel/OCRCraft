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

  it("round-trips optional media binary metadata through the portable contract", () => {
    const exported = { schema: "ocrcraft-portable", version: 1, exportedAt: "2026-01-01T00:00:00.000Z", sections: { media: [{ _table: "exercise_media_assets", id: "asset-1", content_type: "image/png", sha256: "abc", _binary_base64: "aGVsbG8=", _binary_sha256: "2cf24dba", _binary_content_type: "image/png" }] } };
    const result = parsePortableImport(exported);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.sections.media?.[0]).toMatchObject({ _binary_base64: "aGVsbG8=", _binary_content_type: "image/png" });
  });
});

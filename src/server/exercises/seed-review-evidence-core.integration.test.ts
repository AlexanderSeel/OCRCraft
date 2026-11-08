import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { runSeedReviewEvidenceQuery } from "./seed-review-evidence-core";

describe("seed review evidence classification", () => {
  it("keeps compatibility, missing and ambiguous records out of versioned evidence", async () => {
    const db=await DuckDBInstance.create(":memory:");const c=await db.connect();
    try {
      await c.run("CREATE TABLE exercises(id VARCHAR,seed_key VARCHAR); CREATE TABLE exercise_seed_quality_reviews(exercise_id VARCHAR,review_version VARCHAR,review_status VARCHAR)");
      await c.run("INSERT INTO exercises VALUES ('versioned','a'),('legacy','b'),('missing','c'),('needs-work','d'),('blank','e'),('import',NULL)");
      await c.run("INSERT INTO exercise_seed_quality_reviews VALUES ('versioned','specific-review-v2','passed'),('legacy',' COMPAT-v1 ','passed'),('needs-work','specific-v1','needs_work'),('blank','','passed'),('import','specific','passed')");
      expect(await runSeedReviewEvidenceQuery(c)).toEqual({versionedPassed:1,compatibilityPassed:1,missing:1,needsWork:2});
    } finally {c.closeSync();db.closeSync();}
  });
  it("handles an empty seed catalog without manufacturing evidence",async()=>{
    const db=await DuckDBInstance.create(":memory:");const c=await db.connect();
    try {
      await c.run("CREATE TABLE exercises(id VARCHAR,seed_key VARCHAR); CREATE TABLE exercise_seed_quality_reviews(exercise_id VARCHAR,review_version VARCHAR,review_status VARCHAR)");
      expect(await runSeedReviewEvidenceQuery(c)).toEqual({versionedPassed:0,compatibilityPassed:0,missing:0,needsWork:0});
    } finally {c.closeSync();db.closeSync();}
  });
});

import { describe, expect, it } from "vitest";
import { assessPlanningMetadata, type PlanningMetadata } from "./planning-eligibility";
const ready: PlanningMetadata = { minAge: 8, riskLevel: "low", suitableForKids: true, suitableForYouth: true, suitableForAdults: true, indoorSuitable: true, outdoorSuitable: true, stationCapacity: 4, trainingGoals: ["coordination"], movementPatterns: ["locomotion"] };
describe("minimum planning metadata eligibility", () => {
  it("accepts explicit suitable metadata without asserting human approval", () => {
    expect(assessPlanningMetadata(ready,"kids","outdoor")).toEqual([]);
  });
  it.each([
    [{ minAge: null },"minimum-age"], [{ minAge: -1 },"minimum-age"], [{ minAge: 0 },"minimum-age"], [{ minAge: 100 },"minimum-age"], [{ riskLevel: "unknown" },"risk"],
    [{ suitableForKids: null },"audience"], [{ suitableForKids: false },"audience"],
    [{ outdoorSuitable: null },"location"], [{ outdoorSuitable: false },"location"],
    [{ stationCapacity: null },"capacity"], [{ stationCapacity: 0 },"capacity"],
    [{ trainingGoals: [" "] },"goals"], [{ movementPatterns: [] },"movement-patterns"],
  ] as const)("rejects missing or invalid metadata: %s", (change,reason) => {
    expect(assessPlanningMetadata({ ...ready,...change },"kids","outdoor")).toContain(reason);
  });
  it("requires known mixed suitability rather than treating null as true", () => {
    expect(assessPlanningMetadata({ ...ready,suitableForKids:null },"mixed","mixed")).toContain("audience");
    expect(assessPlanningMetadata({ ...ready,indoorSuitable:null },"mixed","mixed")).toContain("location");
    expect(assessPlanningMetadata({ ...ready,indoorSuitable:false,outdoorSuitable:false },"mixed","mixed")).toContain("location");
  });
});

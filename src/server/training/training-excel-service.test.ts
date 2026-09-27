import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  persistTrainingDraftMock: vi.fn().mockResolvedValue("imported-session"),
  listExercisesMock: vi.fn(),
}));
vi.mock("@/server/exercises/exercise-repository", () => ({ listExercises: mocks.listExercisesMock }));
vi.mock("./training-session-repository", () => ({ persistTrainingDraft: mocks.persistTrainingDraftMock }));
import { exportTrainingWorkbook, importTrainingWorkbook } from "./training-excel-service";
import type { TrainingSessionDetail } from "./training-session-repository";

describe("training Excel export", () => {
  it("keeps the template columns and writes explicit phase/subheadings", async () => {
    const session = {
      id: "training-1",
      title: "OCR Grundlagen",
      status: "draft",
      source: "manual",
      totalDurationMinutes: 30,
      locale: "de",
      itemCount: 3,
      createdAt: "2026-09-27T10:00:00.000Z",
      trainerProfile: null,
      groupId: null,
      notes: null,
      routeName: null,
      routeDistanceMetres: null,
      routeSurface: null,
      routeGpsReference: null,
      routeNotes: null,
      updatedAt: "2026-09-27T10:00:00.000Z",
      organizationMode: "solo",
      teamSize: null,
      groupSplitCount: null,
      phases: [
        { id: "warmup", kind: "warmup", title: "Aufwärmen", sortOrder: 0, items: [{ id: "w1", exerciseId: "e1", exerciseName: "Laufen", format: "free", durationMinutes: 5, instructions: "Locker laufen.", levelLabel: null, sortOrder: 0, mainPartIndex: null, mainPartTitle: null, programming: null }] },
        { id: "main", kind: "main", title: "Hauptteil", sortOrder: 1, items: [{ id: "m1", exerciseId: "e2", exerciseName: "Bear Crawl", format: "circuit", durationMinutes: 20, instructions: "Kontrolliert bewegen.", levelLabel: "Standard", sortOrder: 0, mainPartIndex: 1, mainPartTitle: "Hauptteil 1 · Technik", programming: null }] },
        { id: "cooldown", kind: "cooldown", title: "Cooldown & Stretching", sortOrder: 2, items: [{ id: "c1", exerciseId: "e3", exerciseName: "Atmung", format: "free", durationMinutes: 5, instructions: "Ruhig atmen.", levelLabel: null, sortOrder: 0, mainPartIndex: null, mainPartTitle: null, programming: null }] },
      ],
    } satisfies TrainingSessionDetail;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await exportTrainingWorkbook(session) as never);
    const sheet = workbook.getWorksheet("Trainingsvorlage");
    expect(sheet).toBeDefined();
    expect(sheet?.getRow(1).getCell(1).text).toBe("Zeit");
    expect(sheet?.getRow(2).getCell(1).text).toBe("Aufwärmen");
    expect(sheet?.getRow(4).getCell(1).text).toBe("Hauptteil");
    expect(sheet?.getRow(5).getCell(1).text).toContain("Hauptteil 1");
    expect(sheet?.getRow(7).getCell(1).text).toBe("Cooldown & Stretching");
  });

  it("round-trips exported phase headings into an imported draft", async () => {
    mocks.listExercisesMock.mockImplementation(async ({ query }: { readonly query: string }) => [{
      id: `exercise-${query}`,
      name: query,
      summary: "",
      category: "general",
      phase: "main",
      riskLevel: "low",
      minAge: null,
      archived: false,
      equipment: [],
      seedKey: null,
      imageUrl: null,
      imageReviewStatus: null,
      imageLicenseLabel: null,
      imageFormat: null,
      sequenceStepCount: null,
    }]);
    const source = {
      id: "training-2", title: "Roundtrip", status: "draft", source: "manual", totalDurationMinutes: 30, locale: "de", itemCount: 3,
      createdAt: "2026-09-27T10:00:00.000Z", trainerProfile: null, groupId: null, notes: null, routeName: null, routeDistanceMetres: null,
      routeSurface: null, routeGpsReference: null, routeNotes: null, updatedAt: "2026-09-27T10:00:00.000Z", organizationMode: "solo", teamSize: null,
      groupSplitCount: null,
      phases: [
        { id: "w", kind: "warmup", title: "Aufwärmen", sortOrder: 0, items: [{ id: "w1", exerciseId: "w1", exerciseName: "Laufen", format: "free", durationMinutes: 5, instructions: "Locker.", levelLabel: null, sortOrder: 0, mainPartIndex: null, mainPartTitle: null, programming: null }], },
        { id: "m", kind: "main", title: "Hauptteil", sortOrder: 1, items: [{ id: "m1", exerciseId: "m1", exerciseName: "Bear Crawl", format: "circuit", durationMinutes: 20, instructions: "Kontrolliert.", levelLabel: null, sortOrder: 0, mainPartIndex: 1, mainPartTitle: "Hauptteil 1", programming: null }], },
        { id: "c", kind: "cooldown", title: "Cooldown & Stretching", sortOrder: 2, items: [{ id: "c1", exerciseId: "c1", exerciseName: "Atmung", format: "free", durationMinutes: 5, instructions: "Ruhig.", levelLabel: null, sortOrder: 0, mainPartIndex: null, mainPartTitle: null, programming: null }], },
      ],
    } satisfies TrainingSessionDetail;
    const buffer = await exportTrainingWorkbook(source);
    const result = await importTrainingWorkbook(new Uint8Array(buffer), "Importierter Roundtrip");
    expect(result).toEqual({ sessionId: "imported-session", matchedExercises: 3, phaseCount: 3 });
    expect(mocks.persistTrainingDraftMock).toHaveBeenCalledOnce();
  });
});

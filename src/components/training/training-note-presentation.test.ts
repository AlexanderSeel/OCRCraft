import { expect, it } from "vitest";
import { presentPlanningMessage, presentTrainingNote } from "./training-note-presentation";

it("presents known system notes bilingually while retaining their exact provenance", () => {
  const local = "Quick Create · local deterministic sports composer";
  expect(presentTrainingNote(local, "de")).toEqual({ summary: "Aus dem Übungskatalog zusammengestelltes Training.", details: local });
  const ai = "Quick Create · reviewed AI proposal · deterministic OCRCraft revalidation";
  expect(presentTrainingNote(ai, "en")).toEqual({ summary: "Training proposed with AI from the exercise catalog.", details: ai });
});

it("preserves custom, appended and empty notes without keyword heuristics", () => {
  for (const notes of ["Trainer: deterministisch dosieren\nMaterial vor Ort prüfen.", "Quick Create · local deterministic sports composer · individuelle Ergänzung"]) {
    expect(presentTrainingNote(notes, "de")).toEqual({ summary: notes, details: null });
  }
  expect(presentTrainingNote(null, "de")).toBeNull();
  expect(presentTrainingNote("", "en")).toBeNull();
});

it("only adapts the known informational message and preserves safety messages", () => {
  const method = "Lokaler Sportalgorithmus: deterministische Auswahl ohne AI; der Hauptteil definiert das Trainingsziel, Aufwärmen und Cooldown werden passend zu dessen Bewegungs- und Belastungsprofil gewählt.";
  expect(presentPlanningMessage(method, "en")).toContain("Check that warm-up and cooldown");
  expect(presentPlanningMessage("Mindestalter unterschritten", "en")).toBe("Mindestalter unterschritten");
});

export interface CatalogCoverageInput {
  readonly id: string;
  readonly name: string;
  readonly hasGerman: boolean;
  readonly hasEnglish: boolean;
  readonly hasPhase: boolean;
  readonly hasRiskAndAge: boolean;
  readonly hasGoal: boolean;
  readonly hasEquipment: boolean;
  readonly hasBodyRegion: boolean;
  readonly hasOcrCapability: boolean;
  readonly isClubObstacle: boolean;
  readonly hasClubGuidance: boolean;
}

export interface CatalogCoverageDimension {
  readonly key: string;
  readonly label: string;
  readonly total: number;
  readonly covered: number;
  readonly missing: number;
  readonly percent: number;
  readonly examples: readonly string[];
}

export interface CatalogCoverageReport {
  readonly totalExercises: number;
  readonly dimensions: readonly CatalogCoverageDimension[];
}

interface DimensionDefinition {
  readonly key: string;
  readonly label: string;
  readonly applies: (row: CatalogCoverageInput) => boolean;
  readonly covered: (row: CatalogCoverageInput) => boolean;
}

const DIMENSIONS: readonly DimensionDefinition[] = [
  { key: "language-de", label: "Deutsch", applies: () => true, covered: (row) => row.hasGerman },
  { key: "language-en", label: "Englisch", applies: () => true, covered: (row) => row.hasEnglish },
  { key: "phase", label: "Trainingsphase", applies: () => true, covered: (row) => row.hasPhase },
  { key: "risk-age", label: "Risiko & Mindestalter", applies: () => true, covered: (row) => row.hasRiskAndAge },
  { key: "goal", label: "Trainingsziel", applies: () => true, covered: (row) => row.hasGoal },
  { key: "equipment", label: "Equipment", applies: () => true, covered: (row) => row.hasEquipment },
  { key: "body-region", label: "Körperregion", applies: () => true, covered: (row) => row.hasBodyRegion },
  { key: "ocr-capability", label: "OCR-Fähigkeit", applies: () => true, covered: (row) => row.hasOcrCapability },
  { key: "club-obstacle", label: "Club-Hindernis", applies: (row) => row.isClubObstacle, covered: (row) => row.hasClubGuidance },
];

export function buildCatalogCoverageReport(rows: readonly CatalogCoverageInput[]): CatalogCoverageReport {
  return {
    totalExercises: rows.length,
    dimensions: DIMENSIONS.map((definition) => {
      const applicable = rows.filter(definition.applies);
      const covered = applicable.filter(definition.covered).length;
      const missingRows = applicable.filter((row) => !definition.covered(row));
      return {
        key: definition.key,
        label: definition.label,
        total: applicable.length,
        covered,
        missing: applicable.length - covered,
        percent: applicable.length === 0 ? 100 : Math.round((covered / applicable.length) * 100),
        examples: missingRows.slice(0, 5).map((row) => row.name || row.id),
      };
    }),
  };
}

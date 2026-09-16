export type ExerciseImageLocale = "de" | "en";

export interface LocalizedExerciseImageGuidance {
  readonly name: string;
  readonly summary: string;
  readonly purpose: string;
  readonly setup: string;
  readonly startPosition: string;
  readonly finishReset: string;
  readonly breathingCue: string;
  readonly tempoCue: string;
  readonly safetyNotes: string;
  readonly qualityCriteria: string;
  readonly prerequisites: string;
  readonly fallbackExercise: string;
  readonly executionSteps: readonly string[];
  readonly coachingCues: readonly string[];
  readonly commonMistakes: readonly { readonly mistake: string; readonly correction: string }[];
  readonly specializedGuidance: readonly string[];
}

export interface ExerciseImageGenerationContext {
  readonly exerciseId: string;
  readonly seedKey: string | null;
  readonly category: string;
  readonly exerciseType: string;
  readonly difficulty: string;
  readonly riskLevel: string;
  readonly minimumAge: number | null;
  readonly impactLevel: string;
  readonly coordinationComplexity: string;
  readonly spaceRequirement: string;
  readonly supervision: string;
  readonly suitableIndoors: boolean;
  readonly suitableOutdoors: boolean;
  readonly bodyRegions: readonly {
    readonly emphasis: string;
    readonly labelDe: string;
    readonly labelEn: string;
  }[];
  readonly movementPatterns: readonly { readonly labelDe: string; readonly labelEn: string }[];
  readonly equipment: readonly {
    readonly nameDe: string;
    readonly nameEn: string;
    readonly quantity: number;
  }[];
  readonly localized: Readonly<Record<ExerciseImageLocale, LocalizedExerciseImageGuidance>>;
}

export interface GeneratedExerciseImage {
  readonly bytes: Uint8Array;
  readonly contentType: "image/png";
  readonly width: number;
  readonly height: number;
}

export interface StoredExerciseImage {
  readonly storageProvider: "filesystem" | "s3";
  readonly storageKey: string;
  readonly storageUri: string;
}

export interface CreateExerciseImageGenerationRecord {
  readonly exerciseId: string;
  readonly styleProfile: string;
  readonly generationPrompt: string;
  readonly storageProvider: StoredExerciseImage["storageProvider"];
}

export interface CompleteExerciseImageGenerationRecord {
  readonly assetId: string;
  readonly storedImage: StoredExerciseImage;
  readonly contentType: string;
  readonly sha256: string;
  readonly width: number;
  readonly height: number;
}

export interface ExerciseImageGenerationRepositoryPort {
  getContext(identifier: string): Promise<ExerciseImageGenerationContext>;
  createGeneratingRecord(input: CreateExerciseImageGenerationRecord): Promise<string>;
  markGenerated(input: CompleteExerciseImageGenerationRecord): Promise<void>;
  markFailed(assetId: string, errorMessage: string): Promise<void>;
}

import { BuilderWorkspace } from "@/components/training/builder-workspace";
import { BuilderSourcePicker } from "@/components/training/builder-source-picker";
import { routeMetadata } from "@/config/route-titles";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { buttonClass } from "@/components/ui/form";
import {
  TrainingBuilderPanel,
  type TrainingBuilderInitialState,
  type TrainingBuilderSourceOption,
} from "@/components/training/training-builder-panel";
import { TrainingQuickPlanner } from "@/components/training/training-quick-planner";
import type { MainPartProgramming } from "@/domain/training/model";
import { listTrainingEquipmentOptions, listTrainingObstacleOptions } from "@/server/training/training-draft-repository";
import { getLatestTrainingGeneration } from "@/server/training/training-generation-repository";
import { getTrainingSessionById, listTrainingSessions } from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{ source?: string; mode?: string; planner?: string }>;
}

export default async function TrainingBuilderPage({ searchParams }: PageProps) {
  const { source, mode } = await searchParams;
  const [equipmentOptions, obstacleOptions, recentSessions] = await Promise.all([
    listTrainingEquipmentOptions(),
    listTrainingObstacleOptions(),
    listTrainingSessions(false, 60),
  ]);

  const sourceTrainingOptions: TrainingBuilderSourceOption[] = recentSessions.map((session) => ({
    id: session.id,
    title: session.title,
    totalDurationMinutes: session.totalDurationMinutes,
    itemCount: session.itemCount,
  }));
  const initialState = source ? await buildInitialState(source) : undefined;

  return (
    <AppShell
      title="Training Builder"
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link className={buttonClass("secondary", "px-4")} href="/quick-create">Quick Create Wizard</Link>
          <Link className={buttonClass("secondary", "px-4")} href="/training">Trainings</Link>
        </div>
      )}
    >
      <BuilderWorkspace
        quick={<div data-tour="builder"><TrainingQuickPlanner equipmentOptions={equipmentOptions} obstacleOptions={obstacleOptions} /></div>}
        detailed={<div className="space-y-4">
          <BuilderSourcePicker options={sourceTrainingOptions} source={source} unavailable={Boolean(source && !initialState)} mode={initialState?.builderMode ?? (mode === "ai" ? "ai" : "local")} />
          <TrainingBuilderPanel key={`${source ?? "new"}:${mode ?? "local"}`} equipmentOptions={equipmentOptions} obstacleOptions={obstacleOptions} initialBuilderMode={mode === "ai" ? "ai" : "local"} initialState={initialState} sourceTrainingOptions={sourceTrainingOptions} />
        </div>}
      />
    </AppShell>
  );
}

async function buildInitialState(trainingId: string): Promise<TrainingBuilderInitialState | undefined> {
  const [session, generation] = await Promise.all([getTrainingSessionById(trainingId), getLatestTrainingGeneration(trainingId)]);
  if (!session || !generation) return undefined;

  const request = generation.request;
  const exerciseById = new Map(session.phases.flatMap((phase) => phase.items).flatMap((item) => item.exerciseId ? [[item.exerciseId, item.exerciseName] as const] : []));
  const mainItems = session.phases.filter((phase) => phase.kind === "main").flatMap((phase) => phase.items);
  const actualMainPartCount = Math.max(1, ...mainItems.map((item) => item.mainPartIndex ?? 1));
  const actualMainPartExerciseCounts = Array.from({ length: actualMainPartCount }, (_, zeroBasedIndex) => mainItems.filter((item) => (item.mainPartIndex ?? 1) === zeroBasedIndex + 1).length);
  const hasUsefulStoredStructure = actualMainPartExerciseCounts.every((count) => count > 0);
  const mainPartCount = hasUsefulStoredStructure ? actualMainPartCount : request.mainPartCount;
  const mainPartExerciseCounts = hasUsefulStoredStructure ? actualMainPartExerciseCounts : request.mainPartExerciseCounts;
  const mainPartProgramming: readonly MainPartProgramming[] = Array.from({ length: mainPartCount }, (_, zeroBasedIndex) => {
    const stored = mainItems.find((item) => (item.mainPartIndex ?? 1) === zeroBasedIndex + 1)?.programming;
    return stored ?? request.mainPartProgramming?.[zeroBasedIndex] ?? { mode: "standard" };
  });

  return {
    sourceTrainingId: session.id,
    sourceTitle: session.title,
    groupId: session.groupId ?? request.groupId,
    builderMode: generation.builderMode,
    audience: request.audience,
    minAge: request.minAge,
    maxAge: request.maxAge,
    participantCount: request.participantCount,
    durationMinutes: session.totalDurationMinutes,
    goals: request.goals,
    bodyRegions: request.bodyRegions,
    avoidBodyRegions: request.avoidBodyRegions,
    exerciseTypes: request.exerciseTypes,
    formats: request.formats,
    location: request.location,
    venueId: request.venueId,
    intensity: request.intensity,
    warmupExerciseCount: session.phases.find((phase) => phase.kind === "warmup")?.items.length || request.warmupExerciseCount,
    mainExerciseCount: mainPartExerciseCounts?.[0] ?? request.mainExerciseCount,
    mainPartExerciseCounts,
    mainPartProgramming,
    cooldownExerciseCount: session.phases.find((phase) => phase.kind === "cooldown")?.items.length || request.cooldownExerciseCount,
    mainPartCount,
    organizationMode: session.organizationMode ?? request.organizationMode,
    teamSize: session.organizationMode === "team" ? session.teamSize ?? request.teamSize : undefined,
    groupSplitCount: session.organizationMode === "solo" ? session.groupSplitCount ?? request.groupSplitCount : undefined,
    sourceTrainingIds: request.sourceTrainingIds,
    preferredExercises: request.preferredExerciseIds.map((id) => ({ id, label: exerciseById.get(id) ?? id, category: "Gespeicherte Wunschübung" })),
    availableEquipment: request.availableEquipment,
    availableObstacleExerciseIds: request.availableObstacleExerciseIds,
  };
}

export const metadata = routeMetadata("trainingBuilder");

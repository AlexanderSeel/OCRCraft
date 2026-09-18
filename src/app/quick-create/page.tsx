import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { QuickCreateWizard } from "@/components/training/quick-create-wizard";
import { getTrainingTemplateByKey } from "@/domain/training/training-template-catalog";
import { listClubGroups } from "@/server/groups/group-repository";
import {
  listTrainingEquipmentOptions,
  listTrainingObstacleOptions,
} from "@/server/training/training-draft-repository";

export const dynamic = "force-dynamic";

interface PageProps { readonly searchParams: Promise<{ template?: string }>; }

export default async function QuickCreatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialTemplate = getTrainingTemplateByKey(params.template);
  const [equipmentOptions, obstacleOptions, groups] = await Promise.all([
    listTrainingEquipmentOptions(),
    listTrainingObstacleOptions(),
    listClubGroups(false),
  ]);

  return (
    <AppShell
      title="Quick Create"
      subtitle="Von Gruppe und Trainingsziel zum strukturierten OCR-Trainingsentwurf."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex rounded-xl bg-[var(--control-strong)] px-4 py-2.5 text-sm font-black text-[var(--control-strong-foreground)]"
            href="/training/builder"
          >
            Training Builder
          </Link>
          <Link
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold hover:bg-[var(--surface-subtle)]"
            href="/"
          >
            Zur Übersicht
          </Link>
        </div>
      )}
    >
      <QuickCreateWizard
        initialTemplate={initialTemplate ? {
          key: initialTemplate.key,
          title: initialTemplate.titleDe,
          audience: initialTemplate.audience,
          minAge: initialTemplate.minAge,
          maxAge: initialTemplate.maxAge,
          participantCount: initialTemplate.defaultParticipants,
          durationMinutes: initialTemplate.durationMinutes,
          goals: initialTemplate.goals,
          bodyRegions: initialTemplate.bodyRegions,
          formats: initialTemplate.formats,
          location: initialTemplate.location,
          intensity: initialTemplate.intensity,
        } : undefined}
        equipmentOptions={equipmentOptions}
        obstacleOptions={obstacleOptions}
        groupPresets={groups.map((group) => ({
          id: group.id,
          name: group.name,
          audience: group.audience,
          minAge: group.minAge,
          maxAge: group.maxAge,
          participantCount: group.defaultParticipantCount,
          durationMinutes: group.defaultDurationMinutes,
          defaultLocation: group.defaultLocation,
          defaultEquipment: group.defaultEquipment,
          skillDistribution: group.skillDistribution,
          preferredFormats: group.preferredFormats,
          defaultOrganizationMode: group.defaultOrganizationMode,
          defaultTeamSize: group.defaultTeamSize,
          defaultGroupSplitCount: group.defaultGroupSplitCount,
          defaultStationGroupSize: group.defaultStationGroupSize,
        }))}
      />
    </AppShell>
  );
}

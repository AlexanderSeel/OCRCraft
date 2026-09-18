import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TrainingPhaseCard } from "@/components/training/phase-card";
import { StatCard } from "@/components/ui/stat-card";
import type { TrainingSession } from "@/domain/training/model";
import {
  getPlannedDurationMinutes,
  validateTrainingSession,
} from "@/domain/training/validation";

const previewSession: TrainingSession = {
  id: "preview-ocr-rig-run",
  title: "Grip, Carry & Run",
  group: {
    id: "open-training",
    name: "OCR Open Training",
    audience: "mixed",
    participantCount: 18,
  },
  totalDurationMinutes: 75,
  focus: ["Grip", "Laufen", "Ganzkörper", "OCR-Technik"],
  phases: [
    {
      id: "phase-warmup",
      kind: "warmup",
      title: "Ankommen & Bewegungsqualität",
      items: [
        {
          id: "warmup-run",
          durationMinutes: 6,
          exercise: {
            id: "run-abc",
            name: "Lauf-ABC & Richtungswechsel",
            riskLevel: "low",
            bodyRegions: ["full-body"],
            equipment: ["Markierungshütchen"],
          },
          instructions: "Locker anlaufen, Kniehebelauf, Anfersen und kontrollierte Richtungswechsel.",
        },
        {
          id: "warmup-mobility",
          durationMinutes: 6,
          exercise: {
            id: "shoulder-hip-prep",
            name: "Schulter-, Hüft- & Hang-Vorbereitung",
            riskLevel: "low",
            bodyRegions: ["shoulders", "hips", "forearms-grip"],
            equipment: ["Rig"],
          },
          instructions: "Mobilität und aktive Schulterspannung ohne Vorermüdung.",
        },
      ],
    },
    {
      id: "phase-main",
      kind: "main",
      title: "Rig & Run mit skalierbaren Stationen",
      items: [
        {
          id: "main-rig-run",
          durationMinutes: 20,
          format: "rig-run",
          levelLabel: "Level 1–3",
          exercise: {
            id: "rig-run-combo",
            name: "400 m Run + Rig Traverse",
            riskLevel: "medium",
            bodyRegions: ["full-body", "forearms-grip", "shoulders"],
            equipment: ["Rig", "Markierungshütchen"],
          },
          instructions: "Nach jeder Laufrunde eine passende Traverse; Griffvariante nach Leistungsstand wählen.",
        },
        {
          id: "main-carry",
          durationMinutes: 15,
          format: "circuit",
          levelLabel: "3 Laststufen",
          exercise: {
            id: "carry-circuit",
            name: "Carry Circuit",
            riskLevel: "medium",
            bodyRegions: ["full-body", "forearms-grip", "core"],
            equipment: ["Kettlebells", "Sandbags"],
          },
          instructions: "Farmer Carry und Sandbag Bear Hug Carry; Last über Haltung und Distanz skalieren.",
        },
        {
          id: "main-technique",
          durationMinutes: 15,
          format: "technique",
          exercise: {
            id: "balance-wall",
            name: "Balance + Wall Technique",
            riskLevel: "medium",
            bodyRegions: ["full-body", "hips", "ankles-feet"],
            equipment: ["Balance Beam", "Low Wall"],
          },
          instructions: "Technik vor Geschwindigkeit: kontrollierter Übergang, saubere Landung, klare Laufwege.",
        },
      ],
    },
    {
      id: "phase-cooldown",
      kind: "cooldown",
      title: "Runterfahren & Beweglichkeit",
      items: [
        {
          id: "cooldown-walk",
          durationMinutes: 5,
          exercise: {
            id: "easy-walk",
            name: "Locker auslaufen / gehen",
            riskLevel: "low",
            bodyRegions: ["full-body"],
            equipment: [],
          },
        },
        {
          id: "cooldown-mobility",
          durationMinutes: 8,
          exercise: {
            id: "mobility-reset",
            name: "Unterarm-, Schulter- & Hüft-Mobility",
            riskLevel: "low",
            bodyRegions: ["forearms-grip", "shoulders", "hips"],
            equipment: [],
          },
          instructions: "Ruhig bewegen, Spannung reduzieren und die Einheit kurz reflektieren.",
        },
      ],
    },
  ],
};

export default function HomePage() {
  const plannedDuration = getPlannedDurationMinutes(previewSession);
  const validationIssues = validateTrainingSession(previewSession);

  return (
    <AppShell
      title="Trainingsübersicht"
      subtitle="Schnell planen, sinnvoll skalieren und als Trainer die Kontrolle behalten."
      actions={
        <>
          <Link
            className="hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold hover:bg-[var(--surface-subtle)] sm:inline-flex"
            href="/training"
          >
            Trainings öffnen
          </Link>
          <Link
            className="inline-flex rounded-xl bg-[var(--control-strong)] px-4 py-2.5 text-sm font-bold text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)]"
            href="/quick-create"
          >
            Quick Create
          </Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Letzte Einheit" value="75 Min." detail="OCR Open Training" />
        <StatCard label="Teilnehmer" value="18" detail="Mixed Level" />
        <StatCard label="Fokus" value="Grip + Run" detail="OCR-Technik & Carry" />
        <StatCard
          label="Plan-Check"
          value={validationIssues.length === 0 ? "Bereit" : `${validationIssues.length} Hinweise`}
          detail={validationIssues.length === 0 ? "Phasen & Dauer plausibel" : "Bitte vor Training prüfen"}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Session Preview</div>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{previewSession.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {previewSession.group.name} · {plannedDuration} Min. geplant · {previewSession.group.participantCount} Personen
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {previewSession.focus.map((focus) => (
                <span className="rounded-lg bg-[var(--surface)] px-3 py-1.5 text-xs font-bold shadow-sm ring-1 ring-[var(--border)]" key={focus}>
                  {focus}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {previewSession.phases.map((phase) => (
              <TrainingPhaseCard key={phase.id} phase={phase} />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl bg-[var(--sidebar)] p-5 text-[var(--sidebar-foreground)] shadow-[var(--shadow-raised)]">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sidebar-muted)]">Schnellstart</div>
            <h2 className="mt-2 text-xl font-black">Neue Einheit in wenigen Schritten</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--sidebar-muted)]">
              Gruppe, Dauer, Ziel, Körperregionen und Format wählen. OCRCraft erstellt daraus einen bearbeitbaren Entwurf.
            </p>
            <Link
              className="mt-5 inline-flex w-full justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
              href="/quick-create"
            >
              Quick Create öffnen
            </Link>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black">Plan-Check</h2>
              <span className="rounded-lg bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-bold">
                {validationIssues.length === 0 ? "OK" : validationIssues.length}
              </span>
            </div>
            {validationIssues.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Aufwärmen, Hauptteil und Cooldown sind vorhanden. Die geplante Dauer stimmt mit der Session überein.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {validationIssues.map((issue) => (
                  <li key={`${issue.code}-${issue.path ?? "session"}`}>{issue.message}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-black">Als Nächstes</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Link className="block rounded-xl bg-[var(--surface-subtle)] px-4 py-3 font-bold hover:bg-[var(--surface-elevated)]" href="/exercises">
                Übungspool aufbauen
              </Link>
              <Link className="block rounded-xl bg-[var(--surface-subtle)] px-4 py-3 font-bold hover:bg-[var(--surface-elevated)]" href="/groups">
                Vereinsgruppen definieren
              </Link>
              <Link className="block rounded-xl bg-[var(--surface-subtle)] px-4 py-3 font-bold hover:bg-[var(--surface-elevated)]" href="/admin?tab=database">
                Such- & Trainingsregeln einstellen
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

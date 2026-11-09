import { routeMetadata } from "@/config/route-titles";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { GameCreationForm } from "@/components/exercises/game-creation-form";
import { buttonClass } from "@/components/ui/form";
import { createExerciseAction } from "@/app/exercises/actions";

export default function NewGamePage() {
  return (
    <AppShell
      title="Neues Spiel"
      actions={<Link className={buttonClass("secondary", "px-4")} href="/games">Abbrechen</Link>}
    >
      <GameCreationForm action={createExerciseAction} />
    </AppShell>
  );
}

export const metadata = routeMetadata("gameNew");

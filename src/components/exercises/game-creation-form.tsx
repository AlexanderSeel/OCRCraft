"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { ExerciseForm, type ExerciseFormProps } from "./exercise-form";

export function GameCreationForm({ action }: { readonly action: ExerciseFormProps["action"] }) {
  const { dictionary } = useLocale();
  const text = dictionary.gameCreation;
  return <div className="space-y-4">
    <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--foreground)]">{text.step}.</strong> {text.help}</p>
    <ExerciseForm action={action} initialExerciseType="game" submitLabel={text.submit} />
  </div>;
}

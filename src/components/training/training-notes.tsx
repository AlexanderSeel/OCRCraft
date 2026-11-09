"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { Disclosure } from "@/components/ui/disclosure";
import { presentTrainingNote } from "./training-note-presentation";

export function TrainingNotes({ notes }: { readonly notes: string | null }) {
  const { dictionary, locale } = useLocale();
  const presentation = presentTrainingNote(notes, locale);
  if (!presentation) return null;
  return <div className="space-y-2">
    <p className="whitespace-pre-wrap">{presentation.summary}</p>
    {presentation.details ? <Disclosure className="print:hidden" summary={dictionary.trainingCopy.details} summaryClassName="min-h-11 cursor-pointer py-3 text-sm font-bold"><p className="whitespace-pre-wrap break-words text-xs leading-5">{presentation.details}</p></Disclosure> : null}
  </div>;
}

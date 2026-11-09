import { getDictionary, type Locale } from "@/i18n/dictionaries";

const localNote = "Quick Create · local deterministic sports composer";
const aiNotes = new Set([
  "Quick Create · AI proposal · deterministic OCRCraft validation",
  "Quick Create · reviewed AI proposal · deterministic OCRCraft revalidation",
]);
const methodNote = "Lokaler Sportalgorithmus: deterministische Auswahl ohne AI; der Hauptteil definiert das Trainingsziel, Aufwärmen und Cooldown werden passend zu dessen Bewegungs- und Belastungsprofil gewählt.";

/** Exact reserved system strings only; never guess at or rewrite trainer-authored text. */
export function presentTrainingNote(notes: string | null, locale: Locale): { readonly summary: string; readonly details: string | null } | null {
  if (!notes) return null;
  const text = getDictionary(locale).trainingCopy;
  if (notes === localNote) return { summary: text.localNote, details: notes };
  if (aiNotes.has(notes)) return { summary: text.aiNote, details: notes };
  return { summary: notes, details: null };
}

export function presentPlanningMessage(message: string, locale: Locale): string {
  return message === methodNote ? getDictionary(locale).trainingCopy.methodNote : message;
}

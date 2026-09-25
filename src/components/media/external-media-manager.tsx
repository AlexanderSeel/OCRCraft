"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmPopoverButton } from "@/components/ui/confirm-popover-form";

interface ExerciseOption {
  readonly id: string;
  readonly label: string;
  readonly category: string;
}

export interface ExternalMediaEditorValue {
  readonly id?: string;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly mediaType: "image" | "video";
  readonly mediaUrl: string;
  readonly thumbnailUrl: string | null;
  readonly provider: string | null;
  readonly sourceReference: string | null;
  readonly licenseLabel: string | null;
  readonly attributionText: string | null;
  readonly usageNote: string | null;
  readonly rightsStatus: string;
  readonly consentRequired: boolean;
  readonly consentConfirmed: boolean;
}

export function ExternalMediaManager({
  saveAction,
  deleteAction,
  value,
}: {
  readonly saveAction: (formData: FormData) => Promise<void>;
  readonly deleteAction: (formData: FormData) => Promise<void>;
  readonly value?: ExternalMediaEditorValue;
}) {
  const [open, setOpen] = useState(false);
  const [exerciseId, setExerciseId] = useState(value?.exerciseId ?? "");
  const [exerciseName, setExerciseName] = useState(value?.exerciseName ?? "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly ExerciseOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video">(value?.mediaType ?? "image");

  async function searchExercises() {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setSearching(true);
    try {
      const response = await fetch("/api/search/autocomplete?q=" + encodeURIComponent(trimmed) + "&locale=de&limit=10");
      const payload = await response.json() as { readonly items?: readonly ExerciseOption[] };
      setResults(payload.items ?? []);
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <button
        className={value
          ? "rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black"
          : "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black"}
        onClick={() => setOpen(true)}
        type="button"
      >
        {value ? "Medium bearbeiten" : "+ Externes Medium"}
      </button>
      {open ? (
        <Dialog
          eyebrow="Medienkatalog"
          onClose={() => setOpen(false)}
          title={value ? "Externes Medium bearbeiten" : "Externes Medium hinzufügen"}
        >
          <form action={saveAction} className="grid gap-4">
            {value?.id ? <input name="assetId" type="hidden" value={value.id} /> : null}
            <input name="exerciseId" type="hidden" value={exerciseId} />

            {value ? (
              <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Übung</div>
                <div className="mt-1 font-black">{exerciseName}</div>
              </div>
            ) : (
              <div className="grid gap-2">
                <label className="text-sm font-bold">
                  Übung suchen
                  <div className="mt-1 flex gap-2">
                    <input
                      className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void searchExercises();
                        }
                      }}
                      placeholder="mindestens 2 Zeichen"
                      value={query}
                    />
                    <button
                      className="rounded-xl border border-[var(--border)] px-4 text-sm font-black"
                      disabled={searching}
                      onClick={() => void searchExercises()}
                      type="button"
                    >
                      {searching ? "Suche …" : "Suchen"}
                    </button>
                  </div>
                </label>
                {results.length ? (
                  <div className="grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-[var(--border)] p-2">
                    {results.map((item) => (
                      <button
                        className="rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-subtle)]"
                        key={item.id}
                        onClick={() => {
                          setExerciseId(item.id);
                          setExerciseName(item.label);
                          setResults([]);
                          setQuery(item.label);
                        }}
                        type="button"
                      >
                        <strong>{item.label}</strong>
                        <span className="ml-2 text-xs text-[var(--muted)]">{item.category}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {exerciseId ? <p className="text-xs font-bold text-[var(--success)]">Ausgewählt: {exerciseName}</p> : null}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                Medientyp
                <select
                  className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                  name="mediaType"
                  onChange={(event) => setMediaType(event.target.value as "image" | "video")}
                  value={mediaType}
                >
                  <option value="image">Bild / animiertes GIF</option>
                  <option value="video">Video</option>
                </select>
              </label>
              <Field defaultValue={value?.provider ?? ""} label="Provider / Quelle" name="provider" placeholder="z. B. Vereinsarchiv, YouTube, Dataset" />
            </div>

            <Field defaultValue={value?.mediaUrl ?? ""} label={mediaType === "video" ? "Video-URL (HTTPS)" : "Bild-URL (HTTPS)"} name="mediaUrl" placeholder="https://…" required />
            <Field defaultValue={value?.thumbnailUrl ?? ""} label="Thumbnail-URL (optional)" name="thumbnailUrl" placeholder="https://…" />
            <Field defaultValue={value?.sourceReference ?? ""} label="Quellen-/Nachweis-URL" name="sourceReference" placeholder="https://…" required />

            <div className="grid gap-4 md:grid-cols-2">
              <Field defaultValue={value?.licenseLabel ?? ""} label="Lizenz / Verwendungsrecht" name="licenseLabel" placeholder="z. B. CC BY 4.0, Vereinseigen" required />
              <label className="grid gap-1 text-sm font-bold">
                Rechteprüfung
                <select
                  className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                  defaultValue={value?.rightsStatus ?? "unreviewed"}
                  name="rightsStatus"
                >
                  <option value="unreviewed">Noch zu prüfen</option>
                  <option value="approved">Geprüft / freigegeben</option>
                  <option value="restricted">Eingeschränkt / nicht verwenden</option>
                </select>
              </label>
            </div>

            <Field defaultValue={value?.attributionText ?? ""} label="Attribution / Urheberhinweis" name="attributionText" placeholder="Name / Quelle / vorgeschriebener Hinweis" />
            <label className="grid gap-1 text-sm font-bold">
              Nutzungshinweis
              <textarea
                className="min-h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal"
                defaultValue={value?.usageNote ?? ""}
                name="usageNote"
                placeholder="Interne Hinweise zur zulässigen Nutzung"
              />
            </label>

            <fieldset className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
              <legend className="px-1 text-sm font-black">Einwilligung</legend>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input defaultChecked={value?.consentRequired ?? false} name="consentRequired" type="checkbox" />
                Personenbezogene Einwilligung erforderlich
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm font-bold">
                <input defaultChecked={value?.consentConfirmed ?? false} name="consentConfirmed" type="checkbox" />
                Erforderliche Einwilligung liegt dokumentiert vor
              </label>
            </fieldset>

            <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--border)] pt-4">
              <div>
                {value?.id ? (
                  <ConfirmPopoverButton action={deleteAction} confirmLabel="Medium entfernen" description="Das externe Medium wird aus dem Katalog entfernt. Diese Aktion kann nicht über die Oberfläche rückgängig gemacht werden." name="assetId" title="Externes Medium entfernen?" triggerClassName="min-h-11 rounded-xl border border-[var(--danger)] px-4 py-2 text-sm font-black text-[var(--danger)]" triggerLabel="Medium entfernen" value={value.id} />
                ) : null}
              </div>
              <div className="flex gap-2">
                <button className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-black" onClick={() => setOpen(false)} type="button">Abbrechen</button>
                <button
                  className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)] disabled:opacity-50"
                  disabled={!exerciseId}
                  type="submit"
                >
                  Speichern
                </button>
              </div>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required = false,
}: {
  readonly label: string;
  readonly name: string;
  readonly defaultValue: string;
  readonly placeholder: string;
  readonly required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <input
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

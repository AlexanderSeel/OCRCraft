"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import {
  aiCapabilityLabel,
  aiPriorityLabel,
  aiProviderRoutingStateLabel,
  defaultImageModel,
  defaultProviderBaseUrl,
  defaultProviderKeyEnvironment,
  providerKindLabel,
  providerSupportsCapability,
  providerSupportsOAuth,
  type AiCapability,
  type AiProviderAuthMode,
  type AiProviderKind,
} from "@/server/ai/ai-provider-core";
import type { AiProviderSettingsView } from "@/server/ai/ai-provider-settings-repository";
import { getKnownAiModels, type AiModelOption } from "@/server/ai/ai-model-catalog";

interface Props {
  readonly providers: readonly AiProviderSettingsView[];
  readonly saved?: string;
  readonly error?: string;
  readonly saveAction: (formData: FormData) => Promise<void>;
  readonly deleteAction: (formData: FormData) => Promise<void>;
  readonly disconnectOAuthAction: (formData: FormData) => Promise<void>;
}

type EditorTarget = AiProviderSettingsView | "new" | null;

export function AiProviderSettingsPanel({
  providers,
  saved,
  error,
  saveAction,
  deleteAction,
  disconnectOAuthAction,
}: Props) {
  const [editor, setEditor] = useState<EditorTarget>(null);
  const routes = useMemo(() => {
    const result: Record<AiCapability, { name: string; priority: number }[]> = {
      training: [],
      exercise_draft: [],
      image: [],
    };
    for (const provider of providers) {
      for (const assignment of provider.assignments) {
        result[assignment.capability].push({
          name: provider.displayName,
          priority: assignment.priority,
        });
      }
    }
    for (const capability of Object.keys(result) as AiCapability[]) {
      result[capability].sort((a, b) => a.priority - b.priority);
    }
    return result;
  }, [providers]);

  return (
    <section
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"
      id="ai-provider-settings"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">KI Provider</div>
          <h2 className="mt-1 text-xl font-black">AI-Provider und Routing</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">
            Lege mehrere AI-Instanzen an und ordne sie Trainingsgenerierung, Übungsentwürfen oder Bildgenerierung mit Priorität zu.
            Bei Limit, fehlender Berechtigung oder technischem Fehler versucht OCRCraft den nächsten Provider.
          </p>
        </div>
        <button
          className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]"
          onClick={() => setEditor("new")}
          type="button"
        >
          + AI hinzufügen
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm leading-6 text-[var(--muted)]">
        <strong className="text-[var(--foreground)]">Text-Token-Limit</strong> zählt Input- und Output-Tokens im aktuellen Monat – <strong className="text-[var(--foreground)]">kein Geldbetrag</strong>.
        Das Request-Limit zählt API-Aufrufe. Für GitHub Copilot ist das Request-Limit maßgeblich, weil der SDK-Adapter keine einheitlichen Tokenzähler liefert.
      </div>

      {saved ? (
        <p aria-live="polite" className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
          AI-Konfiguration wurde gespeichert.
        </p>
      ) : null}
      {error ? <ErrorNotice code={error} /> : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {(["training","exercise_draft","image"] as const).map((capability) => (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" key={capability}>
            <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">{aiCapabilityLabel(capability)}</div>
            {routes[capability].length ? (
              <ol className="mt-3 grid gap-2">
                {routes[capability].map((route) => (
                  <li className="flex items-center gap-2 text-sm" key={route.name + route.priority}>
                    <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-black">{aiPriorityLabel(route.priority)}</span>
                    <span className="truncate font-bold">{route.name}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">Keine AI zugewiesen.</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-[var(--surface-subtle)] text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">AI</th>
              <th className="px-4 py-3">Modelle</th>
              <th className="px-4 py-3">Verwendung / Prio</th>
              <th className="px-4 py-3">Verbrauch Monat</th>
              <th className="px-4 py-3">Zugang</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr className="border-t border-[var(--border)]" key={provider.id}>
                <td className="px-4 py-3">
                  <div className="font-black">{provider.displayName}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{providerKindLabel(provider.providerKind)}</div>
                </td>
                <td className="px-4 py-3">
                  <div><span className="text-xs text-[var(--muted)]">Text:</span> <strong>{provider.textModelId || "—"}</strong></div>
                  <div className="mt-1"><span className="text-xs text-[var(--muted)]">Bild:</span> <strong>{provider.imageModelId || "—"}</strong></div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-[330px] flex-wrap gap-1.5">
                    {provider.assignments.length ? provider.assignments
                      .slice()
                      .sort((a, b) => a.priority - b.priority)
                      .map((assignment) => (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 text-xs font-bold" key={assignment.capability}>
                          {aiCapabilityLabel(assignment.capability)} · {aiPriorityLabel(assignment.priority)}
                        </span>
                      )) : <span className="text-xs text-[var(--muted)]">nicht zugewiesen</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div>{formatNumber(provider.usage.requests)} Requests</div>
                  <div>{formatNumber(provider.usage.totalTokens)} Text-Tokens</div>
                  <div>{formatNumber(provider.usage.images)} Bilder</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {provider.authMode === "oauth"
                    ? <span className={provider.hasOAuthCredential ? "font-black text-[var(--success-foreground)]" : "font-black text-[var(--danger)]"}>{provider.hasOAuthCredential ? "OAuth verbunden" : "OAuth nicht verbunden"}</span>
                    : provider.authMode === "encrypted_key"
                      ? <span>{provider.hasStoredApiKey ? "gespeicherter Key" : "Key fehlt"}</span>
                      : <span>{provider.environmentKeyAvailable ? "ENV verfügbar" : "ENV fehlt"}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={routingStateClassName(provider.routingState)}>
                    {aiProviderRoutingStateLabel(provider.routingState)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="min-h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-black"
                    onClick={() => setEditor(provider)}
                    type="button"
                  >
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
            {providers.length === 0 ? (
              <tr><td className="px-4 py-6 text-center text-[var(--muted)]" colSpan={7}>Noch keine AI-Instanz angelegt.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editor ? (
        <Dialog
          eyebrow="AI Provider"
          onClose={() => setEditor(null)}
          title={editor === "new" ? "AI hinzufügen" : editor.displayName + " bearbeiten"}
        >
          <AiProviderEditor
            deleteAction={deleteAction}
            disconnectOAuthAction={disconnectOAuthAction}
            onClose={() => setEditor(null)}
            provider={editor === "new" ? null : editor}
            saveAction={saveAction}
          />
        </Dialog>
      ) : null}
    </section>
  );
}

function AiProviderEditor({
  provider,
  saveAction,
  deleteAction,
  disconnectOAuthAction,
  onClose,
}: {
  readonly provider: AiProviderSettingsView | null;
  readonly saveAction: (formData: FormData) => Promise<void>;
  readonly deleteAction: (formData: FormData) => Promise<void>;
  readonly disconnectOAuthAction: (formData: FormData) => Promise<void>;
  readonly onClose: () => void;
}) {
  const initialKind = provider?.providerKind ?? "openai";
  const [providerKind, setProviderKind] = useState<AiProviderKind>(initialKind);
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl ?? defaultProviderBaseUrl(initialKind) ?? "");
  const [authMode, setAuthMode] = useState<AiProviderAuthMode>(provider?.authMode ?? "environment");
  const [apiKeyEnv, setApiKeyEnv] = useState(provider?.apiKeyEnv ?? defaultProviderKeyEnvironment(initialKind) ?? "");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<readonly AiModelOption[]>(getKnownAiModels(initialKind));
  const [modelWarning, setModelWarning] = useState<string | null>(null);
  const [modelCheck, setModelCheck] = useState<string | null>(
    getKnownAiModels(initialKind).length > 0
      ? String(getKnownAiModels(initialKind).length) + " bekannte Modelle verfügbar"
      : null,
  );
  const [loadingModels, setLoadingModels] = useState(false);
  const supportsImage = providerSupportsCapability(providerKind, "image");
  const supportsOAuth = providerSupportsOAuth(providerKind);
  const assignment = (capability: AiCapability) => provider?.assignments.find((item) => item.capability === capability);

  function changeKind(next: AiProviderKind) {
    setProviderKind(next);
    setBaseUrl(defaultProviderBaseUrl(next) ?? "");
    setApiKeyEnv(defaultProviderKeyEnvironment(next) ?? "");
    if (!providerSupportsOAuth(next) && authMode === "oauth") setAuthMode("environment");
    const known = getKnownAiModels(next);
    setModels(known);
    setModelWarning(null);
    setModelCheck(known.length > 0 ? String(known.length) + " bekannte Modelle verfügbar" : null);
  }

  async function loadModels() {
    setLoadingModels(true);
    setModelWarning(null);
    try {
      const response = await fetch("/api/admin/ai/models", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instanceId: provider?.providerKind === providerKind ? provider.id : null,
          providerKind,
          baseUrl,
          authMode,
          apiKeyEnv,
          apiKey: apiKey || null,
        }),
      });
      const payload = await response.json() as {
        readonly models?: readonly AiModelOption[];
        readonly warning?: string | null;
        readonly live?: boolean;
        readonly message?: string;
      };
      if (!response.ok) throw new Error(payload.message || "Modelle konnten nicht geladen werden.");
      const nextModels = payload.models ?? [];
      setModels(nextModels);
      setModelWarning(payload.warning ?? null);
      setModelCheck(payload.live
        ? "Verbindung erfolgreich · " + String(nextModels.filter((model) => model.source === "live").length) + " Modelle live geladen"
        : nextModels.length > 0
          ? "Live-Verbindung nicht verfügbar · bekannte Modelle bleiben auswählbar"
          : "Keine Modelle verfügbar");
    } catch (error) {
      setModelWarning(error instanceof Error ? error.message : "Modelle konnten nicht geladen werden.");
      setModelCheck("Verbindungsprüfung fehlgeschlagen");
    } finally {
      setLoadingModels(false);
    }
  }

  const textModels = models.filter((model) => model.supportsText);
  const imageModels = models.filter((model) => model.supportsImage);

  return (
    <form action={saveAction} className="grid gap-5">
      {provider ? <input name="id" type="hidden" value={provider.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          Provider
          <select
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"
            name="providerKind"
            onChange={(event) => changeKind(event.target.value as AiProviderKind)}
            value={providerKind}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="copilot">GitHub Copilot</option>
            <option value="openai-compatible">OpenAI-kompatibel / lokal</option>
          </select>
        </label>
        <Field
          defaultValue={provider?.displayName ?? providerKindLabel(providerKind)}
          label="Anzeigename"
          name="displayName"
          placeholder="z. B. Copilot Training Primär"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input defaultChecked={provider?.enabled ?? true} name="enabled" type="checkbox" />
        AI-Instanz aktivieren
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          Base URL
          <input
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal disabled:opacity-70"
            disabled={providerKind !== "openai-compatible"}
            name="baseUrl"
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder={providerKind === "copilot" ? "wird vom Copilot SDK verwaltet" : "https://..."}
            value={baseUrl}
          />
          {providerKind !== "openai-compatible" ? <span className="text-xs font-normal text-[var(--muted)]">{providerKind === "copilot" ? "Der offizielle Copilot SDK verwaltet den Endpunkt." : "Standard-URL wird automatisch verwaltet."}</span> : null}
        </label>
        <div className="grid content-start gap-2">
          <span className="text-sm font-bold">Verbindung und Modelle</span>
          <button
            className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-black"
            disabled={loadingModels}
            onClick={loadModels}
            type="button"
          >
            {loadingModels ? "Provider wird geprüft …" : "Verbindung prüfen & Modelle aktualisieren"}
          </button>
          {modelCheck ? <span className="text-xs font-bold text-[var(--foreground)]">{modelCheck}</span> : null}
          {modelWarning ? <span className="text-xs text-[var(--warning)]">{modelWarning}</span> : null}
        </div>
      </div>

      <datalist id={"text-models-" + (provider?.id ?? "new")}>
        {textModels.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
      </datalist>
      <datalist id={"image-models-" + (provider?.id ?? "new")}>
        {imageModels.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
      </datalist>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          Textmodell
          <input
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
            defaultValue={provider?.textModelId ?? ""}
            list={"text-models-" + (provider?.id ?? "new")}
            name="textModelId"
            placeholder="Modell auswählen oder ID eingeben"
          />
          <span className="text-xs font-normal text-[var(--muted)]">Für Training und Übungsentwürfe.</span>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Bildmodell
          <input
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal disabled:opacity-60"
            defaultValue={provider?.imageModelId ?? defaultImageModel(providerKind) ?? ""}
            disabled={!supportsImage}
            list={"image-models-" + (provider?.id ?? "new")}
            name="imageModelId"
            placeholder={supportsImage ? "Bildmodell auswählen oder ID eingeben" : "für diesen Adapter nicht verfügbar"}
          />
          <span className="text-xs font-normal text-[var(--muted)]">Bildgenerierung bleibt derzeit auf OpenAI/OpenAI-kompatible Images-Endpunkte begrenzt.</span>
        </label>
      </div>

      <fieldset className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        <legend className="px-1 text-sm font-black">Funktionszuweisung und Priorität</legend>
        <p className="mb-3 text-xs leading-5 text-[var(--muted)]">Kleinere Prioritätszahl wird zuerst verwendet. Beispiel: P1 → P2 → P3.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <CapabilityAssignment capability="training" existing={assignment("training")} />
          <CapabilityAssignment capability="exercise_draft" existing={assignment("exercise_draft")} />
          <CapabilityAssignment capability="image" disabled={!supportsImage} existing={assignment("image")} />
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          Zugang
          <select
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
            name="authMode"
            onChange={(event) => setAuthMode(event.target.value as AiProviderAuthMode)}
            value={authMode}
          >
            <option value="environment">Umgebungsvariable</option>
            <option value="encrypted_key">Verschlüsselter Key in DuckDB</option>
            {supportsOAuth ? <option value="oauth">Provider-Login / OAuth</option> : null}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Umgebungsvariable
          <input
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal disabled:opacity-60"
            disabled={authMode !== "environment"}
            name="apiKeyEnv"
            onChange={(event) => setApiKeyEnv(event.target.value)}
            value={apiKeyEnv}
          />
        </label>
      </div>

      {authMode === "oauth" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <div className="font-black">{providerKind === "copilot" ? "GitHub Copilot verbinden" : "Google Gemini verbinden"}</div>
          {!provider || provider.providerKind !== providerKind ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Speichere die AI-Instanz zuerst. Danach kann der Provider-Login gestartet werden.</p>
          ) : !provider.oauthClientConfigured ? (
            <p className="mt-2 text-sm text-[var(--danger)]">OAuth-App oder OCRCRAFT_AI_SECRET_KEY ist serverseitig noch nicht vollständig konfiguriert. Details stehen in docs/operations.md.</p>
          ) : provider.hasOAuthCredential ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-black text-[var(--success-foreground)]">Verbunden{provider.oauthExpiresAt ? " · Tokenablauf " + provider.oauthExpiresAt : ""}</span>
              <button
                className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-xs font-black"
                formAction={disconnectOAuthAction}
                name="id"
                type="submit"
                value={provider.id}
              >
                OAuth trennen
              </button>
            </div>
          ) : (
            <a
              className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]"
              href={"/api/admin/ai/oauth/start?instanceId=" + encodeURIComponent(provider.id)}
            >
              {providerKind === "copilot" ? "Mit GitHub verbinden" : "Mit Google verbinden"}
            </a>
          )}
        </div>
      ) : null}

      <label className="grid gap-1 text-sm font-bold">
        Neuen API-Key speichern
        <input
          autoComplete="new-password"
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal disabled:opacity-60"
          disabled={authMode !== "encrypted_key" || !(provider?.keyStorageAvailable ?? true)}
          name="apiKey"
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={provider?.keyStorageAvailable === false ? "OCRCRAFT_AI_SECRET_KEY fehlt" : "wird nicht angezeigt oder zurückgegeben"}
          type="password"
          value={apiKey}
        />
      </label>

      {provider?.hasStoredApiKey && authMode === "encrypted_key" ? (
        <label className="flex items-center gap-2 text-xs font-bold">
          <input name="clearStoredApiKey" type="checkbox" />
          Gespeicherten API-Key löschen
        </label>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          defaultValue={provider?.monthlyTextTokenLimit == null ? "" : String(provider.monthlyTextTokenLimit)}
          inputMode="numeric"
          label="Monatliches Text-Token-Limit"
          name="monthlyTextTokenLimit"
          placeholder={providerKind === "copilot" ? "für Copilot Request-Limit verwenden" : "kein Limit"}
        />
        <Field
          defaultValue={provider?.monthlyRequestLimit == null ? "" : String(provider.monthlyRequestLimit)}
          inputMode="numeric"
          label="Monatliches Request-Limit"
          name="monthlyRequestLimit"
          placeholder="kein Limit"
        />
      </div>

      {provider ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">Aktueller Monat</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <Metric label="Requests" value={formatNumber(provider.usage.requests)} />
            <Metric label="Text-Tokens" value={formatNumber(provider.usage.totalTokens)} />
            <Metric label="Bilder" value={formatNumber(provider.usage.images)} />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--border)] pt-4">
        <div>
          {provider ? (
            <button
              className="min-h-11 rounded-xl border border-[var(--danger)] px-4 text-sm font-black text-[var(--danger)]"
              formAction={deleteAction}
              name="id"
              type="submit"
              value={provider.id}
            >
              AI entfernen
            </button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-black" onClick={onClose} type="button">Abbrechen</button>
          <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">
            Speichern
          </button>
        </div>
      </div>
    </form>
  );
}

function CapabilityAssignment({
  capability,
  existing,
  disabled = false,
}: {
  readonly capability: AiCapability;
  readonly existing?: { readonly priority: number };
  readonly disabled?: boolean;
}) {
  return (
    <div className={"rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 " + (disabled ? "opacity-60" : "")}>
      <label className="flex items-center gap-2 text-sm font-black">
        <input defaultChecked={Boolean(existing)} disabled={disabled} name={"assign_" + capability} type="checkbox" />
        {aiCapabilityLabel(capability)}
      </label>
      <label className="mt-2 grid gap-1 text-xs font-bold">
        Priorität
        <input
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2"
          defaultValue={existing?.priority ?? 10}
          disabled={disabled}
          min={1}
          name={"priority_" + capability}
          type="number"
        />
      </label>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  inputMode,
}: {
  readonly label: string;
  readonly name: string;
  readonly defaultValue: string;
  readonly placeholder: string;
  readonly inputMode?: "numeric";
}) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <input
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
        defaultValue={defaultValue}
        inputMode={inputMode}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface)] p-2">
      <div className="text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 font-black">{value}</div>
    </div>
  );
}

function ErrorNotice({ code }: { readonly code: string }) {
  const message = code === "secret"
    ? "API-Key oder OAuth-Token konnte nicht gespeichert werden, weil OCRCRAFT_AI_SECRET_KEY nicht gesetzt ist."
    : code === "provider"
      ? "Provider oder AI-Instanz ist ungültig."
      : code === "oauth-config"
        ? "OAuth ist für diesen Provider noch nicht vollständig serverseitig konfiguriert."
        : code === "oauth"
          ? "Provider-Login konnte nicht abgeschlossen werden."
          : code === "config"
            ? "Die AI-Konfiguration ist unvollständig. Prüfe Modelle, URL und Funktionszuweisungen."
            : "AI-Einstellungen konnten nicht gespeichert werden.";
  return <p aria-live="assertive" className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">{message}</p>;
}

function routingStateClassName(state: AiProviderSettingsView["routingState"]): string {
  if (state === "ready") {
    return "rounded-full bg-[var(--success-bg)] px-2.5 py-1 text-xs font-black text-[var(--success-foreground)]";
  }
  if (state === "inactive" || state === "unassigned") {
    return "rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-black text-[var(--muted)]";
  }
  return "rounded-full bg-[var(--danger-bg)] px-2.5 py-1 text-xs font-black text-[var(--danger)]";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}

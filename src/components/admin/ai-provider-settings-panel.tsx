import type { AiProviderSettingsView } from "@/server/ai/ai-provider-settings-repository";

interface Props {
  readonly providers: readonly AiProviderSettingsView[];
  readonly saved?: string;
  readonly error?: string;
  readonly saveAction: (formData: FormData) => Promise<void>;
}

export function AiProviderSettingsPanel({ providers, saved, error, saveAction }: Props) {
  return (
    <section
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"
      id="ai-provider-settings"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">KI Provider</div>
          <h2 className="mt-1 text-xl font-black">Modelle, Keys, Limits und Verbrauch</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">
            OCRCraft kann Text-KI für Trainingsgenerierung und AI-Übungsentwürfe getrennt auswählen. Keys bleiben entweder in Umgebungsvariablen oder werden mit OCRCRAFT_AI_SECRET_KEY verschlüsselt in DuckDB gespeichert.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
          Direkter Provider-Login/OAuth benötigt provider-spezifische App-Registrierungen und ist noch nicht aktiviert.
        </div>
      </div>

      {saved ? (
        <p aria-live="polite" className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
          KI-Provider „{saved}“ wurde gespeichert.
        </p>
      ) : null}
      {error ? <ErrorNotice code={error} /> : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {providers.map((provider) => (
          <form action={saveAction} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" key={provider.providerId}>
            <input name="providerId" type="hidden" value={provider.providerId} />

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{provider.displayName}</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {provider.protocol === "anthropic" ? "Anthropic Messages API" : "OpenAI-kompatible Chat-Completions API"}
                </p>
              </div>
              <span className={provider.enabled
                ? "rounded-full bg-[var(--success-bg)] px-2.5 py-1 text-xs font-black text-[var(--success-foreground)]"
                : "rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-black text-[var(--muted)]"}>
                {provider.enabled ? "Aktiv" : "Inaktiv"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input defaultChecked={provider.enabled} name="enabled" type="checkbox" />
                Provider aktivieren
              </label>
              <div className="text-xs font-bold text-[var(--muted)]">
                Key: {provider.authMode === "environment"
                  ? provider.environmentKeyAvailable ? "Umgebungsvariable vorhanden" : "Umgebungsvariable fehlt"
                  : provider.hasStoredApiKey ? "verschlüsselt gespeichert" : "noch nicht gespeichert"}
              </div>
            </div>

            <fieldset className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <legend className="px-1 text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">Verwendung</legend>
              <div className="mt-1 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input defaultChecked={provider.useForTraining} name="useForTraining" type="checkbox" />
                  Trainingsgenerierung
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input defaultChecked={provider.useForExerciseDrafts} name="useForExerciseDrafts" type="checkbox" />
                  Übungsentwürfe
                </label>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                Pro Funktion ist genau der zuletzt gespeicherte ausgewählte Provider aktiv.
              </p>
            </fieldset>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Base URL" name="baseUrl" defaultValue={provider.baseUrl ?? ""} placeholder="https://..." />
              <Field label="Modell-ID" name="modelId" defaultValue={provider.modelId ?? ""} placeholder="Provider-Modell" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                Key-Quelle
                <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={provider.authMode} name="authMode">
                  <option value="environment">Umgebungsvariable</option>
                  <option value="encrypted_key">Verschlüsselt in DuckDB</option>
                </select>
              </label>
              <Field label="Umgebungsvariable" name="apiKeyEnv" defaultValue={provider.apiKeyEnv ?? ""} placeholder="OPENAI_API_KEY" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="grid gap-1 text-sm font-bold">
                Neuen API-Key speichern
                <input
                  autoComplete="new-password"
                  className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                  disabled={!provider.keyStorageAvailable}
                  name="apiKey"
                  placeholder={provider.keyStorageAvailable ? "wird nicht angezeigt oder zurückgegeben" : "OCRCRAFT_AI_SECRET_KEY fehlt"}
                  type="password"
                />
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold">
                <input name="clearStoredApiKey" type="checkbox" />
                Gespeicherten Key löschen
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                label="Monatliches Token-Limit"
                name="monthlyTokenLimit"
                defaultValue={provider.monthlyTokenLimit == null ? "" : String(provider.monthlyTokenLimit)}
                inputMode="numeric"
                placeholder="kein Limit"
              />
              <Field
                label="Monatliches Request-Limit"
                name="monthlyRequestLimit"
                defaultValue={provider.monthlyRequestLimit == null ? "" : String(provider.monthlyRequestLimit)}
                inputMode="numeric"
                placeholder="kein Limit"
              />
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">Aktueller Monat</div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                <Metric label="Requests" value={formatNumber(provider.usage.requests)} />
                <Metric label="Input" value={formatNumber(provider.usage.inputTokens)} />
                <Metric label="Output" value={formatNumber(provider.usage.outputTokens)} />
                <Metric label="Tokens gesamt" value={formatNumber(provider.usage.totalTokens)} />
                <Metric label="Bilder" value={formatNumber(provider.usage.images)} />
              </dl>
              {provider.monthlyTokenLimit ? (
                <UsageBar label="Token-Limit" used={provider.usage.totalTokens} limit={provider.monthlyTokenLimit} />
              ) : null}
              {provider.monthlyRequestLimit ? (
                <UsageBar label="Request-Limit" used={provider.usage.requests} limit={provider.monthlyRequestLimit} />
              ) : null}
            </div>

            <div className="mt-4 flex justify-end">
              <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">
                Provider speichern
              </button>
            </div>
          </form>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        <h3 className="font-black">GitHub Copilot</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          GitHub Copilot wird nicht als direkter OCRCraft-Inference-Provider angeboten. GitHub Models wurde eingestellt; Copilot ist ein separater Dienst und stellt für diese App keinen allgemeinen öffentlichen Chat-Completions-Endpunkt bereit. OpenAI-kompatible eigene Endpunkte können stattdessen über „OpenAI-kompatibel“ angebunden werden.
        </p>
      </div>
    </section>
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
    <div className="rounded-lg bg-[var(--surface-subtle)] p-2">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 font-black">{value}</dd>
    </div>
  );
}

function UsageBar({ label, used, limit }: { readonly label: string; readonly used: number; readonly limit: number }) {
  const percentage = Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold">{label}</span>
        <span className="text-[var(--muted)]">{formatNumber(used)} / {formatNumber(limit)} · {percentage}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--border)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: String(percentage) + "%" }} />
      </div>
    </div>
  );
}

function ErrorNotice({ code }: { readonly code: string }) {
  const message = code === "secret"
    ? "API-Key konnte nicht gespeichert werden, weil OCRCRAFT_AI_SECRET_KEY nicht gesetzt ist."
    : code === "config"
      ? "Ein aktivierter Provider benötigt Base-URL und Modell-ID."
      : code === "provider"
        ? "Unbekannter KI-Provider."
        : "KI-Provider-Einstellungen konnten nicht gespeichert werden.";
  return <p aria-live="assertive" className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">{message}</p>;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}

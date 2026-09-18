# Betrieb und Wiederherstellung

Diese Anleitung beschreibt den vorgesehenen Betrieb einer privaten OCRCraft-Installation.

## Produktionsstart

1. Mit Node.js `>=20.19.0` und `npm ci` installieren.
2. Eine `.env` außerhalb der Versionsverwaltung anlegen.
3. `npm run build` und anschließend `npm run start` ausführen.
4. `OCRCRAFT_DB_PATH` auf ein dauerhaftes Datenverzeichnis zeigen lassen. Das Verzeichnis muss für den Node-Prozess les- und schreibbar sein.

Die Anwendung führt ausstehende Migrationen beim ersten Datenzugriff aus. Der Prozess benötigt dafür exklusiven Schreibzugriff auf die DuckDB-Datei. Mehrere App-Instanzen dürfen dieselbe Datei verwenden, wenn sie dasselbe gemeinsame Lock-Verzeichnis erreichen; für produktiven Mehrprozessbetrieb ist ein einzelner App-Prozess oder ein gemeinsam eingebundenes Dateisystem mit zuverlässigen exklusiven Dateisperren vorzuziehen.

## Identität und Rollen

Für den lokalen Vereinsbetrieb wird beim ersten Zugriff automatisch `owner@ocrcraft.local` als `super_admin` angelegt. Für einen kontrollierten Betrieb:

```text
OCRCRAFT_AUTH_REQUIRED=1
OCRCRAFT_ACTOR_EMAIL=trainer@example.org
OCRCRAFT_LOGIN_CODE=<vereins-code>
OCRCRAFT_ACTOR_ASSERTION_SECRET=<langes-secret>
```

Der konfigurierte Actor muss als aktiver Benutzer in DuckDB vorhanden sein. Schreibende globale Aktionen prüfen die Rolle serverseitig; die UI-Prüfung ersetzt keine Autorisierung. Eine vorgeschaltete Vereinsanmeldung muss nach erfolgreicher Anmeldung die Actor-E-Mail für den Prozess setzen.

Der lokale Login-Dialog verwendet die E-Mail als Benutzernamen und einen individuellen Passwort-Hash. Neue Benutzer werden im Adminbereich mit einem Passwort von mindestens acht Zeichen angelegt; Klartextpasswörter werden nie gespeichert. Für die initiale Einrichtung kann zusätzlich `OCRCRAFT_LOGIN_CODE` als gemeinsamer Fallback-Code gesetzt werden. Der Code wird nur serverseitig verglichen; die Anmeldung erstellt ein acht Stunden gültiges, httpOnly Cookie.

Für einen vorgeschalteten Login ohne gemeinsam genutzte Prozessvariable kann der Proxy pro Request den Header `x-ocrcraft-actor` setzen. Der Wert hat die Form `email|unixSeconds|hexSignature`; signiert wird `email|unixSeconds` mit HMAC-SHA256 und `OCRCRAFT_ACTOR_ASSERTION_SECRET`. Assertions sind fünf Minuten gültig. Der Proxy muss den Header von außen entfernen und selbst neu setzen; das Secret darf nicht an Browser oder Clients gelangen. Mit `OCRCRAFT_ACTOR_ASSERTION_HEADER` kann ein anderer Headername verwendet werden.

## AI-Provider und OAuth

AI-Keys können aus Umgebungsvariablen gelesen oder mit `OCRCRAFT_AI_SECRET_KEY` verschlüsselt in DuckDB gespeichert werden. Derselbe Secret-Key verschlüsselt OAuth-Tokens; er muss auf allen App-Instanzen identisch und dauerhaft verfügbar sein.

Für Google Gemini OAuth:

```text
OCRCRAFT_AI_SECRET_KEY=<langes-zufälliges-secret>
OCRCRAFT_GOOGLE_OAUTH_CLIENT_ID=<google-oauth-client-id>
OCRCRAFT_GOOGLE_OAUTH_CLIENT_SECRET=<google-oauth-client-secret>
OCRCRAFT_GOOGLE_PROJECT_ID=<google-cloud-project-id>
OCRCRAFT_PUBLIC_BASE_URL=https://ocrcraft.example.org
```

Als Redirect URI in der Google OAuth-App wird `https://<host>/api/admin/ai/oauth/callback` registriert. OCRCraft fordert die offiziell dokumentierten Gemini-/Cloud-Scopes an und verwendet bei OAuth das Google-Projekt als `x-goog-user-project`.

Für GitHub Copilot:

```text
OCRCRAFT_AI_SECRET_KEY=<langes-zufälliges-secret>
OCRCRAFT_GITHUB_OAUTH_CLIENT_ID=<github-oauth-client-id>
OCRCRAFT_GITHUB_OAUTH_CLIENT_SECRET=<github-oauth-client-secret>
OCRCRAFT_PUBLIC_BASE_URL=https://ocrcraft.example.org
```

Die GitHub OAuth-App erhält dieselbe Callback-URL. Der zurückgegebene User Access Token wird verschlüsselt gespeichert und an den offiziellen `@github/copilot-sdk` übergeben. Der angemeldete GitHub-Benutzer benötigt eine passende Copilot-Berechtigung/Subscription. OCRCraft ruft die für den Benutzer verfügbaren Copilot-Modelle über `listModels()` ab.

`OCRCRAFT_PUBLIC_BASE_URL` ist bei Reverse Proxy/externem Host empfohlen. Ohne die Variable verwendet OCRCraft den Origin des eingehenden Requests.

## S3-kompatibler Medienspeicher

Für produktiven S3-/MinIO-/R2-kompatiblen Speicher:

```text
OCRCRAFT_IMAGE_STORAGE=s3
OCRCRAFT_IMAGE_BUCKET=<bucket>
OCRCRAFT_S3_REGION=<region>
OCRCRAFT_S3_ENDPOINT=https://<endpoint>        # optional bei AWS S3
OCRCRAFT_IMAGE_PUBLIC_BASE_URL=https://<cdn-or-public-bucket-base>
OCRCRAFT_IMAGE_PREFIX=exercise-images
OCRCRAFT_S3_FORCE_PATH_STYLE=1                 # typischerweise für MinIO/kompatible Endpunkte
OCRCRAFT_IMAGE_CACHE_CONTROL=public, max-age=31536000, immutable
OCRCRAFT_S3_SSE=AES256                         # optional: AES256 oder aws:kms
OCRCRAFT_S3_KMS_KEY_ID=<kms-key-id>            # erforderlich bei aws:kms
```

Im Produktionsmodus ist eine HTTPS-`OCRCRAFT_IMAGE_PUBLIC_BASE_URL` erforderlich, damit gespeicherte Bilder in der Anwendung ausgeliefert werden können. Benutzerdefinierte S3-Endpunkte müssen ebenfalls HTTPS verwenden. Nur für bewusst isolierte Entwicklungsumgebungen kann HTTP mit `OCRCRAFT_S3_ALLOW_INSECURE_HTTP=1` erlaubt werden.

Der Storage führt für Diagnose/Wartung einen Bucket-`HeadBucket`-Check aus und inventarisiert Objekte paginiert. Neue Objekte erhalten Cache-Control, OCRCraft-Metadaten und optional serverseitige S3-Verschlüsselung. Bei `aws:kms` muss der App-Principal zusätzlich Zugriff auf den konfigurierten KMS-Key besitzen.

Die S3-Zugangsdaten können über `AWS_ACCESS_KEY_ID` und `AWS_SECRET_ACCESS_KEY` oder über die normale AWS Credential Chain bereitgestellt werden. Niemals S3-Secrets in DuckDB-Exporte oder Git übernehmen.

## Backup und Restore

- `Datenbank sichern` erstellt eine konsistente Kopie in `data/backups/` inklusive Manifest.
- `OCRCRAFT_BACKUP_RETENTION` begrenzt die Anzahl der aufbewahrten Backups.
- Vor jedem Restore wird automatisch ein Sicherheitsbackup erstellt.
- Für eine vollständige Wiederherstellung müssen Datenbank, Backup-Verzeichnis und `public/generated/` beziehungsweise der konfigurierte S3-Speicher gemeinsam gesichert werden.
- Mindestens eine regelmäßige Sicherung muss **außerhalb der OCRCraft-Maschine** liegen. Für Dateisystem-Medien bedeutet das eine Kopie von DuckDB, `data/backups/` und `public/generated/` auf ein externes Ziel; bei S3 müssen DuckDB/Backups separat off-machine gesichert und für den Bucket Versionierung oder ein unabhängiges Replikations-/Backupziel aktiviert werden.
- Medienreviews speichern Reviewer, Zeitpunkt, Übungsreferenz und – bei externen Medien – Quellen-/Lizenzreferenz in DuckDB. Diese Metadaten müssen zusammen mit den Medienobjekten gesichert werden, damit eine Wiederherstellung fachliche Freigaben nachvollziehbar erhält.
- Restore-Dateinamen werden exakt bestätigt; Pfadbestandteile werden abgewiesen.

Nach einem Restore die Anwendung einmal neu starten und im Adminbereich den DuckDB-/FTS-Status prüfen. Bei einem abgebrochenen Prozess darf eine `.wal`-Datei nicht manuell gelöscht werden. OCRCraft bewahrt sie zur Diagnose auf und versucht eine kontrollierte Wiedereröffnung.

## Migrationen und Wartung

Migrationen liegen versioniert unter `src/server/db/migrations/` und werden in aufsteigender Reihenfolge angewendet. Vor Schemaänderungen:

1. Datenbank sichern.
2. Anwendung stoppen oder Schreibzugriffe pausieren.
3. Migration beziehungsweise neue Version ausrollen.
4. Anwendung starten und den FTS-Status kontrollieren.
5. Bei Bedarf im Tab **Datenbank** beide Suchindizes neu aufbauen.

Portable JSON-Exporte sind für ausgewählte strukturierte Bereiche gedacht. Der Import validiert Schema, Tabellen und Spalten vor einer Transaktion und ist auf Super-Admins begrenzt. Binärmedien bleiben bis zur optionalen Medienexport-Funktion über Quellen- und Prüfsummenmetadaten referenziert.

## Geheimnisse

`OPENAI_API_KEY`, andere Provider-Keys, OAuth-Client-Secrets, `OCRCRAFT_AI_SECRET_KEY` und S3-Zugangsdaten gehören ausschließlich in die Prozessumgebung oder eine lokale `.env`, niemals in Git, portable Exporte oder Logs.

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

Für den lokalen Login-Dialog im Adminbereich wird zusätzlich `OCRCRAFT_LOGIN_CODE` benötigt. Der Code wird nur serverseitig verglichen; die Anmeldung erstellt ein acht Stunden gültiges, httpOnly Cookie. Ohne gesetzten Login-Code bleibt die Anmeldung deaktiviert.

Für einen vorgeschalteten Login ohne gemeinsam genutzte Prozessvariable kann der Proxy pro Request den Header `x-ocrcraft-actor` setzen. Der Wert hat die Form `email|unixSeconds|hexSignature`; signiert wird `email|unixSeconds` mit HMAC-SHA256 und `OCRCRAFT_ACTOR_ASSERTION_SECRET`. Assertions sind fünf Minuten gültig. Der Proxy muss den Header von außen entfernen und selbst neu setzen; das Secret darf nicht an Browser oder Clients gelangen. Mit `OCRCRAFT_ACTOR_ASSERTION_HEADER` kann ein anderer Headername verwendet werden.

## Backup und Restore

- `Datenbank sichern` erstellt eine konsistente Kopie in `data/backups/` inklusive Manifest.
- `OCRCRAFT_BACKUP_RETENTION` begrenzt die Anzahl der aufbewahrten Backups.
- Vor jedem Restore wird automatisch ein Sicherheitsbackup erstellt.
- Für eine vollständige Wiederherstellung müssen Datenbank, Backup-Verzeichnis und `public/generated/` beziehungsweise der konfigurierte S3-Speicher gemeinsam gesichert werden.
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

`OPENAI_API_KEY` und S3-Zugangsdaten gehören ausschließlich in die Prozessumgebung oder eine lokale `.env`, niemals in Git, portable Exporte oder Logs.

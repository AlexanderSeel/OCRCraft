# Datenbank-Baseline v1.0

`src/server/db/initial-v1.sql` ist das reproduzierbar erzeugte Fresh-Install-Skript für OCRCraft 1.0. Es bündelt alle nummerierten Migrationen bis einschließlich Version 83, entfernt deren einzelne Transaktions- und Versionsbuchhaltung und führt sie als eine atomare Transaktion aus.

Die Baseline wird erzeugt mit:

```bash
npm run db:build-initial
```

Der Generator liest ausschließlich `src/server/db/migrations/*.sql` in numerischer Reihenfolge. Die Datei wird nicht manuell bearbeitet. Neue Schemaänderungen werden weiterhin als nummerierte Migration ergänzt und anschließend mit dem Generator in die v1-Baseline aufgenommen.

Beim Start prüft der Migrationsdienst, ob außer `schema_migrations` noch Anwendungstabellen existieren. Bei einer leeren Datenbank wird die Baseline angewendet und alle enthaltenen Versionsnummern werden als erledigt eingetragen. Bestehende Datenbanken verwenden unverändert den inkrementellen Migrationspfad.

Die Baseline enthält Seed- und Katalogdaten, aber keine Nutzerdaten. Ein Fresh Install ist damit fachlich gleichwertig zur vollständigen Migrationskette; der Integrationstest prüft den Seed-, Spiele- und Versionsumfang.

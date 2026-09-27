# Datenbank-Baseline v1.0

`src/server/db/initial-v1.sql` ist das eingefrorene Fresh-Install-Skript für OCRCraft 1.0. Es bündelt alle nummerierten Migrationen bis einschließlich Version 91, entfernt deren einzelne Transaktions- und Versionsbuchhaltung und führt sie als eine atomare Transaktion aus.

Die Baseline wird erzeugt mit:

```bash
npm run db:build-initial
```

Der Generator liest die Migrationen bis Version 91 in numerischer Reihenfolge. Die Datei wird nicht manuell bearbeitet und bleibt als v1-Baseline eingefroren. Neue Schemaänderungen werden als neue nummerierte Migration ab Version 92 ergänzt und nach der Baseline inkrementell angewendet.

Beim Start prüft der Migrationsdienst, ob außer `schema_migrations` noch Anwendungstabellen existieren. Bei einer leeren Datenbank wird die Baseline angewendet und anschließend werden alle Migrationen nach Version 91 inkrementell ausgeführt. Bestehende Datenbanken verwenden unverändert den inkrementellen Migrationspfad.

Die Baseline enthält Seed- und Katalogdaten, aber keine Nutzerdaten. Ein Fresh Install ist damit fachlich gleichwertig zur vollständigen Migrationskette; der Integrationstest prüft den Seed-, Spiele- und Versionsumfang.

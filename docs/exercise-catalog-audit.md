# Übungskatalog-Audit

Stand: September 2026 · Ausführung über Administration → Übersicht bzw. bei
External-Importen über den Coverage-Block

Der Katalog-Audit prüft alle Übungen mit `includeImported: true` gegen dieselbe
deterministische Pflichtfeldabfrage. Versionierte Seeds und externe Importdatensätze
werden getrennt gezählt, aber mit denselben Regeln bewertet. Der Audit entscheidet
nicht, ob ein Coachingtext fachlich gut formuliert ist; dafür bleiben Quellenprüfung,
Duplikat-Review und Trainerfreigabe erforderlich.

## Prüffelder

| Bereich | Regel |
| --- | --- |
| Identität | `seed_key` und `canonical_name` müssen vorhanden sein; DE-/EN-Name und je ein Alias werden separat geprüft. |
| Beschreibung | DE-/EN-Kurzbeschreibung, Zweck, Aufbau und Startposition müssen vorhanden sein. |
| Ausführung | Mindestens drei nichtleere Ausführungsschritte pro Sprache. |
| Coaching | Mindestens zwei Cues und mindestens eine Fehlerkorrektur pro Sprache. |
| Klassifikation | Kategorie, Trainingsphase, Trainingsziel, primäre Körperregion und mindestens ein Bewegungsmuster. |
| Sicherheit/Zielgruppe | Übungstyp, Schwierigkeit, Risiko, Mindestalter und alle drei Zielgruppenflags. |
| Betrieb | Aufsicht und positive Stations-/Teilnehmerkapazität. |
| Dosierung | Mindestens eine unterstützte Dosierungsart, zum Beispiel Wiederholungen, Sekunden, Meter oder Runden. |
| Progression | Bei `progression_required` müssen DE-/EN-Level 1–3 befüllt sein. |
| Provenienz | Mindestens eine Quellenreferenz pro Katalogdatensatz. |

## Interpretation

Ein fehlendes Feld blockiert die Vollständigkeitsquote, erzeugt aber keine automatische
Änderung am Datensatz. Besonders bei importierten Übungen bleiben externe Inhalte im
Referenz-/Reviewstatus, bis eigene Coaching-, Sicherheits- und Progressionsangaben
vorliegen. Eine Übung ohne Equipment ist zulässig, wenn sie als Körpergewichtsübung
fachlich so klassifiziert ist; die Equipmentbeziehung wird daher angezeigt, aber nicht
pauschal als Lücke bewertet.

Für OCRFRA-Hindernisse gilt zusätzlich die lokale Freigabegrenze: Ein vollständiger
Datensatz ist noch keine Nutzungsfreigabe. Maße, Zustand, Fallschutz, Kapazität,
Aufsicht, Altersgrenze und Fallback müssen im [Hindernisinventar](./ocrfra-obstacle-inventory.md)
und durch den Verein bestätigt werden.

## Technische Quelle

- Abfrage: `src/server/exercises/seed-completeness-core.ts`
- Service/Quoten: `src/server/exercises/seed-completeness-service.ts`
- Darstellung: `src/components/admin/seed-completeness-report.tsx`
- Import-Coverage: `src/app/admin/page.tsx`
- Regressionstest: `src/server/exercises/seed-completeness-core.integration.test.ts`

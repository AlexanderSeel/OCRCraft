# Duplikat- und Variantenreview

Stand: September 2026 · Administration → Datenqualität → Doppelungen prüfen

Der Review-Workflow behandelt Namensähnlichkeit als Prüfhinweis, nicht als
automatische Zusammenlegung. Das ist besonders wichtig für OCR-Varianten wie
„niedrige Wand“, „Schrägwand“, „Ringtraverse“ oder unterschiedliche Zielgruppen- und
Belastungsstufen.

## Erkennung

Die Domainfunktion normalisiert Namen und Aliase, vergleicht Token, Equipment,
Körperregionen und externe Datensatz-IDs und erzeugt daraus:

- `same`: gleiche externe ID oder gleicher normalisierter Name;
- `probable_duplicate`: hohe Namens-/Kontextähnlichkeit;
- `conflict`: ähnliche Begriffe, aber fachlicher Konflikt möglich;
- `new`: kein Review-Treffer.

Nur nicht-neue Treffer werden als offene Aufgabe gespeichert. Der Treffer enthält
Score, Klassifikation und die konkreten Gründe. Rohquellen werden dabei nicht
überschrieben.

## Trainerentscheidung

Im Side-by-Side-Vergleich stehen drei fachliche Entscheidungen zur Verfügung:

| Entscheidung | Wirkung |
| --- | --- |
| Eine Übung behalten | Die ausgewählte Übung bleibt aktiv; der andere Datensatz wird archiviert. Beziehungen, Trainingshistorie, Medien und Quellen werden auf den aktiven Datensatz übernommen. |
| Beide behalten – echte Variante | Keine Übung wird archiviert; die Entscheidung wird als `keep_both` protokolliert. |
| Keine Dublette | Keine Übung wird archiviert; die Entscheidung wird als `not_duplicate` protokolliert. |

Batch-Entscheidungen verwenden dieselben drei Zustände. Jede Entscheidung speichert
Task-ID, Auswahl, archivierte ID (falls vorhanden), Zeit und Audit-Metadaten. Dadurch
bleiben Quellenbezug und Trainerentscheidung nachvollziehbar.

## Sicherheitsgrenzen

- Es gibt keine automatische Zusammenlegung allein anhand eines Scores.
- Echte Varianten werden nicht durch einen Namensmatch entfernt.
- Ein Archivdatensatz wird nicht physisch gelöscht; Trainingshistorie und Quellen
  bleiben wiederauffindbar.
- Bei Konflikten bleibt die Trainerentscheidung maßgeblich.

Technische Quellen: `src/domain/exercise/duplicate-detection.ts`,
`src/server/exercises/duplicate-review-service.ts` und
`src/components/admin/duplicate-review-panel.tsx`.

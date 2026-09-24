# OCR-Kandidaten-Batch: Provenienz und kanonische Anreicherung

Stand: September 2026

Migration `083_ocr_candidate_provenance.sql` dokumentiert die vier ExerciseDB-Kandidaten, die im High-Signal-Review als eigenständige OCRCraft-Lücken bestätigt wurden:

| Kanonischer Seed | ExerciseDB-ID | Behandlung |
| --- | --- | --- |
| `hanging-straight-leg-raise` | `6vcvsLS` | Referenz-only; eigener DE/EN-Inhalt |
| `hanging-pike` | `gdPIyyO` | Referenz-only; eigener DE/EN-Inhalt |
| `hanging-oblique-knee-raise` | `lFBTISi` | Referenz-only; eigener DE/EN-Inhalt |
| `battle-rope-waves` | `hVzPY5j` | Referenz-only; eigener DE/EN-Inhalt |

`hanging-knee-raise` erhält keine künstliche ExerciseDB-Zuordnung: Der Katalog enthält nur assistierte oder anders benannte Varianten, die fachlich nicht als identischer Datensatz gelten. Die kanonische Übung bleibt OCRCraft-Eigeninhalt.

Die Migration ist idempotent für die Quellenreferenzen und den zusätzlichen Revieweintrag. Rohinstruktionen, GIFs und externe Medien werden weder kopiert noch als produktiver Coachingtext verwendet.

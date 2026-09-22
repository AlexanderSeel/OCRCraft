# Katalog-Coverage-Report

Der Admin-Report wertet den aktiven Übungskatalog aus dem Read-Model-Service aus.
Er zeigt nicht nur fehlende Texte, sondern ob die für Filter und Trainingsplanung
benötigten strukturierten Dimensionen tatsächlich belegt sind.

Geprüft werden Deutsch, Englisch, Trainingsphase, Risiko/Mindestalter, Trainingsziel,
Equipment, primäre Körperregion und eine OCR-Fähigkeitszuordnung. OCR-Fähigkeit wird
aus dem `ocr-skill`-Kontext, dem OCR-Tag oder den kanonischen OCR-Bewegungsmustern
abgeleitet. Das ist ein Coverage-Signal und ersetzt nicht die redaktionelle Zuordnung
aus der [OCR-Fähigkeitsmatrix](./ocr-skill-matrix.md).

Club-Hindernis-Coverage gilt nur für Datensätze mit `club-`-Seed-Key und prüft dort
die strukturierte Hindernis-Guidance einschließlich Sicherheitszone. Allgemeine
Übungen werden nicht als fehlende Club-Hindernisse gezählt.

Technische Quellen:

- `src/server/exercises/catalog-coverage-core.ts`
- `src/server/exercises/catalog-coverage-service.ts`
- `src/components/admin/catalog-coverage-report.tsx`

# Quellenkatalog-Audit

Der Audit wurde mit `node scripts/audit-source-catalogs.mjs` aus den beiden Rohdateien erzeugt und dient als erster Review-Batch. Die Rohdaten wurden nicht verändert.

## Ergebnis

- `hasaneyldrm-exercises.json`: 1.324 Datensätze, 1.316 normalisierte Namen, 8 interne Namensduplikate.
- `exercisedb-exercises.json`: 1.500 Datensätze, 1.492 normalisierte Namen, 8 interne Namensduplikate.
- 1.315 normalisierte Namen überschneiden sich zwischen den Quellen. Das spricht für eine gemeinsame oder stark überlappende Übungsbasis; die Quellen dürfen deshalb nicht einfach addiert werden.
- Beide Rohquellen enthalten vollständige technische Mindestfelder für ID, Name, Kategorie und Instruktionen.
- Lizenzübernahme ist für alle 1.324 bzw. 1.500 Rohdatensätze ungeklärt. Das ist erwartbar, weil die Rohdateien keine verifizierte `license_label`/`license_verified`-Freigabe tragen. Die bestehende Importlogik behandelt solche Inhalte korrekt als Referenzmodus.

## Fachliche Befunde

Die Rohkataloge sind stark auf klassische Fitnesskategorien konzentriert: Upper Arms, Upper Legs, Back, Waist, Chest und Shoulders dominieren. Für OCRCraft fehlen bzw. sind nicht zuverlässig ableitbar: Trainingsphasen, OCR-Fähigkeit, Hindernisbezug, sichere Progression/Regression, Stationskapazität, Aufsicht, Altersfreigabe und Vereinsverfügbarkeit.

Die ersten acht Namensduplikate je Quelle sind keine automatische Löschliste. Sie werden im nächsten Batch nach Gerätevariante, Ausführung, Risiko und Ziel geprüft. Gleiche Namen können fachlich unterschiedliche Varianten sein.

## Konsequenz für die nächsten Batches

1. Rohquellen unverändert archivieren und nur über Provenienz-/Reviewstatus anbinden.
2. Quellenüberlappung mit einer kanonischen Identität und einem Quellen-Mapping auflösen.
3. Zuerst OCR-relevante Kernübungen kuratieren: Laufen, Grip/Pull, Carry, Klettern/Übersteigen, Balance, Core, Mobilität, Warm-up und Cooldown.
4. Für jeden freigegebenen Datensatz eigene DE/EN-Coaching- und Sicherheitsfelder ergänzen.
5. Erst danach die OCRFRA-Club-Hindernisse und Templates an die kuratierte Übungsbasis anbinden.

Der anschließende 70%-Matching-Lauf bestätigt, dass hasaneyldrm für die überlappende Basis der vollständigere Kandidat ist. Details stehen in [`docs/source-match-audit.md`](./source-match-audit.md).

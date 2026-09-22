# Quellen-Matching-Audit

Das Matching verwendet die vereinbarte 70%-Schwelle. Es dient dazu, überlappende Rohdatensätze zu identifizieren und den fachlich vollständigeren Kandidaten zu priorisieren. Es ersetzt keine Review-Entscheidung und verändert keine Rohdatei.

## Auswahlregel

1. Namen werden Unicode-normalisiert, kleingeschrieben und in Tokens zerlegt.
2. Exakte normalisierte Namen erhalten Score `1.00`.
3. Andere Namen werden über Token-Dice und Edit-Distanz bewertet; der höhere Wert gilt.
4. Ab `0.70` wird ein Match-Kandidat erzeugt.
5. Der Füllstand wird über Name, Kategorie/Körperteil, Equipment, Zielmuskeln, Instruktion, Schritte und Medienreferenz gezählt.
6. Beim kanonischen Mapping gewinnt der vollständigere Kandidat; die unterlegene Quelle bleibt als Provenienz erhalten.

Der Lizenzstatus blockiert den internen Abgleich nicht, wird aber nicht entfernt. Externe Texte und Medien bleiben bis zu einer gesonderten Freigabe Referenzen; eigene OCRCraft-Coachingtexte werden für produktive Datensätze bevorzugt.

Ausführung:

```bash
npm run data:match
```

## Ergebnis des aktuellen Laufs

- 1.324 von 1.324 hasaneyldrm-Datensätzen erreichen die Schwelle.
- 1.323 Matches sind exakte normalisierte Namensmatches; ein Match ist fuzzy und liegt bei 0,826.
- Der hasaneyldrm-Kandidat ist bei allen 1.324 Matches nach dem aktuellen Füllstand vollständiger.
- Der einzige fuzzy Kandidat ist `stationary bike run v. 3` → `stationary bike run`; dieser bleibt wegen der abweichenden Benennung als Review-Kandidat markiert.
- ExerciseDB enthält neben der Überlappung zusätzliche Kandidaten. Diese werden nicht automatisch in den OCRCraft-Kernkatalog übernommen, sondern separat nach OCR-Relevanz und fachlicher Vollständigkeit bewertet.

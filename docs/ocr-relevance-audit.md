# OCR-Relevanz-Audit der zusätzlichen ExerciseDB-Kandidaten

Die 1.500 ExerciseDB-Datensätze wurden gegen die hasaneyldrm-Basis abgeglichen. 177 normalisierte Namen bleiben außerhalb der gemeinsamen Basis. Eine transparente Heuristik sortiert sie nur in Review-Prioritäten:

- **18 High-Signal-Kandidaten:** Begriffe wie Pull-up, Chin-up, Hang, Carry, Sled, Crawl, Sprint, Klettern oder Battle Rope.
- **50 Conditioning-Kandidaten:** allgemeine Squats, Lunges, Deadlifts, Push-ups, Planks, Jumps, Step-ups, Balance-, Row- und Rope-Varianten.
- **109 manuelle Review-Kandidaten:** derzeit kein belastbarer OCR-Signalbegriff.

Die 35 High-Signal-Kandidaten werden zuerst fachlich geprüft. Die aktuelle Quelle enthält zahlreiche künstlich wirkende Variantenbezeichnungen; ein Schlüsselwort allein ist deshalb keine Aufnahmeentscheidung. Vor der Übernahme braucht jeder Datensatz eigene OCRCraft-Felder für Phase, Ziel, Alter, Risiko, Aufsicht, Kapazität, Progression/Regression, Sicherheitszone und Trainerfreigabe.

Ausführung:

```bash
npm run data:ocr-relevance
```

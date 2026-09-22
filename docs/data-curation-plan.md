# OCRCraft – Datenkuratierung und Quellenregister

Stand: September 2026

Dieses Dokument beschreibt, wie der Katalog zu einer belastbaren OCR-/Breitensport-Basis wird. Es trennt fachliche Referenzen, vereinseigene Fakten und tatsächlich übernehmbaren Inhalt. Externe Texte, Bilder und GIFs werden nicht automatisch kopiert.

## Inventur des aktuellen Bestands

- `data/hasaneyldrm-exercises.json`: 1.324 externe Datensätze, überwiegend allgemeine Fitnessübungen; Datensätze enthalten unter anderem englische Anleitungen, Mehrsprachigkeit und Gym-Visual-Attribution.
- `data/exercisedb-exercises.json`: 1.500 gecachte ExerciseDB-Datensätze mit externen GIF-Referenzen und englischen Instruktionsschritten.
- Der Seed-Katalog ist bereits fachlich erweitert: Warm-up, Laufen, Mobilität, Kraft/Core, Carry/Lift, Grip/Rig, OCR-Technik, Spiele und Cooldown werden über Migrationen strukturiert.
- Es existieren 24 eigene Trainingsvorlagen sowie 12 eigene Spiele. Die Vorlagen und Spiele verwenden externe Referenzen nur für Struktur/Taxonomie und tragen keine fremden Texte als eigenen Inhalt.
- Die Datenbank besitzt bereits Quellen-, Alias-, Duplikat-, Lizenz-, Medien-, Sicherheits-, Alters- und Vollständigkeitsmodelle. Die nächste Arbeit ist daher Kuratierung und Evidenzpflege, nicht ein unkontrollierter Massenimport.

## Quellenhierarchie

1. **Vereinsfakten:** [OCR Frankfurt – Trainingsgelände](https://ocrfra.de/trainingsgelaende/). Für die Club-Konfiguration werden die dort genannten Hindernis- und Gerätearten als lokale Verfügbarkeit geführt: Olympus, Eskaladierwand, Schrägwand, Inverse Wand, Balancebalken, Multirig sowie mobile Geräte wie Reifen, Slackline, Ankerketten und Atlassteine. Höhen, Spannweiten, Kapazitäten und Freigaben werden erst nach Bestätigung durch den Verein als harte Werte gespeichert.
2. **Offizielle OCR-Sportregeln und Sicherheit:** [World Obstacle Competition Rules](https://worldobstacle.org/competition-rules/) und [World Obstacle Safety](https://worldobstacle.org/safety/). Diese Quellen liefern die sportliche Taxonomie, Wettkampfformate und Sicherheitsprinzipien. Sie ersetzen keine individuelle medizinische oder trainerische Beurteilung.
3. **Sportpraxis-Referenzen:** [VIBSS Stundenbeispiele für Erwachsene](https://www.vibss.de/sportpraxis/stundenbeispiele-pfp/erwachsene) sowie [für Kinder und Jugendliche](https://www.vibss.de/sportpraxis/stundenbeispiele-pfp/kinder-und-jugendliche). Sie dienen als Struktur- und Altersreferenz; OCRCraft formuliert eigene Einheiten.
4. **Externe Übungskataloge:** ExerciseDB und hasaneyldrm/exercises-dataset bleiben Referenz-/Importquellen. Übernahme von Text, Medien oder Lizenzbehauptungen erfolgt nur nach verifizierter Lizenz und Quellenprüfung.
5. **OCRCraft-Eigeninhalt:** Kuratierte Übungen, Spiele, Templates und Sicherheits-/Coachingtexte werden mit eigener Provenienz, Reviewstatus und Änderungsdatum gepflegt.

## Kanonisches Datenmodell für die Bereinigung

Jede freigegebene Übung braucht mindestens:

- einen stabilen `seed_key` bzw. eine stabile Identität und einen kanonischen Namen;
- DE- und EN-Namen, Kurzbeschreibung, Ausführungsschritte, Coaching-Cues und Fehlerkorrekturen;
- Phase (Warm-up, Hauptteil, Cooldown), Ziel, Bewegungsmuster, Körperregionen und Equipment;
- Altersspanne, Risiko, Aufsicht, Oberfläche/Umgebung, Platzbedarf, Kapazität und skalierbare Regression/Progression;
- OCR-Bezug nur, wenn eine konkrete Fähigkeit beschrieben wird: Laufen, Greifen/Hängen, Ziehen, Tragen, Klettern, Balancieren, Übersteigen, Werfen oder Übergang;
- Quellen- und Lizenzstatus sowie einen fachlichen Reviewstatus.

Duplikate werden nicht durch bloße Namensähnlichkeit zusammengelegt. Zusammenlegung braucht normalisierten Namen, Bewegungsmuster, Equipment, Instruktionsvergleich und eine dokumentierte Auflösungsentscheidung. Varianten mit anderem Risiko, Alter, Equipment oder Ziel bleiben getrennte Übungen.

## Geplante Erweiterung

- Club-Obstacle-Pack für OCR Frankfurt mit Availability, Aufbau, Sicherheitszone, Kapazität, Standard-/Regression-/Fallback-Variante und Freigabe durch den Verein; der aktuelle Bild-/Seitenaudit steht in [`docs/ocrfra-obstacle-inventory.md`](./ocrfra-obstacle-inventory.md).
- Offizielle OCR-Fähigkeitsmatrix für Training und Templates: Laufbasis, Grip/Pull, Carry, Klettern/Übersteigen, Balance, technische Übergänge, Teamwork und Recovery.
- Template-Packs für Erwachsene, Youth und Kids, jeweils mit sichtbarer Warm-up-/Main-/Cooldown-Struktur, Zeitbudget, Teilnehmerzahl, Intensitätsziel und Sicherheitsblock.
- Spiele-Packs für Reaktion, Kooperation, Lauftechnik, Balance und OCR-Technik; jedes Spiel erhält Altersgrenze, Ausschlusskriterien, Platzbedarf, Material und eine nicht-eliminierende Sicherheitsvariante.
- Datenqualitäts- und Coverage-Berichte nach Phase, Ziel, Alter, Risiko, Equipment, Club-Hindernis und Sprache.

## Freigaberegel

KI darf Kandidaten und Lücken vorschlagen. Eine Übung, ein Hindernis oder ein Template wird erst nach deterministischer Validierung, Quellen-/Lizenzprüfung und Trainerfreigabe produktiv. Für Kinder/Jugendliche gelten die härteren Alters-, Risiko-, Aufsichts- und Kapazitätsregeln.

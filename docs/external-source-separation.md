# Trennung externer Übungsquellen

Stand: September 2026 · technische Policy, keine Rechtsberatung

ExerciseDB/AscendAPI und `hasaneyldrm/exercises-dataset` werden als untrusted
Referenzquellen importiert. Ein Import macht externe Inhalte nicht automatisch zu
OCRCraft-Eigeninhalt und veröffentlicht keine Übung ohne Trainerreview.

## Modi

| Inhalt | Verifizierter Rechte-/Lizenznachweis | Verhalten |
| --- | --- | --- |
| Quelltext/Instruktionen | Nein | Nur Quellenmetadaten, Name/Klassifikation und OCRCraft-eigene generische Reviewhinweise; Quelltext wird nicht kopiert. |
| Quelltext/Instruktionen | Ja | Darf als Importreferenz übernommen werden, bleibt aber als externe Provenienz markiert und reviewpflichtig. |
| Bild, GIF, Video | Nein | Keine lokale Medienkopie und keine veröffentlichte Medienreferenz. |
| Bild, GIF, Video | Nur Dataset-/Textlizenz oder reine Attribution | Weiterhin keine Medienkopie; Medienfreigabe muss separat nachgewiesen werden. |
| Bild, GIF, Video | Explizite Medienrechte | Referenz bleibt pending, bis Medienreview und Attribution geprüft sind. |

ExerciseDB wird derzeit mit `rights not verified` importiert. Damit bleiben die
ExerciseDB-Anleitungen und Medien referenz-only. Bei hasaneyldrm kann der Datensatz
als MIT-Datasetquelle gekennzeichnet werden; eine Datasetlizenz wird nicht als
automatische Freigabe der enthaltenen Gym-Visuals interpretiert.

## Übersetzung und Provenienz

Die automatische deutsche Übersetzung läuft nur nach dem gewählten Import-Opt-in.
Bei ungeklärter Textlizenz erhält der AI-Provider nur strukturierte Metadaten wie
Name, Kategorie, Körperregion, Equipment und Ziel; nicht den ungeklärten Quelltext.
Generierte deutsche Texte bleiben Entwurf, werden als AI-/Import-Provenienz markiert
und benötigen Trainerfreigabe.

Jede importierte Übung erhält eine Quellenreferenz mit Provider, URL, Lizenzlabel,
Datensatz-ID und `content_mode` (`reference_only` oder `licensed_copy`). Medien
bleiben zusätzlich mit Attribution und eigenem Reviewstatus gekennzeichnet.

Technische Policy: `src/server/exercises/import/external-content-license-policy.ts`.

# Visuelle Medienprüfung

Prüfstand: **8. November 2026**. Die drei historischen P1-Exporte wurden vollständig in einem ersten visuellen Durchgang geprüft: **42 lokale Dateien, 27 mit Änderungsbedarf, 15 mit weiterer Trainerprüfung, keine Freigabe**. Das ist kein Abschluss des gesamten Katalog-/Video-/Rechtereviews.

| Batch | Dateien angesehen | Änderung erforderlich | Weitere Trainerprüfung | Bericht |
| --- | ---: | ---: | ---: | --- |
| Einzelpersonen | 17 | 10 | 7 | [Einzelbefunde](./image-review-single-subject-2026-11-08.md) |
| OCRFRA-Hindernisse | 11 | 6 | 5 | [Einzelbefunde](./image-review-ocrfra-obstacles-2026-11-08.md) |
| Spiele und Partner | 14 | 11 | 3 | [Einzelbefunde](./image-review-games-partner-2026-11-08.md) |
| Gesamt | 42 | 27 | 15 | [Maschinenlesbarer Index](./image-review-batch-index-2026-11-08.json) |

Jede JSON-Prüfliste hält Datei- und Prompt-SHA-256, verglichene Asset-ID, weitere exportierte Referenzen, Soll-Schritte, sichtbaren Befund und Nacharbeit fest. Die Hashes aller 42 Dateien und aller 84 exportierten Asset-/Prompt-Referenzen wurden geprüft. Bei Datei- oder relevanten Inhaltsänderungen ist der bisherige Befund erneut abzugleichen.

## Gemeinsame Dateireferenzen

Die Exporte enthalten 84 Asset-Referenzen auf 42 Pfade; jeder Pfad wird zweimal referenziert. An 24 Pfaden unterscheiden sich die Prompts ausschließlich im gewünschten erwachsenen Demonstrator (`adult man` / `adult woman`). Nach Normalisierung dieses Satzes stimmen die jeweiligen Promptpaare exakt überein. Das sind keine unterschiedlichen Übungsanleitungen oder 84 unabhängig geprüfte Bilder. Die textbezogenen Befunde gelten jeweils für den ausdrücklich benannten ersten Prompt; beide Präsentationsanforderungen wurden nicht freigegeben.

Die Exportdaten sind historische Arbeitsstände aus September 2026. Aktuellen Datenbankstatus, Primärmedium und weiter gültige Zuordnung vor jeder Änderung erneut feststellen. Keine Referenz wurde gelöscht oder zusammengeführt; keine Datei und kein Datenbankstatus wurden durch dieses Review verändert.

## Weitere Arbeit

1. Zuerst falsche Kontakte, schwebende Bauteile, wechselnde Verbindungen und unklare Landungen korrigieren. Die tatsächlichen Hindernisgeometrien anhand von Vereinsreferenzen aufnehmen, bevor neue Varianten gezeichnet werden.
2. Spielregeln bildlich eindeutig machen: eine aktive Person je freizugebender Station, zeitliche Folge von gleichzeitigen Teilnehmenden unterscheiden, feste Depot-/Teamzonen und getrennte Hin-/Rückwege zeigen. Farbsignale um nichtfarbliche Merkmale ergänzen.
3. Bei jedem weiteren Ersatz eigene Kandidatendateien verwenden und stabile Trainings-/Medienreferenzen erhalten; die 42 bekannten veralteten Zuordnungen sind inzwischen technisch ausgesondert (Abschluss unten).
4. Alle korrigierten sowie die 15 noch offenen Bilder vollständig auf Anatomie, Text-Match, Rechte/Provenienz und gegebenenfalls Vor-Ort-Geometrie prüfen; anschließend eine explizite Freigabe dokumentieren.
5. Übrige Katalogbilder und Videos einschließlich bereits als `approved` markierter Altmedien separat prüfen. Der erste Durchgang dieser 42 Dateien ersetzt diese Aufgabe nicht.

## Datenbank-/Dateiabgleich vor der Bereinigung

Der [read-only Integritätsaudit](./media-integrity-2026-11-08.json) bestätigt im Arbeitsbestand 42 gemeinsame Dateigruppen und 42 Pending-Records mit abweichendem gespeicherten SHA-256. Alle 42 in den visuellen Berichten ausdrücklich verglichenen Asset-IDs passen dagegen zum aktuellen Datei-Hash. Der Initial-Snapshot hat bei 105 Medien keine gemeinsamen Dateigruppen, fehlenden Dateien oder Hashabweichungen. Der Arbeitsbestand hat 346 Medien und keine fehlenden lokalen Dateien. Die Integrität ist keine fachliche Freigabe.

Neugenerierung und Paketimport veröffentlichen lokale Bilder jetzt ohne Überschreiben vorhandener Ziele; die S3-Generierung verlangt einen bedingten Neuschreibzugriff. Das repariert die 42 alten Hashabweichungen nicht: deren Metadaten bleiben zur referenzsicheren Einzelfallklärung erhalten. Keine Datei wurde zur Anpassung an einen alten Hash ersetzt, kein alter Hash umgeschrieben und kein Reviewstatus gesetzt.

## Abgeschlossene technische Bereinigung

Die [42 veralteten Pending-Kandidaten](./media-retirement-2026-11-08.json) wurden nach Preview, Kopie-Probe und Checkpoint-Backup als `rejected` ausgesondert. Es bestehen jetzt **0 Hashabweichungen und 0 gemeinsame Dateigruppen unter nicht verworfenen Medien**. Alle 346 Medienrecords bleiben vorhanden; die 42 abweichenden historischen Records werden weiterhin roh im Audit gezählt, aber getrennt von nutzbaren Kandidaten ausgewiesen. Pending sank von 326 auf 284; keine neue Freigabe.

Originalhashes, Dateibytes, Primärflags, übrig gebliebene Medienrecords sowie sämtliche geprüften Job-, Trainings-, Versions-, Katalog- und Nutzerrecords sind gegenüber dem Backup unverändert. 36 betroffene Generation-Jobs behalten ihre Asset-Fremdschlüssel. Je verworfenem Record dokumentiert ein technischer System-Auditeintrag den bisherigen Hash, den tatsächlichen Datei-Hash und die überlebende Kandidaten-ID. Ein erneuter Preview findet keine Kandidaten. Verworfene Bilder bleiben in der Administration nachvollziehbar, sind aber aus der normalen Übungsauswahl ausgeschlossen; auch ein direkter Primär-Auswahlrequest wird abgewiesen.

Dies ist eine technische Aussonderung beschädigter Zuordnungen, keine fachliche Übungs-/Bildbewertung. Die 27 sichtbaren Änderungsbefunde und 15 weiteren Trainerprüfungen bleiben offen. Vor bewusster Reaktivierung historischer Medien Zuordnung und Datei-Hash erneut prüfen; Originalbytes eines überschriebenen Kandidaten werden hierdurch nicht wiederhergestellt.

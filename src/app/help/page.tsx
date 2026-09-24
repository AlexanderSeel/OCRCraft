import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const workspaces = [
  { href: "/", title: "Dashboard", text: "Überblick, Status und schnelle Einstiege." },
  { href: "/training", title: "Training", text: "Gespeicherte Einheiten, Vorlagen, Quick Create und Builder." },
  { href: "/exercises", title: "Übungen", text: "Übungskatalog, Coaching, Sicherheit, Equipment und Medien." },
  { href: "/obstacles", title: "Hindernisse", text: "OCR-Hindernisse, Guidance, Maße und Sicherheitszonen." },
  { href: "/games", title: "Spiele", text: "Spielerische Trainingsformen im gemeinsamen Katalogmodell." },
  { href: "/groups", title: "Gruppen", text: "Zielgruppen, Standardwerte und Vereinsregeln." },
  { href: "/media", title: "Medien", text: "Bilder, Videos, Rechteprüfung und KI-Ersatz." },
  { href: "/exercises/ai-drafts", title: "AI-Entwürfe", text: "KI-Vorschläge prüfen, freigeben oder verwerfen." },
  { href: "/admin/outdoor-variants", title: "Outdoor", text: "Portable Varianten, Ersatz-Equipment und Portabilitäts-Audit." },
  { href: "/admin?tab=overview", title: "Administration", text: "Benutzer, Datenqualität, Queue, Datenbank und Einstellungen." },
] as const;

const glossary = [
  ["Portable", "Equipment oder Ausführung, die ohne studioexklusive Maschine in Halle oder Outdoor planbar ist."],
  ["Converted", "Importübung, deren ursprüngliche Studioabhängigkeit auf eine fachlich definierte portable Variante abgebildet wurde."],
  ["Blocked", "Datensatz, der bis zu einer fachlichen Entscheidung nicht automatisch in der aktiven Planung verwendet werden soll."],
  ["Reviewblocker", "Fachlicher oder sicherheitsrelevanter Zustand, der eine automatische Freigabe verhindert."],
  ["Primärmedium", "Das Bild oder Video, das OCRCraft bevorzugt für eine Übung anzeigt."],
  ["AI-Draft", "Noch nicht freigegebener KI-Vorschlag. Er wird erst nach Validierung und Trainerentscheidung produktiv."],
  ["Fallback", "Sichere Ersatzübung oder vereinfachte Variante, wenn die geplante Ausführung nicht möglich ist."],
  ["Stationskapazität", "Maximale Anzahl Teilnehmender, die eine Station gleichzeitig sicher nutzen kann."],
] as const;

export default function HelpPage() {
  return (
    <AppShell
      title="Hilfezentrum"
      subtitle="Tutorials erneut öffnen, Arbeitsbereiche finden und zentrale OCRCraft-Begriffe nachschlagen."
      actions={<Link className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/">Dashboard</Link>}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-[var(--brand)] bg-[var(--brand-soft)] p-5" data-tour="help-reopen">
          <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Interaktive Hilfe</div>
          <h2 className="mt-1 text-xl font-black">Tutorial erneut öffnen</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Öffne zuerst den gewünschten Arbeitsbereich und nutze dort oben rechts die <strong>?</strong>-Schaltfläche.
            OCRCraft setzt eine nicht abgeschlossene Führung am gespeicherten Schritt fort. Ein bereits abgeschlossenes Tutorial startet wieder bei Schritt 1.
          </p>
          <p className="mt-2 text-xs font-bold text-[var(--muted)]">
            Tutorials starten nur nach deiner Aktion und öffnen sich nicht automatisch über Formularen oder Reviewentscheidungen.
          </p>
        </section>

        <section data-tour="help-workspaces">
          <div className="mb-3">
            <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Arbeitsbereiche</div>
            <h2 className="mt-1 text-xl font-black">Direkteinstieg</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => (
              <Card as="article" className="p-4" key={workspace.href}>
                <h3 className="font-black">{workspace.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{workspace.text}</p>
                <Link className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-[var(--border)] px-3 text-sm font-black hover:bg-[var(--surface-subtle)]" href={workspace.href}>
                  Bereich öffnen
                </Link>
              </Card>
            ))}
          </div>
        </section>

        <section data-tour="help-glossary">
          <div className="mb-3">
            <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Glossar</div>
            <h2 className="mt-1 text-xl font-black">Wichtige Begriffe</h2>
          </div>
          <dl className="grid gap-2 lg:grid-cols-2">
            {glossary.map(([term, description]) => (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" key={term}>
                <dt className="font-black">{term}</dt>
                <dd className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Fachhinweise</div>
          <h2 className="mt-1 text-xl font-black">Vor dem Speichern prüfen</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)]">
            <li>• Kinder-/Jugend-, Risiko- und Aufsichtsgrenzen sind harte Sicherheitsregeln.</li>
            <li>• KI-Ausgaben sind Vorschläge und benötigen weiterhin Validierung bzw. Trainerreview.</li>
            <li>• Externe Medien ohne bestätigte Nutzungsrechte gelten nicht als verwendbare Übungsbilder.</li>
            <li>• Outdoor-Ersatzgeräte nur freigeben, wenn Bewegungsmuster, Widerstandsrichtung und Sicherheit erhalten bleiben.</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

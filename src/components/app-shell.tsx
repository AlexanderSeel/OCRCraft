import type { ReactNode } from "react";

const navigation = [
  ["Übersicht", "/"],
  ["Training", "/training"],
  ["Übungen", "/exercises"],
  ["Hindernisse", "/obstacles"],
  ["Gruppen", "/groups"],
  ["Medien", "/media"],
] as const;

interface AppShellProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-[var(--border)] bg-[var(--dark)] text-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-lg font-black text-[var(--dark)]">
            O
          </div>
          <div>
            <div className="font-black tracking-tight">OCRCraft</div>
            <div className="text-xs text-white/55">Club Training Studio</div>
          </div>
        </div>

        <nav aria-label="Hauptnavigation" className="flex-1 space-y-1 p-4">
          {navigation.map(([label, href], index) => (
            <a
              className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                index === 0
                  ? "bg-white/12 text-white"
                  : "text-white/65 hover:bg-white/8 hover:text-white"
              }`}
              href={href}
              key={href}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <a
            className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/65 hover:bg-white/8 hover:text-white"
            href="/settings"
          >
            Einstellungen
          </a>
          <a
            className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/65 hover:bg-white/8 hover:text-white"
            href="/admin"
          >
            Administration
          </a>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/92 backdrop-blur">
          <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{title}</h1>
              {subtitle ? (
                <p className="mt-1 hidden text-sm text-[var(--muted)] sm:block">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

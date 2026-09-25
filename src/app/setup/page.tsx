import { redirect } from "next/navigation";
import { hasAppUsers } from "@/server/auth/identity-service";
import { buttonClass, formControlClass } from "@/components/ui/form";
import { setupFirstSuperAdminAction } from "../admin/identity-actions";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasAppUsers()) redirect("/login");
  const query = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] p-4 text-[var(--foreground)]">
      <section className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
          OCRCraft · Erststart
        </p>
        <h1 className="mt-2 text-2xl font-black">Super-Admin anlegen</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Es existiert noch kein Benutzer. Lege jetzt das erste
          Super-Admin-Konto und den Vereinscode an. Danach ist die Anwendung nur
          noch nach Anmeldung erreichbar.
        </p>
        {query.error ? (
          <p
            aria-live="assertive"
            className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]"
          >
            Die Einrichtung konnte nicht gespeichert werden. Prüfe alle Felder.
          </p>
        ) : null}
        <form
          action={setupFirstSuperAdminAction}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label className="grid gap-1 text-sm font-bold" htmlFor="firstName">
            Vorname
            <input
              className={`${formControlClass} font-normal`}
              id="firstName"
              name="firstName"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-bold" htmlFor="lastName">
            Nachname
            <input
              className={`${formControlClass} font-normal`}
              id="lastName"
              name="lastName"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-bold" htmlFor="username">
            Username
            <input
              className={`${formControlClass} font-normal`}
              id="username"
              name="username"
              pattern="[A-Za-z0-9._-]{3,40}"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-bold" htmlFor="email">
            E-Mail
            <input
              className={`${formControlClass} font-normal`}
              id="email"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold" htmlFor="password">
            Passwort
            <input
              className={`${formControlClass} font-normal`}
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <label
            className="grid gap-1 text-sm font-bold"
            htmlFor="clubAccessCode"
          >
            Vereinscode
            <input
              className={`${formControlClass} font-normal`}
              id="clubAccessCode"
              minLength={4}
              name="clubAccessCode"
              required
              type="password"
            />
          </label>
          <button
            className={buttonClass("primary", "w-full px-4 sm:col-span-2")}
            type="submit"
          >
            Einrichtung abschließen
          </button>
        </form>
      </section>
    </main>
  );
}

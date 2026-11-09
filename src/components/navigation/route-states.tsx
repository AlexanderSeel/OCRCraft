"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import type { UiDictionary } from "@/i18n/dictionaries";
import { buttonClass } from "@/components/ui/form-styles";

export function RouteError({ retry }: { readonly retry: () => void }) {
  const { dictionary } = useLocale();
  return <RouteErrorContent dictionary={dictionary} retry={retry} />;
}

/** No data fetch, storage mutation or raw exception text in the failure path. */
export function RouteErrorContent({ dictionary, retry }: { readonly dictionary: UiDictionary; readonly retry: () => void }) {
  const [pending, startTransition] = useTransition();
  const text = dictionary.routeStates;
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-xl content-center gap-4 p-4 text-[var(--foreground)]" id="main-content">
      <p className="text-sm font-bold text-[var(--muted)]">OCRCraft</p>
      <div className="rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-[var(--danger)]" role="alert">
        <h1 className="text-2xl font-black">{text.error}</h1><p className="mt-3 text-sm leading-6">{text.errorDetail}</p>
      </div>
      <p className="text-sm leading-6 text-[var(--muted)]">{text.recovery}</p>
      <div className="flex flex-wrap gap-2">
        <button className={buttonClass("primary")} disabled={pending} onClick={() => startTransition(retry)} type="button">{pending ? text.retrying : text.retry}</button>
        <Link className={buttonClass("secondary")} href="/">{text.home}</Link>
      </div>
    </main>
  );
}

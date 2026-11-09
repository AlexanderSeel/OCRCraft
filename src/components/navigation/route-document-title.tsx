"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { documentTitle } from "@/config/route-titles";

export function RouteDocumentTitle() {
  const pathname = usePathname();
  const { locale } = useLocale();
  useEffect(() => {
    const title = documentTitle(pathname, locale);
    const synchronize = () => { if (document.title !== title) document.title = title; };
    synchronize();
    // Streamed server metadata may arrive after hydration; retain the browser's language.
    const observer = new MutationObserver(synchronize);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname, locale]);
  return null;
}

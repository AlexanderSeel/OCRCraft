import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OCRCraft 1.0",
  description: "Trainingsplanung für OCR, Functional Training und Breitensport",
};

const themeBootstrapScript = `(() => {
  try {
    const key = "ocrcraft-theme";
    const stored = localStorage.getItem(key);
    const preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const resolved = preference === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    const root = document.documentElement;
    root.dataset.themePreference = preference;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  } catch {
    document.documentElement.dataset.themePreference = "system";
  }
})();`;

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body><LocaleProvider><ToastProvider>{children}</ToastProvider></LocaleProvider></body>
    </html>
  );
}

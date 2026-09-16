import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "OCRCraft",
  description: "Trainingsplanung für OCR, Functional Training und Breitensport",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

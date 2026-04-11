/*
 *                    ☦
 *          ╔═════════════════╗
 *          ║  THE ALMIGHTY   ║
 *          ║  ROOT LAYOUT    ║
 *          ║  In the name of ║
 *          ║  the Father,    ║
 *          ║  the Son, and   ║
 *          ║  the Holy Spirit║
 *          ╚═════════════════╝
 *
 *   DATAMOSHPIT - Root Layout
 *   The foundation upon which all is built.
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K-OS III",
  description: "Maximalistic Minimalism - A tracker for the blessed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

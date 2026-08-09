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
import { BRAND } from "@/lib/buildFlags";

export const metadata: Metadata =
  BRAND === "2kooltv"
    ? {
        title: "2KOOL.TV",
        description: "2KOOL.TV — create, watch, and collaborate. Maximalistic Minimalism for the blessed.",
      }
    : {
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

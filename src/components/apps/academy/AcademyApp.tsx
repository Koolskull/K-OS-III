"use client";

/*
 *                    ✠
 *      ACADEMY — IN-OS APP
 *
 *  Renders the K-OS Academy inside a desktop window. Self-contained
 *  navigation (no URL changes); same content as the /edu route.
 */

import { Academy } from "@/components/academy/Academy";

export function AcademyApp() {
  return <Academy mode="window" initialRef={null} />;
}

export default AcademyApp;

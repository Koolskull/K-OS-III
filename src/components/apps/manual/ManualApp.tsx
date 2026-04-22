"use client";

/*
 *                    ☦
 *      MANUAL — IN-OS APP
 *
 *  Renders the K-OS Manual inside a desktop window. Self-contained
 *  navigation (no URL changes); same content as the /doc route.
 */

import { Manual } from "@/components/doc/Manual";

export function ManualApp() {
  return <Manual mode="window" initialSlug={null} />;
}

export default ManualApp;

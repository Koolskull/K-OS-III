"use client";

import { ThrashPhoneShell } from "@/components/apps/thrash-tracker/ThrashPhoneShell";

/** Direct route. Same phone tracker the desktop icon opens. */
export default function ThrashPage() {
  return <ThrashPhoneShell isFocused />;
}

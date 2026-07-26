/*
 *                    ☦
 *        ACCOUNTS — STANDALONE ROUTE
 *
 *   Direct-link entry point (e.g. before the OS shell has booted, or a
 *   shared profile link). Inside the OS shell itself, this same content
 *   opens as a normal app window instead — see AccountApp's usage in
 *   src/app/page.tsx.
 */

import { AccountApp } from "@/components/apps/account/AccountApp";

export default function AccountPage() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <AccountApp />
    </div>
  );
}

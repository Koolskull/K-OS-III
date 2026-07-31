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
import { HAS_BACKEND } from "@/lib/buildFlags";

export default function AccountPage() {
  if (!HAS_BACKEND) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#888",
          fontFamily: "var(--dm-font-primary)",
          fontSize: 10,
          letterSpacing: 1,
          textAlign: "center",
          padding: 24,
        }}
      >
        ACCOUNTS AREN&apos;T AVAILABLE IN THIS BUILD.
        <br />
        THIS IS THE LOCAL/OFFLINE VERSION OF K-OS III.
      </div>
    );
  }
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <AccountApp />
    </div>
  );
}

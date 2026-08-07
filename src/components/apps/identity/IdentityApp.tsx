"use client";

/*
 *                    ☦
 *      IDENTITY — K-OS III APP
 *
 *  Local-first accounts + in-app Ethereum wallet.
 *  Static-export safe (2kool.tv). Real GitHub/Google OAuth when
 *  NEXT_PUBLIC_POCKETBASE_URL points at a PocketBase with providers.
 *
 *  UI: hard edges, pixel fonts, no rounded corners, CRT/Gameboy chrome.
 *  Follows koolskull-os-ui-notes.md (Maximalistic Minimalism).
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  createEmailAccount,
  createProviderAccount,
  exportAccountPrivateKey,
  getCurrentAccount,
  listAccounts,
  signInEmail,
  signInWithPassphrase,
  signOut,
  socialOAuthAvailable,
  type KosAccountPublic,
} from "@/lib/user/accounts";
import { chunkAddress, shortAddress } from "@/lib/user/wallet";
import {
  finishOAuthAndMintWallet,
  isPocketBaseConfigured,
  readOAuthCodeFromUrl,
  startOAuthRedirect,
} from "@/lib/user/pocketbase";

type View =
  | { kind: "home" }
  | { kind: "signin-email" }
  | { kind: "signup-email" }
  | { kind: "provider"; provider: "github" | "google" }
  | { kind: "vault" }
  | { kind: "export" }
  | { kind: "oauth-finish"; code: string };

const inputStyle: React.CSSProperties = {
  background: "#000",
  color: "#fff",
  border: "2px solid #555",
  padding: "8px 10px",
  fontFamily: "var(--dm-font-primary), monospace",
  fontSize: 12,
  letterSpacing: 1,
  outline: "none",
  borderRadius: 0,
  width: "100%",
  boxSizing: "border-box",
  imageRendering: "pixelated",
};

const yellowBtn: React.CSSProperties = {
  background: "#ffff00",
  color: "#000",
  border: "2px solid #ffff00",
  padding: "8px 14px",
  fontFamily: "inherit",
  fontSize: 11,
  letterSpacing: 2,
  cursor: "pointer",
  fontWeight: 700,
  borderRadius: 0,
  imageRendering: "pixelated",
};

const outlineBtn: React.CSSProperties = {
  background: "#000",
  color: "#fff",
  border: "2px solid #fff",
  padding: "8px 14px",
  fontFamily: "inherit",
  fontSize: 11,
  letterSpacing: 2,
  cursor: "pointer",
  fontWeight: 700,
  borderRadius: 0,
};

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  color: "#888",
  border: "1px solid #333",
  padding: "8px 14px",
  fontFamily: "inherit",
  fontSize: 11,
  letterSpacing: 2,
  cursor: "pointer",
  borderRadius: 0,
};

const dangerBtn: React.CSSProperties = {
  ...outlineBtn,
  borderColor: "#ff4444",
  color: "#ff6666",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 10,
  color: "#888",
  letterSpacing: 2,
  width: "100%",
};

const panel: React.CSSProperties = {
  border: "1px solid #333",
  background: "#0a0a0a",
  padding: 14,
  marginBottom: 14,
};

export function IdentityApp() {
  const [account, setAccount] = useState<KosAccountPublic | null>(null);
  const [accounts, setAccounts] = useState<KosAccountPublic[]>([]);
  const [view, setView] = useState<View>({ kind: "home" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const cur = getCurrentAccount();
    setAccount(cur);
    setAccounts(listAccounts());
    if (cur) setView({ kind: "vault" });
  }, []);

  useEffect(() => {
    refresh();
    // PocketBase OAuth return
    const code = readOAuthCodeFromUrl();
    if (code) {
      setView({ kind: "oauth-finish", code });
    }
    setReady(true);
  }, [refresh]);

  if (!ready) {
    return (
      <Shell>
        <p style={{ color: "#666", fontSize: 12, letterSpacing: 2 }}>LOADING IDENTITY…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <header
        style={{
          flexShrink: 0,
          borderBottom: "2px solid #fff",
          padding: "10px 16px",
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: 2, color: "#666" }}>
          K-OS III · AUTH / WEB3
        </div>
        <h1
          style={{
            margin: "6px 0 4px",
            fontSize: 16,
            letterSpacing: 3,
            color: "#ffff00",
            fontWeight: 700,
          }}
        >
          IDENTITY
        </h1>
        <p style={{ margin: 0, fontSize: 11, color: "#aaa", lineHeight: 1.45, maxWidth: 640 }}>
          Local accounts mint an in-app Ethereum wallet. Password encrypts the key
          (AES-GCM). Optional PocketBase for real GitHub / Google OAuth.
        </p>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 18px 28px",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {error && (
            <div
              style={{
                ...panel,
                borderColor: "#ff4444",
                color: "#ff6666",
                fontSize: 11,
                letterSpacing: 1,
              }}
            >
              {error}
              <button
                type="button"
                onClick={() => setError(null)}
                style={{ ...ghostBtn, marginLeft: 12, padding: "2px 8px" }}
              >
                DISMISS
              </button>
            </div>
          )}

          {view.kind === "home" && !account && (
            <HomeView
              accounts={accounts}
              busy={busy}
              onEmailSignIn={() => {
                setError(null);
                setView({ kind: "signin-email" });
              }}
              onEmailCreate={() => {
                setError(null);
                setView({ kind: "signup-email" });
              }}
              onProvider={(p) => {
                setError(null);
                setView({ kind: "provider", provider: p });
              }}
              onUnlock={async (id, pass) => {
                setBusy(true);
                setError(null);
                try {
                  await signInWithPassphrase(id, pass);
                  refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Unlock failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}

          {view.kind === "signin-email" && (
            <EmailSignIn
              busy={busy}
              onBack={() => setView({ kind: "home" })}
              onSubmit={async (email, password) => {
                setBusy(true);
                setError(null);
                try {
                  await signInEmail(email, password);
                  refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Sign-in failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}

          {view.kind === "signup-email" && (
            <EmailSignUp
              busy={busy}
              onBack={() => setView({ kind: "home" })}
              onSubmit={async (fields) => {
                setBusy(true);
                setError(null);
                try {
                  await createEmailAccount(fields);
                  refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Create failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}

          {view.kind === "provider" && (
            <ProviderLink
              provider={view.provider}
              busy={busy}
              pb={isPocketBaseConfigured()}
              onBack={() => setView({ kind: "home" })}
              onLocal={async (fields) => {
                setBusy(true);
                setError(null);
                try {
                  await createProviderAccount({
                    provider: view.provider,
                    ...fields,
                  });
                  refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Link failed");
                } finally {
                  setBusy(false);
                }
              }}
              onOAuth={async () => {
                setBusy(true);
                setError(null);
                try {
                  await startOAuthRedirect(view.provider);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "OAuth failed");
                  setBusy(false);
                }
              }}
            />
          )}

          {view.kind === "oauth-finish" && (
            <OAuthFinish
              code={view.code}
              busy={busy}
              onBack={() => setView({ kind: "home" })}
              onSubmit={async (passphrase, displayName) => {
                setBusy(true);
                setError(null);
                try {
                  await finishOAuthAndMintWallet({
                    code: view.code,
                    passphrase,
                    displayName,
                  });
                  // Clean query string
                  if (typeof window !== "undefined") {
                    const u = new URL(window.location.href);
                    u.searchParams.delete("code");
                    u.searchParams.delete("state");
                    window.history.replaceState({}, "", u.pathname + u.search);
                  }
                  refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "OAuth finish failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}

          {(view.kind === "vault" || account) && account && view.kind !== "export" && view.kind !== "oauth-finish" && (
            <VaultView
              account={account}
              onExport={() => {
                setError(null);
                setView({ kind: "export" });
              }}
              onSignOut={() => {
                signOut();
                setAccount(null);
                setAccounts(listAccounts());
                setView({ kind: "home" });
              }}
            />
          )}

          {view.kind === "export" && account && (
            <ExportView
              account={account}
              busy={busy}
              onBack={() => setView({ kind: "vault" })}
              onExport={async (passphrase) => {
                setBusy(true);
                setError(null);
                try {
                  return await exportAccountPrivateKey(passphrase);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Export failed");
                  return null;
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "var(--dm-font-primary), monospace",
        imageRendering: "pixelated",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function HomeView({
  accounts,
  busy,
  onEmailSignIn,
  onEmailCreate,
  onProvider,
  onUnlock,
}: {
  accounts: KosAccountPublic[];
  busy: boolean;
  onEmailSignIn: () => void;
  onEmailCreate: () => void;
  onProvider: (p: "github" | "google") => void;
  onUnlock: (id: string, pass: string) => Promise<void>;
}) {
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [pass, setPass] = useState("");
  const pb = socialOAuthAvailable();

  return (
    <>
      <section style={panel}>
        <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
          NEW SESSION
        </div>
        <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 12 }}>
          Create an email account or link a social identity. First session mints a
          secp256k1 ETH wallet. Key stays encrypted in this browser until you export.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" style={yellowBtn} disabled={busy} onClick={onEmailCreate}>
            CREATE EMAIL
          </button>
          <button type="button" style={outlineBtn} disabled={busy} onClick={onEmailSignIn}>
            SIGN IN EMAIL
          </button>
        </div>
      </section>

      <section style={panel}>
        <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
          SOCIAL · GITHUB / GOOGLE
        </div>
        <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 12 }}>
          {pb
            ? "PocketBase OAuth is configured. Use real GitHub / Google, then set a lock passphrase to mint the wallet."
            : "No PocketBase URL — local provider path. You set a lock passphrase; wallet is minted offline. Set NEXT_PUBLIC_POCKETBASE_URL for live OAuth."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            style={outlineBtn}
            disabled={busy}
            onClick={() => onProvider("github")}
          >
            GITHUB
          </button>
          <button
            type="button"
            style={outlineBtn}
            disabled={busy}
            onClick={() => onProvider("google")}
          >
            GOOGLE
          </button>
        </div>
      </section>

      {accounts.length > 0 && (
        <section style={panel}>
          <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
            KNOWN ACCOUNTS · THIS BROWSER
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {accounts.map((a) => (
              <li
                key={a.id}
                style={{
                  borderTop: "1px solid #222",
                  padding: "10px 0",
                  fontSize: 11,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "#fff", letterSpacing: 1 }}>
                      {a.displayName.toUpperCase()}
                      <span style={{ color: "#666", marginLeft: 8 }}>
                        [{a.provider.toUpperCase()}]
                      </span>
                    </div>
                    <div style={{ color: "#666", marginTop: 2 }}>{a.email}</div>
                    <div
                      className="slim-digits-h"
                      style={{ color: "#66ff66", marginTop: 4, letterSpacing: 1 }}
                    >
                      {shortAddress(a.walletAddress, 6)}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={ghostBtn}
                    disabled={busy}
                    onClick={() => {
                      setUnlockId(a.id);
                      setPass("");
                    }}
                  >
                    UNLOCK
                  </button>
                </div>
                {unlockId === a.id && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      type="password"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="passphrase"
                      style={{ ...inputStyle, flex: 1, minWidth: 140 }}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      style={yellowBtn}
                      disabled={busy || pass.length < 8}
                      onClick={() => void onUnlock(a.id, pass)}
                    >
                      OPEN
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer style={{ marginTop: 20, fontSize: 10, color: "#555", letterSpacing: 1 }}>
        ☦ LOCAL-FIRST · KEY NEVER LEAVES BROWSER UNENCRYPTED
      </footer>
    </>
  );
}

function EmailSignIn({
  busy,
  onBack,
  onSubmit,
}: {
  busy: boolean;
  onBack: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <section style={panel}>
      <button type="button" onClick={onBack} style={{ ...ghostBtn, marginBottom: 12 }}>
        ← BACK
      </button>
      <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 12 }}>
        SIGN IN · EMAIL
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(email, password);
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label style={labelStyle}>
          EMAIL
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
            required
          />
        </label>
        <label style={labelStyle}>
          PASSWORD
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
            required
            minLength={8}
          />
        </label>
        <button type="submit" style={yellowBtn} disabled={busy}>
          {busy ? "…" : "SIGN IN"}
        </button>
      </form>
    </section>
  );
}

function EmailSignUp({
  busy,
  onBack,
  onSubmit,
}: {
  busy: boolean;
  onBack: () => void;
  onSubmit: (f: {
    email: string;
    password: string;
    displayName?: string;
    handle?: string;
  }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  return (
    <section style={panel}>
      <button type="button" onClick={onBack} style={{ ...ghostBtn, marginBottom: 12 }}>
        ← BACK
      </button>
      <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
        CREATE · EMAIL ACCOUNT
      </div>
      <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 12 }}>
        Password is also the wallet lock. 8+ characters. ETH keypair is generated
        immediately and stored encrypted in localStorage.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit({ email, password, displayName, handle });
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label style={labelStyle}>
          DISPLAY NAME
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
            placeholder="operator"
            maxLength={40}
          />
        </label>
        <label style={labelStyle}>
          HANDLE
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            style={inputStyle}
            placeholder="koolskull"
            maxLength={24}
          />
        </label>
        <label style={labelStyle}>
          EMAIL
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
            required
          />
        </label>
        <label style={labelStyle}>
          PASSWORD · WALLET LOCK
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </label>
        <button type="submit" style={yellowBtn} disabled={busy}>
          {busy ? "MINTING…" : "CREATE + MINT WALLET"}
        </button>
      </form>
    </section>
  );
}

function ProviderLink({
  provider,
  busy,
  pb,
  onBack,
  onLocal,
  onOAuth,
}: {
  provider: "github" | "google";
  busy: boolean;
  pb: boolean;
  onBack: () => void;
  onLocal: (f: {
    email: string;
    passphrase: string;
    displayName?: string;
    handle?: string;
  }) => Promise<void>;
  onOAuth: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [displayName, setDisplayName] = useState("");
  const label = provider.toUpperCase();

  return (
    <section style={panel}>
      <button type="button" onClick={onBack} style={{ ...ghostBtn, marginBottom: 12 }}>
        ← BACK
      </button>
      <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
        LINK · {label}
      </div>
      {pb && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 10 }}>
            Real OAuth via PocketBase. After redirect you will set a wallet lock
            passphrase.
          </p>
          <button type="button" style={yellowBtn} disabled={busy} onClick={() => void onOAuth()}>
            {busy ? "…" : `CONTINUE WITH ${label}`}
          </button>
          <div
            style={{
              margin: "16px 0",
              borderTop: "1px solid #333",
              paddingTop: 12,
              fontSize: 10,
              color: "#555",
              letterSpacing: 2,
            }}
          >
            OR LOCAL LINK
          </div>
        </div>
      )}
      <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 12 }}>
        Local {label} identity: store email + lock passphrase. Mints ETH wallet under
        the passphrase. Not live OAuth{pb ? " (use button above for real OAuth)" : ""}.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onLocal({ email, passphrase, displayName });
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label style={labelStyle}>
          DISPLAY NAME
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
            placeholder={label}
          />
        </label>
        <label style={labelStyle}>
          EMAIL ON {label}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </label>
        <label style={labelStyle}>
          LOCK PASSPHRASE · WALLET KEY
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            style={inputStyle}
            required
            minLength={8}
          />
        </label>
        <button type="submit" style={outlineBtn} disabled={busy}>
          {busy ? "MINTING…" : `CREATE ${label} + WALLET`}
        </button>
      </form>
    </section>
  );
}

function OAuthFinish({
  code,
  busy,
  onBack,
  onSubmit,
}: {
  code: string;
  busy: boolean;
  onBack: () => void;
  onSubmit: (passphrase: string, displayName: string) => Promise<void>;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [displayName, setDisplayName] = useState("");
  return (
    <section style={panel}>
      <button type="button" onClick={onBack} style={{ ...ghostBtn, marginBottom: 12 }}>
        ← BACK
      </button>
      <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
        OAUTH RETURN · SET WALLET LOCK
      </div>
      <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 12 }}>
        Social auth succeeded. Choose a lock passphrase — it encrypts your new ETH
        private key in this browser. Code: {code.slice(0, 8)}…
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(passphrase, displayName);
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label style={labelStyle}>
          DISPLAY NAME
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          LOCK PASSPHRASE
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            style={inputStyle}
            required
            minLength={8}
          />
        </label>
        <button type="submit" style={yellowBtn} disabled={busy}>
          {busy ? "MINTING…" : "FINISH + MINT WALLET"}
        </button>
      </form>
    </section>
  );
}

function VaultView({
  account,
  onExport,
  onSignOut,
}: {
  account: KosAccountPublic;
  onExport: () => void;
  onSignOut: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const chunks = chunkAddress(account.walletAddress, 10);

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(account.walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy address:", account.walletAddress);
    }
  };

  return (
    <>
      <section style={{ ...panel, borderColor: "#ffff00", background: "#0a0a00" }}>
        <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
          SESSION · {account.provider.toUpperCase()}
        </div>
        <div style={{ fontSize: 14, letterSpacing: 2, color: "#fff", marginBottom: 4 }}>
          {account.displayName.toUpperCase()}
        </div>
        <div style={{ fontSize: 11, color: "#888" }}>
          {account.handle ? `@${account.handle}` : ""} · {account.email}
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 8, letterSpacing: 1 }}>
          JOINED {account.createdAt.slice(0, 10)}
        </div>
      </section>

      <section style={panel}>
        <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
          WALLET.SYS // ETH
        </div>
        <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 10 }}>
          In-app secp256k1 keypair. Address is public. Private key encrypted until export.
        </p>
        <div style={{ fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 4 }}>
          ADDRESS
        </div>
        {/* Vertical list context → digits horizontal (Slimentologika) */}
        <code
          style={{
            display: "block",
            border: "2px solid #444",
            background: "#000",
            padding: "10px 12px",
            color: "#66ff66",
            fontSize: 12,
            letterSpacing: 1,
            lineHeight: 1.5,
            wordBreak: "break-all",
            fontFamily: "var(--dm-font-primary), monospace",
          }}
        >
          {chunks.map((chunk) => (
            <span key={chunk} style={{ display: "block" }}>
              {chunk}
            </span>
          ))}
        </code>
        <div style={{ fontSize: 10, color: "#555", marginTop: 8, letterSpacing: 1 }}>
          CREATED {account.walletCreatedAt.slice(0, 19).replace("T", " ")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button type="button" style={outlineBtn} onClick={() => void copyAddr()}>
            {copied ? "COPIED" : "COPY ADDRESS"}
          </button>
          <button type="button" style={dangerBtn} onClick={onExport}>
            EXPORT KEY
          </button>
        </div>
      </section>

      <section style={panel}>
        <div style={{ color: "#666", letterSpacing: 2, fontSize: 10, marginBottom: 8 }}>
          SESSION
        </div>
        <button type="button" style={ghostBtn} onClick={onSignOut}>
          SIGN OUT
        </button>
      </section>

      <footer style={{ marginTop: 12, fontSize: 10, color: "#555", letterSpacing: 1 }}>
        ☦ PROVE ALL THINGS · HOLD FAST THAT WHICH IS GOOD
      </footer>
    </>
  );
}

function ExportView({
  account,
  busy,
  onBack,
  onExport,
}: {
  account: KosAccountPublic;
  busy: boolean;
  onBack: () => void;
  onExport: (
    passphrase: string,
  ) => Promise<{ privateKey: string; address: string } | null>;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [key, setKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <section style={{ ...panel, borderColor: "#ff4444" }}>
      <button type="button" onClick={onBack} style={{ ...ghostBtn, marginBottom: 12 }}>
        ← VAULT
      </button>
      <div style={{ color: "#ff6666", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
        KEY.EXPORT // DANGER
      </div>
      <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 12 }}>
        Private key controls funds at {shortAddress(account.walletAddress, 6)}. Export only
        to a secure offline store. Anyone with this key owns the wallet.
      </p>
      {!key ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const r = await onExport(passphrase);
              if (r) {
                setKey(r.privateKey);
                setRevealed(true);
              }
            })();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <label style={labelStyle}>
            CONFIRM PASSPHRASE
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              style={inputStyle}
              required
              minLength={8}
            />
          </label>
          <button type="submit" style={dangerBtn} disabled={busy}>
            {busy ? "…" : "REVEAL PRIVATE KEY"}
          </button>
        </form>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#888", letterSpacing: 2 }}>PRIVATE KEY</span>
            <button
              type="button"
              style={ghostBtn}
              onClick={() => setRevealed((v) => !v)}
            >
              {revealed ? "HIDE" : "SHOW"}
            </button>
          </div>
          <code
            style={{
              display: "block",
              border: "2px solid #ff4444",
              background: "#100000",
              padding: 10,
              color: "#ffaaaa",
              fontSize: 11,
              wordBreak: "break-all",
              fontFamily: "var(--dm-font-primary), monospace",
            }}
          >
            {revealed ? key : "•".repeat(66)}
          </code>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              style={outlineBtn}
              onClick={() => {
                void navigator.clipboard.writeText(key).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? "COPIED" : "COPY KEY"}
            </button>
            <button
              type="button"
              style={ghostBtn}
              onClick={() => {
                setKey(null);
                setPassphrase("");
                setRevealed(false);
              }}
            >
              CLEAR
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default IdentityApp;

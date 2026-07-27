"use client";

/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  ACCOUNT         ║
 *            ╚══════════════════╝
 *
 *   Matrix sign-in + profile editor, styled to match the rest of the OS
 *   chrome. Mounted both as a windowed app (see src/app/page.tsx) and at
 *   the standalone /account route (src/app/account/page.tsx) for direct
 *   links / pre-boot access. See docs/ACCOUNTS_SPEC.md.
 */

import { useEffect, useState, useCallback } from "react";
import { signIn, signOut } from "next-auth/react";
import { SiweMessage } from "siwe";
import { getAddress } from "ethers";
import { safeFetchJson } from "@/lib/safeFetchJson";

interface SessionUser {
  name?: string | null;
  id?: string;
}

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

interface Profile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
}

interface OwnedNft {
  contractAddress: string;
  tokenId: string;
  name: string | null;
  image: string | null;
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: 24,
  background: "#000",
  color: "#fff",
  border: "1px solid #555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  padding: "0 6px",
  marginTop: 3,
  boxSizing: "border-box",
  outline: "none",
};

const label: React.CSSProperties = {
  fontSize: 7,
  color: "#888",
  letterSpacing: 1,
  display: "block",
  marginTop: 10,
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  height: 26,
  marginTop: 14,
  border: "1px solid #fff",
  background: "#fff",
  color: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  height: 22,
  padding: "0 8px",
  border: "1px solid #555",
  background: "#000",
  color: "#ccc",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 7,
  letterSpacing: 1,
  cursor: "pointer",
};

export function AccountApp() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [homeserver, setHomeserver] = useState("https://matrix.org");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [signingInWallet, setSigningInWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [showNftPicker, setShowNftPicker] = useState(false);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [nftError, setNftError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<OwnedNft[]>([]);

  const refreshSession = useCallback(async () => {
    setLoadingSession(true);
    const data = await safeFetchJson<{ user?: SessionUser }>("/api/auth/session");
    setUser(data?.user ?? null);
    setLoadingSession(false);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!user) return;
    safeFetchJson<Profile | null>("/api/profile")
      .then((p) => {
        setProfile(p);
        setDisplayName(p?.display_name ?? "");
        setBio(p?.bio ?? "");
        setAvatarUrl(p?.avatar_url ?? "");
        setIsPublic(p?.is_public ?? false);
      });
  }, [user]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setSignInError(null);
    const res = await signIn("matrix", { homeserver, username, password, redirect: false });
    setSigningIn(false);
    if (res?.error) {
      setSignInError(res.error);
      return;
    }
    await refreshSession();
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    setProfile(null);
    setUser(null);
  }

  async function handleEthereumSignIn() {
    setWalletError(null);
    if (!window.ethereum) {
      setWalletError("No Ethereum wallet found — install MetaMask or a similar browser wallet.");
      return;
    }
    setSigningInWallet(true);
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts[0]) throw new Error("No account returned by wallet.");
      // Wallets don't all return the address in EIP-55 checksum casing (some
      // return all-lowercase or, apparently, all-uppercase) — siwe's parser
      // requires a valid checksum, so normalize it ourselves rather than
      // trusting the wallet's casing.
      const address = getAddress(accounts[0]);

      const chainIdHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      const chainId = parseInt(chainIdHex, 16);

      const nonceRes = await fetch("/api/ethereum/nonce");
      const { nonce } = (await nonceRes.json()) as { nonce: string };

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to K-OS III.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });
      const preparedMessage = siweMessage.prepareMessage();

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [preparedMessage, address],
      })) as string;

      const res = await signIn("ethereum", { message: preparedMessage, signature, redirect: false });
      if (res?.error) {
        setWalletError(res.error);
        return;
      }
      await refreshSession();
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "Wallet sign-in failed.");
    } finally {
      setSigningInWallet(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName, bio, avatar_url: avatarUrl, is_public: isPublic }),
    });
    setSaving(false);
    if (res.ok) {
      const p = (await res.json()) as Profile;
      setProfile(p);
      setSaveMsg("SAVED");
    } else {
      setSaveMsg("FAILED TO SAVE");
    }
    setTimeout(() => setSaveMsg(null), 2500);
  }

  async function openNftPicker() {
    setShowNftPicker(true);
    setLoadingNfts(true);
    setNftError(null);
    const res = await fetch("/api/nfts");
    setLoadingNfts(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setNftError(body.error ?? "Failed to load NFTs.");
      return;
    }
    setNfts((await res.json()) as OwnedNft[]);
  }

  async function pickNftAvatar(nft: OwnedNft) {
    if (!nft.image) return;
    setAvatarUrl(nft.image);
    setShowNftPicker(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: nft.image }),
    });
    if (res.ok) {
      setProfile((await res.json()) as Profile);
      setSaveMsg("AVATAR SET FROM NFT");
      setTimeout(() => setSaveMsg(null), 2500);
    }
  }

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "var(--dm-font-primary)",
        imageRendering: "pixelated",
        padding: 16,
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 320, margin: "0 auto" }}>
        {loadingSession ? (
          <div style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>LOADING…</div>
        ) : !user ? (
          <form onSubmit={handleSignIn}>
            <span style={{ fontSize: 9, color: "#ddd", letterSpacing: 2 }}>SIGN IN WITH MATRIX</span>

            <span style={label}>HOMESERVER</span>
            <input style={field} value={homeserver} onChange={(e) => setHomeserver(e.target.value)} />

            <span style={label}>MATRIX USERNAME</span>
            <input
              style={field}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@you:matrix.org or just 'you'"
            />

            <span style={label}>PASSWORD</span>
            <input style={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <button type="submit" disabled={signingIn} style={primaryBtn}>
              {signingIn ? "SIGNING IN…" : "SIGN IN"}
            </button>
            {signInError && (
              <div style={{ fontSize: 7, color: "#ff6666", marginTop: 8, letterSpacing: 0.5 }}>
                {signInError.toUpperCase()}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, backgroundColor: "#333" }} />
              <span style={{ fontSize: 7, color: "#555", letterSpacing: 1 }}>OR</span>
              <div style={{ flex: 1, height: 1, backgroundColor: "#333" }} />
            </div>

            <button
              type="button"
              onClick={handleEthereumSignIn}
              disabled={signingInWallet}
              style={{ ...primaryBtn, marginTop: 0, background: "#000", color: "#fff", border: "1px solid #555" }}
            >
              {signingInWallet ? "CHECK YOUR WALLET…" : "SIGN IN WITH ETHEREUM"}
            </button>
            {walletError && (
              <div style={{ fontSize: 7, color: "#ff6666", marginTop: 8, letterSpacing: 0.5 }}>
                {walletError.toUpperCase()}
              </div>
            )}
          </form>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 9, color: "#ddd", letterSpacing: 1, wordBreak: "break-all" }}>
                {user.name}
              </span>
              <button onClick={handleSignOut} style={secondaryBtn}>
                SIGN OUT
              </button>
            </div>

            <div style={{ borderTop: "1px solid #333", paddingTop: 10 }}>
              <span style={{ fontSize: 8, color: "#888", letterSpacing: 2 }}>PROFILE</span>
              <form onSubmit={handleSaveProfile}>
                <span style={label}>DISPLAY NAME</span>
                <input style={field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

                <span style={label}>BIO</span>
                <textarea
                  style={{ ...field, height: 60, padding: 6, resize: "vertical" as const }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />

                <span style={label}>AVATAR URL</span>
                <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                  <input
                    style={{ ...field, marginTop: 0, flex: 1 }}
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                  <button type="button" onClick={openNftPicker} style={secondaryBtn}>
                    USE NFT
                  </button>
                </div>
                {avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    style={{ width: 48, height: 48, objectFit: "cover", border: "1px solid #333", marginTop: 6 }}
                  />
                )}

                <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  PUBLIC PROFILE
                </label>

                <button type="submit" disabled={saving} style={primaryBtn}>
                  {saving ? "SAVING…" : "SAVE PROFILE"}
                </button>
                {saveMsg && (
                  <div style={{ fontSize: 7, color: "#888", marginTop: 6, letterSpacing: 1 }}>{saveMsg}</div>
                )}
              </form>
            </div>
          </>
        )}
      </div>

      {showNftPicker && (
        <div
          onClick={() => setShowNftPicker(false)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 340,
              maxHeight: "80%",
              overflowY: "auto",
              border: "1px solid #555",
              background: "#0a0a0a",
              boxShadow: "3px 3px 0 #000",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "5px 8px",
                borderBottom: "1px solid #333",
                background: "#1a1a1a",
              }}
            >
              <span style={{ fontSize: 8, color: "#ddd", letterSpacing: 1 }}>CHOOSE NFT AVATAR</span>
              <button onClick={() => setShowNftPicker(false)} style={{ ...secondaryBtn, height: 18, padding: "0 6px" }}>
                ×
              </button>
            </div>
            <div style={{ padding: 8 }}>
              {loadingNfts ? (
                <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>LOADING…</div>
              ) : nftError ? (
                <div style={{ fontSize: 7, color: "#ff6666", letterSpacing: 0.5 }}>{nftError.toUpperCase()}</div>
              ) : nfts.length === 0 ? (
                <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>NO NFTS FOUND IN THIS WALLET.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {nfts.map((nft) => (
                    <button
                      key={`${nft.contractAddress}-${nft.tokenId}`}
                      onClick={() => pickNftAvatar(nft)}
                      title={nft.name ?? undefined}
                      style={{
                        border: "1px solid #333",
                        background: "#000",
                        padding: 0,
                        cursor: "pointer",
                        aspectRatio: "1",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={nft.image ?? undefined} alt={nft.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

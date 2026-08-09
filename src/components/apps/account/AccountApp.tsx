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
import {
  discoverEip6963Wallets,
  getWalletConnectProvider,
  type Eip1193Provider,
  type Eip6963Detail,
} from "@/lib/walletProviders";
import { ProfileBlocksEditor } from "@/components/apps/account/ProfileBlocksEditor";

interface SessionUser {
  name?: string | null;
  id?: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
  show_email?: boolean;
  show_ethereum?: boolean;
  show_matrix?: boolean;
  show_ens?: boolean;
  show_install_list?: boolean;
  show_time_stats?: boolean;
  show_badges?: boolean;
  ens_name?: string | null;
}

interface LinkedMethod {
  provider: string;
  providerAccountId: string;
  label: string;
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
  const [signingInWallet, setSigningInWallet] = useState<string | null>(null); // which wallet uuid/"walletconnect", or null
  const [walletError, setWalletError] = useState<string | null>(null);
  const [detectedWallets, setDetectedWallets] = useState<Eip6963Detail[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [availableProviders, setAvailableProviders] = useState<Record<string, { id: string }> | null>(null);
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailName, setEmailName] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    return discoverEip6963Wallets((wallet) => {
      setDetectedWallets((prev) => (prev.some((w) => w.info.uuid === wallet.info.uuid) ? prev : [...prev, wallet]));
    });
  }, []);

  useEffect(() => {
    safeFetchJson<Record<string, { id: string }>>("/api/auth/providers").then(setAvailableProviders);
  }, []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showEthereum, setShowEthereum] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showEns, setShowEns] = useState(false);
  const [showInstallList, setShowInstallList] = useState(false);
  const [showTimeStats, setShowTimeStats] = useState(false);
  const [showBadges, setShowBadges] = useState(true);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensBusy, setEnsBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [linked, setLinked] = useState<LinkedMethod[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [showLinkMatrix, setShowLinkMatrix] = useState(false);
  const [showLinkEmail, setShowLinkEmail] = useState(false);
  const [linkHomeserver, setLinkHomeserver] = useState("https://matrix.org");
  const [linkMatrixUser, setLinkMatrixUser] = useState("");
  const [linkMatrixPass, setLinkMatrixPass] = useState("");
  const [linkEmail, setLinkEmail] = useState("");
  const [linkEmailPass, setLinkEmailPass] = useState("");

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

  const refreshLinked = useCallback(async () => {
    const data = await safeFetchJson<{ methods?: LinkedMethod[] }>("/api/account/linked");
    setLinked(data?.methods ?? []);
  }, []);

  useEffect(() => {
    if (!user) return;
    safeFetchJson<Profile | null>("/api/profile").then((p) => {
      setProfile(p);
      setDisplayName(p?.display_name ?? "");
      setBio(p?.bio ?? "");
      setAvatarUrl(p?.avatar_url ?? "");
      setIsPublic(p?.is_public ?? false);
      setShowEmail(p?.show_email ?? false);
      setShowEthereum(p?.show_ethereum ?? false);
      setShowMatrix(p?.show_matrix ?? false);
      setShowEns(p?.show_ens ?? false);
      setShowInstallList(p?.show_install_list ?? false);
      setShowTimeStats(p?.show_time_stats ?? false);
      setShowBadges(p?.show_badges ?? true);
      setEnsName(p?.ens_name ?? null);
    });
    refreshLinked();
  }, [user, refreshLinked]);

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

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailError(null);

    if (emailMode === "signup") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: emailPassword, name: emailName }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setEmailError(body?.error ?? "Registration failed.");
        setEmailBusy(false);
        return;
      }
    }

    const res = await signIn("email", { email, password: emailPassword, redirect: false });
    setEmailBusy(false);
    if (res?.error) {
      setEmailError(res.error);
      return;
    }
    await refreshSession();
  }

  function handleOAuthSignIn(providerId: string) {
    signIn(providerId);
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    setProfile(null);
    setUser(null);
  }

  /** Shared SIWE flow — works the same regardless of which provider (an
   *  EIP-6963 wallet, or a connected WalletConnect session) supplied it. */
  async function signInWithProvider(provider: Eip1193Provider, key: string) {
    setWalletError(null);
    setSigningInWallet(key);
    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts[0]) throw new Error("No account returned by wallet.");
      // Wallets don't all return the address in EIP-55 checksum casing (some
      // return all-lowercase or, apparently, all-uppercase) — siwe's parser
      // requires a valid checksum, so normalize it ourselves rather than
      // trusting the wallet's casing.
      const address = getAddress(accounts[0]);

      const chainIdHex = (await provider.request({ method: "eth_chainId" })) as string;
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

      const signature = (await provider.request({
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
      setSigningInWallet(null);
    }
  }

  function handleEip6963SignIn(wallet: Eip6963Detail) {
    signInWithProvider(wallet.provider, wallet.info.uuid);
  }

  function handleBrowserWalletSignIn() {
    if (!window.ethereum) {
      setWalletError("No Ethereum wallet found — install MetaMask, Rabby, Rainbow, or use WalletConnect below.");
      return;
    }
    signInWithProvider(window.ethereum, "browser");
  }

  async function handleWalletConnectSignIn() {
    setWalletError(null);
    setSigningInWallet("walletconnect");
    try {
      const provider = await getWalletConnectProvider();
      await provider.connect();
      await signInWithProvider(provider, "walletconnect");
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "WalletConnect failed.");
      setSigningInWallet(null);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        is_public: isPublic,
        show_email: showEmail,
        show_ethereum: showEthereum,
        show_matrix: showMatrix,
        show_ens: showEns,
        show_install_list: showInstallList,
        show_time_stats: showTimeStats,
        show_badges: showBadges,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const p = (await res.json()) as Profile;
      setProfile(p);
      setEnsName(p.ens_name ?? null);
      setSaveMsg("SAVED");
    } else {
      setSaveMsg("FAILED TO SAVE");
    }
    setTimeout(() => setSaveMsg(null), 2500);
  }

  async function refreshEns() {
    setEnsBusy(true);
    setSaveMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_ens: true }),
    });
    setEnsBusy(false);
    if (res.ok) {
      const p = (await res.json()) as Profile;
      setProfile(p);
      setEnsName(p.ens_name ?? null);
      setSaveMsg(p.ens_name ? `ENS: ${p.ens_name}` : "NO ENS FOUND FOR LINKED WALLET");
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setSaveMsg((body?.error ?? "ENS REFRESH FAILED").toUpperCase());
    }
    setTimeout(() => setSaveMsg(null), 3000);
  }

  async function linkEthereumWithProvider(provider: Eip1193Provider) {
    setLinkError(null);
    setLinkBusy(true);
    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts[0]) throw new Error("No account returned by wallet.");
      const address = getAddress(accounts[0]);
      const chainIdHex = (await provider.request({ method: "eth_chainId" })) as string;
      const chainId = parseInt(chainIdHex, 16);
      const nonceRes = await fetch("/api/ethereum/nonce");
      const { nonce } = (await nonceRes.json()) as { nonce: string };
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Link Ethereum wallet to K-OS III account.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });
      const preparedMessage = siweMessage.prepareMessage();
      const signature = (await provider.request({
        method: "personal_sign",
        params: [preparedMessage, address],
      })) as string;
      const res = await fetch("/api/account/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "ethereum", message: preparedMessage, signature }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string; methods?: LinkedMethod[] } | null;
      if (!res.ok) {
        setLinkError(body?.error ?? "Link failed.");
        return;
      }
      setLinked(body?.methods ?? []);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Wallet link failed.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleLinkMatrix(e: React.FormEvent) {
    e.preventDefault();
    setLinkBusy(true);
    setLinkError(null);
    const res = await fetch("/api/account/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "matrix",
        homeserver: linkHomeserver,
        username: linkMatrixUser,
        password: linkMatrixPass,
      }),
    });
    const body = (await res.json().catch(() => null)) as { error?: string; methods?: LinkedMethod[] } | null;
    setLinkBusy(false);
    if (!res.ok) {
      setLinkError(body?.error ?? "Matrix link failed.");
      return;
    }
    setLinked(body?.methods ?? []);
    setShowLinkMatrix(false);
    setLinkMatrixPass("");
  }

  async function handleLinkEmail(e: React.FormEvent) {
    e.preventDefault();
    setLinkBusy(true);
    setLinkError(null);
    const res = await fetch("/api/account/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "email", email: linkEmail, password: linkEmailPass }),
    });
    const body = (await res.json().catch(() => null)) as { error?: string; methods?: LinkedMethod[] } | null;
    setLinkBusy(false);
    if (!res.ok) {
      setLinkError(body?.error ?? "Email link failed.");
      return;
    }
    setLinked(body?.methods ?? []);
    setShowLinkEmail(false);
    setLinkEmailPass("");
  }

  async function handleUnlink(m: LinkedMethod) {
    setLinkError(null);
    const res = await fetch("/api/account/link", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: m.provider, providerAccountId: m.providerAccountId }),
    });
    const body = (await res.json().catch(() => null)) as { error?: string; methods?: LinkedMethod[] } | null;
    if (!res.ok) {
      setLinkError(body?.error ?? "Unlink failed.");
      return;
    }
    setLinked(body?.methods ?? []);
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
          <div>
            <span style={{ fontSize: 9, color: "#ddd", letterSpacing: 2 }}>SIGN IN</span>

            {(availableProviders?.google || availableProviders?.twitter) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {availableProviders?.google && (
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn("google")}
                    style={{ ...primaryBtn, marginTop: 0 }}
                  >
                    CONTINUE WITH GOOGLE
                  </button>
                )}
                {availableProviders?.twitter && (
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn("twitter")}
                    style={{ ...primaryBtn, marginTop: 0, background: "#000", color: "#fff", border: "1px solid #fff" }}
                  >
                    CONTINUE WITH X
                  </button>
                )}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0" }}>
              <div style={{ flex: 1, height: 1, backgroundColor: "#333" }} />
              <span style={{ fontSize: 7, color: "#555", letterSpacing: 1 }}>OR</span>
              <div style={{ flex: 1, height: 1, backgroundColor: "#333" }} />
            </div>

            <form onSubmit={handleEmailSubmit}>
              <span style={label}>EMAIL</span>
              <input style={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

              {emailMode === "signup" && (
                <>
                  <span style={label}>NAME (OPTIONAL)</span>
                  <input style={field} value={emailName} onChange={(e) => setEmailName(e.target.value)} />
                </>
              )}

              <span style={label}>PASSWORD</span>
              <input
                style={field}
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
              />

              <button type="submit" disabled={emailBusy} style={primaryBtn}>
                {emailBusy ? "PLEASE WAIT…" : emailMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN WITH EMAIL"}
              </button>
              {emailError && (
                <div style={{ fontSize: 7, color: "#ff6666", marginTop: 8, letterSpacing: 0.5 }}>
                  {emailError.toUpperCase()}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setEmailMode((m) => (m === "signin" ? "signup" : "signin"));
                  setEmailError(null);
                }}
                style={{ ...secondaryBtn, marginTop: 8, width: "100%", background: "transparent", border: "none", color: "#666" }}
              >
                {emailMode === "signin" ? "NEED AN ACCOUNT? CREATE ONE" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              style={{ ...secondaryBtn, width: "100%", marginTop: 16, background: "transparent" }}
            >
              {showAdvanced ? "▾ HIDE MORE OPTIONS" : "▸ MORE SIGN-IN OPTIONS (MATRIX / WALLET)"}
            </button>

            {showAdvanced && (
              <form onSubmit={handleSignIn} style={{ marginTop: 12, borderTop: "1px solid #333", paddingTop: 12 }}>
                <span style={{ fontSize: 8, color: "#888", letterSpacing: 2 }}>SIGN IN WITH MATRIX</span>

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

                <button type="submit" disabled={signingIn} style={{ ...primaryBtn, background: "#000", color: "#fff", border: "1px solid #555" }}>
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

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {detectedWallets.map((wallet) => (
                    <button
                      key={wallet.info.uuid}
                      type="button"
                      onClick={() => handleEip6963SignIn(wallet)}
                      disabled={signingInWallet !== null}
                      style={{ ...primaryBtn, marginTop: 0, background: "#000", color: "#fff", border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      {wallet.info.icon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={wallet.info.icon} alt="" style={{ width: 14, height: 14 }} />
                      )}
                      {signingInWallet === wallet.info.uuid ? "CHECK YOUR WALLET…" : `${wallet.info.name.toUpperCase()}`}
                    </button>
                  ))}

                  {detectedWallets.length === 0 && (
                    <button
                      type="button"
                      onClick={handleBrowserWalletSignIn}
                      disabled={signingInWallet !== null}
                      style={{ ...primaryBtn, marginTop: 0, background: "#000", color: "#fff", border: "1px solid #555" }}
                    >
                      {signingInWallet === "browser" ? "CHECK YOUR WALLET…" : "BROWSER WALLET"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleWalletConnectSignIn}
                    disabled={signingInWallet !== null}
                    style={{ ...primaryBtn, marginTop: 0, background: "#000", color: "#fff", border: "1px solid #555" }}
                  >
                    {signingInWallet === "walletconnect" ? "CHECK YOUR WALLET…" : "WALLETCONNECT (MOBILE / QR)"}
                  </button>
                </div>
                {walletError && (
                  <div style={{ fontSize: 7, color: "#ff6666", marginTop: 8, letterSpacing: 0.5 }}>
                    {walletError.toUpperCase()}
                  </div>
                )}
              </form>
            )}
          </div>
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

                <div style={{ marginTop: 10, borderTop: "1px solid #222", paddingTop: 8 }}>
                  <span style={{ fontSize: 7, color: "#666", letterSpacing: 1 }}>CONTACT VISIBILITY (PUBLIC)</span>
                  <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />
                    SHOW EMAIL
                  </label>
                  <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={showEthereum} onChange={(e) => setShowEthereum(e.target.checked)} />
                    SHOW ETHEREUM / ENS ADDRESSES
                  </label>
                  <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={showMatrix} onChange={(e) => setShowMatrix(e.target.checked)} />
                    SHOW MATRIX ID
                  </label>
                  <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={showEns} onChange={(e) => setShowEns(e.target.checked)} />
                    SHOW ENS NAME
                  </label>
                  <div style={{ fontSize: 7, color: "#666", marginTop: 6 }}>
                    ENS: {ensName ?? "(none cached)"}
                  </div>
                  <button type="button" style={{ ...secondaryBtn, marginTop: 6 }} disabled={ensBusy} onClick={refreshEns}>
                    {ensBusy ? "RESOLVING…" : "REFRESH ENS FROM WALLET"}
                  </button>
                </div>

                <div style={{ marginTop: 10, borderTop: "1px solid #222", paddingTop: 8 }}>
                  <span style={{ fontSize: 7, color: "#666", letterSpacing: 1 }}>
                    APPS ON PUBLIC PROFILE (FROM APP MANAGER)
                  </span>
                  <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showInstallList}
                      onChange={(e) => setShowInstallList(e.target.checked)}
                    />
                    SHOW INSTALLED APPS
                  </label>
                  <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showTimeStats}
                      onChange={(e) => setShowTimeStats(e.target.checked)}
                    />
                    SHOW TIME SPENT IN APPS
                  </label>
                  <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showBadges}
                      onChange={(e) => setShowBadges(e.target.checked)}
                    />
                    SHOW INSTALL BADGES
                  </label>
                  <div style={{ fontSize: 6, color: "#555", marginTop: 6, lineHeight: 1.4 }}>
                    DATA LIVES LOCALLY UNTIL YOU OPEN APP MANAGER → SYNC TO PROFILE (OR LAUNCH AN APP WHILE SIGNED IN).
                    TIME/INSTALLS DEFAULT PRIVATE.
                  </div>
                </div>

                <button type="submit" disabled={saving} style={primaryBtn}>
                  {saving ? "SAVING…" : "SAVE PROFILE"}
                </button>
                {saveMsg && (
                  <div style={{ fontSize: 7, color: "#888", marginTop: 6, letterSpacing: 1 }}>{saveMsg}</div>
                )}
              </form>
            </div>

            <div style={{ borderTop: "1px solid #333", paddingTop: 10, marginTop: 14 }}>
              <span style={{ fontSize: 8, color: "#888", letterSpacing: 2 }}>CONNECTED IDENTITIES</span>
              <div style={{ fontSize: 6, color: "#555", marginTop: 4, letterSpacing: 0.5, lineHeight: 1.4 }}>
                OPTIONAL. LINK WALLET, MATRIX, OR EMAIL TO THIS ACCOUNT. CHAT RAILS STAY SEPARATE (WALLET/ENS ≠ MATRIX).
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {linked.length === 0 ? (
                  <div style={{ fontSize: 7, color: "#666" }}>NO LINKED METHODS LOADED.</div>
                ) : (
                  linked.map((m) => (
                    <div
                      key={`${m.provider}:${m.providerAccountId}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                        border: "1px solid #333",
                        padding: "4px 6px",
                      }}
                    >
                      <span style={{ fontSize: 7, color: "#ccc", wordBreak: "break-all" }}>
                        {m.provider.toUpperCase()}: {m.label}
                      </span>
                      <button type="button" style={secondaryBtn} onClick={() => handleUnlink(m)}>
                        UNLINK
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                <button
                  type="button"
                  disabled={linkBusy}
                  style={{ ...secondaryBtn, width: "100%" }}
                  onClick={() => {
                    if (detectedWallets[0]) linkEthereumWithProvider(detectedWallets[0].provider);
                    else if (window.ethereum) linkEthereumWithProvider(window.ethereum);
                    else setLinkError("No wallet found — install MetaMask/Rabby or use WalletConnect sign-in first.");
                  }}
                >
                  {linkBusy ? "LINKING…" : "LINK ETHEREUM WALLET"}
                </button>
                <button type="button" style={{ ...secondaryBtn, width: "100%" }} onClick={() => setShowLinkMatrix((v) => !v)}>
                  {showLinkMatrix ? "▾ CANCEL MATRIX LINK" : "▸ LINK MATRIX"}
                </button>
                {showLinkMatrix && (
                  <form onSubmit={handleLinkMatrix}>
                    <span style={label}>HOMESERVER</span>
                    <input style={field} value={linkHomeserver} onChange={(e) => setLinkHomeserver(e.target.value)} />
                    <span style={label}>MATRIX USERNAME</span>
                    <input style={field} value={linkMatrixUser} onChange={(e) => setLinkMatrixUser(e.target.value)} />
                    <span style={label}>PASSWORD</span>
                    <input
                      style={field}
                      type="password"
                      value={linkMatrixPass}
                      onChange={(e) => setLinkMatrixPass(e.target.value)}
                    />
                    <button type="submit" disabled={linkBusy} style={{ ...primaryBtn, marginTop: 8 }}>
                      {linkBusy ? "VERIFYING…" : "VERIFY & LINK MATRIX"}
                    </button>
                  </form>
                )}
                <button type="button" style={{ ...secondaryBtn, width: "100%" }} onClick={() => setShowLinkEmail((v) => !v)}>
                  {showLinkEmail ? "▾ CANCEL EMAIL LINK" : "▸ LINK EMAIL + PASSWORD"}
                </button>
                {showLinkEmail && (
                  <form onSubmit={handleLinkEmail}>
                    <span style={label}>EMAIL</span>
                    <input style={field} type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />
                    <span style={label}>PASSWORD (MIN 8)</span>
                    <input
                      style={field}
                      type="password"
                      value={linkEmailPass}
                      onChange={(e) => setLinkEmailPass(e.target.value)}
                    />
                    <button type="submit" disabled={linkBusy} style={{ ...primaryBtn, marginTop: 8 }}>
                      {linkBusy ? "LINKING…" : "LINK EMAIL"}
                    </button>
                  </form>
                )}
              </div>
              {linkError && (
                <div style={{ fontSize: 7, color: "#ff6666", marginTop: 8, letterSpacing: 0.5 }}>
                  {linkError.toUpperCase()}
                </div>
              )}
            </div>

            {profile && <ProfileBlocksEditor />}
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

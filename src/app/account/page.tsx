"use client";

/*
 *                    ☦
 *        ACCOUNTS — MINIMAL TEST PAGE
 *
 *   Deliberately plain (not yet styled to match the K-OS pixel chrome) —
 *   this exists to prove the Matrix sign-in + profile-editing loop works
 *   end to end before it gets folded into the OS shell as a real app
 *   window. See docs/ACCOUNTS_SPEC.md.
 */

import { useEffect, useState, useCallback } from "react";
import { signIn, signOut } from "next-auth/react";

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
}

export default function AccountPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [homeserver, setHomeserver] = useState("https://matrix.org");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setLoadingSession(true);
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    setUser(data?.user ?? null);
    setLoadingSession(false);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: Profile | null) => {
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
    const res = await signIn("matrix", {
      homeserver,
      username,
      password,
      redirect: false,
    });
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
      }),
    });
    setSaving(false);
    if (res.ok) {
      const p = (await res.json()) as Profile;
      setProfile(p);
      setSaveMsg("Saved.");
    } else {
      setSaveMsg("Failed to save.");
    }
  }

  if (loadingSession) {
    return <main style={{ padding: 24, fontFamily: "monospace" }}>Loading…</main>;
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace", maxWidth: 480 }}>
      <h1>K-OS Account (test)</h1>

      {!user ? (
        <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label>
            Homeserver
            <input value={homeserver} onChange={(e) => setHomeserver(e.target.value)} style={{ display: "block", width: "100%" }} />
          </label>
          <label>
            Matrix username (e.g. @you:matrix.org or just "you")
            <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ display: "block", width: "100%" }} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: "block", width: "100%" }} />
          </label>
          <button type="submit" disabled={signingIn}>
            {signingIn ? "Signing in…" : "Sign in with Matrix"}
          </button>
          {signInError && <p style={{ color: "crimson" }}>{signInError}</p>}
        </form>
      ) : (
        <>
          <p>
            Signed in as <strong>{user.name}</strong> ·{" "}
            <button onClick={handleSignOut}>Sign out</button>
          </p>

          <h2>Profile</h2>
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label>
              Display name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ display: "block", width: "100%" }} />
            </label>
            <label>
              Bio
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ display: "block", width: "100%" }} rows={4} />
            </label>
            <label>
              Avatar URL
              <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} style={{ display: "block", width: "100%" }} />
            </label>
            <label>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Public profile
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
            {saveMsg && <p>{saveMsg}</p>}
          </form>
          {profile && (
            <pre style={{ background: "#eee", padding: 8, marginTop: 16 }}>{JSON.stringify(profile, null, 2)}</pre>
          )}
        </>
      )}
    </main>
  );
}

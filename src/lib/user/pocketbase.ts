/**
 * Optional PocketBase bridge for real GitHub / Google OAuth.
 *
 * When NEXT_PUBLIC_POCKETBASE_URL is set and PocketBase has OAuth apps
 * configured (auth providers github + google), this module can complete
 * an OAuth2 flow and then mint a local encrypted ETH wallet under a
 * lock passphrase the user chooses.
 *
 * Static export (2kool.tv) has no server API routes — PocketBase is the
 * external auth backend. Without it, IDENTITY uses local email + local
 * provider-linked accounts (see accounts.ts).
 *
 * Docs: https://pocketbase.io/docs/authentication/#oauth2-integration
 */

import {
  createProviderAccount,
  pocketBaseUrl,
  type KosAccountPublic,
} from "./accounts";

export type OAuthProvider = "github" | "google";

export function isPocketBaseConfigured(): boolean {
  return Boolean(pocketBaseUrl());
}

/**
 * Start PocketBase OAuth2 via redirect (works from static sites).
 * After redirect back, call finishOAuthFromUrl().
 *
 * Requires PocketBase auth methods enabled for the provider and the
 * app's origin registered as a redirect URL in the OAuth app settings.
 */
export async function startOAuthRedirect(provider: OAuthProvider): Promise<void> {
  const base = pocketBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_POCKETBASE_URL is not set");

  // Request auth methods → get authURL for provider
  const methodsRes = await fetch(
    `${base.replace(/\/$/, "")}/api/collections/users/auth-methods`,
    { credentials: "include" },
  );
  if (!methodsRes.ok) {
    throw new Error(`PocketBase auth-methods failed (${methodsRes.status})`);
  }
  const methods = (await methodsRes.json()) as {
    authProviders?: { name: string; authUrl: string; codeVerifier?: string; state?: string }[];
  };
  const p = methods.authProviders?.find((x) => x.name === provider);
  if (!p?.authUrl) {
    throw new Error(
      `Provider "${provider}" is not enabled on this PocketBase instance`,
    );
  }

  // Persist verifier for the callback page
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      "kos-pb-oauth",
      JSON.stringify({
        provider,
        codeVerifier: p.codeVerifier ?? "",
        redirectUrl: window.location.href.split("#")[0],
      }),
    );
    // PocketBase expects redirect_url query on the auth URL
    const url = new URL(p.authUrl);
    if (!url.searchParams.get("redirect_uri") && !url.searchParams.get("redirect_url")) {
      url.searchParams.set("redirect_url", window.location.href.split("#")[0]);
    }
    window.location.href = url.toString();
  }
}

/**
 * After OAuth redirect, exchange code and create local provider account
 * with wallet. User must supply a lock passphrase for key encryption.
 */
export async function finishOAuthAndMintWallet(input: {
  code: string;
  passphrase: string;
  displayName?: string;
}): Promise<KosAccountPublic> {
  const base = pocketBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_POCKETBASE_URL is not set");

  type OAuthMeta = {
    provider: OAuthProvider;
    codeVerifier: string;
    redirectUrl: string;
  };
  let meta: OAuthMeta | null = null;
  try {
    const raw = window.sessionStorage.getItem("kos-pb-oauth");
    if (raw) meta = JSON.parse(raw) as OAuthMeta;
  } catch {
    meta = null;
  }
  if (!meta) throw new Error("Missing OAuth session — start sign-in again");

  const body = {
    provider: meta.provider,
    code: input.code,
    codeVerifier: meta.codeVerifier,
    redirectUrl: meta.redirectUrl,
  };

  const res = await fetch(
    `${base.replace(/\/$/, "")}/api/collections/users/auth-with-oauth2`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PocketBase OAuth failed: ${t || res.status}`);
  }
  const data = (await res.json()) as {
    record?: { email?: string; name?: string; username?: string; id?: string };
    token?: string;
  };

  const email =
    data.record?.email ||
    `${meta.provider}-${data.record?.id || "user"}@oauth.local`;
  const displayName =
    input.displayName ||
    data.record?.name ||
    data.record?.username ||
    meta.provider;

  window.sessionStorage.removeItem("kos-pb-oauth");

  // Mint local encrypted wallet under user-chosen lock passphrase
  return createProviderAccount({
    provider: meta.provider,
    email,
    passphrase: input.passphrase,
    displayName,
    handle: data.record?.username || displayName,
  });
}

export function readOAuthCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
}

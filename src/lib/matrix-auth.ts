/*
 *                    ☦
 *        ACCOUNTS — MATRIX LOGIN
 *
 *   Verifies a username/password directly against a Matrix homeserver's
 *   client-server API (https://spec.matrix.org/latest/client-server-api/#login).
 *   No homeserver of our own is required for this — any existing Matrix
 *   account (matrix.org or a self-hosted homeserver) can sign in to K-OS.
 *   Standing up a K-OS-run homeserver is a later, separate step (see
 *   docs/ACCOUNTS_SPEC.md).
 */

export interface MatrixLoginResult {
  userId: string; // "@name:homeserver.tld"
  accessToken: string;
  deviceId: string;
  homeserver: string;
}

export class MatrixLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatrixLoginError";
  }
}

/** Normalize a user-entered homeserver URL: default scheme, strip trailing slash. */
function normalizeHomeserver(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!trimmed) throw new MatrixLoginError("Homeserver URL is required.");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function matrixLogin(
  homeserverInput: string,
  username: string,
  password: string,
): Promise<MatrixLoginResult> {
  const homeserver = normalizeHomeserver(homeserverInput);

  let res: Response;
  try {
    res = await fetch(`${homeserver}/_matrix/client/v3/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "m.login.password",
        identifier: { type: "m.id.user", user: username },
        password,
        initial_device_display_name: "K-OS III",
      }),
    });
  } catch {
    throw new MatrixLoginError(`Could not reach homeserver "${homeserver}".`);
  }

  if (!res.ok) {
    let errMsg = `Matrix login failed (HTTP ${res.status}).`;
    try {
      const body = (await res.json()) as { error?: string; errcode?: string };
      if (body.error) errMsg = body.error;
    } catch {
      // ignore — non-JSON error body
    }
    throw new MatrixLoginError(errMsg);
  }

  const data = (await res.json()) as {
    user_id?: string;
    access_token?: string;
    device_id?: string;
  };
  if (!data.user_id || !data.access_token || !data.device_id) {
    throw new MatrixLoginError("Homeserver returned an unexpected login response.");
  }

  return {
    userId: data.user_id,
    accessToken: data.access_token,
    deviceId: data.device_id,
    homeserver,
  };
}

/**
 * Verify a Matrix username/password without keeping a live credential
 * afterward. K-OS only needs proof of identity, not an ongoing ability to
 * act as the user on Matrix — so the access token this mints is logged out
 * (revoked) immediately after confirming login succeeded, and only the
 * verified user ID is returned.
 */
export async function matrixVerifyIdentity(
  homeserverInput: string,
  username: string,
  password: string,
): Promise<string> {
  const result = await matrixLogin(homeserverInput, username, password);
  try {
    await fetch(`${result.homeserver}/_matrix/client/v3/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${result.accessToken}` },
    });
  } catch {
    // Best-effort revoke — the token still expires on its own, and we never
    // persist or use it, so a failed logout call here isn't a security hole,
    // just a slightly longer-lived unused token on the homeserver's side.
  }
  return result.userId;
}

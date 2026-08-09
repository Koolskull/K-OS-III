/*
 *                    ☦
 *        MATRIX — LIGHTWEIGHT C-S CLIENT (chat rail only)
 *
 *   Uses Matrix Client-Server HTTP API directly so we do not pull the full
 *   matrix-js-sdk into the Next bundle for v1. Identity sign-in (Account app)
 *   still discards tokens; K-CHAT stores tokens in localStorage for this rail.
 *
 *   Text messages + room list. Honest E2EE badge when m.room.encryption is set
 *   (crypto device verification deferred — use Element for full E2EE setup).
 */

const STORAGE_KEY = "kos-kchat-matrix-v1";

export interface MatrixSession {
  homeserver: string;
  userId: string;
  accessToken: string;
  deviceId: string;
}

export interface MatrixRoomSummary {
  roomId: string;
  name: string;
  isDm: boolean;
  isGroup: boolean;
  avatarUrl: string | null;
  encrypted: boolean;
  lastPreview: string | null;
}

export interface MatrixTextMessage {
  id: string;
  roomId: string;
  sender: string;
  body: string;
  ts: number;
  encrypted: boolean;
}

function normalizeHomeserver(input: string): string {
  const t = input.trim().replace(/\/+$/, "");
  if (!t) throw new Error("Homeserver required");
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export function loadMatrixSession(): MatrixSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MatrixSession;
  } catch {
    return null;
  }
}

export function saveMatrixSession(s: MatrixSession | null) {
  if (typeof window === "undefined") return;
  if (!s) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export async function matrixLogin(
  homeserverInput: string,
  username: string,
  password: string,
): Promise<MatrixSession> {
  const homeserver = normalizeHomeserver(homeserverInput);
  let user = username.trim();
  if (!user.startsWith("@")) {
    const host = new URL(homeserver).hostname;
    user = `@${user}:${host}`;
  }
  const res = await fetch(`${homeserver}/_matrix/client/v3/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "m.login.password",
      identifier: { type: "m.id.user", user },
      password,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string; errcode?: string } | null;
    throw new Error(err?.error ?? `Matrix login failed (${res.status})`);
  }
  const data = (await res.json()) as {
    user_id: string;
    access_token: string;
    device_id: string;
    home_server?: string;
  };
  const session: MatrixSession = {
    homeserver,
    userId: data.user_id,
    accessToken: data.access_token,
    deviceId: data.device_id,
  };
  saveMatrixSession(session);
  return session;
}

export async function matrixLogout(session: MatrixSession): Promise<void> {
  try {
    await fetch(`${session.homeserver}/_matrix/client/v3/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  } catch {
    /* ignore */
  }
  saveMatrixSession(null);
}

function mxcToHttp(homeserver: string, mxc: string | undefined | null): string | null {
  if (!mxc || !mxc.startsWith("mxc://")) return null;
  const rest = mxc.slice("mxc://".length);
  return `${homeserver}/_matrix/media/v3/thumbnail/${rest}?width=48&height=48&method=crop`;
}

export async function matrixSyncRooms(session: MatrixSession): Promise<MatrixRoomSummary[]> {
  const url = new URL(`${session.homeserver}/_matrix/client/v3/sync`);
  url.searchParams.set("timeout", "0");
  url.searchParams.set("filter", JSON.stringify({ room: { timeline: { limit: 1 } } }));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!res.ok) throw new Error(`Matrix sync failed (${res.status})`);
  const data = (await res.json()) as {
    rooms?: {
      join?: Record<
        string,
        {
          state?: { events?: Array<{ type: string; content: Record<string, unknown> }> };
          timeline?: {
            events?: Array<{ type: string; sender?: string; content?: Record<string, unknown> }>;
          };
          summary?: { "m.heroes"?: string[]; "m.joined_member_count"?: number };
        }
      >;
    };
  };

  const rooms: MatrixRoomSummary[] = [];
  const joined = data.rooms?.join ?? {};
  for (const [roomId, room] of Object.entries(joined)) {
    const stateEvents = room.state?.events ?? [];
    let name: string | null = null;
    let avatarMxc: string | null = null;
    let encrypted = false;
    for (const ev of stateEvents) {
      if (ev.type === "m.room.name" && typeof ev.content.name === "string") name = ev.content.name;
      if (ev.type === "m.room.avatar" && typeof ev.content.url === "string") avatarMxc = ev.content.url;
      if (ev.type === "m.room.encryption") encrypted = true;
    }
    const memberCount = room.summary?.["m.joined_member_count"] ?? 0;
    const heroes = room.summary?.["m.heroes"] ?? [];
    const isDm = !name && memberCount <= 2;
    if (!name) {
      name = isDm ? heroes[0] ?? roomId : roomId;
    }
    const lastEv = [...(room.timeline?.events ?? [])].reverse().find((e) => e.type === "m.room.message");
    const lastPreview =
      lastEv && typeof lastEv.content?.body === "string" ? lastEv.content.body : null;

    rooms.push({
      roomId,
      name,
      isDm,
      isGroup: !isDm,
      avatarUrl: mxcToHttp(session.homeserver, avatarMxc),
      encrypted,
      lastPreview,
    });
  }
  return rooms.sort((a, b) => a.name.localeCompare(b.name));
}

export async function matrixRoomMessages(
  session: MatrixSession,
  roomId: string,
  limit = 50,
): Promise<MatrixTextMessage[]> {
  const url = `${session.homeserver}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages?dir=b&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!res.ok) throw new Error(`Matrix messages failed (${res.status})`);
  const data = (await res.json()) as {
    chunk?: Array<{
      event_id: string;
      sender: string;
      origin_server_ts: number;
      type: string;
      content: { body?: string; msgtype?: string };
    }>;
  };
  const encrypted = false; // timeline events may be encrypted blobs without crypto module
  const msgs = (data.chunk ?? [])
    .filter((e) => e.type === "m.room.message" && e.content.msgtype === "m.text")
    .map((e) => ({
      id: e.event_id,
      roomId,
      sender: e.sender,
      body: e.content.body ?? "",
      ts: e.origin_server_ts,
      encrypted,
    }));
  return msgs.reverse();
}

export async function matrixSendText(
  session: MatrixSession,
  roomId: string,
  body: string,
): Promise<string> {
  const txn = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const res = await fetch(
    `${session.homeserver}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ msgtype: "m.text", body }),
    },
  );
  if (!res.ok) throw new Error(`Send failed (${res.status})`);
  const data = (await res.json()) as { event_id: string };
  return data.event_id;
}

/** Find or create a DM with another Matrix user. */
export async function matrixOpenDm(session: MatrixSession, otherUserId: string): Promise<string> {
  const res = await fetch(`${session.homeserver}/_matrix/client/v3/createRoom`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      is_direct: true,
      preset: "trusted_private_chat",
      invite: [otherUserId],
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `Create DM failed (${res.status})`);
  }
  const data = (await res.json()) as { room_id: string };
  return data.room_id;
}

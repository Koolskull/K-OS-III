"use client";

/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  K-CHAT          ║
 *            ╚══════════════════╝
 *
 *   Collapsible left list (DMs vs groups, PFPs).
 *   Filters: ALL | FAVORITES | MATRIX | ENS | SERVER (48h text).
 *   Rails never blend encryption stories.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadMatrixSession,
  matrixLogin,
  matrixLogout,
  matrixOpenDm,
  matrixRoomMessages,
  matrixSendText,
  matrixSyncRooms,
  type MatrixRoomSummary,
  type MatrixSession,
  type MatrixTextMessage,
} from "@/lib/chat/matrix-client";
import {
  appendLocalWalletMessage,
  loadFavorites,
  loadLocalWalletDms,
  openLocalWalletDm,
  resolvePeerHandle,
  toggleFavorite,
  tryCreateXmtpClient,
  type WalletConversation,
} from "@/lib/chat/wallet-messaging";
import { discoverEip6963Wallets, type Eip1193Provider } from "@/lib/walletProviders";
import { safeFetchJson } from "@/lib/safeFetchJson";

export interface KChatLaunchOpts {
  rail?: "wallet" | "matrix" | "server";
  peerHandle?: string;
  peerUserId?: number;
}

type FilterId = "all" | "favorites" | "matrix" | "ens" | "server";
type ActiveChat =
  | { kind: "matrix"; room: MatrixRoomSummary }
  | { kind: "wallet"; conv: WalletConversation }
  | { kind: "server"; threadId: number; title: string; isGroup: boolean };

interface ServerThread {
  id: number;
  kind: string;
  title: string | null;
  last_body: string | null;
}

interface ServerMessage {
  id: number;
  sender_id: number;
  body: string;
  created_at: string;
  expires_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
}

const mono: React.CSSProperties = {
  fontFamily: "var(--dm-font-primary)",
  imageRendering: "pixelated" as const,
};

export function KChatApp({ launch }: { launch?: KChatLaunchOpts }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Matrix
  const [mxSession, setMxSession] = useState<MatrixSession | null>(null);
  const [mxRooms, setMxRooms] = useState<MatrixRoomSummary[]>([]);
  const [mxMsgs, setMxMsgs] = useState<MatrixTextMessage[]>([]);
  const [mxHomeserver, setMxHomeserver] = useState("https://matrix.org");
  const [mxUser, setMxUser] = useState("");
  const [mxPass, setMxPass] = useState("");
  const [mxBusy, setMxBusy] = useState(false);

  // Wallet / ENS
  const [walletConvs, setWalletConvs] = useState<WalletConversation[]>([]);
  const [walletProvider, setWalletProvider] = useState<Eip1193Provider | null>(null);
  const [myAddress, setMyAddress] = useState<string | null>(null);
  const [xmtpReady, setXmtpReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [xmtp, setXmtp] = useState<any>(null);

  // Server ephemeral
  const [serverThreads, setServerThreads] = useState<ServerThread[]>([]);
  const [serverMsgs, setServerMsgs] = useState<ServerMessage[]>([]);

  const [active, setActive] = useState<ActiveChat | null>(null);
  const [peerInput, setPeerInput] = useState(launch?.peerHandle ?? "");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setFavorites(loadFavorites());
    setWalletConvs(loadLocalWalletDms());
    const s = loadMatrixSession();
    if (s) setMxSession(s);
    const stop = discoverEip6963Wallets((w) => {
      setWalletProvider((prev) => prev ?? w.provider);
    });
    return stop;
  }, []);

  useEffect(() => {
    if (launch?.peerHandle) setPeerInput(launch.peerHandle);
  }, [launch?.peerHandle]);

  const refreshMatrix = useCallback(async (session: MatrixSession) => {
    const rooms = await matrixSyncRooms(session);
    setMxRooms(rooms);
  }, []);

  useEffect(() => {
    if (!mxSession) return;
    refreshMatrix(mxSession).catch((e) => setError(e instanceof Error ? e.message : "Matrix sync failed"));
  }, [mxSession, refreshMatrix]);

  const refreshServer = useCallback(async () => {
    const data = await safeFetchJson<{ threads: ServerThread[] }>("/api/chat/ephemeral/threads");
    setServerThreads(data?.threads ?? []);
  }, []);

  useEffect(() => {
    refreshServer();
  }, [refreshServer]);

  async function connectMatrix(e: React.FormEvent) {
    e.preventDefault();
    setMxBusy(true);
    setError(null);
    try {
      const s = await matrixLogin(mxHomeserver, mxUser, mxPass);
      setMxSession(s);
      setMxPass("");
      await refreshMatrix(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matrix login failed");
    } finally {
      setMxBusy(false);
    }
  }

  async function disconnectMatrix() {
    if (mxSession) await matrixLogout(mxSession);
    setMxSession(null);
    setMxRooms([]);
    setMxMsgs([]);
    if (active?.kind === "matrix") setActive(null);
  }

  async function connectWallet() {
    setError(null);
    try {
      const provider = walletProvider ?? window.ethereum;
      if (!provider) throw new Error("No wallet found");
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      setMyAddress(accounts[0] ?? null);
      setWalletProvider(provider);
      const client = await tryCreateXmtpClient(provider);
      if (client) {
        setXmtp(client);
        setXmtpReady(true);
      } else {
        setXmtpReady(false);
        setError("XMTP SDK not installed — wallet DMs use local cache only until @xmtp/browser-sdk is added.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connect failed");
    }
  }

  async function openPeer() {
    setError(null);
    const handle = peerInput.trim();
    if (!handle) return;

    if (handle.startsWith("@") && handle.includes(":")) {
      if (!mxSession) {
        setError("Connect Matrix first to open a Matrix DM.");
        setFilter("matrix");
        return;
      }
      try {
        const roomId = await matrixOpenDm(mxSession, handle);
        await refreshMatrix(mxSession);
        const room = mxRooms.find((r) => r.roomId === roomId) ?? {
          roomId,
          name: handle,
          isDm: true,
          isGroup: false,
          avatarUrl: null,
          encrypted: false,
          lastPreview: null,
        };
        setActive({ kind: "matrix", room });
        const msgs = await matrixRoomMessages(mxSession, roomId);
        setMxMsgs(msgs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Open Matrix DM failed");
      }
      return;
    }

    // Wallet / ENS
    try {
      const { address, ens } = await resolvePeerHandle(handle);
      const conv = openLocalWalletDm(address, ens);
      setWalletConvs(loadLocalWalletDms());
      setActive({ kind: "wallet", conv });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resolve failed");
    }
  }

  async function selectMatrixRoom(room: MatrixRoomSummary) {
    if (!mxSession) return;
    setActive({ kind: "matrix", room });
    setError(null);
    try {
      setMxMsgs(await matrixRoomMessages(mxSession, room.roomId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load messages failed");
    }
  }

  async function selectServerThread(t: ServerThread) {
    setActive({
      kind: "server",
      threadId: t.id,
      title: t.title || (t.kind === "group" ? "GROUP" : "DM"),
      isGroup: t.kind === "group",
    });
    const data = await safeFetchJson<{ messages: ServerMessage[] }>(
      `/api/chat/ephemeral/threads/${t.id}/messages`,
    );
    setServerMsgs(data?.messages ?? []);
  }

  async function send() {
    if (!draft.trim() || !active) return;
    setError(null);
    const body = draft.trim();
    try {
      if (active.kind === "matrix" && mxSession) {
        await matrixSendText(mxSession, active.room.roomId, body);
        setMxMsgs(await matrixRoomMessages(mxSession, active.room.roomId));
      } else if (active.kind === "wallet") {
        let encrypted = false;
        if (xmtp && xmtpReady) {
          await xmtp.send(active.conv.peerAddress, body);
          encrypted = true;
        }
        const from = myAddress ?? "me";
        const conv = appendLocalWalletMessage(active.conv.peerAddress, from, body, encrypted);
        setWalletConvs(loadLocalWalletDms());
        setActive({ kind: "wallet", conv });
      } else if (active.kind === "server") {
        const res = await fetch(`/api/chat/ephemeral/threads/${active.threadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (!res.ok) {
          const b = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(b?.error ?? "Send failed");
        }
        const data = await safeFetchJson<{ messages: ServerMessage[] }>(
          `/api/chat/ephemeral/threads/${active.threadId}/messages`,
        );
        setServerMsgs(data?.messages ?? []);
        await refreshServer();
      }
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    }
  }

  const favId = (id: string) => favorites.includes(id);

  const filteredMatrixDms = useMemo(() => {
    let rooms = mxRooms.filter((r) => r.isDm);
    if (filter === "favorites") rooms = rooms.filter((r) => favId(`mx:${r.roomId}`));
    if (filter === "matrix" || filter === "all" || filter === "favorites") return rooms;
    return filter === "ens" || filter === "server" ? [] : rooms;
  }, [mxRooms, filter, favorites]);

  const filteredMatrixGroups = useMemo(() => {
    let rooms = mxRooms.filter((r) => r.isGroup);
    if (filter === "favorites") rooms = rooms.filter((r) => favId(`mx:${r.roomId}`));
    if (filter === "matrix" || filter === "all" || filter === "favorites") return rooms;
    return [];
  }, [mxRooms, filter, favorites]);

  const filteredWallet = useMemo(() => {
    let list = walletConvs;
    if (filter === "favorites") list = list.filter((c) => favId(`ens:${c.peerAddress}`));
    if (filter === "ens" || filter === "all" || filter === "favorites") return list;
    return [];
  }, [walletConvs, filter, favorites]);

  const filteredServer = useMemo(() => {
    if (filter === "ens" || filter === "matrix") return [];
    if (filter === "favorites") {
      return serverThreads.filter((t) => favId(`srv:${t.id}`));
    }
    return serverThreads;
  }, [serverThreads, filter, favorites]);

  const filters: { id: FilterId; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "favorites", label: "★" },
    { id: "matrix", label: "MATRIX" },
    { id: "ens", label: "ENS" },
    { id: "server", label: "48H" },
  ];

  return (
    <div className="w-full h-full flex" style={{ ...mono, background: "#000", color: "#fff" }}>
      {/* Collapsible left rail */}
      <div
        style={{
          width: sidebarOpen ? 200 : 0,
          minWidth: sidebarOpen ? 200 : 0,
          borderRight: sidebarOpen ? "1px solid #333" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.15s",
          background: "#0a0a0a",
        }}
      >
        {sidebarOpen && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: 4, borderBottom: "1px solid #222" }}>
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  style={{
                    fontSize: 6,
                    letterSpacing: 0.5,
                    padding: "2px 4px",
                    border: "1px solid #555",
                    background: filter === f.id ? "#fff" : "#000",
                    color: filter === f.id ? "#000" : "#aaa",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto" style={{ padding: 4 }}>
              {(filter === "all" || filter === "matrix" || filter === "favorites") && (
                <>
                  <Section label="MATRIX DMS" />
                  {filteredMatrixDms.map((r) => (
                    <ChatRow
                      key={r.roomId}
                      title={r.name}
                      preview={r.lastPreview}
                      avatar={r.avatarUrl}
                      badge={r.encrypted ? "E2EE?" : "MX"}
                      fav={favId(`mx:${r.roomId}`)}
                      onFav={() => setFavorites(toggleFavorite(`mx:${r.roomId}`))}
                      onClick={() => selectMatrixRoom(r)}
                      active={active?.kind === "matrix" && active.room.roomId === r.roomId}
                    />
                  ))}
                  <Section label="MATRIX GROUPS" />
                  {filteredMatrixGroups.map((r) => (
                    <ChatRow
                      key={r.roomId}
                      title={r.name}
                      preview={r.lastPreview}
                      avatar={r.avatarUrl}
                      badge="GRP"
                      fav={favId(`mx:${r.roomId}`)}
                      onFav={() => setFavorites(toggleFavorite(`mx:${r.roomId}`))}
                      onClick={() => selectMatrixRoom(r)}
                      active={active?.kind === "matrix" && active.room.roomId === r.roomId}
                    />
                  ))}
                </>
              )}
              {(filter === "all" || filter === "ens" || filter === "favorites") && (
                <>
                  <Section label="ENS / WALLET DMS" />
                  {filteredWallet.map((c) => (
                    <ChatRow
                      key={c.peerAddress}
                      title={c.peer}
                      preview={c.messages[c.messages.length - 1]?.body}
                      avatar={null}
                      badge={xmtpReady ? "XMTP" : "LOC"}
                      fav={favId(`ens:${c.peerAddress}`)}
                      onFav={() => setFavorites(toggleFavorite(`ens:${c.peerAddress}`))}
                      onClick={() => setActive({ kind: "wallet", conv: c })}
                      active={active?.kind === "wallet" && active.conv.peerAddress === c.peerAddress}
                    />
                  ))}
                </>
              )}
              {(filter === "all" || filter === "server" || filter === "favorites") && (
                <>
                  <Section label="SERVER 48H (TEXT)" />
                  {filteredServer.map((t) => (
                    <ChatRow
                      key={t.id}
                      title={t.title || (t.kind === "group" ? "GROUP" : `NOTE #${t.id}`)}
                      preview={t.last_body}
                      avatar={null}
                      badge={t.kind === "group" ? "GRP" : "48H"}
                      fav={favId(`srv:${t.id}`)}
                      onFav={() => setFavorites(toggleFavorite(`srv:${t.id}`))}
                      onClick={() => selectServerThread(t)}
                      active={active?.kind === "server" && active.threadId === t.id}
                    />
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderBottom: "1px solid #333",
            background: "#0a0a0a",
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Hide chat list" : "Show chat list"}
            style={iconBtn}
          >
            {sidebarOpen ? "«" : "»"}
          </button>
          <span style={{ fontSize: 8, letterSpacing: 1, color: "#888", flex: 1 }}>
            K-CHAT · MATRIX ≠ ENS/XMTP ≠ 48H SERVER
          </span>
          {!mxSession ? (
            <span style={{ fontSize: 6, color: "#666" }}>MX OFF</span>
          ) : (
            <button type="button" style={iconBtn} onClick={disconnectMatrix}>
              MX OUT
            </button>
          )}
          <button type="button" style={iconBtn} onClick={connectWallet}>
            {myAddress ? "WALLET ON" : "WALLET"}
          </button>
        </div>

        {!mxSession && (filter === "matrix" || filter === "all") && (
          <form onSubmit={connectMatrix} style={{ padding: 8, borderBottom: "1px solid #222", display: "flex", flexWrap: "wrap", gap: 4 }}>
            <input style={inp} value={mxHomeserver} onChange={(e) => setMxHomeserver(e.target.value)} placeholder="homeserver" />
            <input style={inp} value={mxUser} onChange={(e) => setMxUser(e.target.value)} placeholder="@user:server" />
            <input style={inp} type="password" value={mxPass} onChange={(e) => setMxPass(e.target.value)} placeholder="password" />
            <button type="submit" disabled={mxBusy} style={btn}>
              {mxBusy ? "…" : "CONNECT MATRIX"}
            </button>
          </form>
        )}

        <div style={{ display: "flex", gap: 4, padding: 8, borderBottom: "1px solid #222" }}>
          <input
            style={{ ...inp, flex: 1 }}
            value={peerInput}
            onChange={(e) => setPeerInput(e.target.value)}
            placeholder="@user:matrix.org  OR  name.eth  OR  0x…"
          />
          <button type="button" style={btn} onClick={openPeer}>
            OPEN
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: 10 }}>
          {!active && (
            <div style={{ fontSize: 8, color: "#555", letterSpacing: 1, lineHeight: 1.6 }}>
              LEFT RAIL: DMS + GROUPS WITH PFPS. HIDE WITH «.
              <br />
              FILTERS: FAVORITES · MATRIX · ENS · 48H SERVER NOTES (TEXT ONLY, AUTO-DELETE).
              <br />
              NO IMAGE/VIDEO ON SERVER NOTES. MATRIX + XMTP STAY OFF THIS SERVER.
              <br />
              X CHAT API: DEFERRED (COMPLEX / COST) — NOT IN V1.
            </div>
          )}

          {active?.kind === "matrix" && (
            <>
              <Header
                title={active.room.name}
                sub={`${active.room.isGroup ? "GROUP" : "DM"} · MATRIX${active.room.encrypted ? " · ROOM MARKS ENCRYPTION (USE ELEMENT TO VERIFY DEVICES)" : " · NOT E2EE"}`}
              />
              {mxMsgs.map((m) => (
                <Bubble key={m.id} who={m.sender} body={m.body} />
              ))}
            </>
          )}

          {active?.kind === "wallet" && (
            <>
              <Header
                title={active.conv.peer}
                sub={
                  xmtpReady
                    ? "ENS/WALLET · XMTP ENCRYPTED · NOT MATRIX"
                    : "ENS/WALLET · LOCAL CACHE ONLY (INSTALL @xmtp/browser-sdk FOR NETWORK E2EE)"
                }
              />
              {active.conv.messages.map((m) => (
                <Bubble
                  key={m.id}
                  who={m.from}
                  body={m.body}
                  tag={m.encrypted ? "XMTP" : "LOCAL"}
                />
              ))}
            </>
          )}

          {active?.kind === "server" && (
            <>
              <Header
                title={active.title}
                sub={`${active.isGroup ? "GROUP" : "DM"} · SERVER TEXT · AUTO-DELETE 48H · NO MEDIA`}
              />
              {serverMsgs.map((m) => (
                <Bubble key={m.id} who={m.sender_name ?? String(m.sender_id)} body={m.body} tag="48H" />
              ))}
            </>
          )}

          {error && (
            <div style={{ fontSize: 7, color: "#ff6666", marginTop: 8, letterSpacing: 0.5 }}>{error.toUpperCase()}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, padding: 8, borderTop: "1px solid #333", background: "#0a0a0a" }}>
          <input
            style={{ ...inp, flex: 1 }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={active ? "TEXT ONLY…" : "SELECT A CHAT"}
            disabled={!active}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="button" style={{ ...btn, opacity: active ? 1 : 0.4 }} disabled={!active} onClick={send}>
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 6, color: "#555", letterSpacing: 1, margin: "8px 0 4px" }}>{label}</div>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, letterSpacing: 1 }}>{title}</div>
      <div style={{ fontSize: 6, color: "#666", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Bubble({ who, body, tag }: { who: string; body: string; tag?: string }) {
  return (
    <div style={{ marginBottom: 8, borderLeft: "2px solid #333", paddingLeft: 6 }}>
      <div style={{ fontSize: 6, color: "#666" }}>
        {who}
        {tag ? ` · ${tag}` : ""}
      </div>
      <div style={{ fontSize: 8, color: "#ddd", whiteSpace: "pre-wrap", marginTop: 2 }}>{body}</div>
    </div>
  );
}

function ChatRow({
  title,
  preview,
  avatar,
  badge,
  fav,
  onFav,
  onClick,
  active,
}: {
  title: string;
  preview?: string | null;
  avatar: string | null;
  badge: string;
  fav: boolean;
  onFav: () => void;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        alignItems: "center",
        padding: 4,
        marginBottom: 2,
        border: active ? "1px solid #fff" : "1px solid #222",
        background: active ? "#111" : "#000",
        cursor: "pointer",
      }}
    >
      <button type="button" onClick={onClick} style={{ display: "flex", gap: 4, alignItems: "center", flex: 1, background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: "inherit" }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" style={{ width: 20, height: 20, objectFit: "cover", border: "1px solid #333" }} />
        ) : (
          <div style={{ width: 20, height: 20, border: "1px solid #333", background: "#1a1a1a", flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 7, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </div>
          {preview && (
            <div style={{ fontSize: 6, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {preview}
            </div>
          )}
        </div>
        <span style={{ fontSize: 5, color: "#666", letterSpacing: 0.5 }}>{badge}</span>
      </button>
      <button type="button" onClick={onFav} style={{ ...iconBtn, border: "none", color: fav ? "#ffcc00" : "#444" }} title="Favorite">
        ★
      </button>
    </div>
  );
}

const inp: React.CSSProperties = {
  height: 22,
  background: "#000",
  color: "#fff",
  border: "1px solid #555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  padding: "0 6px",
  outline: "none",
  boxSizing: "border-box",
};

const btn: React.CSSProperties = {
  height: 22,
  padding: "0 8px",
  border: "1px solid #fff",
  background: "#fff",
  color: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 7,
  letterSpacing: 1,
  cursor: "pointer",
};

const iconBtn: React.CSSProperties = {
  height: 20,
  padding: "0 6px",
  border: "1px solid #555",
  background: "#000",
  color: "#ccc",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 7,
  cursor: "pointer",
};

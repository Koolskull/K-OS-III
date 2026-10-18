"use client";

/*
 *                    ☦
 *      APP MANAGER — installable package browser
 *
 *  Phase A: local installs only. PocketBase sync later.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  availableCatalog,
  isDesktopApp,
  type AppId,
  type AppPackage,
  isCoreApp,
} from "@/lib/apps/catalog";
import {
  getInstall,
  installApp,
  isInstalled,
  loadInstallState,
  subscribeInstalls,
  uninstallApp,
  type InstallStoreState,
} from "@/lib/apps/installStore";
import { listEarnedBadges } from "@/lib/apps/badges";
import { formatDuration, getUsageMs, loadUsage, subscribeUsage } from "@/lib/apps/usageClock";
import { syncActivityToAccount } from "@/lib/apps/activitySync";

type Filter = "all" | "installed" | "available";

export interface AppManagerAppProps {
  /** Highlight a package (e.g. user tried to launch uninstalled app) */
  highlightAppId?: string | null;
  onOpenApp?: (appId: string) => void;
}

export function AppManagerApp({ highlightAppId, onOpenApp }: AppManagerAppProps) {
  const [state, setState] = useState<InstallStoreState>({ version: 1, installs: {} });
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [badges, setBadges] = useState(listEarnedBadges());
  const [usageTick, setUsageTick] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    setState(loadInstallState());
    setBadges(listEarnedBadges());
    setUsageTick((n) => n + 1);
  }, []);

  useEffect(() => {
    refresh();
    const unsubI = subscribeInstalls(refresh);
    const unsubU = subscribeUsage(refresh);
    return () => {
      unsubI();
      unsubU();
    };
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const catalog = useMemo(() => availableCatalog().filter(isDesktopApp), []);

  const rows = useMemo(() => {
    return catalog.filter((pkg) => {
      const installed = isInstalled(pkg.id, state);
      if (filter === "installed") return installed;
      if (filter === "available") return !installed && pkg.tier !== "core";
      return true;
    });
  }, [catalog, filter, state]);

  const onInstall = (id: AppId) => {
    const { newBadgeTitle } = installApp(id);
    refresh();
    setToast(newBadgeTitle ? `Installed · Badge: ${newBadgeTitle}` : "Installed");
  };

  const onUninstall = (id: AppId) => {
    if (isCoreApp(id)) return;
    uninstallApp(id);
    refresh();
    setToast("Removed from desktop");
  };

  return (
    <div style={root}>
      <header style={header}>
        <div>
          <div style={{ color: "#00ff00", letterSpacing: 2, fontSize: 14 }}>APP MANAGER</div>
          <div style={{ color: "#888", fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
            INSTALL · BADGES · TIME SPENT · SYNC TO PROFILE WHEN LOGGED IN
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {(["all", "installed", "available"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                ...chip,
                borderColor: filter === f ? "#00ff00" : "#444",
                color: filter === f ? "#00ff00" : "#aaa",
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              const ok = await syncActivityToAccount();
              setSyncing(false);
              setToast(
                ok
                  ? "Synced installs / badges / time → account profile"
                  : "Sync failed (sign in on a Node host?)",
              );
            }}
            style={{
              ...chip,
              borderColor: "#448844",
              color: "#88ff88",
            }}
          >
            {syncing ? "SYNC…" : "SYNC TO PROFILE"}
          </button>
        </div>
      </header>

      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={body}>
        <div style={grid}>
          {rows.map((pkg) => (
            <PackageCard
              key={pkg.id + String(usageTick)}
              pkg={pkg}
              installed={isInstalled(pkg.id, state)}
              highlight={highlightAppId === pkg.id}
              installRec={getInstall(pkg.id, state)}
              timeMs={getUsageMs(pkg.id)}
              onInstall={() => onInstall(pkg.id)}
              onUninstall={() => onUninstall(pkg.id)}
              onOpen={() => onOpenApp?.(pkg.id)}
            />
          ))}
        </div>

        <aside style={side}>
          <div style={sideTitle}>BADGES ({badges.length})</div>
          {badges.length === 0 ? (
            <p style={{ color: "#666", fontSize: 11, lineHeight: 1.5 }}>
              Install apps to earn badges. SYNC TO PROFILE when logged in so they can show publicly.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {badges
                .slice()
                .reverse()
                .map((b) => (
                  <li key={b.id + String(b.earnedAt)} style={badgeRow}>
                    <div style={{ color: "#00ff00", fontSize: 11 }}>{b.title}</div>
                    <div style={{ color: "#666", fontSize: 9, marginTop: 2 }}>{b.description}</div>
                  </li>
                ))}
            </ul>
          )}
          <div style={{ ...sideTitle, marginTop: 16 }}>TIME (LOCAL)</div>
          <p style={{ color: "#666", fontSize: 10, lineHeight: 1.45 }}>
            Focused window time. Private until you enable “show time stats” on ACCOUNT and sync.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
            {Object.entries(loadUsage().totals)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([id, ms]) => (
                <li key={id} style={{ color: "#888", fontSize: 10, marginBottom: 4 }}>
                  {id} · {formatDuration(ms)}
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function PackageCard({
  pkg,
  installed,
  highlight,
  installRec,
  timeMs,
  onInstall,
  onUninstall,
  onOpen,
}: {
  pkg: AppPackage;
  installed: boolean;
  highlight: boolean;
  installRec?: { openCount: number; versionInstalled: string };
  timeMs: number;
  onInstall: () => void;
  onUninstall: () => void;
  onOpen: () => void;
}) {
  const core = pkg.tier === "core";
  return (
    <div
      style={{
        ...card,
        borderColor: highlight ? "#00ff00" : installed ? "#335533" : "#333",
        boxShadow: highlight ? "0 0 0 1px #00ff00" : undefined,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={glyphBox}>{pkg.glyph}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontSize: 12, letterSpacing: 1 }}>{pkg.label}</div>
          <div style={{ color: "#666", fontSize: 9, marginTop: 2 }}>
            v{pkg.version}
            {core ? " · CORE" : installed ? " · INSTALLED" : " · AVAILABLE"}
            {pkg.requiresCloud ? " · CLOUD" : ""}
          </div>
        </div>
      </div>
      <p style={{ color: "#aaa", fontSize: 11, lineHeight: 1.45, margin: "10px 0" }}>
        {pkg.description}
      </p>
      {(installRec || timeMs > 0) && (
        <div style={{ color: "#555", fontSize: 9, marginBottom: 8, letterSpacing: 1 }}>
          {installRec ? `OPENS ${installRec.openCount} · PKG ${installRec.versionInstalled}` : ""}
          {timeMs > 0 ? `${installRec ? " · " : ""}TIME ${formatDuration(timeMs)}` : ""}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {installed ? (
          <>
            <button type="button" onClick={onOpen} style={btnPrimary}>
              OPEN
            </button>
            {!core && (
              <button type="button" onClick={onUninstall} style={btnGhost}>
                UNINSTALL
              </button>
            )}
          </>
        ) : (
          <button type="button" onClick={onInstall} style={btnPrimary}>
            INSTALL
          </button>
        )}
      </div>
    </div>
  );
}

const root: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary), monospace",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  imageRendering: "pixelated",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  borderBottom: "2px solid #fff",
  flexShrink: 0,
};

const chip: React.CSSProperties = {
  background: "#000",
  border: "1px solid #444",
  fontFamily: "inherit",
  fontSize: 9,
  letterSpacing: 1,
  padding: "4px 8px",
  cursor: "pointer",
};

const toastStyle: React.CSSProperties = {
  margin: "8px 14px 0",
  padding: "8px 10px",
  border: "1px solid #448844",
  color: "#88ff88",
  fontSize: 11,
  letterSpacing: 1,
};

const body: React.CSSProperties = {
  flex: 1,
  display: "flex",
  minHeight: 0,
  overflow: "hidden",
};

const grid: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 10,
  alignContent: "start",
};

const side: React.CSSProperties = {
  width: 200,
  flexShrink: 0,
  borderLeft: "1px solid #222",
  padding: 12,
  overflowY: "auto",
  background: "#0a0a0a",
};

const sideTitle: React.CSSProperties = {
  color: "#888",
  fontSize: 10,
  letterSpacing: 1,
  marginBottom: 10,
  borderBottom: "1px solid #222",
  paddingBottom: 4,
};

const badgeRow: React.CSSProperties = {
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: "1px solid #1a1a1a",
};

const card: React.CSSProperties = {
  border: "1px solid #333",
  background: "#0c0c0c",
  padding: 12,
};

const glyphBox: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "1px solid #444",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  flexShrink: 0,
};

const btnPrimary: React.CSSProperties = {
  background: "#000",
  border: "1px solid #00ff00",
  color: "#00ff00",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  padding: "6px 10px",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  background: "#000",
  border: "1px solid #555",
  color: "#aaa",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  padding: "6px 10px",
  cursor: "pointer",
};

export default AppManagerApp;

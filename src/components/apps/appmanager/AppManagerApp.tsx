/*
 *                    ☦
 *            ╔═══════════════════╗
 *            ║  APP MANAGER      ║
 *            ╚═══════════════════╝
 *
 *   Install / uninstall / update versioned desktop packages.
 *   Catalog lives in src/lib/apps/catalog.ts — see docs/APP_MANAGER.md.
 */

"use client";

import React, { useMemo, useState } from "react";
import { APP_CATALOG, SHELL_VERSION, getAppPackage } from "@/lib/apps/catalog";
import { hasUpdate, isInstalled, useAppInstalls } from "@/lib/apps/installs";
import type { AppId, AppPackage } from "@/lib/apps/types";
import { HAS_BACKEND } from "@/lib/buildFlags";

type Filter = "all" | "installed" | "available" | "updates";

const mono: React.CSSProperties = {
  fontFamily: "var(--dm-font-primary)",
  imageRendering: "pixelated",
};

function Card({
  pkg,
  installed,
  updateAvailable,
  onInstall,
  onUninstall,
  onUpdate,
  onOpen,
  onOpenDocs,
}: {
  pkg: AppPackage;
  installed: boolean;
  updateAvailable: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onUpdate: () => void;
  onOpen: () => void;
  onOpenDocs: () => void;
}) {
  const blocked = Boolean(pkg.requiresCloud && !HAS_BACKEND);
  const core = pkg.tier === "core";

  return (
    <div
      style={{
        ...mono,
        border: "1px solid #333",
        background: "#0a0a0a",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 160,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "1px solid #555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
            background: "#000",
          }}
        >
          {pkg.glyph}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: 1, color: "#fff" }}>{pkg.name}</div>
          <div style={{ fontSize: 7, color: "#888", marginTop: 2, letterSpacing: 0.5 }}>
            v{pkg.version}
            {core ? " · CORE" : ""}
            {pkg.requiresCloud ? " · CLOUD" : ""}
            {updateAvailable ? " · UPDATE" : ""}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 8, color: "#aaa", lineHeight: 1.45, flex: 1 }}>{pkg.description}</div>

      {pkg.docsPath && (
        <button
          type="button"
          onClick={onOpenDocs}
          style={{
            ...btn,
            border: "1px solid #333",
            color: "#888",
            textAlign: "left",
          }}
          title={pkg.docsPath}
        >
          DOCS · {pkg.docsPath.replace(/^docs\//, "")}
        </button>
      )}

      {blocked && (
        <div style={{ fontSize: 7, color: "#a80", letterSpacing: 0.5 }}>
          NEEDS NODE HOST (/api) — USE app.2kool.tv OR LOCAL DEV
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {installed && !core && (
          <button type="button" onClick={onOpen} style={{ ...btn, borderColor: "#fff", color: "#fff" }}>
            OPEN
          </button>
        )}
        {core && (
          <button type="button" onClick={onOpen} style={{ ...btn, borderColor: "#fff", color: "#fff" }}>
            OPEN
          </button>
        )}
        {!installed && !core && (
          <button
            type="button"
            disabled={blocked}
            onClick={onInstall}
            style={{
              ...btn,
              borderColor: blocked ? "#333" : "#fff",
              background: blocked ? "#111" : "#fff",
              color: blocked ? "#555" : "#000",
              cursor: blocked ? "not-allowed" : "pointer",
            }}
          >
            INSTALL
          </button>
        )}
        {installed && !core && updateAvailable && (
          <button type="button" onClick={onUpdate} style={{ ...btn, borderColor: "#ff0", color: "#ff0" }}>
            UPDATE
          </button>
        )}
        {installed && !core && (
          <button type="button" onClick={onUninstall} style={{ ...btn, borderColor: "#555", color: "#888" }}>
            UNINSTALL
          </button>
        )}
        {core && (
          <span style={{ fontSize: 7, color: "#555", alignSelf: "center", letterSpacing: 1 }}>CANNOT UNINSTALL</span>
        )}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
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

export function AppManagerApp({
  onLaunchApp,
  onOpenManual,
}: {
  onLaunchApp?: (appId: string) => void;
  onOpenManual?: (slug?: string) => void;
}) {
  const { store, install, uninstall, applyUpdate } = useAppInstalls();
  const [filter, setFilter] = useState<Filter>("all");
  const [docsOpen, setDocsOpen] = useState<AppPackage | null>(null);

  const packages = useMemo(() => {
    return APP_CATALOG.filter((pkg) => {
      if (pkg.requiresCloud && !HAS_BACKEND && filter === "available") {
        /* still list but mark blocked */
      }
      const installed = isInstalled(pkg.id, store);
      const upd = hasUpdate(pkg.id);
      if (filter === "installed") return installed;
      if (filter === "available") return !installed && pkg.tier !== "core";
      if (filter === "updates") return installed && upd;
      return true;
    });
  }, [filter, store]);

  return (
    <div
      style={{
        ...mono,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        color: "#fff",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #222",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2 }}>APP MANAGER</div>
          <div style={{ fontSize: 7, color: "#666", marginTop: 3, letterSpacing: 0.5 }}>
            SHELL {SHELL_VERSION} · INSTALL TO PIN ON DESKTOP · EACH PACKAGE HAS ITS OWN VERSION + DOCS
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "installed", "available", "updates"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                ...btn,
                borderColor: filter === f ? "#fff" : "#333",
                color: filter === f ? "#fff" : "#888",
                textTransform: "uppercase",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 10,
          alignContent: "start",
        }}
      >
        {packages.map((pkg) => {
          const installed = isInstalled(pkg.id, store);
          const upd = hasUpdate(pkg.id);
          return (
            <Card
              key={pkg.id}
              pkg={pkg}
              installed={installed}
              updateAvailable={upd}
              onInstall={() => install(pkg.id)}
              onUninstall={() => uninstall(pkg.id)}
              onUpdate={() => applyUpdate(pkg.id)}
              onOpen={() => onLaunchApp?.(pkg.id)}
              onOpenDocs={() => {
                if (pkg.manualSlug && onOpenManual) {
                  onOpenManual(pkg.manualSlug);
                  return;
                }
                setDocsOpen(pkg);
              }}
            />
          );
        })}
        {packages.length === 0 && (
          <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>NO PACKAGES IN THIS FILTER</div>
        )}
      </div>

      {docsOpen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            padding: 16,
          }}
          onClick={() => setDocsOpen(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...mono,
              width: "min(480px, 100%)",
              border: "1px solid #555",
              background: "#0a0a0a",
              padding: 16,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>
              {docsOpen.glyph} {docsOpen.name} · v{docsOpen.version}
            </div>
            <div style={{ fontSize: 8, color: "#aaa", lineHeight: 1.5, marginBottom: 12 }}>
              {docsOpen.description}
            </div>
            <div style={{ fontSize: 7, color: "#888", letterSpacing: 0.5, marginBottom: 6 }}>
              DOCUMENTATION PATH
            </div>
            <code
              style={{
                display: "block",
                fontSize: 8,
                color: "#ff0",
                background: "#000",
                border: "1px solid #333",
                padding: 8,
                marginBottom: 12,
                wordBreak: "break-all",
              }}
            >
              {docsOpen.docsPath ?? "(no package doc path — open MANUAL)"}
            </code>
            <div style={{ fontSize: 7, color: "#666", lineHeight: 1.45, marginBottom: 12 }}>
              Full markdown lives in the repo. In-OS MANUAL covers interactive guides where wired.
              Package versions update independently of the shell when we bump catalog entries.
            </div>
            <button type="button" onClick={() => setDocsOpen(null)} style={{ ...btn, borderColor: "#fff" }}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function getPackageForDocs(id: string): AppPackage | undefined {
  return getAppPackage(id as AppId);
}

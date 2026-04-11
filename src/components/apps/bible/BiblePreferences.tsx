/*
 *        ☦
 *   ╔══════════════════╗
 *   ║ BIBLE SETTINGS   ║
 *   ╚══════════════════╝
 *
 *   Translation selection, font, data export/import,
 *   and study file management.
 *   Arrow keys to navigate, Q+Left/Right to change values.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { BiblePrefs } from "@/types/bible";

const AVAILABLE_FONTS = [
  "kongtext",
  "courier-pixel",
  "sometype-mono",
  "hina-mincho",
  "remilia-mincho",
  "akshar",
  "akshar-contrast",
  "alphazet",
  "atwriter",
  "ccsuperhuman",
  "coralpixels",
  "freshid-condensed",
  "geet",
  "jacquard24",
  "jacquard24-charted",
  "jazzypixel",
  "jersey15",
  "jersey25",
  "jvmiyopro",
  "kirana",
  "larase",
  "micro5",
  "micro5-charted",
  "rolliv",
  "shoutspace",
  "source-sans-pro",
  "speedpxwatch",
  "star-rust",
  "tipo-movin-cdmx",
  "type-right",
  "wmxyosupa",
];

interface SettingRow {
  id: string;
  label: string;
  type: "select" | "toggle" | "action" | "info";
  options?: string[];
  getValue?: () => string;
  onAction?: () => void;
}

interface BiblePreferencesProps {
  onExport: () => void;
  onImport: () => void;
  onClearData: () => void;
  noteCount: number;
  highlightCount: number;
  prefs: BiblePrefs;
  onPrefsChange: (prefs: BiblePrefs) => void;
}

export function BiblePreferences({
  onExport,
  onImport,
  onClearData,
  noteCount,
  highlightCount,
  prefs,
  onPrefsChange,
}: BiblePreferencesProps) {
  const [cursor, setCursor] = useState(0);

  const rows: SettingRow[] = [
    {
      id: "version",
      label: "VERSION",
      type: "info",
      getValue: () => "KJV",
    },
    {
      id: "font",
      label: "FONT",
      type: "select",
      options: AVAILABLE_FONTS,
      getValue: () => prefs.font,
    },
    {
      id: "fontsize",
      label: "FONT SIZE",
      type: "select",
      getValue: () => `${prefs.fontSize}PX`,
    },
    {
      id: "autosave",
      label: "AUTO SAVE",
      type: "toggle",
      getValue: () => (prefs.autoSave ? "ON" : "OFF"),
    },
    {
      id: "notes-count",
      label: "NOTES",
      type: "info",
      getValue: () => String(noteCount),
    },
    {
      id: "highlights-count",
      label: "HIGHLIGHTS",
      type: "info",
      getValue: () => String(highlightCount),
    },
    {
      id: "export",
      label: "EXPORT",
      type: "action",
      getValue: () => "DOWNLOAD .STUDY.JSON",
      onAction: onExport,
    },
    {
      id: "import",
      label: "IMPORT",
      type: "action",
      getValue: () => "LOAD .STUDY.JSON",
      onAction: onImport,
    },
    {
      id: "clear",
      label: "CLEAR ALL",
      type: "action",
      getValue: () => "ERASE ALL NOTES & HIGHLIGHTS",
      onAction: onClearData,
    },
  ];

  const changeValue = useCallback(
    (dir: -1 | 1) => {
      const row = rows[cursor];
      if (!row) return;

      if (row.id === "font") {
        const idx = AVAILABLE_FONTS.indexOf(prefs.font);
        const next = (idx + dir + AVAILABLE_FONTS.length) % AVAILABLE_FONTS.length;
        onPrefsChange({ ...prefs, font: AVAILABLE_FONTS[next] });
      } else if (row.id === "fontsize") {
        const next = Math.max(6, Math.min(24, prefs.fontSize + dir));
        onPrefsChange({ ...prefs, fontSize: next });
      } else if (row.id === "autosave") {
        onPrefsChange({ ...prefs, autoSave: !prefs.autoSave });
      }
    },
    [cursor, prefs, onPrefsChange, rows],
  );

  const [qHeld, setQHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" || (e.shiftKey && e.code === "KeyQ")) return;
      // Shift+arrows = screen nav, let parent handle
      if (e.shiftKey) return;

      // Track Q held state
      if (e.code === "KeyQ") {
        setQHeld(true);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      let handled = true;

      if (qHeld) {
        // Q + right/up = increase, Q + left/down = decrease
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          changeValue(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          changeValue(-1);
        } else {
          handled = false;
        }
      } else {
        switch (e.key) {
          case "ArrowUp":
            setCursor((c) => Math.max(0, c - 1));
            break;
          case "ArrowDown":
            setCursor((c) => Math.min(rows.length - 1, c + 1));
            break;
          case "w":
          case "W":
          case "Enter": {
            const row = rows[cursor];
            if (row?.type === "action" && row.onAction) {
              row.onAction();
            } else if (row?.id === "autosave") {
              onPrefsChange({ ...prefs, autoSave: !prefs.autoSave });
            }
            break;
          }
          default:
            handled = false;
        }
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyQ") {
        setQHeld(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [cursor, rows.length, changeValue, prefs, onPrefsChange, qHeld]);

  const getSectionFor = (id: string): string | null => {
    if (id === "version" || id === "font" || id === "fontsize" || id === "autosave") return "SETTINGS";
    if (id === "notes-count" || id === "highlights-count") return "STUDY DATA";
    if (id === "export" || id === "import" || id === "clear") return "FILE";
    return null;
  };

  let lastSection = "";

  return (
    <div
      className="h-full flex flex-col select-none overflow-y-auto p-2"
      style={{
        fontSize: "inherit",
        imageRendering: "pixelated",
      }}
    >
      {rows.map((row, i) => {
        const isCursor = i === cursor;
        const section = getSectionFor(row.id);
        const showSection = section && section !== lastSection;
        if (section) lastSection = section;
        const value = row.getValue?.() ?? "";
        const isEditable = row.type === "select" || row.type === "toggle";
        const isAction = row.type === "action";

        return (
          <React.Fragment key={row.id}>
            {showSection && (
              <div
                className="border-b mb-1 pb-0.5"
                style={{
                  borderColor: "#ffffff",
                  fontSize: "0.9em",
                  letterSpacing: "2px",
                  color: "#ffffff",
                  marginTop: i > 0 ? "8px" : "0",
                }}
              >
                {section}
              </div>
            )}
            <div
              className="flex items-center justify-between py-1 px-1 cursor-pointer"
              style={{
                backgroundColor: isCursor ? "#0a0a0a" : "transparent",
                borderLeft: isCursor ? "3px solid #ffffff" : "3px solid transparent",
                paddingLeft: "6px",
              }}
              onClick={() => {
                setCursor(i);
                if (isAction && row.onAction) row.onAction();
              }}
            >
              <span
                style={{
                  color: isCursor ? "#ffffff" : "#555555",
                  fontSize: "0.9em",
                  letterSpacing: "1px",
                }}
              >
                {row.label}
              </span>

              <div className="flex items-center gap-1">
                {isEditable && isCursor && (
                  <span style={{ color: "#555555", fontSize: "0.7em" }}>◄ Q</span>
                )}
                <span
                  style={{
                    color: isCursor
                      ? isAction
                        ? row.id === "clear"
                          ? "#8B0000"
                          : "#ffffff"
                        : "#ffffff"
                      : "#333333",
                    fontSize: "0.9em",
                    letterSpacing: "1px",
                    fontFamily: row.id === "font" ? `'${value}', monospace` : undefined,
                  }}
                >
                  {value.toUpperCase()}
                </span>
                {isEditable && isCursor && (
                  <span style={{ color: "#555555", fontSize: "0.7em" }}>Q ►</span>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <div
        className="px-1 py-1 mt-3"
        style={{ fontSize: "0.7em", color: "#333333", lineHeight: "12px" }}
      >
        UP/DN:SELECT  Q+ARROW:CHANGE VALUE  W:CONFIRM ACTION
      </div>
    </div>
  );
}

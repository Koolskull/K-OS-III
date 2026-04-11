/*
 *              ☦
 *       ╔═════════════════╗
 *       ║  ST. ISIDORE    ║
 *       ║  Patron of the  ║
 *       ║  Internet &     ║
 *       ║  Configurations ║
 *       ╚═════════════════╝
 *
 *   PREFERENCES SCREEN
 *   System configuration: display scaling,
 *   MIDI devices, audio interfaces,
 *   VSTs, sample settings, master output.
 *
 *   Navigation:
 *     Up/Down arrows = move cursor between rows
 *     Q + Right/Up   = increase / next value
 *     Q + Left/Down  = decrease / prev value
 *     W/Enter        = confirm action rows
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

export type ScalePreset = "auto" | "tiny" | "1x" | "2x" | "3x" | "4x";

export interface PreferencesData {
  displayScale: ScalePreset;
  font: string;
  fontSize: number;
  defaultSampleRate: number;
  defaultBitDepth: number;
  defaultFileFormat: string;
  masterVolume: number;
}

const SCALE_VALUES: ScalePreset[] = ["auto", "tiny", "1x", "2x", "3x", "4x"];
const SCALE_DESCS: Record<ScalePreset, string> = {
  auto: "DETECT FROM SCREEN SIZE",
  tiny: "MIYOO MINI / HANDHELDS",
  "1x": "BASE / TABLETS",
  "2x": "1080P DESKTOPS",
  "3x": "1440P / ULTRAWIDE",
  "4x": "4K DISPLAYS",
};

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

const SAMPLE_RATES = [22050, 44100, 48000, 96000];
const BIT_DEPTHS = [8, 16, 24];
const FILE_FORMATS = ["WAV", "AIFF", "RAW"];

interface SettingRow {
  id: string;
  label: string;
  section?: string;
  type: "select" | "numeric" | "info";
  getValue: () => string;
  onChange?: (dir: 1 | -1) => void;
  displayFont?: string;
}

interface PreferencesProps {
  preferences: PreferencesData;
  onPreferencesChange: (prefs: PreferencesData) => void;
}

export function Preferences({ preferences, onPreferencesChange }: PreferencesProps) {
  const [cursor, setCursor] = useState(0);
  const [midiInputs, setMidiInputs] = useState<string[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<string[]>([]);
  const [qHeld, setQHeld] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const update = useCallback(
    (partial: Partial<PreferencesData>) => {
      onPreferencesChange({ ...preferences, ...partial });
    },
    [preferences, onPreferencesChange],
  );

  // Enumerate MIDI devices
  useEffect(() => {
    if (typeof navigator !== "undefined" && "requestMIDIAccess" in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      nav.requestMIDIAccess()
        .then((access: any) => {
          const inputs: string[] = [];
          access.inputs.forEach((input: any) => {
            inputs.push(input.name || `MIDI IN ${inputs.length}`);
          });
          setMidiInputs(inputs);
        })
        .catch(() => setMidiInputs([]));
    }
  }, []);

  // Enumerate audio output devices
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const outputs = devices
          .filter((d) => d.kind === "audiooutput")
          .map((d) => d.label || `OUTPUT ${d.deviceId.slice(0, 6)}`);
        setAudioOutputs(outputs);
      }).catch(() => setAudioOutputs([]));
    }
  }, []);

  const cycleArray = <T,>(arr: T[], current: T, dir: 1 | -1): T => {
    const idx = arr.indexOf(current);
    return arr[(idx + dir + arr.length) % arr.length];
  };

  const rows: SettingRow[] = [
    {
      id: "scale",
      label: "SCALE",
      section: "DISPLAY",
      type: "select",
      getValue: () => {
        const v = preferences.displayScale.toUpperCase();
        const desc = SCALE_DESCS[preferences.displayScale];
        return `${v}  ${desc}`;
      },
      onChange: (dir) => update({ displayScale: cycleArray(SCALE_VALUES, preferences.displayScale, dir) }),
    },
    {
      id: "font",
      label: "FONT",
      type: "select",
      getValue: () => preferences.font.toUpperCase(),
      onChange: (dir) => update({ font: cycleArray(AVAILABLE_FONTS, preferences.font, dir) }),
      displayFont: preferences.font,
    },
    {
      id: "fontSize",
      label: "FONT SIZE",
      type: "numeric",
      getValue: () => `${preferences.fontSize}PX`,
      onChange: (dir) => update({ fontSize: Math.max(6, Math.min(24, preferences.fontSize + dir)) }),
    },
    {
      id: "masterVol",
      label: "MASTER VOL",
      section: "AUDIO",
      type: "numeric",
      getValue: () => String(preferences.masterVolume),
      onChange: (dir) => update({ masterVolume: Math.max(0, Math.min(127, preferences.masterVolume + dir * 8)) }),
    },
    {
      id: "audioOut",
      label: "AUDIO OUT",
      type: "info",
      getValue: () => audioOutputs.length ? audioOutputs[0] : "DEFAULT",
    },
    ...(midiInputs.length > 0
      ? midiInputs.map((name, i): SettingRow => ({
          id: `midi-${i}`,
          label: `MIDI IN ${i}`,
          section: i === 0 ? "MIDI" : undefined,
          type: "info",
          getValue: () => name,
        }))
      : [{
          id: "midi-none",
          label: "MIDI",
          section: "MIDI",
          type: "info" as const,
          getValue: () => "NO DEVICES DETECTED",
        }]
    ),
    {
      id: "vst",
      label: "VST",
      section: "VST",
      type: "info",
      getValue: () => "NO PLUGINS LOADED",
    },
    {
      id: "sampleRate",
      label: "SAMPLE RATE",
      section: "SAMPLE DEFAULTS",
      type: "select",
      getValue: () => {
        const r = preferences.defaultSampleRate;
        return r >= 1000 ? `${r / 1000}K` : String(r);
      },
      onChange: (dir) => update({ defaultSampleRate: cycleArray(SAMPLE_RATES, preferences.defaultSampleRate, dir) }),
    },
    {
      id: "bitDepth",
      label: "BIT DEPTH",
      type: "select",
      getValue: () => `${preferences.defaultBitDepth}BIT`,
      onChange: (dir) => update({ defaultBitDepth: cycleArray(BIT_DEPTHS, preferences.defaultBitDepth, dir) }),
    },
    {
      id: "fileFormat",
      label: "FILE FORMAT",
      type: "select",
      getValue: () => preferences.defaultFileFormat,
      onChange: (dir) => update({ defaultFileFormat: cycleArray(FILE_FORMATS, preferences.defaultFileFormat, dir) }),
    },
  ];

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Track Q held state
      if (e.code === "KeyQ") {
        setQHeld(true);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Shift+arrows = screen nav, let parent handle
      if (e.shiftKey) return;

      let handled = true;

      if (qHeld) {
        // Q + arrows = change value (right/up = increase, left/down = decrease)
        const row = rows[cursor];
        if (row?.onChange) {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            row.onChange(1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            row.onChange(-1);
          } else {
            handled = false;
          }
        } else {
          handled = false;
        }
      } else {
        // Plain arrows = cursor movement
        switch (e.key) {
          case "ArrowUp":
            setCursor((c) => Math.max(0, c - 1));
            break;
          case "ArrowDown":
            setCursor((c) => Math.min(rows.length - 1, c + 1));
            break;
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
  }, [cursor, qHeld, rows]);

  let lastSection = "";

  return (
    <div
      ref={containerRef}
      className="select-none p-2 h-full overflow-y-auto"
      style={{
        fontFamily: "var(--dm-font-primary)",
        fontSize: "10px",
        imageRendering: "pixelated",
      }}
    >
      {rows.map((row, i) => {
        const isCursor = i === cursor;
        const section = row.section;
        const showSection = section && section !== lastSection;
        if (section) lastSection = section;
        const value = row.getValue();
        const isEditable = !!row.onChange;

        return (
          <React.Fragment key={row.id}>
            {showSection && (
              <div
                className="border-b mb-1 pb-0.5"
                style={{
                  borderColor: "#ffffff",
                  fontSize: "9px",
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
              onClick={() => setCursor(i)}
            >
              <span
                style={{
                  color: isCursor ? "#ffffff" : "#555555",
                  fontSize: "9px",
                  letterSpacing: "1px",
                }}
              >
                {row.label}
              </span>

              <div className="flex items-center gap-1">
                {isEditable && isCursor && (
                  <span style={{ color: "#555555", fontSize: "7px" }}>◄ Q</span>
                )}
                <span
                  style={{
                    color: isCursor ? "#ffffff" : "#333333",
                    fontSize: "9px",
                    letterSpacing: "1px",
                    fontFamily: row.displayFont ? `'${row.displayFont}', monospace` : undefined,
                  }}
                >
                  {value}
                </span>
                {isEditable && isCursor && (
                  <span style={{ color: "#555555", fontSize: "7px" }}>Q ►</span>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <div
        className="px-1 py-1 mt-3"
        style={{ fontSize: "7px", color: "#333333", lineHeight: "12px" }}
      >
        UP/DN:SELECT  Q+ARROW:CHANGE VALUE
      </div>
    </div>
  );
}

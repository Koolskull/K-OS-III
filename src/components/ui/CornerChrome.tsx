/*
 *            ☦
 *      ╔══════════════════════════╗
 *      ║  CORNER CHROME           ║
 *      ║  Mobile Creative UI      ║
 *      ╚══════════════════════════╝
 *
 *   Reusable corner-collapsible panels + vertical zen hide
 *   for Sprite Editor, Tilemap, and future creative tools.
 *   Spec: docs/MOBILE_CREATIVE_UI.md
 *
 *   No rounded corners. Pixel font. Hard edges only.
 */

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface CornerChromeContextValue {
  /** All non-canvas chrome hidden (zen / full-canvas mode) */
  uiHidden: boolean;
  setUiHidden: (v: boolean) => void;
  toggleUiHidden: () => void;
  /** Which panel is currently expanded (null = none) */
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  /** True when viewport is narrow enough to prefer corner mode */
  isNarrow: boolean;
}

const CornerChromeContext = createContext<CornerChromeContextValue | null>(null);

export function useCornerChrome() {
  const ctx = useContext(CornerChromeContext);
  if (!ctx) {
    throw new Error("useCornerChrome must be used inside <CornerHost>");
  }
  return ctx;
}

/** Optional safe version that returns null outside a host (for mixed layouts). */
export function useCornerChromeOptional() {
  return useContext(CornerChromeContext);
}

export function useIsNarrow(breakpoint = 720) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return narrow;
}

const AFFORDANCE: React.CSSProperties = {
  position: "absolute",
  zIndex: 40,
  width: 36,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#000000",
  color: "#888888",
  border: "1px solid #555555",
  fontFamily: "var(--dm-font-primary), monospace",
  fontSize: 8,
  letterSpacing: 1,
  cursor: "pointer",
  userSelect: "none",
  touchAction: "manipulation",
  imageRendering: "pixelated",
};

const AFFORDANCE_ACTIVE: React.CSSProperties = {
  ...AFFORDANCE,
  backgroundColor: "#ffffff",
  color: "#000000",
  borderColor: "#ffffff",
};

const PANEL_SHELL: React.CSSProperties = {
  position: "absolute",
  zIndex: 35,
  backgroundColor: "#000000",
  border: "1px solid #333333",
  color: "#ffffff",
  fontFamily: "var(--dm-font-primary), monospace",
  fontSize: 9,
  imageRendering: "pixelated",
  maxWidth: "min(92vw, 280px)",
  maxHeight: "min(70vh, 420px)",
  overflow: "auto",
  boxShadow: "none",
};

function cornerPosition(corner: Corner): React.CSSProperties {
  switch (corner) {
    case "top-left":
      return { top: 4, left: 4 };
    case "top-right":
      return { top: 4, right: 4 };
    case "bottom-left":
      return { bottom: 4, left: 4 };
    case "bottom-right":
      return { bottom: 4, right: 4 };
  }
}

function panelAnchor(corner: Corner): React.CSSProperties {
  switch (corner) {
    case "top-left":
      return { top: 36, left: 4 };
    case "top-right":
      return { top: 36, right: 4 };
    case "bottom-left":
      return { bottom: 36, left: 4 };
    case "bottom-right":
      return { bottom: 36, right: 4 };
  }
}

interface CornerHostProps {
  children: ReactNode;
  /** localStorage key for remembering zen state */
  storageKey?: string;
  /** Force narrow mode (useful for testing) */
  forceNarrow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Root wrapper for creative apps that want corner-collapsible chrome.
 * Puts position:relative on the host so absolute corner affordances work.
 */
export function CornerHost({
  children,
  storageKey = "kos-corner-chrome",
  forceNarrow,
  className,
  style,
}: CornerHostProps) {
  const isNarrowDetected = useIsNarrow(720);
  const isNarrow = forceNarrow ?? isNarrowDetected;

  const [uiHidden, setUiHiddenState] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Restore zen preference
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === "1") setUiHiddenState(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const setUiHidden = useCallback(
    (v: boolean) => {
      setUiHiddenState(v);
      if (v) setExpanded(null);
      try {
        localStorage.setItem(storageKey, v ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const toggleUiHidden = useCallback(() => {
    setUiHidden(!uiHidden);
  }, [uiHidden, setUiHidden]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  // Keyboard: H toggles zen when focused inside host
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "h" || e.key === "H") {
        // Avoid conflict with other shortcuts if modifier held
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        toggleUiHidden();
      }
      if (e.key === "Escape") {
        setExpanded(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleUiHidden]);

  const value = useMemo(
    () => ({
      uiHidden,
      setUiHidden,
      toggleUiHidden,
      expanded,
      setExpanded,
      toggleExpanded,
      isNarrow,
    }),
    [uiHidden, setUiHidden, toggleUiHidden, expanded, toggleExpanded, isNarrow],
  );

  return (
    <CornerChromeContext.Provider value={value}>
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          ...style,
        }}
      >
        {children}
      </div>
    </CornerChromeContext.Provider>
  );
}

interface CornerPanelProps {
  id: string;
  corner: Corner;
  /** Short label shown on the collapsed affordance (e.g. "PEN", "CLR", "FRM") */
  label: string;
  children: ReactNode;
  /** When true, this panel is part of the "chrome" that zen mode hides entirely */
  chrome?: boolean;
  /** Panel is always visible on wide screens unless zen is on */
  desktopInline?: boolean;
  /**
   * Always collapse to a corner affordance (even on wide desktop).
   * Use for apps that want four-corner menus at all sizes (e.g. SHOTLIST).
   */
  forceCorner?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A panel that either:
 * - sits inline on wide screens, or
 * - collapses to a corner affordance on narrow / zen mode / forceCorner.
 */
export function CornerPanel({
  id,
  corner,
  label,
  children,
  chrome = true,
  forceCorner = false,
  className,
  style,
}: CornerPanelProps) {
  const { uiHidden, expanded, toggleExpanded, isNarrow } = useCornerChrome();
  const isExpanded = expanded === id;

  // Zen mode: only show affordances (and only one restore control is enough,
  // but each panel still gets its corner so tools stay reachable).
  const showAsCorner = forceCorner || isNarrow || uiHidden;

  if (!showAsCorner) {
    // Desktop / wide: render children inline (caller places them in layout)
    return (
      <div className={className} style={style} data-corner-panel={id}>
        {children}
      </div>
    );
  }

  // Narrow or zen: corner affordance + floating panel when expanded
  return (
    <>
      <button
        type="button"
        aria-label={`Toggle ${label}`}
        title={label}
        style={{
          ...cornerPosition(corner),
          ...(isExpanded ? AFFORDANCE_ACTIVE : AFFORDANCE),
        }}
        onClick={(e) => {
          e.stopPropagation();
          toggleExpanded(id);
        }}
      >
        {label.slice(0, 4)}
      </button>
      {isExpanded && (
        <div
          className={className}
          style={{
            ...PANEL_SHELL,
            ...panelAnchor(corner),
            ...style,
          }}
          data-corner-panel={id}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 6px",
              borderBottom: "1px solid #333",
              background: "#0a0a0a",
            }}
          >
            <span style={{ letterSpacing: 1, color: "#888" }}>{label}</span>
            <button
              type="button"
              onClick={() => toggleExpanded(id)}
              style={{
                border: "1px solid #555",
                background: "#000",
                color: "#888",
                fontFamily: "monospace",
                fontSize: 8,
                padding: "1px 6px",
                cursor: "pointer",
              }}
            >
              X
            </button>
          </div>
          <div style={{ padding: 4 }}>{children}</div>
        </div>
      )}
    </>
  );
}

interface ZenToggleProps {
  /** Which corner holds the always-visible restore button when zen is on */
  corner?: Corner;
}

/** Small always-available control to enter/exit full-canvas zen mode. */
export function VerticalChromeToggle({ corner = "bottom-right" }: ZenToggleProps) {
  const { uiHidden, toggleUiHidden, isNarrow } = useCornerChrome();

  // On wide screens we still offer the toggle so users can maximize canvas.
  const label = uiHidden ? "UI" : "ZEN";

  return (
    <button
      type="button"
      aria-label={uiHidden ? "Show UI" : "Hide UI (zen mode)"}
      title={uiHidden ? "Show menus" : "Hide menus (H)"}
      style={{
        ...cornerPosition(corner),
        ...(uiHidden ? AFFORDANCE_ACTIVE : AFFORDANCE),
        // Sit slightly inset from the corner panel affordance if both exist
        ...(corner === "bottom-right" ? { bottom: 4, right: isNarrow ? 44 : 4 } : {}),
        zIndex: 45,
      }}
      onClick={(e) => {
        e.stopPropagation();
        toggleUiHidden();
      }}
    >
      {label}
    </button>
  );
}

/** Click-catcher that collapses expanded panels when the canvas is tapped. */
export function CornerDismissLayer() {
  const { expanded, setExpanded } = useCornerChrome();
  if (!expanded) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 30,
      }}
      onClick={() => setExpanded(null)}
      onPointerDown={() => setExpanded(null)}
    />
  );
}

/*
 *                ☦
 *         ┌──────────────┐
 *         │  ✝ SAINT ✝  │
 *         │   ISIDORE    │
 *         │  OF SEVILLE  │
 *         │  Patron of   │
 *         │  the Internet│
 *         └──────────────┘
 *
 *   WINDOW COMPONENT
 *   The sacred frame of the VMI.
 *   No rounded corners. No mercy.
 */

"use client";

import React from "react";

interface WindowProps {
  title: string;
  children: React.ReactNode;
  width?: string | number;
  height?: string | number;
  x?: number;
  y?: number;
  active?: boolean;
  onFocus?: () => void;
}

/**
 * VMI Window - pixel-perfect, sharp-cornered container
 * Emulates the KOOLSKULL OS window frame aesthetic
 */
export function Window({
  title,
  children,
  width = "auto",
  height = "auto",
  x = 0,
  y = 0,
  active = true,
  onFocus,
}: WindowProps) {
  return (
    <div
      className="absolute select-none"
      style={{
        left: x,
        top: y,
        width,
        height,
        imageRendering: "pixelated",
      }}
      onClick={onFocus}
    >
      {/* Outer border - double pixel border */}
      <div
        className="border-2 flex flex-col"
        style={{
          borderColor: active ? "#ffffff" : "#888888",
          borderStyle: "solid",
          backgroundColor: "#000000",
          height: "100%",
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-2 py-0.5 border-b-2"
          style={{
            backgroundColor: active ? "#1a1a1a" : "#1a1a1a",
            borderColor: active ? "#ffffff" : "#888888",
            fontFamily: "var(--dm-font-primary)",
            fontSize: "10px",
            letterSpacing: "2px",
            color: active ? "#ffffff" : "#999999",
            textTransform: "uppercase",
          }}
        >
          <span>{"["} {title} {"]"}</span>
          <span style={{ fontSize: "8px" }}>☦</span>
        </div>

        {/* Content area */}
        <div
          className="flex-1 overflow-hidden p-1"
          style={{
            fontFamily: "var(--dm-font-primary)",
            fontSize: "11px",
            color: "#ffffff",
            lineHeight: "1.4",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

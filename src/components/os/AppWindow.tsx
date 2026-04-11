/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  APP WINDOW      ║
 *            ╚══════════════════╝
 *
 *   Draggable/resizable window for the K-OS desktop shell.
 *   Pixel aesthetic, no rounded corners, sharp borders.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

interface AppWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  state: WindowState;
  zIndex: number;
  isFocused: boolean;
  onFocus: () => void;
  onStateChange: (state: WindowState) => void;
  onClose: () => void;
}

const TITLE_BAR_H = 24;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;
const RESIZE_HANDLE = 4;

export function AppWindow({
  title,
  children,
  state,
  zIndex,
  isFocused,
  onFocus,
  onStateChange,
  onClose,
}: AppWindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [restoreState, setRestoreState] = useState<WindowState | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const borderColor = isFocused ? "#444444" : "#222222";
  const titleBg = isFocused ? "#1a1a1a" : "#0a0a0a";
  const titleColor = isFocused ? "#ffffff" : "#888888";

  const handleMouseDownTitle = (e: React.MouseEvent) => {
    if (state.isMaximized) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({ x: e.clientX - state.x, y: e.clientY - state.y });
    onFocus();
  };

  const handleDoubleClickTitle = () => {
    if (state.isMaximized) {
      if (restoreState) {
        onStateChange({ ...restoreState, isMaximized: false });
      }
    } else {
      setRestoreState(state);
      onStateChange({
        ...state,
        isMinimized: false,
        isMaximized: true,
      });
    }
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStateChange({ ...state, isMinimized: true });
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDoubleClickTitle();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (state.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    setResizeDir(direction);
    setDragOffset({ x: e.clientX, y: e.clientY });
    onFocus();
  };

  useEffect(() => {
    if (!isDragging && !resizeDir) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(-state.width + 100, Math.min(e.clientX - dragOffset.x, window.innerWidth - 100));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 50));
        onStateChange({ ...state, x: newX, y: newY });
      } else if (resizeDir) {
        const dx = e.clientX - dragOffset.x;
        const dy = e.clientY - dragOffset.y;
        let { x, y, width, height } = state;

        if (resizeDir.includes("e")) width = Math.max(MIN_WIDTH, width + dx);
        if (resizeDir.includes("s")) height = Math.max(MIN_HEIGHT, height + dy);
        if (resizeDir.includes("w")) {
          const newW = width - dx;
          if (newW >= MIN_WIDTH) { width = newW; x = x + dx; }
        }
        if (resizeDir.includes("n")) {
          const newH = height - dy;
          if (newH >= MIN_HEIGHT) { height = newH; y = y + dy; }
        }

        setDragOffset({ x: e.clientX, y: e.clientY });
        onStateChange({ ...state, x, y, width, height });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizeDir(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, resizeDir, dragOffset, state, onStateChange]);

  if (state.isMinimized) return null;

  const resizeHandles = !state.isMaximized && (
    <>
      <div style={{ position: "absolute", top: 0, left: RESIZE_HANDLE, right: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: "n-resize" }} onMouseDown={(e) => handleResizeStart(e, "n")} />
      <div style={{ position: "absolute", bottom: 0, left: RESIZE_HANDLE, right: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: "s-resize" }} onMouseDown={(e) => handleResizeStart(e, "s")} />
      <div style={{ position: "absolute", top: RESIZE_HANDLE, bottom: RESIZE_HANDLE, left: 0, width: RESIZE_HANDLE, cursor: "w-resize" }} onMouseDown={(e) => handleResizeStart(e, "w")} />
      <div style={{ position: "absolute", top: RESIZE_HANDLE, bottom: RESIZE_HANDLE, right: 0, width: RESIZE_HANDLE, cursor: "e-resize" }} onMouseDown={(e) => handleResizeStart(e, "e")} />
      <div style={{ position: "absolute", top: 0, left: 0, width: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: "nw-resize" }} onMouseDown={(e) => handleResizeStart(e, "nw")} />
      <div style={{ position: "absolute", top: 0, right: 0, width: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: "ne-resize" }} onMouseDown={(e) => handleResizeStart(e, "ne")} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: "sw-resize" }} onMouseDown={(e) => handleResizeStart(e, "sw")} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: "se-resize" }} onMouseDown={(e) => handleResizeStart(e, "se")} />
    </>
  );

  return (
    <div
      ref={windowRef}
      style={{
        position: "absolute",
        ...(state.isMaximized
          ? { left: 0, top: 0, right: 0, bottom: 36 }
          : { left: state.x, top: state.y, width: state.width, height: state.height }),
        zIndex,
        border: `2px solid ${borderColor}`,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        imageRendering: "pixelated",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
      onMouseDown={onFocus}
    >
      {resizeHandles}

      {/* Title bar */}
      <div
        style={{
          height: `${TITLE_BAR_H}px`,
          backgroundColor: titleBg,
          borderBottom: `2px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "6px",
          paddingRight: "4px",
          cursor: state.isMaximized ? "default" : "move",
          flexShrink: 0,
          userSelect: "none",
        }}
        onMouseDown={handleMouseDownTitle}
        onDoubleClick={handleDoubleClickTitle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontFamily: "var(--dm-font-primary)",
              fontSize: "10px",
              color: titleColor,
              letterSpacing: "2px",
            }}
          >
            ☦ {title}
          </span>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          <button
            onClick={handleMinimize}
            style={{
              width: "16px",
              height: "16px",
              border: `1px solid ${borderColor}`,
              backgroundColor: "#000000",
              color: titleColor,
              fontFamily: "var(--dm-font-primary)",
              fontSize: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              lineHeight: 1,
            }}
          >
            _
          </button>
          <button
            onClick={handleMaximize}
            style={{
              width: "16px",
              height: "16px",
              border: `1px solid ${borderColor}`,
              backgroundColor: "#000000",
              color: titleColor,
              fontFamily: "var(--dm-font-primary)",
              fontSize: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              lineHeight: 1,
            }}
          >
            {state.isMaximized ? "=" : "[]"}
          </button>
          <button
            onClick={handleCloseClick}
            style={{
              width: "16px",
              height: "16px",
              border: `1px solid ${borderColor}`,
              backgroundColor: "#000000",
              color: titleColor,
              fontFamily: "var(--dm-font-primary)",
              fontSize: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              lineHeight: 1,
            }}
          >
            X
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

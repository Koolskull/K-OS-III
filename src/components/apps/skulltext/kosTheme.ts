/*
 * K-OS III — SKULLTEXT CodeMirror theme
 * Flat black, hard edges, no radius, no AA, yellow caret.
 */

import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

/** Chrome + layout — pure pixel OS look; fills flex parent */
export const kosEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#000000",
      color: "#e8e8e8",
      height: "100%",
      maxHeight: "100%",
      width: "100%",
      fontSize: "13px",
      fontFamily: "var(--dm-font-primary), ui-monospace, monospace",
    },
    "&.cm-editor": {
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },
    ".cm-scroller": {
      flex: "1 1 auto",
      overflow: "auto",
      fontFamily: "var(--dm-font-primary), ui-monospace, monospace",
      minHeight: "0",
    },
    ".cm-content": {
      caretColor: "#00ff00",
      fontFamily: "var(--dm-font-primary), ui-monospace, monospace",
      padding: "12px 14px",
      lineHeight: "1.5",
      minHeight: "100%",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#00ff00",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "#333300 !important",
    },
    ".cm-activeLine": {
      backgroundColor: "#0a0a00",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#0a0a00",
      color: "#00ff00",
    },
    ".cm-gutters": {
      backgroundColor: "#0a0a0a",
      color: "#555555",
      border: "none",
      borderRight: "1px solid #222222",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 6px",
      minWidth: "2.5em",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "#111111",
      border: "1px solid #444444",
      color: "#888888",
    },
    ".cm-tooltip": {
      backgroundColor: "#000000",
      border: "1px solid #555555",
      borderRadius: "0",
      color: "#cccccc",
      fontFamily: "var(--dm-font-primary), monospace",
      fontSize: "11px",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul": {
      fontFamily: "var(--dm-font-primary), monospace",
      fontSize: "11px",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
      borderRadius: "0",
      padding: "2px 8px",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "#00ff00",
      color: "#000000",
    },
    ".cm-completionMatchedText": {
      textDecoration: "underline",
      textDecorationColor: "#00ff00",
    },
    ".cm-diagnostic": {
      borderRadius: "0",
    },
    ".cm-diagnostic-error": {
      borderLeft: "2px solid #ff4444",
    },
    ".cm-panel": {
      backgroundColor: "#0a0a0a",
      borderTop: "1px solid #333333",
      color: "#cccccc",
      fontFamily: "var(--dm-font-primary), monospace",
      fontSize: "11px",
    },
    ".cm-panel input, .cm-panel button": {
      borderRadius: "0",
      border: "1px solid #555555",
      background: "#000000",
      color: "#cccccc",
      fontFamily: "inherit",
    },
    ".cm-panel button": {
      cursor: "pointer",
    },
    ".cm-panel button:hover": {
      background: "#ffffff",
      color: "#000000",
    },
    ".cm-searchMatch": {
      backgroundColor: "#333300",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#666600",
    },
  },
  { dark: true },
);

const kosHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#00ff00" },
  { tag: t.operator, color: "#cccccc" },
  { tag: t.special(t.variableName), color: "#66ccff" },
  { tag: t.typeName, color: "#88aaff" },
  { tag: t.className, color: "#88aaff" },
  { tag: t.number, color: "#ffaa44" },
  { tag: t.string, color: "#88ff88" },
  { tag: t.regexp, color: "#88ff88" },
  { tag: t.bool, color: "#ffaa44" },
  { tag: t.null, color: "#ffaa44" },
  { tag: t.comment, color: "#666666", fontStyle: "italic" },
  { tag: t.meta, color: "#888888" },
  { tag: t.tagName, color: "#00ff00" },
  { tag: t.attributeName, color: "#66ccff" },
  { tag: t.attributeValue, color: "#88ff88" },
  { tag: t.heading, color: "#00ff00", fontWeight: "bold" },
  { tag: t.link, color: "#66aaff", textDecoration: "underline" },
  { tag: t.url, color: "#66aaff" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.processingInstruction, color: "#888888" },
  { tag: t.definition(t.variableName), color: "#e8e8e8" },
  { tag: t.function(t.variableName), color: "#66ccff" },
  { tag: t.propertyName, color: "#aaddff" },
  { tag: t.invalid, color: "#ff4444" },
]);

export const kosTheme: Extension = [kosEditorTheme, syntaxHighlighting(kosHighlightStyle)];

/*
 * CodeMirror 6 host for SKULLTEXT — K-OS theme, soft wrap default on.
 */

"use client";

import React, { useEffect, useRef } from "react";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
} from "@codemirror/language";
import { kosTheme } from "./kosTheme";
import { languageForFilename } from "./languages";

export interface SkullEditorProps {
  value: string;
  filename: string;
  wrap: boolean;
  onChange: (value: string) => void;
}

export function SkullEditor({ value, filename, wrap, onChange }: SkullEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langComp = useRef(new Compartment());
  const wrapComp = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const applyingExternal = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create editor once per mount (parent remounts via key={fileId})
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const lang = languageForFilename(filename);

    const extensions: Extension[] = [
      kosTheme,
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      drawSelection(),
      history(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      foldGutter(),
      autocompletion(),
      highlightSelectionMatches(),
      keymap.of([
        indentWithTab,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
      langComp.current.of(lang ?? []),
      wrapComp.current.of(wrap ? EditorView.lineWrapping : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !applyingExternal.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorState.tabSize.of(2),
      EditorView.editable.of(true),
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; file switches remount via key
  }, []);

  // Sync doc when parent forces a new value without remount (rare)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    applyingExternal.current = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
    applyingExternal.current = false;
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const lang = languageForFilename(filename);
    view.dispatch({
      effects: langComp.current.reconfigure(lang ?? []),
    });
  }, [filename]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: wrapComp.current.reconfigure(wrap ? EditorView.lineWrapping : []),
    });
  }, [wrap]);

  return (
    <div
      ref={parentRef}
      className="skulltext-cm-host"
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    />
  );
}

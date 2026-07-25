/*
 * CodeMirror 6 host for SKULLTEXT — K-OS theme, soft wrap default on.
 */

"use client";

import React, { useEffect, useRef } from "react";
import { EditorState, Compartment, Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { kosTheme } from "./kosTheme";
import { languageForFilename } from "./languages";

export interface SkullEditorProps {
  value: string;
  filename: string;
  wrap: boolean;
  onChange: (value: string) => void;
  onReady?: (view: EditorView) => void;
}

export function SkullEditor({ value, filename, wrap, onChange, onReady }: SkullEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langComp = useRef(new Compartment());
  const wrapComp = useRef(new Compartment());
  // avoid feedback loop when we setDoc from props
  const applyingExternal = useRef(false);

  useEffect(() => {
    if (!parentRef.current) return;

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
      foldGutter({
        openText: "▾",
        closedText: "▸",
      }),
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
          onChange(update.state.doc.toString());
        }
      }),
      EditorState.tabSize.of(2),
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: parentRef.current,
    });
    viewRef.current = view;
    onReady?.(view);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // mount once — filename/wrap/value synced below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // external value (file switch)
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

  // language when filename changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const lang = languageForFilename(filename);
    view.dispatch({
      effects: langComp.current.reconfigure(lang ?? []),
    });
  }, [filename]);

  // soft wrap toggle
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
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}

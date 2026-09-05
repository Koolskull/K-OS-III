/*
 * CodeMirror 6 host for SKULLTEXT — K-OS theme, soft wrap default on.
 * Client-only; parent should dynamic-import this module.
 */

"use client";

import { useEffect, useRef } from "react";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
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

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const lang = languageForFilename(filename);

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        kosTheme,
        keymap.of([indentWithTab]),
        langComp.current.of(lang ?? []),
        wrapComp.current.of(wrap ? EditorView.lineWrapping : []),
        EditorState.tabSize.of(2),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !applyingExternal.current) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() === value) return;
    applyingExternal.current = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
    applyingExternal.current = false;
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: langComp.current.reconfigure(languageForFilename(filename) ?? []),
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

export default SkullEditor;

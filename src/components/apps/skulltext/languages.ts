/*
 * Map file extensions → CodeMirror language support.
 */

import { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import { cpp } from "@codemirror/lang-cpp";

export function languageForFilename(name: string): Extension | null {
  const i = name.lastIndexOf(".");
  const ext = (i >= 0 ? name.slice(i) : "").toLowerCase();

  switch (ext) {
    case ".ts":
    case ".tsx":
      return javascript({ typescript: true, jsx: ext === ".tsx" });
    case ".js":
    case ".jsx":
      return javascript({ jsx: ext === ".jsx" });
    case ".html":
    case ".htm":
      return html();
    case ".css":
      return css();
    case ".json":
      return json();
    case ".md":
    case ".markdown":
      return markdown();
    case ".xml":
    case ".svg":
      return xml();
    case ".c":
    case ".h":
    case ".cpp":
    case ".hpp":
    case ".cc":
      return cpp();
    case ".cs":
      // No official csharp package in core set — plain text for now
      return null;
    case ".csv":
    case ".txt":
    default:
      return null;
  }
}

/*
 * Map file extensions → CodeMirror language support.
 */

import type { Extension } from "@codemirror/state";
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
      return javascript({ typescript: true, jsx: false });
    case ".tsx":
      return javascript({ typescript: true, jsx: true });
    case ".js":
      return javascript({ jsx: false });
    case ".jsx":
      return javascript({ jsx: true });
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
    case ".csv":
    case ".txt":
    default:
      return null;
  }
}

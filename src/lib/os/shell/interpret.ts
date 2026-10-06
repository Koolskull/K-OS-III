/*
 *   Turn one shell line into an action.
 *   Commands, app names, install asks, and arithmetic.
 */

import { findShellApp, SHELL_APPS } from "./catalog";
import { readMath } from "./math";

export const HELP_TEXT = [
  "COMMANDS",
  "  HELP            THIS LIST",
  "  <NAME>          OPEN AN INSTALLED APP",
  "  OPEN <NAME>     OPEN AN INSTALLED APP",
  "  INSTALL <NAME>  INSTALL A DEPOT PACKAGE",
  "  LIST            INSTALLED APPS",
  "  DEPOT           APPS NOT INSTALLED",
  "  CLEAR           CLEAR THE SCROLL",
  "  EXIT            CLOSE THE SHELL",
  "  <EQUATION>      ANSWER THE MATH",
  "",
  "  SHIFT+T         TOGGLE THE SHELL",
  "  UP  DOWN        COMMAND HISTORY",
  "  Y / N           ANSWER AN INSTALL ASK",
  "  SIN COS TAN     RADIANS",
  "  SQRT ABS LOG LN FLOOR CEIL ROUND",
  "  PI  E  TAU",
].join("\n");

export type ShellAction =
  | { kind: "empty" }
  | { kind: "help" }
  | { kind: "clear" }
  | { kind: "exit" }
  | { kind: "list" }
  | { kind: "depot" }
  | { kind: "math"; value: string }
  | { kind: "bad-math" }
  | { kind: "launch"; appId: string; title: string }
  | { kind: "already"; appId: string; title: string }
  | { kind: "ask"; appId: string | null; label: string }
  | { kind: "begin"; appId: string | null; label: string }
  | { kind: "install-usage" }
  | { kind: "open-usage" }
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "need-yn" };

const HELP = new Set(["help", "?"]);
const CLEAR = new Set(["clear", "cls"]);
const EXIT = new Set(["exit", "quit"]);
const LIST = new Set(["list", "apps", "ls"]);
const DEPOT = new Set(["depot", "packages"]);

export function interpret(raw: string, installed: ReadonlySet<string>, pendingAsk: boolean): ShellAction {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "empty" };

  const parts = trimmed.split(/\s+/);
  const head = parts[0].toLowerCase();
  const rest = parts.slice(1).join(" ");

  if (pendingAsk) {
    if (head === "y" || head === "yes") return { kind: "yes" };
    if (head === "n" || head === "no") return { kind: "no" };
    return { kind: "need-yn" };
  }

  if (HELP.has(head)) return { kind: "help" };
  if (CLEAR.has(head)) return { kind: "clear" };
  if (EXIT.has(head)) return { kind: "exit" };
  if (LIST.has(head)) return { kind: "list" };
  if (DEPOT.has(head)) return { kind: "depot" };

  if (head === "install") {
    if (!rest) return { kind: "install-usage" };
    return beginInstall(rest, installed);
  }
  if (head === "open") {
    if (!rest) return { kind: "open-usage" };
    return resolveName(rest, installed);
  }

  const math = readMath(trimmed);
  if (math.ok) return { kind: "math", value: math.value };
  if (math.reason === "bad") return { kind: "bad-math" };

  return resolveName(trimmed, installed);
}

function beginInstall(query: string, installed: ReadonlySet<string>): ShellAction {
  const app = findShellApp(query);
  if (app && installed.has(app.id)) return { kind: "already", appId: app.id, title: app.title };
  if (app) return { kind: "begin", appId: app.id, label: app.label };
  return { kind: "begin", appId: null, label: query.toUpperCase() };
}

function resolveName(query: string, installed: ReadonlySet<string>): ShellAction {
  const app = findShellApp(query);
  if (!app) return { kind: "ask", appId: null, label: query.toUpperCase() };
  if (!installed.has(app.id)) return { kind: "ask", appId: app.id, label: app.label };
  return { kind: "launch", appId: app.id, title: app.title };
}

export function formatAppList(installed: ReadonlySet<string>, mode: "installed" | "depot"): string {
  const apps = SHELL_APPS.filter((app) => (mode === "installed" ? installed.has(app.id) : !installed.has(app.id)));
  if (apps.length === 0) return mode === "depot" ? "DEPOT EMPTY" : "NOTHING INSTALLED";
  const head = mode === "installed" ? "INSTALLED" : "DEPOT";
  return [head, ...apps.map((app) => `  ${app.label}`)].join("\n");
}

const BAR_INNER = 18;

function barFrame(fill: number, message: string): string {
  const cells = "#".repeat(fill) + ".".repeat(BAR_INNER - fill);
  const text = message.slice(0, BAR_INNER).padEnd(BAR_INNER, " ");
  return [
    "+--------------------+",
    `| ${cells} |`,
    `| ${text} |`,
    "+--------------------+",
  ].join("\n");
}

/** Two ASCII passes: a column fills, then a bar runs. */
export function installFrames(label: string): string[] {
  const name = label.trim().slice(0, 18) || "PACKAGE";
  const frames: string[] = [];
  const cols = 6;
  for (let row = 0; row <= cols; row += 1) {
    const cells = Array.from({ length: cols }, (_, index) => (index < row ? "#" : ".")).join("  ");
    frames.push(`  ${cells}\n  ${name}`);
  }
  const stages: Array<[number, string]> = [
    [0, "LINKING DEPOT"],
    [3, "FETCHING"],
    [6, "UNPACKING"],
    [9, "WRITING"],
    [12, "LINKING"],
    [15, "CHECKING"],
    [18, "CHECKING"],
  ];
  for (const [fill, message] of stages) frames.push(barFrame(fill, message));
  return frames;
}

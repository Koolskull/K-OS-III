import type { MapProject } from "./types";
import { DEFAULT_NODE_STYLE, DEFAULT_WIRE_ROUTING, DEFAULT_WIRE_STYLE, uid } from "./types";

/** Original starter map — research / project workflow (not DSMP content). */
export function createDemoProject(): MapProject {
  const now = Date.now();
  const a = uid("n");
  const b = uid("n");
  const c = uid("n");
  const d = uid("n");
  const e = uid("n");
  const f = uid("n");

  return {
    id: uid("p"),
    name: "RESEARCH WORKFLOW",
    updatedAt: now,
    wireRouting: DEFAULT_WIRE_ROUTING,
    nodes: [
      {
        id: a, x: 80, y: 120, w: 180, h: 96,
        rotation: 0,
        title: "QUESTION",
        body: "What problem are we organizing?",
        style: { ...DEFAULT_NODE_STYLE },
      },
      {
        id: b, x: 340, y: 60, w: 190, h: 110,
        rotation: 0,
        title: "SOURCES",
        body: "Primary docs first.\nLabel contested claims.",
        style: { ...DEFAULT_NODE_STYLE },
      },
      {
        id: c, x: 340, y: 220, w: 190, h: 110,
        rotation: 0,
        title: "NOTES",
        body: "Short claims, not essays.\nLink evidence.",
        style: { ...DEFAULT_NODE_STYLE },
      },
      {
        id: d, x: 600, y: 120, w: 200, h: 120,
        rotation: 0,
        title: "SYNTHESIS",
        body: "Map connections.\nSeparate fact / inference / speculation.",
        style: { ...DEFAULT_NODE_STYLE },
      },
      {
        id: e, x: 880, y: 80, w: 180, h: 100,
        rotation: 0,
        title: "TASKS",
        body: "Next actions.\nOwners. Deadlines.",
        style: { ...DEFAULT_NODE_STYLE },
      },
      {
        id: f, x: 880, y: 230, w: 180, h: 100,
        rotation: 0,
        title: "DELIVERABLE",
        body: "Ship the map.\nRevisit epistemic stance.",
        style: { ...DEFAULT_NODE_STYLE },
      },
    ],
    wires: [
      { id: uid("w"), from: a, to: b, title: "gather", style: { ...DEFAULT_WIRE_STYLE } },
      { id: uid("w"), from: a, to: c, title: "capture", style: { ...DEFAULT_WIRE_STYLE } },
      { id: uid("w"), from: b, to: d, title: "evidence", style: { ...DEFAULT_WIRE_STYLE } },
      { id: uid("w"), from: c, to: d, title: "claims", style: { ...DEFAULT_WIRE_STYLE } },
      { id: uid("w"), from: d, to: e, title: "act", style: { ...DEFAULT_WIRE_STYLE } },
      { id: uid("w"), from: d, to: f, title: "ship", style: { ...DEFAULT_WIRE_STYLE } },
    ],
  };
}

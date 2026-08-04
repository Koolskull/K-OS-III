export type WireStyle = "solid" | "dashed" | "thick";

export interface NodeStyle {
  bg: string;
  border: string;
  text: string;
  borderWidth: number;
  roundness: number;
}

export interface WireStyleProps {
  color: string;
  width: number;
  style: WireStyle;
}

export interface MapNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees. Default 0. */
  rotation?: number;
  title: string;
  body: string;
  style: NodeStyle;
}

export interface MapWire {
  id: string;
  from: string;
  to: string;
  title: string;
  style: WireStyleProps;
}

export interface MapProject {
  id: string;
  name: string;
  nodes: MapNode[];
  wires: MapWire[];
  /** 0=straight, ~0.5=smooth, 1=orthogonal grid */
  wireRouting?: number;
  updatedAt: number;
}

export type EditTarget =
  | { kind: "node"; id: string }
  | { kind: "wire"; id: string }
  | null;

export type ToolMode = "select" | "connect" | "pan";

export const DEFAULT_NODE_STYLE: NodeStyle = {
  bg: "#000000",
  border: "#ffffff",
  text: "#ffffff",
  borderWidth: 2,
  roundness: 0,
};

export const DEFAULT_WIRE_STYLE: WireStyleProps = {
  color: "#ffffff",
  width: 2,
  style: "solid",
};

export const DEFAULT_WIRE_ROUTING = 0.45;

export function uid(prefix = "n"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeProject(p: MapProject): MapProject {
  return {
    ...p,
    wireRouting:
      typeof p.wireRouting === "number"
        ? Math.min(1, Math.max(0, p.wireRouting))
        : DEFAULT_WIRE_ROUTING,
    nodes: p.nodes.map((n) => ({
      ...n,
      rotation: typeof n.rotation === "number" ? n.rotation : 0,
      style: { ...DEFAULT_NODE_STYLE, ...n.style },
    })),
    wires: p.wires.map((w) => ({
      ...w,
      style: { ...DEFAULT_WIRE_STYLE, ...w.style },
    })),
  };
}

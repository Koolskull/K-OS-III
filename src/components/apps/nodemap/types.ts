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

export function uid(prefix = "n"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

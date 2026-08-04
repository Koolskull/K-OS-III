import { normalizeProject, type MapProject } from "./types";

const KEY = "kos.nodemap.project.v1";
const STYLES_KEY = "kos.nodemap.styles.v1";

export function loadProject(): MapProject | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as MapProject;
    if (!data?.nodes || !data?.wires) return null;
    return normalizeProject(data);
  } catch {
    return null;
  }
}

export function saveProject(project: MapProject): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify({ ...project, updatedAt: Date.now() }));
  } catch {
    /* quota */
  }
}

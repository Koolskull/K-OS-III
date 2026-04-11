/*
 *            ☦
 *      ╔════════════════════╗
 *      ║  ST. ISIDORE OF    ║
 *      ║  SEVILLE            ║
 *      ╚════════════════════╝
 *
 *   PROJECT IO
 *   Save/load .dmpit files (ZIP containing project.json + samples/).
 *
 *   Format:
 *     project.dmpit (ZIP)
 *       ├── project.json
 *       └── samples/
 *           ├── 00_KICK.wav
 *           └── 01_SNARE.wav
 */

import JSZip from "jszip";
import type { ProjectData, ProjectSample } from "@/types/tracker";

/** Serialize project + samples into a .dmpit ZIP blob */
export async function saveProject(project: ProjectData): Promise<Blob> {
  const zip = new JSZip();

  // Serialize project JSON (replace sample binary data with file references)
  const sampleRefs = project.samples.map((s) => ({
    id: s.id,
    name: s.name,
    file: `samples/${s.id.toString(16).padStart(2, "0").toUpperCase()}_${s.name}.wav`,
  }));

  const jsonProject = {
    ...project,
    samples: sampleRefs,
  };

  zip.file("project.json", JSON.stringify(jsonProject, null, 2));

  // Add sample binary data
  for (const sample of project.samples) {
    const filename = `samples/${sample.id.toString(16).padStart(2, "0").toUpperCase()}_${sample.name}.wav`;
    zip.file(filename, sample.data);
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/** Load a .dmpit ZIP blob into a ProjectData */
export async function loadProjectFile(blob: Blob): Promise<ProjectData> {
  const zip = await JSZip.loadAsync(blob);

  const jsonFile = zip.file("project.json");
  if (!jsonFile) throw new Error("Invalid .dmpit file: missing project.json");

  const jsonText = await jsonFile.async("string");
  const parsed = JSON.parse(jsonText);

  // Restore sample binary data from ZIP
  const samples: ProjectSample[] = [];
  for (const entry of parsed.samples) {
    const sampleFile = zip.file(entry.file);
    if (sampleFile) {
      const data = await sampleFile.async("arraybuffer");
      samples.push({
        id: entry.id,
        name: entry.name,
        data,
      });
    } else {
      console.warn(`[PROJECT IO] Missing sample file: ${entry.file}`);
    }
  }

  return {
    ...parsed,
    samples,
  } as ProjectData;
}

/** Trigger a browser download of the project */
export async function downloadProject(project: ProjectData): Promise<void> {
  const blob = await saveProject(project);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name || "UNTITLED"}.dmpit`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Open a file picker and load a .dmpit project */
export function openProjectPicker(): Promise<ProjectData | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dmpit,.zip";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const project = await loadProjectFile(file);
        resolve(project);
      } catch (e) {
        console.error("[PROJECT IO] Load failed:", e);
        resolve(null);
      }
    };
    input.click();
  });
}

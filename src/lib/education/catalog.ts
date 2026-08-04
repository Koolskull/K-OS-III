import type { EducationTrackMeta } from "./types";

/**
 * Built-in education catalog for the in-OS EDUCATION app.
 * Paths resolve under public/education/<slug>/<file> via assetUrl.
 */
export const EDUCATION_TRACKS: EducationTrackMeta[] = [
  {
    slug: "antediluvian",
    title: "Antediluvian Observatory",
    summary:
      "Alternative deep history and pre-flood theories — observe, cite, leave contradictions visible. Younger Dryas, Göbekli Tepe, floods, Atlantis, maps, Watchers, Tartaria.",
    lessons: [
      { id: "antediluvian/01", file: "01-how-to-read.md", title: "How to read alternative history", estimatedMinutes: 14 },
      { id: "antediluvian/02", file: "02-younger-dryas.md", title: "When the sky fell — Younger Dryas", estimatedMinutes: 18 },
      { id: "antediluvian/03", file: "03-gobekli-tepe.md", title: "Göbekli Tepe before the textbooks", estimatedMinutes: 16 },
      { id: "antediluvian/04", file: "04-floods-and-atlantis.md", title: "Floods everywhere and Plato's date", estimatedMinutes: 18 },
      { id: "antediluvian/05", file: "05-maps-and-coasts.md", title: "Maps and underwater coasts", estimatedMinutes: 16 },
      { id: "antediluvian/06", file: "06-contradicting-clocks.md", title: "Watchers, Tartaria, and contradicting clocks", estimatedMinutes: 18 },
    ],
  },

  {
    slug: "sovereignty",
    title: "Sovereignty",
    summary:
      "Sources of belief, consciousness research, declassified programs, and monetary history. Primary sources first.",
    lessons: [
      { id: "sovereignty/01", file: "01-introduction.md", title: "What this track is for", estimatedMinutes: 12 },
      { id: "sovereignty/02", file: "02-simple-salvation.md", title: "Simple salvation teachings of Jesus", estimatedMinutes: 15 },
      { id: "sovereignty/03", file: "03-monroe-and-obe.md", title: "Robert Monroe and out-of-body experience", estimatedMinutes: 18 },
      { id: "sovereignty/04", file: "04-mkultra-and-stargate.md", title: "MKUltra, Stargate, and declassified programs", estimatedMinutes: 22 },
      { id: "sovereignty/05", file: "05-tesla-and-russell.md", title: "Tesla and Russell — record vs later claims", estimatedMinutes: 20 },
      { id: "sovereignty/06", file: "06-jekyll-island-and-american-system.md", title: "Jekyll Island, Fed, American System", estimatedMinutes: 25 },
    ],
  },
  {
    slug: "culture-machines",
    title: "Culture Machines",
    summary:
      "How scenes, institutions, and markets co-produce culture that computers scale. Injection vs proliferation.",
    lessons: [
      { id: "culture-machines/01", file: "01-injection-vs-proliferation.md", title: "Injection versus proliferation", estimatedMinutes: 15 },
      { id: "culture-machines/02", file: "02-cacophony-burning-man-santacon.md", title: "Cacophony, Burning Man, SantaCon", estimatedMinutes: 16 },
      { id: "culture-machines/03", file: "03-acid-tests-and-academic-lsd.md", title: "Acid Tests and academic LSD", estimatedMinutes: 18 },
      { id: "culture-machines/04", file: "04-jungle-ccru-accelerationism.md", title: "Jungle, CCRU, accelerationism", estimatedMinutes: 18 },
      { id: "culture-machines/05", file: "05-aquino-mindwar-presidio.md", title: "Aquino, MindWar, Presidio", estimatedMinutes: 22 },
      { id: "culture-machines/06", file: "06-myth-filters-and-festival-scale.md", title: "Festival scale and myth filters", estimatedMinutes: 16 },
    ],
  },
];

export function findLesson(lessonId: string) {
  for (const track of EDUCATION_TRACKS) {
    const lesson = track.lessons.find((l) => l.id === lessonId);
    if (lesson) return { track, lesson };
  }
  return null;
}

export function lessonMarkdownPath(trackSlug: string, file: string): string {
  return `/education/${trackSlug}/${file}`;
}

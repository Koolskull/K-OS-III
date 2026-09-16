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
      "Expanded alternative deep history — occult maps, founded megaliths, Younger Dryas, floods, Atlantis, Watchers/Enoch, giants, hyperdiffusion, Rh-marker rhetoric, Tartaria/mud flood, world's fairs, star forts, Agartha/Hyperborea. Observe, cite, leave contradictions visible.",
    lessons: [
      { id: "antediluvian/01", file: "01-how-to-read.md", title: "How to read alternative history", estimatedMinutes: 22 },
      { id: "antediluvian/02", file: "02-younger-dryas.md", title: "When the sky fell — Younger Dryas", estimatedMinutes: 24 },
      { id: "antediluvian/03", file: "03-gobekli-tepe.md", title: "Göbekli Tepe before the textbooks", estimatedMinutes: 32 },
      { id: "antediluvian/04", file: "04-floods-and-atlantis.md", title: "Floods everywhere and Plato's date", estimatedMinutes: 30 },
      { id: "antediluvian/05", file: "05-maps-and-coasts.md", title: "Maps and underwater coasts", estimatedMinutes: 36 },
      { id: "antediluvian/06", file: "06-watchers-descent.md", title: "The Watchers' Descent — Book of Enoch", estimatedMinutes: 30 },
      { id: "antediluvian/07", file: "07-watchers-knowledge.md", title: "Forbidden arts of the Watchers", estimatedMinutes: 28 },
      { id: "antediluvian/08", file: "08-giants-americas.md", title: "Giants of the Americas and the old world", estimatedMinutes: 30 },
      { id: "antediluvian/09", file: "09-hyperdiffusion.md", title: "Hyperdiffusion and the mother culture", estimatedMinutes: 32 },
      { id: "antediluvian/10", file: "10-rh-markers.md", title: "Rh markers and claimed antediluvian bloodlines", estimatedMinutes: 28 },
      { id: "antediluvian/11", file: "11-tartaria-mudflood.md", title: "Tartaria and the mud flood", estimatedMinutes: 32 },
      { id: "antediluvian/12", file: "12-world-fairs.md", title: "World's Fairs as alleged capitals", estimatedMinutes: 28 },
      { id: "antediluvian/13", file: "13-star-forts-emf.md", title: "Star forts, domes, and EMF architecture", estimatedMinutes: 30 },
      { id: "antediluvian/14", file: "14-agartha-hyperborea.md", title: "Agartha, Hyperborea, and inner earth", estimatedMinutes: 28 },
      { id: "antediluvian/15", file: "15-found-not-founded.md", title: "Found not founded — architecture claims", estimatedMinutes: 32 },
      { id: "antediluvian/16", file: "16-contradicting-clocks.md", title: "Contradicting clocks — synthesis", estimatedMinutes: 32 },
    ],
  },

  {
    slug: "sovereignty",
    title: "Sovereignty",
    summary:
      "Sources of belief, consciousness research, declassified programs, monetary history, and institutional science as a consensus machine. Primary sources first.",
    lessons: [
      { id: "sovereignty/01", file: "01-introduction.md", title: "What this track is for", estimatedMinutes: 12 },
      { id: "sovereignty/02", file: "02-simple-salvation.md", title: "Simple salvation teachings of Jesus", estimatedMinutes: 15 },
      { id: "sovereignty/03", file: "03-monroe-and-obe.md", title: "Robert Monroe and out-of-body experience", estimatedMinutes: 18 },
      { id: "sovereignty/04", file: "04-mkultra-and-stargate.md", title: "MKUltra, Stargate, and declassified programs", estimatedMinutes: 22 },
      { id: "sovereignty/05", file: "05-tesla-and-russell.md", title: "Tesla and Russell — record vs later claims", estimatedMinutes: 20 },
      { id: "sovereignty/06", file: "06-jekyll-island-and-american-system.md", title: "Jekyll Island, Fed, American System", estimatedMinutes: 25 },
      { id: "sovereignty/07", file: "07-weinstein-and-institutional-physics.md", title: "Eric Weinstein and institutional physics", estimatedMinutes: 22 },
      { id: "sovereignty/08", file: "08-weinstein-alternative-hero.md", title: "Eric Weinstein — dejected insider", estimatedMinutes: 20 },
      { id: "sovereignty/09", file: "09-russell-weinstein-two-poles.md", title: "Russell and Weinstein — two poles, no lineage", estimatedMinutes: 22 },
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

/*
 *                    ☦
 *      K-OS MANUAL — ARTICLE REGISTRY
 *
 *  One registry of typed article metadata. Each article's body lives in
 *  src/lib/doc/articles/<slug>.tsx and is lazily imported by the renderer.
 *
 *  Categories group articles in the index. The same registry is consumed
 *  by:
 *    - src/app/doc/page.tsx                (index route)
 *    - src/app/doc/[slug]/page.tsx         (article route)
 *    - src/components/apps/manual/ManualApp.tsx (in-OS desktop app)
 */

export type ArticleCategory =
  | "foundations"
  | "datamoshpit"
  | "visuals"
  | "deeper"
  | "reference";

export interface ArticleMeta {
  slug: string;
  title: string;
  oneLiner: string;
  category: ArticleCategory;
  level: "beginner" | "intermediate" | "advanced";
  /** Slugs of related articles, shown in "See also" footer */
  seeAlso?: string[];
  /** Additional reference articles linked from this one's body */
  furtherReading?: string[];
}

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  foundations: "FOUNDATIONS",
  datamoshpit: "DATAMOSHPIT",
  visuals: "VISUALS",
  deeper: "GOING DEEPER",
  reference: "REFERENCE",
};

export const CATEGORY_DESCRIPTIONS: Record<ArticleCategory, string> = {
  foundations: "Start here. Beginner-friendly. Zero assumed knowledge.",
  datamoshpit: "The tracker — making sounds and arrangements.",
  visuals: "The Scene VM — making things visible.",
  deeper: "Advanced articles referenced from earlier sections.",
  reference: "Lookup tables, file formats, and project culture.",
};

export const ARTICLES: ArticleMeta[] = [
  // Foundations
  {
    slug: "welcome",
    title: "Welcome to K-OS",
    oneLiner: "What this whole thing is and where to start.",
    category: "foundations",
    level: "beginner",
    seeAlso: ["what-is-a-tracker", "the-rules"],
  },
  {
    slug: "what-is-a-tracker",
    title: "What Is a Tracker?",
    oneLiner: "A music program that uses a spreadsheet instead of a piano roll.",
    category: "foundations",
    level: "beginner",
    seeAlso: ["song-chain-phrase", "hexadecimal"],
  },
  {
    slug: "hexadecimal",
    title: "Hexadecimal",
    oneLiner: "Counting in base 16 — and why trackers love it.",
    category: "foundations",
    level: "beginner",
    seeAlso: ["slimentologika", "song-chain-phrase"],
  },
  {
    slug: "terminal-basics",
    title: "The Terminal",
    oneLiner: "What it is, how to open one, and why you'd want to.",
    category: "foundations",
    level: "beginner",
    seeAlso: ["running-k-os-locally"],
  },
  {
    slug: "running-k-os-locally",
    title: "Running K-OS Locally",
    oneLiner: "Cloning the repo, installing dependencies, starting the dev server.",
    category: "foundations",
    level: "beginner",
    seeAlso: ["terminal-basics", "dmpit-format"],
  },

  // Datamoshpit
  {
    slug: "song-chain-phrase",
    title: "Song → Chain → Phrase",
    oneLiner: "How a Datamoshpit composition is built up from layers.",
    category: "datamoshpit",
    level: "intermediate",
    seeAlso: ["effect-commands", "hexadecimal", "scene-vm"],
  },
  {
    slug: "effect-commands",
    title: "Effect Commands",
    oneLiner: "The two-letter codes that bend, slide, and chop your notes.",
    category: "datamoshpit",
    level: "intermediate",
    seeAlso: ["song-chain-phrase", "hexadecimal"],
  },
  {
    slug: "slimentologika",
    title: "Slimentologika",
    oneLiner: "The 16 pixel-glyphs that replace hex digits in K-OS.",
    category: "datamoshpit",
    level: "beginner",
    seeAlso: ["hexadecimal", "the-rules"],
  },

  // Visuals
  {
    slug: "per-instrument-visuals",
    title: "Per-Instrument Visuals",
    oneLiner: "Every instrument can carry a tiny visual scene that fires with its notes.",
    category: "visuals",
    level: "intermediate",
    seeAlso: ["scene-vm", "song-chain-phrase"],
  },
  {
    slug: "scene-vm",
    title: "The Scene VM",
    oneLiner: "How visuals run in lockstep with audio under the hood.",
    category: "visuals",
    level: "advanced",
    seeAlso: ["per-instrument-visuals", "song-chain-phrase"],
  },

  // Reference
  {
    slug: "dmpit-format",
    title: "The .dmpit File Format",
    oneLiner: "What's inside a saved K-OS project, and why.",
    category: "reference",
    level: "advanced",
    seeAlso: ["song-chain-phrase", "running-k-os-locally"],
  },
  {
    slug: "the-rules",
    title: "The Rules",
    oneLiner: "Pixel-correct, no rounded corners, and what those mean for contributors.",
    category: "reference",
    level: "beginner",
    seeAlso: ["welcome", "slimentologika"],
  },
  {
    slug: "glossary",
    title: "Glossary",
    oneLiner: "A–Z of K-OS terms.",
    category: "reference",
    level: "beginner",
  },
];

export const ARTICLES_BY_SLUG: Record<string, ArticleMeta> = Object.fromEntries(
  ARTICLES.map((a) => [a.slug, a]),
);

export function articlesInCategory(cat: ArticleCategory): ArticleMeta[] {
  return ARTICLES.filter((a) => a.category === cat);
}

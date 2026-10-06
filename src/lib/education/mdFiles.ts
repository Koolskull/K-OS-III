// Known markdown files referenced by the K-OS corpus and education content.
// These paths are resolved client-side via assetUrl() and must be available
// under /public at build/export time (see scripts/copy-docs.js).
export interface MdFileRef {
  path: string;
  title: string;
}

function titleFromPath(p: string): string {
  const base = p.split("/").pop() || p;
  const stem = base.replace(/\.[^.]+$/, "");
  // Replace underscores/dashes with spaces and title-case words
  const words = stem.split(/[_-]+/).map((w) => {
    if (!w) return w;
    // Preserve known acronyms
    const upper = w.toUpperCase();
    if (["K", "OS", "KOS", "K-WALLET", "NFT", "UI", "VM", "CPU", "EVM"].includes(upper)) {
      return upper;
    }
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
  // Special-case K-OS formatting
  const joined = words.join(" ").replace(/\bK Os\b/g, "K-OS");
  return joined;
}

// Manually curated list: include all docs/*.md plus select root/public files.
// If a file is removed from the repo later, it's harmless — resolveMdLink()
// will only activate when content links to an existing KNOWN_MD_FILES entry.
export const KNOWN_MD_FILES: MdFileRef[] = [
  // Root docs
  { path: "README.md", title: titleFromPath("README.md") },
  { path: "CONTRIBUTING.md", title: titleFromPath("CONTRIBUTING.md") },
  { path: "EDUCATION.md", title: titleFromPath("EDUCATION.md") },
  { path: "VISION.md", title: titleFromPath("VISION.md") },

  // Public-facing readmes that are already under /public
  { path: "public/education/README.md", title: titleFromPath("public/education/README.md") },
  { path: "public/reference/entries/README.md", title: titleFromPath("public/reference/entries/README.md") },

  // docs/ canonical files (subset explicitly named in the task)
  { path: "docs/EPISTEMIC_STANCE.md", title: titleFromPath("docs/EPISTEMIC_STANCE.md") },
  { path: "docs/KNOWLEDGE_CORPUS.md", title: titleFromPath("docs/KNOWLEDGE_CORPUS.md") },
  { path: "docs/REFERENCE_EDITORIAL.md", title: titleFromPath("docs/REFERENCE_EDITORIAL.md") },
  { path: "docs/ECONOMIC_STANCE.md", title: titleFromPath("docs/ECONOMIC_STANCE.md") },
  { path: "docs/CREATIVITY_AS_THE_WAY_OUT.md", title: titleFromPath("docs/CREATIVITY_AS_THE_WAY_OUT.md") },
  {
    path: "docs/CREATIVITY_AS_THE_WAY_OUT_README.md",
    title: titleFromPath("docs/CREATIVITY_AS_THE_WAY_OUT_README.md"),
  },
  { path: "docs/FOOLS_TRACK_STRUCTURE.md", title: titleFromPath("docs/FOOLS_TRACK_STRUCTURE.md") },
  { path: "docs/EDU_REVIEW.md", title: titleFromPath("docs/EDU_REVIEW.md") },
  { path: "docs/SEED_ISSUES.md", title: titleFromPath("docs/SEED_ISSUES.md") },
  { path: "docs/CHAT_SPEC.md", title: titleFromPath("docs/CHAT_SPEC.md") },
  { path: "docs/COMMANDS.md", title: titleFromPath("docs/COMMANDS.md") },
  { path: "docs/COMMERCE_SPEC.md", title: titleFromPath("docs/COMMERCE_SPEC.md") },
  { path: "docs/CONTROLLER_SUPPORT.md", title: titleFromPath("docs/CONTROLLER_SUPPORT.md") },
  { path: "docs/COUNSEL_OUTLINE.md", title: titleFromPath("docs/COUNSEL_OUTLINE.md") },
  { path: "docs/CREATIVE_WORKFLOW.md", title: titleFromPath("docs/CREATIVE_WORKFLOW.md") },
  { path: "docs/DATAMOSHPIT_GUIDE.md", title: titleFromPath("docs/DATAMOSHPIT_GUIDE.md") },
  { path: "docs/DATAMOSHPIT_VIDEO_SPEC.md", title: titleFromPath("docs/DATAMOSHPIT_VIDEO_SPEC.md") },
  { path: "docs/DEPLOYMENT.md", title: titleFromPath("docs/DEPLOYMENT.md") },
  { path: "docs/FORWARD_STATUS.md", title: titleFromPath("docs/FORWARD_STATUS.md") },
  { path: "docs/FUNDING_PLAN.md", title: titleFromPath("docs/FUNDING_PLAN.md") },
  { path: "docs/GROOVE_AND_TIMING.md", title: titleFromPath("docs/GROOVE_AND_TIMING.md") },
  { path: "docs/K_WALLET_SPEC.md", title: titleFromPath("docs/K_WALLET_SPEC.md") },
  { path: "docs/MOBILE_CREATIVE_UI.md", title: titleFromPath("docs/MOBILE_CREATIVE_UI.md") },
  { path: "docs/NAVIGATION_AND_INPUT.md", title: titleFromPath("docs/NAVIGATION_AND_INPUT.md") },
  { path: "docs/NFT_MINTING.md", title: titleFromPath("docs/NFT_MINTING.md") },
  { path: "docs/NODEMAP.md", title: titleFromPath("docs/NODEMAP.md") },
  { path: "docs/NOTES.md", title: titleFromPath("docs/NOTES.md") },
  { path: "docs/PRODUCTION_PROTOCOL.md", title: titleFromPath("docs/PRODUCTION_PROTOCOL.md") },
  { path: "docs/SHOTLIST_SPEC.md", title: titleFromPath("docs/SHOTLIST_SPEC.md") },

  // Additional docs that exist in this repo (not exhaustive but helpful)
  { path: "docs/SLIMENTOLOGIKA_GUIDE.md", title: titleFromPath("docs/SLIMENTOLOGIKA_GUIDE.md") },
  { path: "docs/WALLET_DEPENDENCIES.md", title: titleFromPath("docs/WALLET_DEPENDENCIES.md") },
  { path: "docs/SPONSOR_POLICY.md", title: titleFromPath("docs/SPONSOR_POLICY.md") },
  { path: "docs/SOUND_ENGINES.md", title: titleFromPath("docs/SOUND_ENGINES.md") },
];

/**
 * Find a known markdown file by:
 *  - exact path match (case-sensitive),
 *  - filename match (case-insensitive),
 *  - or by path suffix match (case-insensitive).
 *
 * Accepts inputs like "EPISTEMIC_STANCE.md", "docs/EPISTEMIC_STANCE.md",
 * "/docs/EPISTEMIC_STANCE.md", "./docs/EPISTEMIC_STANCE.md".
 */
export function findMdFile(nameOrPath: string): MdFileRef | null {
  const raw = (nameOrPath || "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/^\.?\//, "").replace(/^\/+/, "");
  const noAnchor = cleaned.split("#")[0];
  // Exact path
  const exact = KNOWN_MD_FILES.find((f) => f.path === noAnchor);
  if (exact) return exact;
  // Filename (case-insensitive)
  const base = noAnchor.split("/").pop()!;
  const baseLower = base.toLowerCase();
  const byName = KNOWN_MD_FILES.find((f) => f.path.split("/").pop()!.toLowerCase() === baseLower);
  if (byName) return byName;
  // Path suffix (case-insensitive)
  const suffixLower = noAnchor.toLowerCase();
  const bySuffix =
    KNOWN_MD_FILES.find((f) => f.path.toLowerCase().endsWith(suffixLower)) ??
    KNOWN_MD_FILES.find((f) => f.path.toLowerCase().endsWith("/" + suffixLower));
  return bySuffix ?? null;
}

/** Returns the filename (last path segment) for a download hint. */
export function mdDownloadFilename(path: string): string {
  const p = (path || "").trim();
  const last = (p.replace(/^\/+/, "").split("/").pop() as string) || "document.md";
  return last;
}


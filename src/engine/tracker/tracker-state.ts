/*
 *                    ☦
 *      TRACKER STATE HELPERS
 *
 *  Pure functions over ProjectData for the LGPT-style indirect navigation:
 *  - Phrases and Chains are identified by 0..255 IDs (not array positions)
 *  - The Chain editor references phrases BY ID
 *  - The Song editor references chains BY ID
 *  - Phrases/Chains are lazily created when first edited (the "ensure" pattern)
 *
 *  Mirrors the LGPT model in:
 *    LittleGPTracker-master/sources/Application/Views/ViewData.{h,cpp}
 *    where currentPhrase_ and currentChain_ are 8-bit IDs and the data is
 *    stored in flat 256-slot tables indexed by ID.
 */

import type { ProjectData, Phrase, Chain } from "@/types/tracker";

/* ------------------------------------------------------------------ */
/*  Find — return null if missing                                      */
/* ------------------------------------------------------------------ */

export function findPhraseById(project: ProjectData, id: number): Phrase | null {
  return project.phrases.find((p) => p.id === id) ?? null;
}

export function findChainById(project: ProjectData, id: number): Chain | null {
  return project.chains.find((c) => c.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Ensure — create-on-demand if missing, return updated state         */
/* ------------------------------------------------------------------ */

function blankPhrase(id: number): Phrase {
  return {
    id,
    rows: Array.from({ length: 16 }, () => ({
      note: null, instrument: null, effect1: null, effect2: null, slice: null,
    })),
  };
}

function blankChain(id: number): Chain {
  return {
    id,
    steps: Array.from({ length: 16 }, () => ({ phrase: null, transpose: 0 })),
  };
}

export function ensurePhrase(
  project: ProjectData,
  id: number,
): { project: ProjectData; phrase: Phrase } {
  const existing = findPhraseById(project, id);
  if (existing) return { project, phrase: existing };
  const phrase = blankPhrase(id);
  return {
    project: { ...project, phrases: [...project.phrases, phrase] },
    phrase,
  };
}

export function ensureChain(
  project: ProjectData,
  id: number,
): { project: ProjectData; chain: Chain } {
  const existing = findChainById(project, id);
  if (existing) return { project, chain: existing };
  const chain = blankChain(id);
  return {
    project: { ...project, chains: [...project.chains, chain] },
    chain,
  };
}

/* ------------------------------------------------------------------ */
/*  Update-or-create — apply a mutator to a phrase/chain by id        */
/* ------------------------------------------------------------------ */

/**
 * Apply `mut` to the phrase with the given id, creating a blank one first
 * if it doesn't exist. Returns a new ProjectData with the mutation applied.
 */
export function withPhrase(
  project: ProjectData,
  id: number,
  mut: (phrase: Phrase) => Phrase,
): ProjectData {
  const ensured = ensurePhrase(project, id);
  const updated = mut(ensured.phrase);
  return {
    ...ensured.project,
    phrases: ensured.project.phrases.map((p) => (p.id === id ? updated : p)),
  };
}

/**
 * Apply `mut` to the chain with the given id, creating a blank one first
 * if it doesn't exist. Returns a new ProjectData with the mutation applied.
 */
export function withChain(
  project: ProjectData,
  id: number,
  mut: (chain: Chain) => Chain,
): ProjectData {
  const ensured = ensureChain(project, id);
  const updated = mut(ensured.chain);
  return {
    ...ensured.project,
    chains: ensured.project.chains.map((c) => (c.id === id ? updated : c)),
  };
}

/* ------------------------------------------------------------------ */
/*  Read-with-fallback — get a phrase/chain or a transient blank      */
/* ------------------------------------------------------------------ */

/**
 * Return the phrase by id, or a transient blank for read-only display when
 * the phrase hasn't been created yet. Caller MUST NOT mutate this object —
 * use withPhrase for writes.
 */
export function getPhraseOrBlank(project: ProjectData, id: number): Phrase {
  return findPhraseById(project, id) ?? blankPhrase(id);
}

/**
 * Return the chain by id, or a transient blank for read-only display when
 * the chain hasn't been created yet. Caller MUST NOT mutate this object —
 * use withChain for writes.
 */
export function getChainOrBlank(project: ProjectData, id: number): Chain {
  return findChainById(project, id) ?? blankChain(id);
}

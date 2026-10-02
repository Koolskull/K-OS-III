/*
 *  Active skin pack for Thrash Tracker / Datamoshpit.
 *  Persists the user's choice in localStorage so creative packs stick.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadDefaultSkinPack,
  loadSkinPack,
  loadSkinPackIndex,
  type ResolvedSkinPack,
  type SkinPackIndexEntry,
} from "@/lib/faceplates";

const STORAGE_KEY = "kos-faceplate-skin-pack";

export function useSkinPack(preferredId?: string | null) {
  const [pack, setPack] = useState<ResolvedSkinPack | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<SkinPackIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const catalogRef = useRef<SkinPackIndexEntry[]>([]);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const select = useCallback(async (id: string) => {
    setActiveId(id);
    activeIdRef.current = id;
    setLoading(true);
    setError(null);
    try {
      const next = await loadSkinPack(id);
      if (!next) {
        setError(`Pack not found: ${id}`);
        setLoading(false);
        return;
      }
      setPack(next);
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        /* private mode */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load skin pack");
    } finally {
      setLoading(false);
    }
  }, []);

  const cycle = useCallback(() => {
    const list = catalogRef.current;
    if (list.length === 0) return;
    const current = activeIdRef.current ?? list[0].id;
    const idx = list.findIndex((p) => p.id === current);
    const from = idx >= 0 ? idx : 0;
    const next = list[(from + 1) % list.length];
    void select(next.id);
  }, [select]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const index = await loadSkinPackIndex();
        if (cancelled) return;
        setCatalog(index.packs);
        catalogRef.current = index.packs;

        let id = preferredId ?? null;
        if (!id) {
          try {
            id = localStorage.getItem(STORAGE_KEY);
          } catch {
            id = null;
          }
        }
        if (!id || !index.packs.some((p) => p.id === id)) {
          id = index.defaultPackId;
        }

        const loaded = (await loadSkinPack(id!)) ?? (await loadDefaultSkinPack());
        if (cancelled) return;
        setPack(loaded);
        const resolvedId = loaded?.manifest.id ?? id!;
        setActiveId(resolvedId);
        activeIdRef.current = resolvedId;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Skin catalog failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preferredId]);

  return { pack, activeId, catalog, loading, error, select, cycle };
}

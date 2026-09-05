"use client";

/*
 * Shared production board.
 * SHOTLIST owns plates / X-sheets. PRODEV owns crew, hours, tasks, vault view.
 * STUDIO owns chain writes. All three read/write this local document so a
 * change in one window shows up in the others.
 */

import { useCallback, useEffect, useState } from "react";
import {
  seedUidFromSequence,
  type Sequence,
  type Shot,
  type ShotCredit,
  type ShotStatus,
} from "@/components/apps/shotlist/shotlistShared";

export type TaskStatus = "todo" | "in-progress" | "done";

export interface TaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  owner: string;
  hours: string;
  shotId: number | null;
}

export interface ProductionBoard {
  sequence: Sequence;
  productionId: string;
  slug: string;
  defaultRoyaltyBps: string;
  tasks: TaskItem[];
}

const STORAGE_KEY = "k-os-production-board";
const EVENT = "kos-production-board";

export function emptyBoard(): ProductionBoard {
  return {
    sequence: { id: 1, name: "UNTITLED SEQUENCE", fps: 24, shots: [] },
    productionId: "",
    slug: "",
    defaultRoyaltyBps: "500",
    tasks: [],
  };
}

function normalizeShot(raw: Partial<Shot> & { id: number }): Shot {
  const status: ShotStatus =
    raw.status === "review" || raw.status === "approved" ? raw.status : "draft";
  const credits: ShotCredit[] = Array.isArray(raw.credits)
    ? raw.credits.map((c) => ({
        account: String(c.account ?? ""),
        role: String(c.role ?? ""),
        weight: String(c.weight ?? "1"),
        hours: String(c.hours ?? "0"),
      }))
    : [];
  return {
    id: raw.id,
    title: raw.title ?? "SHOT",
    description: raw.description ?? "",
    durationFrames: Math.max(1, Number(raw.durationFrames) || 24),
    audioNotes: raw.audioNotes ?? "",
    bg: raw.bg === "black" ? "black" : "white",
    orientation: raw.orientation === "portrait" ? "portrait" : "landscape",
    plateW: Number(raw.plateW) || 0,
    plateH: Number(raw.plateH) || 0,
    thumbnail: raw.thumbnail ?? null,
    hasCommittedThumbnail: Boolean(raw.hasCommittedThumbnail),
    xsheet: Array.isArray(raw.xsheet) ? raw.xsheet : [],
    status,
    credits,
    chain: raw.chain,
  };
}

function normalizeBoard(raw: Partial<ProductionBoard> | null): ProductionBoard {
  const base = emptyBoard();
  if (!raw) return base;
  const sequence: Sequence = {
    id: raw.sequence?.id ?? base.sequence.id,
    name: raw.sequence?.name ?? "UNTITLED SEQUENCE",
    fps: Number(raw.sequence?.fps) || 24,
    shots: Array.isArray(raw.sequence?.shots)
      ? raw.sequence.shots.map((s) => normalizeShot(s))
      : [],
  };
  seedUidFromSequence(sequence);
  return {
    sequence,
    productionId: raw.productionId ?? "",
    slug: raw.slug ?? "",
    defaultRoyaltyBps: raw.defaultRoyaltyBps ?? "500",
    tasks: Array.isArray(raw.tasks)
      ? raw.tasks.map((t) => ({
          id: String(t.id),
          title: String(t.title ?? ""),
          status:
            t.status === "in-progress" || t.status === "done" ? t.status : "todo",
          owner: String(t.owner ?? ""),
          hours: String(t.hours ?? "0"),
          shotId: typeof t.shotId === "number" ? t.shotId : null,
        }))
      : [],
  };
}

export function loadBoard(): ProductionBoard {
  if (typeof window === "undefined") return emptyBoard();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBoard();
    return normalizeBoard(JSON.parse(raw) as Partial<ProductionBoard>);
  } catch {
    return emptyBoard();
  }
}

export function saveBoard(board: ProductionBoard) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}

export function newTaskId(): string {
  return `t-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
}

export function useProduction() {
  const [board, setBoardState] = useState<ProductionBoard>(loadBoard);

  useEffect(() => {
    const sync = () => setBoardState(loadBoard());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setBoard = useCallback(
    (next: ProductionBoard | ((prev: ProductionBoard) => ProductionBoard)) => {
      const value = typeof next === "function" ? next(loadBoard()) : next;
      saveBoard(value);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(EVENT));
      }
      setBoardState(value);
    },
    [],
  );

  const setSequence = useCallback(
    (next: Sequence | ((prev: Sequence) => Sequence)) => {
      setBoard((prev) => ({
        ...prev,
        sequence: typeof next === "function" ? next(prev.sequence) : next,
      }));
    },
    [setBoard],
  );

  const patchShot = useCallback(
    (id: number, patch: Partial<Shot>) => {
      setSequence((prev) => ({
        ...prev,
        shots: prev.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
    },
    [setSequence],
  );

  return {
    board,
    setBoard,
    sequence: board.sequence,
    setSequence,
    patchShot,
  };
}

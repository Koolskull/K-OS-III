/*
 * OS-level creative workflow bus.
 * Lets apps hand plates/sprites to each other and return without embedding.
 *
 *   shotlist ──handoffTo('kooldraw')──▶ KoolDraw
 *   shotlist ◀──complete(result)──────┘
 */

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CreativeAppId,
  CreativeAssetKind,
  CreativeResult,
  CreativeReturn,
  CreativeSession,
} from "./types";

export type { CreativeAppId, CreativeAssetKind, CreativeResult, CreativeReturn, CreativeSession };

let sessionCounter = 0;

export interface HandoffRequest {
  sourceApp: CreativeAppId;
  targetApp: CreativeAppId;
  kind: CreativeAssetKind;
  label: string;
  width: number;
  height: number;
  dataUrl?: string | null;
  mono?: boolean;
  bg?: "black" | "white";
  ref?: Record<string, unknown>;
}

interface CreativeWorkflowValue {
  /** Session the *target* app should load (null when idle) */
  session: CreativeSession | null;
  /** Populated when target completes/cancels — *source* app consumes then clearReturn() */
  lastReturn: CreativeReturn | null;
  /** Start a handoff and launch/focus the target app */
  handoffTo: (req: HandoffRequest) => string;
  /** Target app: finish and return payload to source */
  complete: (result: CreativeResult) => void;
  /** Target app: abort; source gets cancelled:true */
  cancel: () => void;
  /** Source app: acknowledge lastReturn */
  clearReturn: () => void;
  /** Is this app currently the active handoff target? */
  isTarget: (app: CreativeAppId) => boolean;
  /** Session aimed at this app (or null) */
  sessionFor: (app: CreativeAppId) => CreativeSession | null;
}

const CreativeWorkflowContext = createContext<CreativeWorkflowValue | null>(null);

interface ProviderProps {
  children: React.ReactNode;
  /** Shell injects launch/focus so handoffs open the right window */
  onLaunchApp: (appId: string) => void;
}

export function CreativeWorkflowProvider({ children, onLaunchApp }: ProviderProps) {
  const [session, setSession] = useState<CreativeSession | null>(null);
  const [lastReturn, setLastReturn] = useState<CreativeReturn | null>(null);
  const sessionRef = useRef<CreativeSession | null>(null);
  sessionRef.current = session;

  const launchRef = useRef(onLaunchApp);
  launchRef.current = onLaunchApp;

  const handoffTo = useCallback((req: HandoffRequest): string => {
    sessionCounter += 1;
    const next: CreativeSession = {
      id: `cw-${sessionCounter}-${Date.now()}`,
      sourceApp: req.sourceApp,
      targetApp: req.targetApp,
      kind: req.kind,
      label: req.label,
      width: req.width,
      height: req.height,
      dataUrl: req.dataUrl ?? null,
      mono: req.mono,
      bg: req.bg,
      ref: req.ref ?? {},
      createdAt: Date.now(),
    };
    setLastReturn(null);
    setSession(next);
    // Defer launch so consumers see session on next paint inside target
    queueMicrotask(() => launchRef.current(req.targetApp));
    return next.id;
  }, []);

  const complete = useCallback((result: CreativeResult) => {
    const s = sessionRef.current;
    if (!s) return;
    setLastReturn({ session: s, result, cancelled: false });
    setSession(null);
    queueMicrotask(() => launchRef.current(s.sourceApp));
  }, []);

  const cancel = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    setLastReturn({ session: s, result: null, cancelled: true });
    setSession(null);
    queueMicrotask(() => launchRef.current(s.sourceApp));
  }, []);

  const clearReturn = useCallback(() => {
    setLastReturn(null);
  }, []);

  const isTarget = useCallback(
    (app: CreativeAppId) => session?.targetApp === app,
    [session],
  );

  const sessionFor = useCallback(
    (app: CreativeAppId) => (session?.targetApp === app ? session : null),
    [session],
  );

  const value = useMemo<CreativeWorkflowValue>(
    () => ({
      session,
      lastReturn,
      handoffTo,
      complete,
      cancel,
      clearReturn,
      isTarget,
      sessionFor,
    }),
    [
      session,
      lastReturn,
      handoffTo,
      complete,
      cancel,
      clearReturn,
      isTarget,
      sessionFor,
    ],
  );

  return (
    <CreativeWorkflowContext.Provider value={value}>
      {children}
    </CreativeWorkflowContext.Provider>
  );
}

export function useCreativeWorkflow(): CreativeWorkflowValue {
  const ctx = useContext(CreativeWorkflowContext);
  if (!ctx) {
    // Safe no-op outside provider (tests / isolated embeds)
    return {
      session: null,
      lastReturn: null,
      handoffTo: () => "",
      complete: () => undefined,
      cancel: () => undefined,
      clearReturn: () => undefined,
      isTarget: () => false,
      sessionFor: () => null,
    };
  }
  return ctx;
}

/** Optional hook — null when provider missing (no throw). */
export function useCreativeWorkflowOptional(): CreativeWorkflowValue | null {
  return useContext(CreativeWorkflowContext);
}

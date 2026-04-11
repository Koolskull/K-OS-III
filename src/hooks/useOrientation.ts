/*
 *            ☦
 *      ╔══════════════════╗
 *      ║  ORIENTATION     ║
 *      ╚══════════════════╝
 *
 *   Detects portrait vs landscape viewport orientation.
 */

"use client";

import { useState, useEffect } from "react";

export interface OrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
}

export function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>({
    isPortrait: false,
    isLandscape: true,
  });

  useEffect(() => {
    const update = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setState({ isPortrait: portrait, isLandscape: !portrait });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return state;
}

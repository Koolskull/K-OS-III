"use client";

import React, { useEffect, useRef } from "react";
import { mediaUrl } from "@/lib/buildFlags";
import type { MusicTrack } from "@/lib/discography";

interface WebampOverlayProps {
  tracks: MusicTrack[];
  onClose: () => void;
}

export function WebampOverlay({ tracks, onClose }: WebampOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    (async () => {
      const { default: Webamp } = await import("webamp");
      if (cancelled || !containerRef.current) return;
      if (typeof Webamp.browserIsSupported === "function" && !Webamp.browserIsSupported()) {
        console.warn("Webamp is not supported in this browser.");
        return;
      }

      if (instanceRef.current) {
        try {
          instanceRef.current.dispose();
        } catch {
          /* ignore */
        }
        instanceRef.current = null;
      }

      const skin = mediaUrl("/webampskins/BlackSimple.wsz");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const webamp = new (Webamp as any)({
        initialTracks: tracks,
        zIndex: 1000,
        initialSkin: skin ? { url: skin } : undefined,
        availableSkins: [
          { url: mediaUrl("/webampskins/BlackSimple.wsz"), name: "Black Simple" },
          { url: mediaUrl("/webampskins/Chemical_Reaction.wsz"), name: "Chemical Reaction" },
        ],
      });

      instanceRef.current = webamp;
      webamp.onClose(() => {
        onClose();
        try {
          webamp.dispose();
        } catch {
          /* ignore */
        }
        instanceRef.current = null;
        return true;
      });

      try {
        await webamp.renderWhenReady(containerRef.current);
      } catch (err) {
        console.error("Webamp render failed", err);
      }
    })();

    return () => {
      cancelled = true;
      if (instanceRef.current) {
        try {
          instanceRef.current.dispose();
        } catch {
          /* ignore */
        }
        instanceRef.current = null;
      }
    };
  }, [tracks, onClose]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    />
  );
}

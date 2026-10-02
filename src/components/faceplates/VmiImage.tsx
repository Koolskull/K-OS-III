/*
 *  Pixel-correct VMI image layer with state fallbacks.
 *  No rounded corners. image-rendering: pixelated.
 */

"use client";

import React, { useEffect, useState } from "react";

interface VmiImageProps {
  urls: string[];
  alt?: string;
  fit?: "cover" | "contain" | "fill";
  style?: React.CSSProperties;
  className?: string;
}

export function VmiImage({
  urls,
  alt = "",
  fit = "cover",
  style,
  className,
}: VmiImageProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [urls.join("|")]);

  if (!urls.length) return null;
  const src = urls[Math.min(index, urls.length - 1)];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      onError={() => {
        setIndex((i) => (i + 1 < urls.length ? i + 1 : i));
      }}
      style={{
        imageRendering: "pixelated",
        objectFit: fit === "fill" ? "fill" : fit,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
    />
  );
}

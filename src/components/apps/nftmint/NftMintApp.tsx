"use client";

import React, { useEffect, useState } from "react";
import { ALL_MINTS, isKnownMintSlug } from "@/data/scatter-mints";
import { MintHeroPage } from "./MintHeroPage";

function hashState(): { slug: string; gallery: boolean } {
  const fallback = ALL_MINTS[0]?.slug ?? "mialien-eth";
  if (typeof window === "undefined") return { slug: fallback, gallery: false };
  if (window.location.hash === "#nfts") return { slug: fallback, gallery: true };
  const match = window.location.hash.match(/^#mint\/([a-z0-9-]+)/i);
  const slug = match && isKnownMintSlug(match[1]) ? match[1] : fallback;
  return { slug, gallery: false };
}

export function NftMintApp() {
  const [state, setState] = useState(hashState);
  useEffect(() => {
    const onHash = () => setState(hashState());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return (
    <MintHeroPage
      slug={state.slug}
      initialGallery={state.gallery}
      onOpenSlug={(next) => {
        setState({ slug: next, gallery: false });
        window.history.replaceState(null, "", `#mint/${next}`);
      }}
    />
  );
}

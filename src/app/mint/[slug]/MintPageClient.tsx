"use client";

import { MintHeroPage } from "@/components/apps/nftmint/MintHeroPage";

export function MintPageClient({ slug }: { slug: string }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <MintHeroPage slug={slug} standalone />
    </div>
  );
}

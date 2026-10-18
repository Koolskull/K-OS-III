import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_MINTS, getScatterMint, isKnownMintSlug } from "@/data/scatter-mints";
import { MintPageClient } from "./MintPageClient";

export function generateStaticParams() {
  return ALL_MINTS.map((c) => ({ slug: c.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const def = getScatterMint(slug);
  if (!def) return { title: "NFT MINT" };
  return {
    title: `${def.title} — NFT MINT`,
    description: def.tagline,
  };
}

export default async function MintPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isKnownMintSlug(slug)) notFound();
  return <MintPageClient slug={slug} />;
}

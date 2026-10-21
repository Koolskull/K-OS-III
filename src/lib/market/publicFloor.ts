import { fallbackTokenImage, floorCollections, isWideArt } from "@/data/sanctioned-nfts";
import { askTile, type PublicAsk } from "@/lib/market/askTile";
import { type SaleTile } from "@/lib/market/opensea";

export async function publicSaleTiles(collectionId: string): Promise<SaleTile[]> {
  const cols = (collectionId === "all" ? floorCollections() : floorCollections().filter((col) => col.id === collectionId)).filter(
    (col) => col.openseaSlug,
  );
  const settled = await Promise.allSettled(cols.map(async (col) => ({ col, items: await readPublic(col.openseaSlug!) })));
  const pages = settled.flatMap((row) => (row.status === "fulfilled" ? [row.value] : []));
  if (!pages.length) throw new Error("OpenSea listings could not be read.");
  const tiles: SaleTile[] = [];
  for (const page of pages) {
    for (const ask of page.items) {
      const tile = askTile(
        {
          id: page.col.id,
          name: page.col.name,
          address: page.col.address,
          slug: page.col.openseaSlug || "",
          wide: isWideArt(page.col.id),
          localImage: fallbackTokenImage(page.col.address, ask.tokenId),
        },
        ask,
      );
      if (tile) tiles.push(tile);
    }
  }
  return tiles;
}

async function readPublic(slug: string): Promise<PublicAsk[]> {
  const live = await loadAsks(`/floor.php?slug=${encodeURIComponent(slug)}`);
  if (live?.length) return live;
  const snap = await loadAsks(`/floor/${encodeURIComponent(slug)}.json`);
  if (snap?.length) return snap;
  if (live) return live;
  if (snap) return snap;
  throw new Error("OpenSea listings could not be read.");
}

async function loadAsks(url: string): Promise<PublicAsk[] | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const body = (await res.json()) as { items?: unknown };
    if (!Array.isArray(body.items)) return null;
    const items: PublicAsk[] = [];
    for (const row of body.items) {
      if (!row || typeof row !== "object") continue;
      const rec = row as Record<string, unknown>;
      const tokenId = typeof rec.tokenId === "string" ? rec.tokenId : "";
      const symbol = typeof rec.symbol === "string" ? rec.symbol : "";
      const unit = typeof rec.unit === "number" ? rec.unit : Number(rec.unit);
      if (!/^\d+$/.test(tokenId) || !symbol || !Number.isFinite(unit)) continue;
      items.push({
        tokenId,
        name: typeof rec.name === "string" ? rec.name : "",
        imageUrl: typeof rec.imageUrl === "string" ? rec.imageUrl : "",
        maker: typeof rec.maker === "string" ? rec.maker : "",
        symbol,
        unit,
        listingId: typeof rec.listingId === "string" ? rec.listingId : "",
      });
    }
    return items;
  } catch {
    return null;
  }
}

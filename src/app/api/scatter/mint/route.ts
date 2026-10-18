import { NextResponse } from "next/server";
import { SCATTER_MINTS } from "@/data/scatter-mints";
import { SCATTER_API } from "@/lib/scatter";

const HDR = { Accept: "application/json", "User-Agent": "koolskull-os/1.0" };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    slug?: string;
    minterAddress?: string;
    listId?: string;
    quantity?: number;
  } | null;

  if (!body?.slug || !body.minterAddress || !body.listId) {
    return NextResponse.json({ error: "slug, minterAddress, listId required" }, { status: 400 });
  }

  const def = SCATTER_MINTS.find((c) => c.slug === body.slug);
  if (!def) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const colRes = await fetch(`${SCATTER_API}/collection/${def.slug}`, {
    headers: HDR,
    cache: "no-store",
  });
  if (!colRes.ok) return NextResponse.json({ error: "Collection lookup failed" }, { status: 502 });
  const col = (await colRes.json()) as { address?: string; chain_id?: number; num_items?: number; max_items?: number };
  const minted = Number(col.num_items ?? 0);
  const max = Number(col.max_items ?? 0);
  if (max > 0 && minted >= max) {
    return NextResponse.json({ error: "SOLD OUT" }, { status: 409 });
  }
  const quantity = Math.max(1, Math.min(20, Math.round(Number(body.quantity) || 1)));
  if (max > 0 && minted + quantity > max) {
    return NextResponse.json({ error: "Not enough supply left" }, { status: 409 });
  }

  const mintRes = await fetch(`${SCATTER_API}/mint`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...HDR },
    body: JSON.stringify({
      collectionAddress: col.address,
      chainId: col.chain_id ?? def.chainId,
      minterAddress: body.minterAddress,
      lists: [{ id: body.listId, quantity }],
    }),
  });

  const data = await mintRes.json().catch(() => null);
  if (!mintRes.ok) {
    return NextResponse.json({ error: (data && data.error) || "Scatter mint failed" }, { status: 502 });
  }
  return NextResponse.json(data);
}

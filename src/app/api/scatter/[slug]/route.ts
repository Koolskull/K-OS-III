import { NextResponse } from "next/server";
import { isKnownScatterSlug } from "@/data/scatter-mints";
import { SCATTER_API, mapScatterCollection } from "@/lib/scatter";

const HDR = { Accept: "application/json", "User-Agent": "koolskull-os/1.0" };

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  if (!isKnownScatterSlug(slug)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const [colRes, listRes] = await Promise.all([
    fetch(`${SCATTER_API}/collection/${slug}`, { headers: HDR, cache: "no-store" }),
    fetch(`${SCATTER_API}/collection/${slug}/eligible-invite-lists`, {
      headers: HDR,
      cache: "no-store",
    }),
  ]);

  if (!colRes.ok) {
    return NextResponse.json({ error: "Scatter collection fetch failed" }, { status: 502 });
  }

  const col = (await colRes.json()) as Record<string, unknown>;
  const lists = listRes.ok ? ((await listRes.json()) as unknown[]) : [];
  return NextResponse.json(mapScatterCollection(slug, col, Array.isArray(lists) ? lists : []));
}

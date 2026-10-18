import { NextResponse } from "next/server";
import { ethCall } from "@/lib/alchemy";
import { MIYAMAKER_MINI } from "@/data/sanctioned-nfts";

function asUint(hex: string): number {
  if (!hex || hex === "0x") return 0;
  return Number(BigInt(hex));
}

export async function GET() {
  try {
    const [supplyHex, maxHex] = await Promise.all([
      ethCall(MIYAMAKER_MINI.address, "0x18160ddd"),
      ethCall(MIYAMAKER_MINI.address, "0xd5abeb01"),
    ]);
    const minted = asUint(supplyHex);
    const max = asUint(maxHex) || MIYAMAKER_MINI.maxSupply;
    return NextResponse.json({
      address: MIYAMAKER_MINI.address,
      chainId: MIYAMAKER_MINI.chainId,
      minted,
      max,
      remaining: Math.max(0, max - minted),
      soldOut: max > 0 && minted >= max,
      mintPriceEth: MIYAMAKER_MINI.mintPriceEth,
      mintPriceWei: MIYAMAKER_MINI.mintPriceWei,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status lookup failed" },
      { status: 502 },
    );
  }
}

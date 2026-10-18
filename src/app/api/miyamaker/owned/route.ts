import { NextResponse } from "next/server";
import { getNftsForOwnerByContracts } from "@/lib/alchemy";
import {
  SANCTIONED_NFTS,
  fallbackTokenImage,
  getSanctioned,
  isEthAddress,
  sanctionedAddresses,
} from "@/data/sanctioned-nfts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") ?? "").trim();
  if (!isEthAddress(address)) {
    return NextResponse.json({ error: "Valid Ethereum address required" }, { status: 400 });
  }

  try {
    const nfts = await getNftsForOwnerByContracts(address, sanctionedAddresses());
    const items = nfts.map((n) => {
      const col = getSanctioned(n.contractAddress);
      return {
        contractAddress: n.contractAddress,
        tokenId: n.tokenId,
        name: n.name,
        image: n.image || fallbackTokenImage(n.contractAddress, n.tokenId),
        collectionId: col?.id ?? null,
        collectionName: col?.name ?? n.collectionName ?? null,
      };
    });
    const held = SANCTIONED_NFTS.filter((c) =>
      items.some((n) => n.contractAddress.toLowerCase() === c.address.toLowerCase()),
    ).map((c) => c.id);
    return NextResponse.json({ address, held, items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Owned NFT lookup failed" },
      { status: 502 },
    );
  }
}

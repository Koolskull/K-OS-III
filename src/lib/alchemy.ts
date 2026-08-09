/*
 *                    ☦
 *        ACCOUNTS — ALCHEMY NFT LOOKUP
 *
 *   Server-side only wrapper around Alchemy's NFT API — used to let a user
 *   pick one of their own owned NFTs as a profile picture (see
 *   docs/ACCOUNTS_SPEC.md, K_WALLET_SPEC.md § 9 open question 2 on default
 *   RPC/API providers). ALCHEMY_API_KEY must never reach the browser; every
 *   caller of this module is an API route handler, not client code.
 */

export interface OwnedNft {
  contractAddress: string;
  tokenId: string;
  name: string | null;
  /** Already-resolved HTTPS image URL (Alchemy's cachedUrl) — safe to use directly in <img>. */
  image: string | null;
}

interface AlchemyNftResponse {
  ownedNfts: Array<{
    contract: { address: string; name?: string | null };
    tokenId: string;
    name?: string | null;
    image?: { cachedUrl?: string | null; thumbnailUrl?: string | null; originalUrl?: string | null };
  }>;
}

/** Networks Alchemy's NFT API supports, as subdomain prefixes. Start with mainnet only. */
export type AlchemyNetwork = "eth-mainnet" | "polygon-mainnet" | "base-mainnet";

export async function getNftsForOwner(
  address: string,
  network: AlchemyNetwork = "eth-mainnet",
): Promise<OwnedNft[]> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("ALCHEMY_API_KEY is not set — add it to .env.local (never commit it).");
  }

  const url = new URL(`https://${network}.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`);
  url.searchParams.set("owner", address);
  url.searchParams.set("withMetadata", "true");
  url.searchParams.set("pageSize", "100");

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Alchemy request failed (HTTP ${res.status}).`);
  }
  const data = (await res.json()) as AlchemyNftResponse;

  return data.ownedNfts
    .map((n) => ({
      contractAddress: n.contract.address,
      tokenId: n.tokenId,
      name: n.name ?? n.contract.name ?? null,
      image: n.image?.cachedUrl ?? n.image?.thumbnailUrl ?? n.image?.originalUrl ?? null,
    }))
    .filter((n) => n.image); // skip NFTs with no renderable image for a PFP picker
}

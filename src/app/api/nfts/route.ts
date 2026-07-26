import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { getNftsForOwner, type AlchemyNetwork } from "@/lib/alchemy";

const VALID_NETWORKS: AlchemyNetwork[] = ["eth-mainnet", "polygon-mainnet", "base-mainnet"];

/** NFTs owned by the signed-in user's linked Ethereum address — for the profile-picture picker. */
export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const linked = await pool.query(
    `SELECT "providerAccountId" FROM accounts WHERE "userId" = $1 AND provider = 'ethereum' LIMIT 1`,
    [userId],
  );
  const address = linked.rows[0]?.providerAccountId;
  if (!address) {
    return NextResponse.json({ error: "No Ethereum wallet linked to this account" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const networkParam = searchParams.get("network");
  const network = VALID_NETWORKS.includes(networkParam as AlchemyNetwork)
    ? (networkParam as AlchemyNetwork)
    : "eth-mainnet";

  try {
    const nfts = await getNftsForOwner(address, network);
    return NextResponse.json(nfts);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch NFTs" },
      { status: 502 },
    );
  }
}

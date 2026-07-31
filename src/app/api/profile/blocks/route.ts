import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { getNftsForOwner, type AlchemyNetwork } from "@/lib/alchemy";
import {
  collectNftRefs,
  ProfileSanitizeError,
  sanitizeProfileBlocks,
  type NftRef,
  type ProfileBlockInput,
} from "@/lib/profile-sanitize";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const result = await pool.query(
    `SELECT id, block_type, payload, sort_order
     FROM profile_blocks WHERE user_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [Number(userId)],
  );
  return NextResponse.json({ blocks: result.rows });
}

async function ownedNftKeys(userId: string): Promise<Set<string>> {
  const eth = await pool.query(
    `SELECT "providerAccountId" FROM accounts WHERE "userId" = $1 AND provider = 'ethereum'`,
    [Number(userId)],
  );
  const keys = new Set<string>();
  const networks: AlchemyNetwork[] = ["eth-mainnet"];
  for (const row of eth.rows as { providerAccountId: string }[]) {
    for (const network of networks) {
      try {
        const nfts = await getNftsForOwner(row.providerAccountId, network);
        for (const n of nfts) {
          keys.add(`${network}:${n.contractAddress.toLowerCase()}:${n.tokenId}`);
        }
      } catch {
        /* Alchemy missing — skip ownership proof for that network */
      }
    }
  }
  return keys;
}

function nftKey(n: NftRef): string {
  return `${n.chain}:${n.contractAddress.toLowerCase()}:${n.tokenId}`;
}

/** Replace the owner's entire ordered module list (transactional). */
export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { blocks?: ProfileBlockInput[] };
  try {
    body = (await req.json()) as { blocks?: ProfileBlockInput[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let sanitized;
  try {
    sanitized = sanitizeProfileBlocks(body.blocks ?? []);
  } catch (err) {
    const msg = err instanceof ProfileSanitizeError ? err.message : "Invalid modules.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const nftRefs = collectNftRefs(sanitized);
  if (nftRefs.length > 0) {
    const owned = await ownedNftKeys(userId);
    if (owned.size === 0) {
      return NextResponse.json(
        { error: "Link an Ethereum wallet and set ALCHEMY_API_KEY to prove NFT ownership." },
        { status: 400 },
      );
    }
    for (const n of nftRefs) {
      if (!owned.has(nftKey(n))) {
        return NextResponse.json(
          { error: `NFT not owned by your linked wallet: ${n.contractAddress} #${n.tokenId}` },
          { status: 400 },
        );
      }
    }
  }

  const uid = Number(userId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM profile_blocks WHERE user_id = $1`, [uid]);
    for (const b of sanitized) {
      await client.query(
        `INSERT INTO profile_blocks (user_id, sort_order, block_type, payload)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [uid, b.sort_order, b.block_type, JSON.stringify(b.payload)],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  const result = await pool.query(
    `SELECT id, block_type, payload, sort_order
     FROM profile_blocks WHERE user_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [uid],
  );
  return NextResponse.json({ blocks: result.rows });
}

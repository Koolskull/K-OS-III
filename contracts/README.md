# 2Kool Production Protocol

Smart contracts for **2Kool Productions**: a salary-capped studio vault, a Git-style credit ledger, shot NFTs (animation-cel style), and a 5% team royalty on future sales.

This is **not** legal advice, an employment agreement, a securities offering, or a replacement for work-for-hire / IP-assignment paperwork. The chain enforces *payment and provenance rules*. A lawyer still has to bind those rules to 2Kool Productions LLC (or whatever entity you form) so they hold up when a film is worth real money.

Spec: [`../docs/PRODUCTION_PROTOCOL.md`](../docs/PRODUCTION_PROTOCOL.md)  
Minting: [`../docs/NFT_MINTING.md`](../docs/NFT_MINTING.md)  
Legacy instruments: [`instruments.json`](./instruments.json)

## Contracts

| Contract | Job |
|---|---|
| `StudioTreasury` | All company value lands here. Payroll cap **$100,000 / rolling year** per member in USDC/USDT/USAT. Surplus cannot be withdrawn to a pocket. |
| `CreditLedger` | Showrunner git: productions, shots, parents (versions), work units, named credits. Credits are accepted, then frozen. History is never edited. |
| `ShotNFT` | ERC-721 + ERC-2981. One token per published shot (or per frame, if you mint at that grain). |
| `ShotRoyaltySink` | Cheap clone per published shot so marketplace ETH royalties hit the right shot. |
| `RoyaltyRouter` | Holds the credited **team's 5%** (shared, not 5% each) until they pull-withdraw. |
| `InstrumentRegistry` | Juicebox project 402 and existing NFT/music/painting drops, marked as company profit. |
| `StudioKit` | Deploys and wires everything in one transaction, then hands admin to your Safe. |

## Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Clone this repo with submodules (OpenZeppelin):

```bash
git submodule update --init --recursive
```

## Test

```bash
cd contracts
forge test
```

In the OS: desktop icon **STUDIO** — connect an injected wallet, paste the StudioKit address, then CREDITS → MINT → SALE.

## Deploy

Use a **Gnosis Safe** (or equivalent) as `ADMIN` and `CONVERSION_SAFE`. Do not leave the deployer EOA as permanent admin.

```bash
cd contracts
export ADMIN=0xYourSafe
export CONVERSION_SAFE=0xYourSafe
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC --broadcast --verify
```

After deploy (if you broadcast as `ADMIN`):

1. `setStablecoin(USDC)` / `setStablecoin(USDT)` / later `USAT`
2. Register Juicebox 402 and every existing collection in `instruments.json`
3. `openProduction` for the first film/game
4. Point K-OS / Datamoshpit / the minting app at the new addresses

**Recommended network:** an Ethereum L2 (Base, OP Mainnet, Arbitrum) for frame-level minting. L1 is fine for productions and shot-level tokens; it is expensive for every frame of a feature.

## What this cannot do by itself

- Rewrite Juicebox V2 project 402. Withdraw from Juicebox, deposit into `StudioTreasury`.
- Force OpenSea/Blur to pay ERC-2981. Many markets honor it; some do not. Studio-run sales should always go through `ShotNFT.settleSale` so the 5% is enforced.
- Issue legal stock. `grantShares` records **studio units** for payroll/credit matching. Have counsel issue actual equity in parallel if that is the intent.

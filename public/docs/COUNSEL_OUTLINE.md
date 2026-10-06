# Counsel briefing — 2Kool Productions

Give this to a lawyer together with [`PRODUCTION_PROTOCOL.md`](./PRODUCTION_PROTOCOL.md) and the Solidity in `contracts/`. It is a briefing, not an agreement.

The same text lives in the in-OS **STUDIO** app, COUNSEL tab.

---

## What this is

2Kool Productions wants paper agreements that match the on-chain Production Protocol: a $100,000 annual salary ceiling per member, a vault that holds surplus instead of paying windfalls, named credits that artists accept, and a shared 5% of future sales of a shot, card, toy, or other use of that credited design. Smart contracts encode payment and provenance. They are not a substitute for employment, IP assignment, or securities paperwork.

## Entity and parties

Confirm the contracting entity (currently referred to as 2Kool Productions LLC). Name founders, the studio council / Gnosis Safe that will hold `DEFAULT_ADMIN_ROLE`, and whether contractors are employees or 1099. The Safe address on the chosen chain should be recited in the agreement so admin keys are not a surprise later.

## Intellectual property

Each contributor assigns (or licenses exclusively) their work-for-hire in the production to the company, with a license-back to use their portfolio. Credits on `CreditLedger` are the public record of authorship. Frozen credits are not rewritten; a correction is a new version with a parent pointer. Force-freeze is only for unresponsive wallets and must still be disclosed. This is the Stan Lee problem: do not let desperation or unsigned deal memos decide who created a shot ten years later.

## Salary and the vault

Company agrees that on-chain payroll through `StudioTreasury` is the exclusive path for member compensation in stablecoin, capped at USD 100,000 per rolling 365-day window (or the lower contracted salary). Surplus from NFT, music, painting, broadcast, and fundraising-instrument proceeds remains in the vault to fund future salaries and a hire budget. There is no founder draw and no cashing of studio units. Pair this with ordinary payroll tax withholding off-chain where employment law requires it.

## Studio units vs equity

`grantShares` records studio units used to match payroll and credits. Unless counsel structures a real securities offering, the agreement should state that studio units are not stock, not a profit interest, and not transferable as securities. If 2Kool later issues actual equity, do it in a separate instrument that references the on-chain ledger instead of pretending the ledger is a cap table.

## Royalties — 5% shared

Default: five percent (500 bps) of each sale of a Shot NFT or licensed merch/cards/toys using that shot or design, paid to the credited team as a group and split by on-chain weight. Not 5% per person. Override is allowed up to 10% for a specific shot, in writing, before publish. Alumni keep royalty withdraw rights after they leave payroll. ERC-2981 is a marketplace hint, not a guarantee; studio-run sales must use `settleSale` so the split is actually paid.

## Legacy fundraising

Juicebox V2 project 402 and any already-minted NFT collections are company profit instruments. Proceeds route into `StudioTreasury`. Historical Juicebox payers are not automatically reminted or granted studio units; any such grant is a separate, disclosed decision. Withdraw leftover Juicebox ETH, convert to USDC/USDT/USAT, and deposit.

## Tax, labor, and foreign crews

On-chain payment does not remove wage-and-hour, overtime, visa, or moral-rights issues (especially for crews in Japan or other jurisdictions with strong author rights). Recite that metadata credits do not by themselves create employment. Get local counsel if you hire abroad. Royalties to alumni may be 1099 / equivalent.

## Buyer-facing copy

Do not hide the 5%. Checkout should show studio share vs creator share. Do not stack a second undisclosed 2Kool fee on top. Commerce Layer rule: never hide fees.

## Audit and dispute

The chain is the credit log. Disputes about "who made the shot" start there. A missing `acceptCredit` is evidence. Force-freeze without a paper trail is a red flag. Keep the IPFS metadata (software used, Flow/ShotGrid id, content hash) so a human can reconstruct the shot if a wallet is lost.

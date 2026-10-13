# Commerce Layer — Design Spec

**Status:** design document. No payment integrations are shipped in this pass. This is the abstraction the rest of K-OS will be built on top of so actual integrations can land incrementally.

For *why* this is built this way, see [`ECONOMIC_STANCE.md`](./ECONOMIC_STANCE.md). For the wallet that handles crypto rails, see [`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md).

---

## 1. The Commerce Layer abstraction

K-OS exposes a single `Commerce` interface that apps inside the OS use to request payment, accept payment, or handle refunds:

```ts
interface Commerce {
  requestPayment(req: PaymentRequest): Promise<PaymentResult>
  acceptPayment(invoice: Invoice): Promise<AcceptResult>
  refund(txId: TxId, amount?: Amount): Promise<RefundResult>
  getReceipt(txId: TxId): Promise<Receipt>
}
```

Apps **do not know or care which underlying rail is used** for any given transaction. That routing is a backend decision based on:

1. What payment methods *each party* (buyer and seller) has configured.
2. What rails *each party's app* supports.
3. What minimizes cost and friction for the transaction at hand.

A buyer using a credit card and a seller receiving stablecoin settlement is a **normal case**, not a special case. The user's view of the transaction shows them exactly what *they* pay or receive, in the form *they* pay or receive it; the routing underneath is **transparent on request but not front-and-center.**

---

## 2. What users see vs. what happens underneath

A user in **Settings → Payments** sees the payment methods *they personally* have configured — their card, their bank, their wallet if they have one.

They do **not** see a toggle saying "enable crypto" because crypto is not a feature of their experience; it is infrastructure that may or may not be involved in any given transaction depending on the other party.

The Commerce Layer's job is to make this work without making the user learn a new mental model. **A user who wants to understand the rails underneath can open a "Route details" disclosure on any transaction and see the full path** — this is the bridge into the education tracks, per the project's commitment to learnability.

---

## 3. Rail adapters

All rails are available to the router and invoked as needed per transaction. Each adapter implements a common interface:

```ts
interface RailAdapter {
  id: RailId
  capabilities: RailCapabilities  // can_send, can_receive, supports_refund, ...
  estimateFees(req: PaymentRequest): Promise<FeeBreakdown>
  initiatePayment(req: PaymentRequest): Promise<RailResult>
  initiateRefund(txId: TxId, amount?: Amount): Promise<RailResult>
}
```

### v0 / planned adapters

- **Stripe adapter** — card payments, ACH, Stripe Connect for marketplaces. Official Stripe SDK.
- **PayPal adapter** — PayPal checkout and PayPal Commerce.
- **Plaid adapter** — bank account linking for ACH and account verification. Complements Stripe and PayPal.
- **EVM adapter** — routes through K-Wallet ([`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md)). Handles stablecoin settlement (USDC, USDT, DAI), ETH, ERC-20s. Invoked automatically when the counterparty's app accepts it and routing determines it's the best path.
- **Bitcoin adapter** — via K-Wallet.
- **Monero adapter** — via K-Wallet.
- **Direct / offline adapter** — for in-person or informal exchange; generates invoices and receipts without any processor. Useful for cash sales, IOU tracking, and over-the-counter trades.

Each adapter is **independently available based on the user's own configuration** — they have set up Stripe or they haven't; they have a wallet or they don't. The user does not see a "turn crypto on" toggle. They see the payment methods they personally have set up. The router composes available adapters across both counterparties to find a working path for each transaction.

---

## 4. Principle: **never hide fees**

Every rail adapter reports its fees honestly to the user at checkout, broken out by party:

- Processor fee (e.g., Stripe's 2.9% + $0.30)
- Network fee (e.g., gas for an EVM tx, miner fee for Bitcoin)
- K-OS fee (if any — see § 8 open questions)
- The amount the recipient actually receives

Users can always see exactly what is being taken and by whom. **This is a stated non-negotiable.** No tooltip-buried fees, no aggregated "service fee" line that hides the breakdown.

A `<FeeDisplay>` component (to be built) is the canonical UI for this — every rail adapter must render through it.

---

## 5. Prefer open-source libraries and protocols

For Stripe, PayPal, and Plaid, we use their official SDKs (they are not open-source but they are the reality of accessing those networks).

For crypto rails, we use audited open-source libraries (see [`WALLET_DEPENDENCIES.md`](./WALLET_DEPENDENCIES.md)).

For anything else — invoicing, receipts, accounting, escrow — **prefer open-source wherever the functionality is mature.** Proprietary tools enter the system only with explicit reason.

---

## 6. The Commissioned Tool — TBD

K-OS plans to commission **at least one original commerce tool** — dynamic, novel, not currently available in open-source form — to differentiate the platform. This tool will be funded via grants/investors (see [`FUNDING_PLAN.md`](./FUNDING_PLAN.md)) and built by paid contributors.

Final scope is TBD until initial funding lands. Candidate directions:

1. **A reputation / web-of-trust system for peer-to-peer commerce** that does not depend on a central platform. Cross-protocol identity, signed attestations, configurable trust scoping. This is the highest-value missing piece of peer-to-peer commerce and the hardest to do well.
2. **A novel escrow mechanism that works across rail types.** Buyer pays in fiat (Stripe), seller receives in stablecoin (EVM), funds are held in a programmable escrow during shipment, released on confirmation, with dispute-resolution paths that don't require a single central arbitrator.
3. **A creator-economy tool for artists to sell work made inside K-OS** with direct settlement, low friction, and no marketplace cut. Native publishing of music, sprites, shaders, and 3D scenes from inside the OS to a buyer's K-OS install — no platform between them.

Final choice TBD. The decision is gated on funding (see `FUNDING_PLAN.md`).

---

## 7. Settlement and custody boundaries

**K-OS never takes custody of user funds.**

All settlement goes directly from buyer to seller through the chosen rail. K-OS may log the existence of transactions locally for the user's own records (per the user's consent), but **never as a central ledger.**

Implications:

- No "K-OS account balance." Users do not deposit funds with K-OS.
- No platform-held escrow without explicit user consent and a user-visible custody arrangement (and even then, the custody is the rail's, not K-OS's).
- The Commissioned Tool's escrow design (if direction 2 above is chosen) must work without K-OS holding funds — through smart contract escrow, multi-sig, or rail-native escrow features.

---

## 8. Compliance posture

A commerce platform that deals with real money has real legal obligations: KYC where applicable, tax reporting, sanctions screening, consumer protection. The Commerce Layer design must make space for these concerns — it is not a magic loophole.

Where compliance lives, by adapter:

- **Stripe / PayPal / Plaid:** these processors handle most KYC, sanctions screening, and chargeback / dispute infrastructure. The Commerce Layer surfaces the processor's compliance flow; it does not bypass it.
- **EVM / Bitcoin / Monero:** crypto rails are user-managed. The user is responsible for their own tax reporting and for not transacting with sanctioned addresses. The Commerce Layer surfaces clear receipts (so the user has the data they need) but does not file for them.
- **Direct / offline:** the user is fully responsible. Receipts are generated for the user's own records.

K-OS does not pretend regulations do not exist. This section will eventually link into a **legal/compliance education track** (see `EDUCATION.md`; track is planned, not yet scaffolded — added to seed issues).

---

## 9. Open questions (need Koolskull's input)

1. **Does K-OS ever charge a fee of its own?** And if so, what is that fee for? Hosting? The reference hardware project? The maintainers? Or strictly no — K-OS is and always will be a zero-fee Commerce Layer? This decision shapes the funding model and the project's relationship to the wider commerce ecosystem.
2. **In-OS marketplace built on top of the Commerce Layer, or as a separate system?** The "Later" vision in `ROADMAP.md` mentions an in-OS marketplace. Building it as an app *on top of* the Commerce Layer is cleaner but harder. Building it as a separate vertical is faster but creates two commerce surfaces.
3. **Money-services / payment-facilitator structure.** Does K-OS pursue a registered MSB or PayFac status later? This is a serious legal and operational decision that shapes what we can do directly vs. what we have to delegate to processors.
4. **Default rail preference per transaction type.** When multiple rails are available, what does the router prefer? Lowest fee? Fastest settlement? User-configured? Something smarter (e.g., learn from past user choices)?
5. **Receipts and accounting export.** What format? CSV is universal but flat. Should K-OS support QuickBooks / Xero export? Tax-tool integration?
6. **Dispute UX.** When a user has a Stripe transaction that goes wrong, the chargeback flow is Stripe's. When a user has a peer-to-peer transaction that goes wrong, what does the OS surface? An issue tracker? A dispute screen? Nothing (defer to the user)?

---

## 10. Tie-in to the rest of K-OS

- **K-Wallet** ([`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md)) provides the crypto rails (EVM, Bitcoin, Monero adapters above).
- **Chat** ([`CHAT_SPEC.md`](./CHAT_SPEC.md)) integrates with the Commerce Layer for in-message payment requests.
- **Datamoshpit** and **future creative apps** can use the Commerce Layer to sell directly to other K-OS users without a platform in between.
- **Education** tracks (`public/education/`) explain what's happening at every layer for users who want to understand.
- **Sponsor Policy** ([`SPONSOR_POLICY.md`](./SPONSOR_POLICY.md)) governs whether K-OS itself takes any fee from commerce flowing through it (open question 1 above).

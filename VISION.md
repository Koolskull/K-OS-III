# Vision

This is the long-form "why" of K-OS III. It is intentionally separated from [`ROADMAP.md`](./ROADMAP.md) so contributors don't read aspirational language and think they're signing up for a government contract. Roadmap is what we're doing. Vision is what we're for.

---

## Primary mission

**K-OS exists to build a local-first creative OS where people make things — music, art, documents, applications, chat, and commerce — without platform middlemen sitting between them.**

Two audiences, one mission, one house with two front doors:

### For builders and contributors

**Ethereum / EVM developers are the project's priority recruitment audience.** The richest technical contribution surface is in on-chain tooling and the crypto-native creative scene. We also expect Ethereum developers to be in higher demand going forward. If you build EVM tooling, on-chain games, smart contracts, wallet infrastructure, or related work — the best contribution surface in this project is yours.

After Ethereum / EVM developers, the priority order is: tracker and chiptune musicians, pixel artists, handheld Linux tinkerers, privacy-curious builders, and Christian creatives. The ordering is deliberate and reflects where the technical work concentrates and where the project's roots are.

### For end users

**The product presents familiar, accessible UX on top.** Crypto rails operate as backend settlement and identity infrastructure — often invisibly. A user can shop in an in-OS marketplace with a credit card while the seller receives stablecoin settlement, with the routing happening underneath. An app built on a crypto-native webstack may store user data on-chain without the user ever seeing a wallet UI. Two users can transact with each other where one uses regular money and the other uses crypto, with the rails negotiated underneath.

Precedent for this pattern: Venmo settles on traditional rails that are hidden from users; Farcaster uses crypto identity but most users never see a wallet in normal use; PayPal hides the underlying payment processor. K-OS extends this pattern across rail types.

Users who want to cross the bridge into direct crypto use have a comprehensive learning path (see *Offline-first knowledge*, below) and full-control tools (see *K-Wallet*, below). Users who don't, still get the full benefit of the system.

---

## The problem

- **Screens and dopamine loops have degraded creative agency.** The same devices that could be tools for making things are designed to be tools for being made-into-an-audience.
- **Most "creative" software is rented, cloud-locked, and data-extractive.** A rented tool is not your tool. A tool that watches you is not yours either.
- **Most commerce runs through platforms that take fees, shape behavior, and hold the relationship between the parties they mediate.** A 15–30% platform tax on a small seller is not just money; over a decade it is a year of creative time subtracted.
- **Most crypto tooling is either institutional-grade and hostile to newcomers, or newcomer-friendly and privacy-hostile.** The third option — locally controlled, privacy-respecting, and accessible — is mostly missing.
- **The current UX pattern of "either you care about crypto or you don't" is a failure of design.** Most users should never have to care. The ones who want to should have a real on-ramp, not a gauntlet of jargon.

---

## The response

A tiny, local-first, open-source OS that:

- boots in a browser
- runs on anything with a keyboard
- treats making and selling things as the default state
- uses whatever rail makes sense underneath (crypto or traditional)
- does not require the user to adopt any particular ideological or technological stance to use it

The aesthetic — pixel-correct, no rounded corners, no anti-aliasing, no gradient buttons, custom base-16 number system (Slimentologika) — is downstream of the principles below. It is not decoration. It is the form the principles took.

---

## Design principles

- **Local-first.** Your projects, your keys, your data — on your device, not on someone's server. Network features are additive, not gating.
- **Modular.** The OS is a shell; every app is a swappable unit. Adapters (wallet signers, chat protocols, commerce rails) are pluggable.
- **Hand-holdable.** Runs on the smallest screens you actually own — Miyoo Mini, Anbernic, Steam Deck, an old laptop, a phone.
- **Fixable.** When (not if) something breaks, the path to fixing it is short, legible, and possible without specialized tools.
- **Legible.** The code, the documents, and the system itself should be read by a person and understood by them. No magic.
- **Privacy-respecting by default.** Tracking is opt-in, telemetry is opt-in, third-party calls are disclosed. The Slimentologika / pixel / no-AA rules are downstream of these — design that respects the user's eyes is part of design that respects the user.
- **Epistemic pluralism.** On contested topics, present competing accounts and let the reader decide. See *Epistemic pluralism as a core principle* below and the full [`docs/EPISTEMIC_STANCE.md`](./docs/EPISTEMIC_STANCE.md).
- **Independent nodes in voluntary commerce.** Economic participants are sovereign nodes engaging voluntarily. Platforms are optional, not mandatory. See *Independent nodes* below and the full [`docs/ECONOMIC_STANCE.md`](./docs/ECONOMIC_STANCE.md).

---

## Epistemic pluralism as a core principle

Monoculture of interpretation is a failure mode. Plural discourse — even when specific claims inside the plural are wrong — is the healthy state. K-OS commits, in its educational and documentary surfaces, to presenting the mainstream account *and* credible dissenting accounts on contested topics, sourced and attributed, leaving the conclusion to the reader.

This is not "all views are equal." It is not a mandate to teach every fringe claim. It is a refusal to flatten debate into a verdict the project hasn't earned the right to deliver.

This commitment shapes the **defaults** in the Reference (`public/reference/`), the Reader Notes (`docs/READER_NOTES/`), and the education tracks (`public/education/`). It does **not** apply to technical specs — a function either returns the right value or it doesn't.

**Critically: this is the editorial stance of the defaults, not a constraint on the user.** K-OS is local-first and source-available by design. Users have permissionless access to edit any entry, swap the entire corpus, connect to alternative Reference sources (community-maintained, friend-curated, federated, IPFS-published), build their own curation tools, or fork the project entirely. The editorial work exists to provide a sane, opinionated *starting point* so the OS is useful out of the box. **Customization is encouraged.** The defaults are ours; the OS is the user's.

Full statement: [`docs/EPISTEMIC_STANCE.md`](./docs/EPISTEMIC_STANCE.md).

---

## Offline-first knowledge and education

K-OS ships with an embedded, curated reference corpus and a multi-track curriculum. The design goal: a person on a handheld device with no internet can still learn to build on Ethereum, understand cryptography, and study history, from K-OS alone.

**The flagship curriculum is the Ethereum developer track.** Companion tracks cover Solidity, cryptography basics, privacy, Bitcoin, Monero, and the meta-skill of reading unfamiliar codebases. Reference entries (the offline encyclopedia) are curated by named editors and follow the epistemic-stance rules.

Any user who wants to cross from regular-money UX into direct crypto use has a clear, dignified path. The wallet UI and the curriculum are designed as companions, not separate products.

Full design: [`docs/KNOWLEDGE_CORPUS.md`](./docs/KNOWLEDGE_CORPUS.md). Index of tracks: [`EDUCATION.md`](./EDUCATION.md).

---

## K-Wallet and hardware-separated signing

A unified settlement and key-management surface inside K-OS. Two modes through one architecture:

- **Invisible mode (default for most users).** Apps use crypto rails for settlement, identity, or storage without surfacing a wallet UI. The user pays with what they have; the seller receives what they accept; the routing happens underneath.
- **Sovereign mode (full control, for users who want it).** Own keys, own signing, own sovereignty. EVM / Bitcoin / Monero support, **hardware-separated signing** (the device that holds your keys is not the device that's on the internet when it isn't actively signing), the education track that explains every concept, and a clear migration path from invisible mode to sovereign mode.

Hardware separation is a first-class mode, not a bolt-on. Software-wallet mode is available with honest warnings about what it does and doesn't protect against.

Full design: [`docs/K_WALLET_SPEC.md`](./docs/K_WALLET_SPEC.md).

---

## Independent nodes in voluntary commerce

K-OS treats economic participants as sovereign nodes — citizens in the civic sense, not users of a platform — who enter into voluntary exchange. Platforms and processors provide real services, but when they become mandatory intermediaries in every transaction they extract fees, shape behavior, hold the relationship, and accumulate power that was not theirs to accumulate.

K-OS is designed to make peer-to-peer commerce as low-friction as platform-mediated commerce, so that using a platform becomes a choice rather than a default. The infrastructure supports mainstream payment rails (Stripe, PayPal, ACH) and crypto settlement rails interchangeably; the user experience presents whichever is familiar to the user.

This is not anti-business. It is anti-rent-extraction. Businesses providing clear services at fair prices are welcome participants.

Full statement: [`docs/ECONOMIC_STANCE.md`](./docs/ECONOMIC_STANCE.md). Architecture: [`docs/COMMERCE_SPEC.md`](./docs/COMMERCE_SPEC.md).

---

## Federated chat as first-class communication

K-OS ships with a Matrix client as a core app, with adapters for additional protocols (Farcaster, eventually XMPP / Nostr / others). Federated, end-to-end encrypted, self-hostable, open-protocol. The chat layer matches the rest of the project's commitments rather than undercutting them.

Full design: [`docs/CHAT_SPEC.md`](./docs/CHAT_SPEC.md).

---

## The long arc

These are directions, not deliverables. They make the rest of the project make sense.

- **Reference hardware** — a steel, fixable, modular hand-computer that doubles as the air-gapped signer for K-Wallet. Open-source design, repairable with hand tools, no glued screens, replaceable battery, real keyboard.
- **IPFS publishing from inside K-OS** — songs, sprites, scenes, contracts — published in one action from the OS, with the user holding the pointer.
- **In-OS marketplace** — projects, samples, sprites, shaders, contracts. Settlement rail is a backend choice, not a user choice. K-OS does not custody funds. Buyers and sellers transact directly.

Read these as direction. They earn their place in `ROADMAP.md` only when there is real work being done on them.

---

## A note on the devotional framing

The boot sequence scrolls Rosary text and Psalms. Files have ASCII art of Jesus and the Templar cross. The README has a "Make a joyful noise" closing line. This is part of the project's identity, and it stays.

The CONTRIBUTING and top-of-README pitch are deliberately religiously and politically neutral, so the project reads as **welcoming weird** rather than gated by belief. You do not have to share the worldview to contribute. You do have to respect that the identity is part of the project, not decoration to be sanded off.

Two audiences. Two doors. One house.

---

```
              ☦
   "Non nobis, Domine, non nobis,
    sed nomini tuo da gloriam."
```

# K-Wallet — Design Spec

**Status:** design document. No wallet code is shipped in this pass. This is the spec future PRs will build against.

K-Wallet is the unified settlement and key-management surface inside K-OS. This document describes its architecture, the rails it covers, the security non-negotiables it operates under, and what v0 actually ships.

> **Security guardrail:** This document describes a system that will hold real user funds. **Never roll our own crypto.** Every cryptographic operation in K-Wallet routes through an audited library or a hardware device. If a contributor finds themselves writing key-generation, seed-phrase, or signing code from scratch, stop and leave a `TODO(security-review)` comment with a link to this document instead. Real implementation requires real human review.

---

## 1. Mission statement

K-Wallet is the unified settlement and key-management surface inside K-OS. It serves two modes simultaneously, through the same underlying architecture:

### Invisible mode (default for most users)

Apps inside K-OS can use crypto rails for settlement, identity, or storage **without ever surfacing a wallet UI to the user**. A user shopping in an in-OS marketplace may pay with a credit card while the seller receives stablecoin settlement — the routing happens underneath. An app built on a crypto-native webstack may keep its user data on-chain while the user signs in with a familiar username/password or passkey flow; key material is managed for them.

### Sovereign mode (full-control, for users who want it)

For users who want to hold their own keys, sign their own transactions, and operate as fully sovereign nodes — K-Wallet exposes the complete surface: EVM / Bitcoin / Monero support, hardware-separated signing, the education track that explains every concept, and a clear migration path from invisible mode to sovereign mode when the user is ready.

### Why this dual posture

This architecture reflects the project's mission. **Ethereum / EVM development is the priority builder audience** because the richest technical contribution is in this layer, and because Ethereum developers are expected to be in high demand. But Ethereum adoption is never forced on a **user** — the same infrastructure serves a grandma buying a pixel-art print and a cypherpunk running a node, because the wallet does the translation underneath.

K-Wallet is **privacy-respecting, local-first, and designed from day one to support hardware-separated signing** — the principle that the device which holds your keys should not be the same device which is connected to the internet when it is not actively signing.

---

## 2. Architecture — three layers, sharply separated

```
┌─────────────────────────────────────────────────────────────┐
│ Apps in K-OS (Datamoshpit, Marketplace, Chat, etc.)         │
└──────────────────────────┬──────────────────────────────────┘
                           │  Wallet API (request, sign, send)
┌──────────────────────────┴──────────────────────────────────┐
│ K-Wallet Service (routing, UX, fee disclosure)              │
└─────┬────────────────────┬───────────────────┬──────────────┘
      │ Chain Layer        │ Signer Layer       │ Key Layer
      │                    │                    │
   ┌──┴───┐             ┌──┴───┐            ┌──┴────────┐
   │ evm  │             │Local │            │ encrypted │
   │ btc  │             │Ledger│            │ keystore  │
   │ xmr  │             │Trezor│            │ (IndexedDB)│
   └──────┘             │Keystone           └───────────┘
                        │KOS-airgap (TBD)│
                        └────────────────┘
```

### 2.1 Key Layer

Holds private keys. Two implementations:

- **Software (default convenience mode):** an encrypted local keystore in IndexedDB protected by a user passphrase. Visible to the OS only when unlocked. Never transmitted off the device.
- **Hardware (recommended):** keys are *not present on the K-OS device at all*. They live on an external hardware signer. K-OS communicates with that signer through the well-defined Signer Layer (§ 2.3).

When the user is in hardware mode, the Key Layer on the K-OS device is functionally absent — there is nothing to leak.

### 2.2 Chain Layer

Per-chain adapters implementing a common interface:

```ts
interface ChainAdapter {
  getBalance(address: Address): Promise<Balance>
  buildTransaction(params: TxParams): Promise<UnsignedTx>
  broadcastTransaction(signedTx: SignedTx): Promise<TxHash>
  getHistory(address: Address, opts?: HistoryOpts): Promise<Tx[]>
  // chain-specific extensions surfaced through capability flags
}
```

Three adapters for v0:

- **`evm`** — wraps `viem` (preferred over `ethers.js` — lighter, better-typed). Supports any EVM chain via RPC config.
- **`bitcoin`** — wraps `bitcoinjs-lib` for transaction construction; node connection via user-configured Electrum server or Bitcoin Core RPC.
- **`monero`** — wraps `monero-ts` or integrates with a locally-running `monero-wallet-rpc`. Document the tradeoff explicitly: full Monero wallet functionality in-browser is cryptographically heavy and may require a local companion process on desktop builds.

Each adapter wraps an **existing audited open-source library**. We do not reimplement chain primitives.

### 2.3 Signer Layer

Pluggable signers implementing a common interface:

```ts
interface Signer {
  getPublicKey(path?: DerivationPath): Promise<PublicKey>
  signTransaction(tx: UnsignedTx): Promise<SignedTx>
  signMessage(msg: Bytes): Promise<Signature>
  capabilities: SignerCapabilities  // which chains, which schemes
}
```

Initial signers:

- **`LocalSoftwareSigner`** — the encrypted keystore from § 2.1. Available, but shown with **prominent honest warnings** in the UI ("your keys are on this device; if this device is compromised, your funds are at risk").
- **`LedgerSigner`** — WebUSB / WebHID via `@ledgerhq/hw-app-*`. Standard Ledger flow.
- **`TrezorSigner`** — via Trezor Connect.
- **`KeystoneSigner`** — air-gapped QR signer. **The reference model for what hardware separation should feel like inside K-OS.** Keys never touch a network; transactions are passed across the air gap as QR codes.
- **`KOSAirgappedSigner`** *(planned, not implemented)* — placeholder interface for K-OS's own future reference hardware signer (see ROADMAP "Later"). Document the QR-code-based protocol it would use so the rest of the system is already compatible when the hardware exists.

---

## 3. Hardware separation as a first-class mode, not a bolt-on

When K-Wallet is opened, the user chooses a signing mode. **Hardware mode is the recommended default in all copy.** Software mode is available and shown with clear honest warnings about its limits.

The wallet UI is **designed around the assumption that signing happens on another device.** No UI element assumes keys are locally accessible. There is no "show seed phrase" button anywhere because in hardware mode there is no seed phrase to show. In software mode, the same UI applies — a "show seed phrase" flow is reachable only through deliberate menu diving with a multi-step confirmation.

This is a design discipline. The point is to make hardware-separated signing feel like the normal path, not the advanced path.

---

## 4. Privacy posture

### 4.1 RPC endpoints

User-configurable. Default to well-known public RPCs for usability, but **surface a clear prompt and explainer on first use** about what RPC providers can see (your IP, your addresses, your balance queries). Link into the privacy education track.

### 4.2 Tor / onion routing

Stated goal in this spec. **Marked as "later, not v0."** The architecture leaves the network layer pluggable so a Tor adapter can be added without rewriting the chain adapters.

### 4.3 Address reuse, coin control, subaddresses

These are must-have features for **v0.5**, not v0:

- Address-reuse warnings on EVM and Bitcoin
- Coin control for Bitcoin (which UTXO to spend from)
- Subaddresses for Monero (one address per counterparty)

### 4.4 EVM honesty

EVM transactions are public and pseudonymous, **not private**. The wallet UI surfaces a "privacy caveats" note any time a user is about to send on an EVM chain. Do not let the UI imply otherwise. Link into the `privacy/` education track.

---

## 5. What v0 actually ships (be realistic)

Scope discipline. v0 is the first thing that ships, not the first version of everything.

| Feature | v0 |
|---|---|
| EVM read | ✅ via `viem` |
| EVM send | ✅ software signer + Ledger signer |
| EVM ENS resolution | ✅ basic |
| EVM dapp connection | ✅ WalletConnect v2 |
| Bitcoin watch-only | ✅ via xpub import — balance, history |
| Bitcoin send | ❌ behind a feature flag until reviewed |
| Monero watch-only | ✅ via view-key import |
| Monero send | ❌ gated on integrating `monero-ts` well **or** bundling a companion `monero-wallet-rpc` for desktop |
| Hardware signer (Keystone-style QR) | ✅ for EVM |
| Hardware signer (Ledger) | ✅ for EVM |
| Tor / privacy routing | ❌ later |
| Multi-sig | ❌ later |
| Social recovery | ❌ later |

---

## 6. What comes later (so contributors can pick these up)

- Full Bitcoin send with coin control and PSBT support
- Full Monero send (depending on `monero-ts` maturity or companion process)
- Tor integration for all RPC traffic
- K-OS reference hardware signer (HW + protocol)
- Multi-sig, including cross-device flows
- Social recovery
- Hardware secure-element integration on the future K-OS device
- Stablecoin-aware UX (separate display of "USD-equivalent" stablecoin balances)
- Account abstraction (smart-contract wallet) support for users who want it

---

## 7. Security non-negotiables

These are non-negotiable. Every contributor working in this area is held to them.

- **Never roll our own crypto.** Every cryptographic operation routes through an audited library or a hardware device.
- **Never log private keys, seed phrases, or unencrypted signing material.** Anywhere. Ever. Including verbose logs, error messages, telemetry, and crash reports.
- **Never transmit keystore material off the device.** The local keystore is local. Period.
- **All dependencies that touch keys or transactions are pinned, reviewed, and listed in [`WALLET_DEPENDENCIES.md`](./WALLET_DEPENDENCIES.md)** with the rationale for each. Every addition requires a named reviewer in the PR.
- **Software-mode warnings are mandatory.** Whenever the LocalSoftwareSigner is active, the UI prominently states: "this is software-wallet mode; your keys live on this device." No hiding it in tooltips.
- **Wallet-touching PRs require a second reviewer.** Noted in `CONTRIBUTING.md` § *Sensitive areas*.

---

## 8. Tie-in to education

Every concept the wallet surfaces (gas, nonce, UTXO, view key, etc.) **links inline into the relevant education track lesson.** First-time users are shown a guided intro that pulls from the `ethereum-dev/` track. Wallet UI and curriculum are designed as companions, not separate products.

When the user pauses on a confusing concept in the wallet UI, the path forward is one click into a real lesson, not a popover with three sentences of marketing copy.

---

## 9. Open questions (need Koolskull's input)

These decisions are required before serious implementation work begins. Ordered roughly by urgency.

1. **Chain priority beyond the initial three.** EVM, Bitcoin, Monero are committed. What's next — Solana? Cosmos? Polkadot? Stellar? An L2 specifically (Optimism, Arbitrum, Base)? Driven by where the project's audience and funding actually concentrate.
2. **Default RPC providers for v0.** Public Cloudflare gateway? Public Infura? A Pocket / decentralized RPC network? User-configured-only with no default? Each has different privacy and reliability tradeoffs.
3. **Stablecoin-specific UX layer.** Should the wallet display USDC, USDT, DAI balances differently from native ETH? Should it default the user to stablecoins for in-OS commerce? Or treat all assets uniformly and let the user decide?
4. **Dapp browsing in-OS vs. external.** Embed a browser-like surface for dapps, or require the user to open dapps in their normal browser and use WalletConnect to bridge?
5. **K-OS reference hardware signer form factor.** SD card with secure element? USB-C cartridge? A full handheld that doubles as the air-gapped device? Each implies a different physical design and a different user workflow.
6. **Custody of in-flight transactions.** When a user signs a transaction but the broadcast fails, where does the signed-but-not-broadcast tx live? In the local keystore? Discarded? Surfaced as a "stuck" item the user must resolve?
7. **Naming.** "K-Wallet" is a working name. Acceptable? Or does this want a 2KOOL-aesthetic name like the rest of the OS?

---

## 10. References (for reviewers)

- `viem` — https://viem.sh
- `bitcoinjs-lib` — https://github.com/bitcoinjs/bitcoinjs-lib
- `monero-ts` — https://github.com/woodser/monero-ts
- WalletConnect v2 — https://docs.walletconnect.com
- Keystone signer protocol — https://keyst.one
- BIP-39 (mnemonic), BIP-32 (HD wallets), BIP-44 (account hierarchy) — https://github.com/bitcoin/bips

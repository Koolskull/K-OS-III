# Wallet Dependencies

This file lists every dependency that touches keys, signing, transaction construction, or RPC traffic for K-Wallet (see [`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md)). Every addition requires a **named reviewer** in the PR and a written rationale.

The point of this file: a single, auditable surface where every wallet-touching dependency is documented, so a security review never has to go discover what we're using.

---

## Rules

1. **No undocumented wallet dependencies.** If it touches keys, signing, transactions, or RPC, it gets a row in this file before merging.
2. **Pinned versions only.** No floating ranges (`^`, `~`) on dependencies in this file. Exact version pins.
3. **Audited libraries only** for cryptographic primitives. If a library has not been audited, it does not handle key material. Period.
4. **Named reviewer per addition.** The reviewer's GitHub handle goes in the row. They are accountable for having actually read the code.
5. **Rationale per addition.** Why this library and not another? What does it provide that we can't safely write ourselves?
6. **Removals are also tracked.** When a dependency is removed, move its row to the "Removed" section with the date and the PR.

---

## Active dependencies

> **No wallet dependencies are installed yet.** This file is scaffolded ahead of implementation so the discipline is in place from day one.

When the first wallet PR adds dependencies, it should populate the table below:

| Library | Version | Purpose | Audited? | Reviewer | Added in PR | Notes |
|---|---|---|---|---|---|---|
| *(none yet)* | | | | | | |

### Planned (per `K_WALLET_SPEC.md` v0)

These are the dependencies the v0 spec calls for. They are *planned*, not yet added. Each will get a row above with a real reviewer when its PR lands.

- **`viem`** — EVM client library. Chosen over `ethers.js` for its smaller bundle size and stronger typing. Actively maintained, large ecosystem, used by major wallet projects.
- **`@ledgerhq/hw-app-eth`** + **`@ledgerhq/hw-transport-webusb`** — Ledger device communication for EVM signing.
- **`@walletconnect/sign-client`** — WalletConnect v2 for dapp connection.
- **`bitcoinjs-lib`** — Bitcoin transaction construction. Long-standing, widely used, audited components.
- **`monero-ts`** — Monero wallet operations in TypeScript. **Caveat:** browser-side Monero is heavy; this dependency may be deferred or replaced with a companion `monero-wallet-rpc` process for desktop builds. Decision lives in the PR that adds it.

### Encryption / KDF (for the LocalSoftwareSigner keystore)

- **A vetted KDF library** (likely `argon2` via `@noble/hashes` or `argon2-browser`) for keystore passphrase-stretching. **No custom KDFs.** No PBKDF2-with-low-iterations.
- **A vetted symmetric AEAD** (likely XChaCha20-Poly1305 or AES-GCM via `@noble/ciphers` or WebCrypto) for the keystore at rest. **No custom encryption.**

---

## Removed dependencies

*(none yet)*

---

## How to add a dependency to this list

When opening a wallet-touching PR that adds a new dependency:

1. Add a row to the **Active dependencies** table with all columns filled in.
2. Make sure your PR has a **second reviewer** assigned (per `CONTRIBUTING.md` § *Sensitive areas*).
3. The reviewer must, in their PR review, explicitly confirm they have read at least the public-facing surface of the library and have no concerns. A LGTM without engagement is not sufficient for this file.
4. If the dependency replaces an existing one, move the old row to **Removed dependencies** with the PR link.

If a dependency is added or upgraded without going through this file, the PR should be reverted.

---

## Why this discipline exists

Every wallet-related disaster in the broader ecosystem traces back to the same small set of failure modes: an unaudited library handling key material, an unreviewed dependency upgrade introducing a malicious change, a "convenience" abstraction that ended up logging seeds. This file does not prevent all of those, but it makes the surface where they could happen small enough to actually watch.

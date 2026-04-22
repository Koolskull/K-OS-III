# Chat & Messaging — Design Spec

**Status:** design document. No adapters are implemented in this pass. This spec is what future PRs build against — Matrix first, then Farcaster, then community-contributed adapters.

K-OS ships with a single chat app whose **UI and protocol are decoupled.** The app is a minimal, pixel-correct, keyboard-first messenger shell. The protocol layer is pluggable. A user can wire one adapter, several adapters, or all of them simultaneously; channels from different networks appear side-by-side in the same interface.

**Precedent for this pattern:** Beeper, Bitlbee, Pidgin, Matrix's own bridge ecosystem. None of these are K-OS's target aesthetic — the point is that the architectural pattern (one UI, many transports) is well-established and known to work. K-OS's version is smaller, pixel-correct, and native to the OS.

For the wallet that handles signing for crypto-identity adapters, see [`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md). For the commerce integration, see [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md).

---

## 1. Architecture — three layers, sharply separated

```
┌─────────────────────────────────────────────────────────────┐
│ Chat UI Layer                                               │
│   Pixel-correct, keyboard-first, follows The Rules.         │
│   Knows nothing about any specific protocol.                │
│   Generic model: accounts, channels, messages, attachments, │
│   presence, read state.                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ ChatAdapter interface
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────┴───────┐   ┌──────┴───────┐    ┌──────┴───────┐
│ Matrix       │   │ Farcaster    │    │ (community)   │
│ adapter      │   │ adapter      │    │ XMPP / Nostr  │
│ matrix-js-sdk│   │ Hub client   │    │ ActivityPub…  │
└──────┬───────┘   └──────┬───────┘    └──────┬───────┘
       │                   │                   │
┌──────┴───────────────────┴───────────────────┴───────────────┐
│ Account & Identity Layer                                     │
│   Per-adapter credential storage (encrypted IndexedDB).      │
│   Sandboxed — no adapter sees another's credentials.         │
└──────────────────────────────────────────────────────────────┘
```

### 1.1 Chat UI Layer

The messenger app itself. Pixel-correct, keyboard-first, follows The Rules (no rounded corners, no anti-aliasing, no gradient buttons, etc.). **Knows nothing about any specific protocol.**

Operates on a generic model:

- **Account** — a credential set for a specific network, owned by the user
- **Channel / Room / Thread** — generalized to "channel" in the UI; the underlying network may call it a room (Matrix), channel (Farcaster), DM (most), thread (some)
- **Message** — text + optional attachments + optional reply-target
- **Attachment** — media, file, payment-request card, or any registered attachment type
- **Presence** — online / offline / away (where the network supports it)
- **Read state** — per-channel last-read marker

Same UI for a Matrix room, a Farcaster channel, a direct message from any network. Differences in what each network actually supports are surfaced through the **capability model** (§ 3), not by maintaining different UIs.

### 1.2 Protocol Adapter Layer

Each supported network is an adapter implementing a common `ChatAdapter` interface:

```ts
interface ChatAdapter {
  id: AdapterId
  capabilities: AdapterCapabilities

  connect(account: Account): Promise<Connection>
  disconnect(account: Account): Promise<void>

  listChannels(account: Account): Promise<Channel[]>
  subscribeChannel(channel: ChannelId, listener: ChannelListener): Subscription

  sendMessage(channel: ChannelId, msg: OutgoingMessage): Promise<MessageId>
  editMessage?(msg: MessageId, newContent: MessageContent): Promise<void>
  deleteMessage?(msg: MessageId): Promise<void>

  fetchHistory(channel: ChannelId, opts?: HistoryOpts): Promise<Message[]>
  uploadAttachment(file: File): Promise<AttachmentRef>

  getProfile(userId: NetworkUserId): Promise<Profile>
  subscribePresence?(userId: NetworkUserId, listener: PresenceListener): Subscription
}
```

Adapters are **installed/removed independently** and can run **simultaneously.**

### 1.3 Account & Identity Layer

Per-adapter credential and identity storage:

- **Matrix:** homeserver URL + access token (or device keys for E2EE).
- **Farcaster:** signer authorization keyed to the user's FID.
- **Other adapters:** per-protocol credential set.

Each account is labeled with the adapter it belongs to. A user can have **multiple accounts on the same adapter** (e.g., two Matrix accounts on different homeservers).

---

## 2. Initial adapters to spec (interfaces only, no implementation in this pass)

### 2.1 Matrix adapter

Via [`matrix-js-sdk`](https://github.com/matrix-org/matrix-js-sdk). Federation respected — user supplies their own homeserver or uses one from a clearly-labeled list of third-party-operated recommendations.

**End-to-end encryption supported.**

**Note:** Matrix E2EE has real cross-device key-management complexity (cross-signing, device verification, key backup, room rotation). The adapter must either handle this well or be **explicit with users when it doesn't** — silently degrading from "encrypted" to "kinda encrypted" is exactly the failure mode we never want.

### 2.2 Farcaster adapter

Via a standard Farcaster Hub client library. Casts in channels map to messages; reactions map to reactions; direct-cast DMs map to DMs.

**Note:** Farcaster semantics differ fundamentally from Matrix:

- Farcaster: **public by default, on-chain identity**, messages effectively permanent.
- Matrix: **rooms with explicit membership, federated identity, E2EE optional but available**.

The UI must **not paper over this difference in ways that mislead users.** When a user posts to a Farcaster channel, it is clearly indicated that this is public and permanent. When a user is in a Matrix room without E2EE, that's also indicated. The user should never wonder "is what I just sent encrypted?" — the UI tells them.

---

## 3. Capability model — handle feature mismatch honestly

Different networks support different features (E2EE, edits, deletes, reactions, threads, presence). The UI **queries the adapter's capability flags and renders accordingly:**

- An "edit" button is **hidden** when the adapter reports edits are not supported.
- An "encrypted" indicator appears **only** when the adapter reports the current channel is E2EE.
- A **public/permanent warning** appears when the adapter reports a network where messages cannot be unsent (Farcaster, Nostr).
- A "delivered/read" indicator appears only when the underlying network actually provides one.

**Never fake a feature.** If a network doesn't support deletion, the UI doesn't pretend to delete. If a network doesn't have read receipts, the UI doesn't show a fake one. **This is a stated non-negotiable.**

The capability flags are part of the `ChatAdapter` interface and are inspected by the UI on every channel:

```ts
interface AdapterCapabilities {
  e2ee: 'always' | 'optional' | 'never'
  edits: boolean
  deletes: 'hard' | 'soft' | 'none'
  reactions: boolean
  threads: boolean
  presence: boolean
  read_receipts: boolean
  permanence: 'mutable' | 'permanent'  // Farcaster/Nostr = permanent
  public_default: boolean              // Farcaster channels = true
  attachments: AttachmentTypes[]
}
```

---

## 4. Unified views vs. per-network views

**Default view:** unified — a single timeline of channels across all connected accounts, sorted by recency. The user can filter to a specific account or a specific adapter when they want.

**Power users** can define **"spaces"** — saved filters that group specific channels from specific adapters. Example: a "Work" space combining a Matrix room and a Farcaster channel; a "Friends" space combining Matrix DMs and Farcaster direct casts.

Spaces are local to the user's K-OS install. They are not visible to anyone else.

---

## 5. Identity and presence across networks

A person you know on Matrix may be the same person you know on Farcaster. The app supports **optional identity linking** — the user tells the app "this Matrix handle and this Farcaster handle are the same person" and the app collapses them in contact lists.

**No automatic linking.** Cross-network identity claims are easy to get wrong and easy to abuse. Linking is always a deliberate user action.

Linked identities can be unlinked at any time. Linking is local to the user's install — it does not export to other users or to the networks themselves.

---

## 6. Privacy posture

- **Credentials never leave the device unencrypted.** Same encrypted IndexedDB pattern as K-Wallet.
- **Adapters are sandboxed.** A malicious or buggy adapter cannot read another adapter's credentials or another adapter's message history.
- **For Matrix:** homeserver choice is the user's. **No default homeserver ships enabled** — the user must choose their own or use one from a clearly-labeled list of third-party-operated recommendations. The UI is honest that the homeserver operator can see metadata about the user's activity.
- **For Farcaster:** signer management follows the network's standard patterns. **The user can revoke the K-OS signer at any time from within the app.**
- **Network metadata is the privacy hard problem.** Even E2EE chat reveals when you're online, who you talk to, and how often. The UI should be clear about this and link into the privacy education track for users who want to understand it.

---

## 7. No engagement metrics, no algorithmic feeds

The chat app presents messages **in chronological order**, or in the order the underlying network provides them. It does not rank, filter for "engagement," or inject recommended content.

**This is stated explicitly in the spec because it is a temptation many client developers do not resist.** K-OS resists.

The user's feed is the user's, not the platform's, and not the OS's.

---

## 8. Integration with the rest of K-OS

### 8.1 Commerce Layer integration

A user can send a payment request to a counterparty inside a chat — the payment runs through the Commerce Layer ([`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md)), the counterparty sees a **payment request card** in-line, settlement happens via whatever rails work between them.

Chat-as-context-for-commerce is a long-standing pattern (Discord bots, Telegram bots, Signal MobileCoin) and K-OS does it in a **rail-agnostic** way. The buyer is not asked to "use crypto"; the payment request card invokes the Commerce Layer router, which figures out what works between the two parties.

### 8.2 Datamoshpit / creative apps integration

A **"share into chat"** target means anything made in K-OS can be sent directly to a channel on any connected network, **honoring that network's attachment semantics.**

- A song from Datamoshpit shared to a Farcaster channel → uploads to a host the network supports, posts as cast with attachment.
- A sprite from the sprite editor shared to a Matrix room → uploads via the Matrix media repo, posts as message with embedded image.
- A 3D scene shared to a chat → handled per the network's capabilities; if the network doesn't support 3D scene attachments, the UI surfaces this and offers alternatives.

### 8.3 K-Wallet integration

For networks that use **on-chain identity** (Farcaster), the chat adapter can invoke K-Wallet for signer operations. For networks that don't (Matrix), **the wallet is never involved.** The chat adapter knows which case it's in via the capability flags.

---

## 9. Naming

Working name: not yet decided. Koolskull to choose. Placeholder candidates in the 2KOOL aesthetic:

1. **K-CHAT** — direct, fits the K-* naming pattern (K-OS, K-Wallet, K-CHAT).
2. **KOOLMAIL** — leans toward the older "computer terminal mail" vibe; works well for a pixel-correct messenger.
3. **THE GREEN ROOM** — borrows from Slimentologika's Ancient Temple of the Green Slime lineage; gives the app its own flavor distinct from the K-* naming.
4. **PIDGIN.SKULL** — explicit reference to the Pidgin multi-protocol IM client; signals the architecture upfront.
5. **PSALMQR** — devotional + protocol-quirky; probably too inside-baseball but worth listing.

Default ranking, subject to Koolskull's veto: **K-CHAT** for clarity, **THE GREEN ROOM** for character.

---

## 10. Open questions (need Koolskull's input)

1. **Voice / video calling in scope?** Adds significant complexity. Matrix supports it via MatrixRTC. Most other adapters either don't support it or implement it through bolt-ons. v0 is text-and-attachments-only by default; voice/video is a separate decision.
2. **How does the app handle a Matrix homeserver going offline mid-conversation?** Queue messages locally and resend? Fail loudly? Show a stale-state indicator? Each option has UX consequences.
3. **Default behavior for E2EE in Matrix rooms.** Force-enable for new DMs the user creates? Honor the room's existing setting always? Show an "encryption: off" warning when joining unencrypted rooms?
4. **Bot / integration support.** Matrix has a rich bot ecosystem. Should K-OS surface bots at all? If so, how does the user know a bot is a bot and not a person?
5. **History and search.** All-history search is heavy and privacy-sensitive (you're indexing all your own messages on-device). On by default? Off by default? User-configurable per account?
6. **Notifications.** Do we ship system notifications (browser notification API) by default? They leak presence to whoever can see your screen and to the network operator if not handled carefully.
7. **The naming decision** above (§ 9).

---

## 11. References

- `matrix-js-sdk` — https://github.com/matrix-org/matrix-js-sdk
- Matrix specification — https://spec.matrix.org/
- Farcaster Hubs — https://docs.farcaster.xyz/
- Beeper / Bitlbee / Pidgin (architectural precedent) — multi-protocol clients with one UI

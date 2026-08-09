/*
 *                    ☦
 *        K-CHAT — ADAPTER TYPES (dual rail)
 *
 *   Wallet/ENS encrypted messaging and Matrix are SEPARATE rails.
 *   Never blend them into one fake unified encryption story.
 *   See docs/CHAT_SPEC.md and the 2kooltv dual-rail plan note.
 */

export type ChatRailId = "wallet" | "matrix";

export interface AdapterCapabilities {
  /** Wallet rail: protocol E2EE. Matrix: room-dependent. */
  e2ee: "always" | "optional" | "never";
  edits: boolean;
  deletes: "hard" | "soft" | "none";
  reactions: boolean;
  permanence: "mutable" | "permanent";
  public_default: boolean;
  /** Human-readable label for the encryption story in the UI. */
  encryptionLabel: string;
}

export interface ChatPeer {
  /** Wallet: 0x address or ENS name. Matrix: @user:server. */
  handle: string;
  displayName?: string;
  rail: ChatRailId;
}

export interface ChatChannel {
  id: string;
  rail: ChatRailId;
  title: string;
  peer?: ChatPeer;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  rail: ChatRailId;
  body: string;
  senderHandle: string;
  createdAt: string; // ISO
  /** True only when the underlying protocol actually encrypts. */
  encrypted: boolean;
}

export interface OutgoingMessage {
  body: string;
}

/**
 * Minimal adapter surface. Live XMTP / matrix-js-sdk implementations come
 * later; v0 may ship stubs that report not-connected honestly.
 */
export interface ChatAdapter {
  id: ChatRailId;
  capabilities: AdapterCapabilities;
  /** Whether the user has credentials for this rail in this session. */
  isConnected(): boolean;
  listChannels(): Promise<ChatChannel[]>;
  sendMessage(channelId: string, msg: OutgoingMessage): Promise<ChatMessage>;
  fetchHistory(channelId: string): Promise<ChatMessage[]>;
  /** Open or resolve a 1:1 with a peer handle (address, ENS, or Matrix id). */
  openDirect?(peerHandle: string): Promise<ChatChannel>;
}

export const WALLET_CAPABILITIES: AdapterCapabilities = {
  e2ee: "always",
  edits: false,
  deletes: "none",
  reactions: false,
  permanence: "mutable",
  public_default: false,
  encryptionLabel: "Encrypted wallet DM (ENS / address) — not Matrix",
};

export const MATRIX_CAPABILITIES: AdapterCapabilities = {
  e2ee: "optional",
  edits: true,
  deletes: "soft",
  reactions: true,
  permanence: "mutable",
  public_default: false,
  encryptionLabel: "Matrix room — E2EE when the room is encrypted",
};

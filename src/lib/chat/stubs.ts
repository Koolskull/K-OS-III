/*
 *                    ☦
 *        K-CHAT — STUB ADAPTERS
 *
 *   Honest placeholders until XMTP (wallet/ENS) and matrix-js-sdk land.
 *   They never claim to send real messages.
 */

import type { ChatAdapter, ChatChannel, ChatMessage, OutgoingMessage } from "./types";
import { MATRIX_CAPABILITIES, WALLET_CAPABILITIES } from "./types";

export class WalletChatStub implements ChatAdapter {
  id = "wallet" as const;
  capabilities = WALLET_CAPABILITIES;
  private peer: string | null = null;

  isConnected(): boolean {
    // Real connection = wallet session + XMTP client. Stub is never live.
    return false;
  }

  async listChannels(): Promise<ChatChannel[]> {
    if (!this.peer) return [];
    return [
      {
        id: `wallet:${this.peer}`,
        rail: "wallet",
        title: this.peer,
        peer: { handle: this.peer, rail: "wallet" },
      },
    ];
  }

  async openDirect(peerHandle: string): Promise<ChatChannel> {
    const handle = peerHandle.trim();
    if (!handle) throw new Error("Peer address or ENS name required.");
    this.peer = handle;
    return {
      id: `wallet:${handle}`,
      rail: "wallet",
      title: handle,
      peer: { handle, rail: "wallet" },
    };
  }

  async sendMessage(_channelId: string, _msg: OutgoingMessage): Promise<ChatMessage> {
    throw new Error("Wallet/ENS encrypted chat is not live yet — XMTP adapter coming.");
  }

  async fetchHistory(_channelId: string): Promise<ChatMessage[]> {
    return [];
  }
}

export class MatrixChatStub implements ChatAdapter {
  id = "matrix" as const;
  capabilities = MATRIX_CAPABILITIES;

  isConnected(): boolean {
    // Identity-only Matrix login discards the access token — no live client.
    return false;
  }

  async listChannels(): Promise<ChatChannel[]> {
    return [];
  }

  async openDirect(peerHandle: string): Promise<ChatChannel> {
    const handle = peerHandle.trim();
    if (!handle.startsWith("@") || !handle.includes(":")) {
      throw new Error("Matrix id looks like @user:homeserver.org");
    }
    return {
      id: `matrix:${handle}`,
      rail: "matrix",
      title: handle,
      peer: { handle, rail: "matrix" },
    };
  }

  async sendMessage(_channelId: string, _msg: OutgoingMessage): Promise<ChatMessage> {
    throw new Error("Matrix chat client is not live yet — rooms stay on your homeserver.");
  }

  async fetchHistory(_channelId: string): Promise<ChatMessage[]> {
    return [];
  }
}

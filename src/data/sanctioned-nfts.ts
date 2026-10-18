/** Official koolskull + Remilia-core collections the Miyamaker Mini viewer will show. */

export interface SanctionedCollection {
  id: string;
  name: string;
  address: string;
  chainId: number;
  /** If set, token images can be built as `${imageBase}${tokenId}.png` */
  imageBase?: string;
  openseaSlug?: string;
}

export const MIYAMAKER_MINI = {
  id: "miyamaker-mini",
  name: "Miyamaker Mini",
  address: "0x375a1911C0C2982f59826C227B7830e5d5985d59",
  chainId: 1,
  imageBase: "https://koolskull.com/miyamakermini/metadata/images/",
  openseaSlug: "miyamaker-mini",
  mintPriceWei: "444400000000000000",
  mintPriceEth: "0.4444",
  maxSupply: 1024,
  heroGif: "https://koolskull.com/miyamakermini/mint/miyamini.gif",
  liveMintUrl: "https://koolskull.com/miyamakermini/mint/",
  licenseUrl: "https://miyamaker.com/",
} as const;

export const SANCTIONED_NFTS: SanctionedCollection[] = [
  {
    id: MIYAMAKER_MINI.id,
    name: MIYAMAKER_MINI.name,
    address: MIYAMAKER_MINI.address,
    chainId: 1,
    imageBase: MIYAMAKER_MINI.imageBase,
    openseaSlug: MIYAMAKER_MINI.openseaSlug,
  },
  {
    id: "mialien-eth",
    name: "Mialien Maker ETH",
    address: "0xC5759Dd58057808568C698fFDc4Ad5548D17e75a",
    chainId: 1,
    openseaSlug: "mialien",
  },
  {
    id: "kool-skull-s-halloween-special",
    name: "KOOL SKULL'S HALLOWEEN SPECIAL",
    address: "0x840C326D4E18Cc5969FE20335DcA0401078340fC",
    chainId: 1,
    openseaSlug: "kool-skull-s-halloween-special",
  },
  {
    id: "bannerz-by-koolskull",
    name: "THRASH BANNERZ BY KOOLSKULL",
    address: "0x19f053F02c676248fAEf8dabd88F119f942dc1aB",
    chainId: 1,
    openseaSlug: "thrashbannerz",
  },
  {
    id: "milady",
    name: "Milady Maker",
    // Prior address had no bytecode. This is the deployed Milady contract (name() = Milady).
    address: "0x5Af0D9827E0c53e4799bb226655a1de152a425a5",
    chainId: 1,
    openseaSlug: "milady",
  },
  {
    id: "remilio",
    name: "Redacted Remilio Babies",
    // Prior address had no bytecode. This is the traded Remilio contract.
    // Its on-chain name() string is "TEST NFT".
    address: "0xd3d9ddd0cf0a5f0bfb8f7fceae075df687eaebab",
    chainId: 1,
    openseaSlug: "remilio-babies",
  },
  {
    id: "radbro",
    name: "Radbro Webring V2",
    address: "0xABCDB5710B88f456fED1e99025379e2969F29610",
    chainId: 1,
    openseaSlug: "radbro-webring-v2",
  },
  {
    id: "bonkler",
    name: "Bonkler",
    address: "0xABFaE8A54e6817F57F9De7796044E9a60e61ad67",
    chainId: 1,
    openseaSlug: "bonkler",
  },
];

/** Public floor on koolskull.com. The other sanctioned collections stay buyable. */
const FLOOR_IDS = new Set([
  "miyamaker-mini",
  "mialien-eth",
  "kool-skull-s-halloween-special",
  "bannerz-by-koolskull",
]);

export function floorCollections(): SanctionedCollection[] {
  return SANCTIONED_NFTS.filter((c) => FLOOR_IDS.has(c.id));
}

export function sanctionedAddresses(): string[] {
  return SANCTIONED_NFTS.map((c) => c.address.toLowerCase());
}

export function getSanctioned(address: string): SanctionedCollection | undefined {
  const a = address.toLowerCase();
  return SANCTIONED_NFTS.find((c) => c.address.toLowerCase() === a);
}

export function isEthAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function fallbackTokenImage(contract: string, tokenId: string): string | null {
  const col = getSanctioned(contract);
  if (!col?.imageBase) return null;
  const id = tokenId.startsWith("0x") ? String(parseInt(tokenId, 16)) : tokenId.replace(/^0+/, "") || "0";
  return `${col.imageBase}${id}.png`;
}

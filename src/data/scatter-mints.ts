export interface ScatterMintDef {
  slug: string;
  title: string;
  shortName: string;
  tagline: string;
  body: string;
  scatterUrl: string;
  chainId: number;
  networkLabel: string;
  address: string;
  symbol: string;
  avatarUrl: string;
  bannerUrl: string;
  maxQuantity: number;
}

export const MIYAMAKER_MINT_SLUG = "miyamaker-mini";

export const MIYAMAKER_MINT_DEF: ScatterMintDef = {
  slug: MIYAMAKER_MINT_SLUG,
  title: "MIYAMAKER MINI",
  shortName: "MIYAMAKER",
  tagline: "ERC721M · 1024 SUPPLY · 0.4444 ETH",
  body: "Miyamaker Mini is a short-run ERC721M test NFT (1024 supply). 75% of mint funds go to the Milady Maker NFTX vault. Holders can receive a custom hand-drawn portrait update. Copyleft under the Viral Public License. DEUS VULT.",
  scatterUrl: "https://koolskull.com/miyamakermini/mint/",
  chainId: 1,
  networkLabel: "Ethereum Mainnet",
  address: "0x375a1911C0C2982f59826C227B7830e5d5985d59",
  symbol: "MIYA",
  avatarUrl: "https://koolskull.com/miyamakermini/metadata/images/1.png",
  bannerUrl: "https://koolskull.com/miyamakermini/mint/miyamini.gif",
  maxQuantity: 10,
};

export const SCATTER_MINTS: ScatterMintDef[] = [
  {
    slug: "mialien-eth",
    title: "MIALIEN MAKER ETH",
    shortName: "MIALIEN",
    tagline: "INTERGALACTIC HOMIES ON ETHEREUM",
    body: "After a long time cooking on this collection, running two versions on Sanko chain and then on Soylami, the ETH version is finally about to be unleashed! Don't worry, if you already own a Remilia product or a KOOLSKULL nft, you will be able to get some of these intergalactic homies for FREE. Mialien Skater, the SEGA Genesis game is coming, and paid mints of this collection will go toward that and the production of Stardrain, the animated chipthrash musical web experience! don't STRESS about the details, its a small team and a huge undertaking; JUST PORT ALL OF YOUR CASH INTO THIS NOW AND HAVE FAITH IN THE PROCESS!!!",
    scatterUrl: "https://www.scatter.art/c/mialien-eth",
    chainId: 1,
    networkLabel: "Ethereum Mainnet",
    address: "0xC5759Dd58057808568C698fFDc4Ad5548D17e75a",
    symbol: "👽",
    avatarUrl: "https://ucarecdn.com/d3d0ab80-0dbf-4290-96ab-9f81b0c94b10/",
    bannerUrl: "https://ucarecdn.com/fbd57635-caae-4d30-958e-aa08f1d26b57/",
    maxQuantity: 10,
  },
  {
    slug: "kool-skull-s-halloween-special",
    title: "KOOL SKULL'S HALLOWEEN SPECIAL",
    shortName: "HALLOWEEN",
    tagline: "HOLY THRASH PFPS · 999 SUPPLY",
    body: "KOOL SKULL'S HALLOWEEN SPECIAL is a Declaration of Superiority over all lower, demonic entities that attempt to permeate this time on the Human Earth Timeline. With GOD's Thrash Energy given to me, I plan on making the Dopest, most Thrashingest Art ever. Halloween is constantly overwhelmed by Propaganda and garbage by evil, but not this time. Now, GOD wins again by sending his KOOLEST little culture war soldier to the front of the line, sending out some wicked dope PFP's for internet users to rock while enjoying the most epic holy bull-run ever. AMEN!",
    scatterUrl: "https://www.scatter.art/c/kool-skull-s-halloween-special",
    chainId: 1,
    networkLabel: "Ethereum Mainnet",
    address: "0x840C326D4E18Cc5969FE20335DcA0401078340fC",
    symbol: "KSHS",
    avatarUrl: "https://ucarecdn.com/503ea378-29be-498d-8f8a-c6ce3a45d0f9/",
    bannerUrl: "https://ucarecdn.com/84dbcad3-72dd-4d43-ba25-f149988c7878/",
    maxQuantity: 10,
  },
  {
    slug: "bannerz-by-koolskull",
    title: "THRASH BANNERZ BY KOOLSKULL",
    shortName: "BANNERZ",
    tagline: "HORIZONTAL THRASH · 8888 BANNERS",
    body: "First in a series of new nft collections by 2KoolProductions. Thrash Bannerz is a collection made by KOOL SKULL to honor the legendary, under-appreciated micro subculture of THRASH. Energetically, Thrash is the answer to one's reactionary responses and when harnessed, can be analogous to what many refer to as \"Vril\", \"Chi\", or \"Prana\". In this creative dimension, all THRASH is expressed in honor and reverence to the ONE INFINITE FATHER GOD OF ALL CREATION. Even when our human vessels feel broken or distant from GOD'S Endless LIGHT, the THRASH we are blessed with expressing is dedicated to GOD because he USES our creative faculties for Divine Glory. The end of this perpetual culture war is coming, and these horizontal art pieces are intended to serve the purpose of exponentiating light into the lives of every human viewer, and every sentient digital entity it touches. DEUS VULT.",
    scatterUrl: "https://www.scatter.art/c/bannerz-by-koolskull",
    chainId: 1,
    networkLabel: "Ethereum Mainnet",
    address: "0x19f053F02c676248fAEf8dabd88F119f942dc1aB",
    symbol: "KSBNRZ",
    avatarUrl: "https://ucarecdn.com/962d8b7a-975f-46da-8946-5e14b566e7e0/",
    bannerUrl: "https://ucarecdn.com/d61a6f39-a6a2-4922-9858-50534b366790/",
    maxQuantity: 10,
  },
];

export const ALL_MINTS: ScatterMintDef[] = [...SCATTER_MINTS, MIYAMAKER_MINT_DEF];

export function isKnownScatterSlug(slug: string): boolean {
  return SCATTER_MINTS.some((c) => c.slug === slug);
}

export function isKnownMintSlug(slug: string): boolean {
  return ALL_MINTS.some((c) => c.slug === slug);
}

export function isMiyamakerMint(slug: string): boolean {
  return slug === MIYAMAKER_MINT_SLUG;
}

export function getScatterMint(slug: string): ScatterMintDef | undefined {
  return ALL_MINTS.find((c) => c.slug === slug);
}

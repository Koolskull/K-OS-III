/*
 * Folder on the site root for each app.
 * koolskull.com/market opens the OS with Marketplace.
 * Names were checked against the koolskull.com docroot on 18 Oct 2026.
 * A name already used by a live page, or by files an app loads, is not reused.
 */

import { availableCatalog, type AppId } from "@/lib/apps/catalog";

export const APP_FOLDER: Record<AppId, string> = {
  appmanager: "apps",
  manual: "manual",
  account: "sign-in",
  education: "learn",
  bible: "holy-bible",
  datamoshpit: "datamoshpit",
  kooldraw: "kooldraw",
  shotlist: "shotlist",
  tilemap: "tilemap",
  skulltext: "skulltext",
  skullmash: "mash",
  notes: "notes",
  nodemap: "nodemap",
  stance: "stance",
  games: "play",
  "stardrain-wiki": "stardrain-wiki",
  browser: "browser",
  prodev: "prodev",
  chat: "chat",
  discography: "records",
  albumart: "albumart",
  artgallery: "artgallery",
  cart: "cart",
  marketplace: "market",
  nftmint: "mints",
};

/** Docroot names that already exist. Compared case-insensitively. */
const RESERVED_FOLDERS = [
  ".well-known",
  "2kool",
  "3d",
  "404",
  "acceleratedyayo",
  "account",
  "album-covers",
  "album-fullscreen",
  "album-large",
  "album-thumbs",
  "albums",
  "api",
  "archive",
  "art",
  "audioshare",
  "bannerz",
  "bgcardbuilder",
  "bible",
  "bio",
  "biz",
  "blender",
  "cgi-bin",
  "codes",
  "discography",
  "dj",
  "doc",
  "docs",
  "dre",
  "education",
  "experiments",
  "familyphotos",
  "fonts",
  "gallery",
  "game",
  "games",
  "gifs",
  "glb",
  "glitch",
  "home",
  "howwell",
  "howwelldoyouknowyourcity",
  "icons",
  "images",
  "img",
  "instruments",
  "jitilio",
  "kos",
  "ks",
  "ksg",
  "lib",
  "menu",
  "mint",
  "miyamaker",
  "miyamakermini",
  "mp3",
  "nanoloop",
  "netflixsandbox",
  "obj",
  "player",
  "portraitz",
  "reference",
  "render",
  "resume",
  "roms",
  "sammmmm",
  "sanko-star",
  "scenes",
  "screenshots",
  "skullmash",
  "sprites",
  "src",
  "stardrain",
  "static",
  "stepdude",
  "store",
  "t44",
  "test",
  "testos",
  "thrashtracker",
  "unity",
  "video",
  "webampskins",
  "work",
];

const reserved = new Set(RESERVED_FOLDERS);

const folderToApp = new Map<string, AppId>(
  (Object.entries(APP_FOLDER) as [AppId, string][]).map(([id, folder]) => [folder, id]),
);

export function appIdFromPathname(pathname: string): AppId | undefined {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  let path = pathname || "/";
  if (base && (path === base || path.startsWith(`${base}/`))) {
    path = path.slice(base.length) || "/";
  }
  const segment = path.split("/").filter(Boolean)[0];
  if (!segment) return undefined;
  return folderToApp.get(segment);
}

/** Folders this brand's static export should write. Throws if one is already taken. */
export function appFoldersToBuild(): string[] {
  const folders = availableCatalog().map((app) => APP_FOLDER[app.id]);
  const seen = new Set<string>();
  for (const folder of folders) {
    if (seen.has(folder)) throw new Error(`Two apps share /${folder}`);
    seen.add(folder);
    if (reserved.has(folder.toLowerCase())) {
      throw new Error(`/${folder} is already a koolskull.com folder`);
    }
  }
  return folders;
}

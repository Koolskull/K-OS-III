import catalog from "@/data/discography.json";
import { mediaUrl } from "@/lib/buildFlags";

export interface MusicTrack {
  url: string;
  duration: number;
  metaData: {
    artist: string;
    title: string;
    album?: string;
  };
}

export interface MusicAlbum {
  id: string;
  title: string;
  artist: string;
  year: string;
  coverUrl?: string;
  thumbUrl?: string;
  largeUrl?: string;
  fullscreenUrl?: string;
  tracks: MusicTrack[];
}

export const DISCOGRAPHY: MusicAlbum[] = catalog as MusicAlbum[];

export function getAlbum(id: string | undefined | null): MusicAlbum | undefined {
  if (!id) return undefined;
  return DISCOGRAPHY.find((a) => a.id === id);
}

export function albumThumb(album: MusicAlbum): string {
  return mediaUrl(album.thumbUrl || album.coverUrl);
}

export function albumLarge(album: MusicAlbum, maximized?: boolean): string {
  if (maximized && album.fullscreenUrl) return mediaUrl(album.fullscreenUrl);
  return mediaUrl(album.largeUrl || album.coverUrl);
}

export function webampTracks(album: MusicAlbum): MusicTrack[] {
  return album.tracks.map((t) => ({
    ...t,
    url: mediaUrl(t.url),
  }));
}

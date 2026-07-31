/*
 *                    ☦
 *        ASSET LIBRARY — SERVER-SIDE FILE STORAGE
 *
 *   Plain image/audio uploads that aren't produced by KoolDraw/Datamoshpit
 *   (those register into the library directly from their own save/render
 *   flow instead). Written under public/uploads/ so Next serves them the
 *   same way as any other static asset — fine for the live Node deploy
 *   (Phase 5 of the plan), since that's a persistent process, not
 *   serverless/edge.
 */

import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export class UploadError extends Error {}

const KIND_LIMITS: Record<string, { maxBytes: number; mimePrefix: string; extensions: Set<string> }> = {
  image: {
    maxBytes: 10 * 1024 * 1024,
    mimePrefix: "image/",
    extensions: new Set(["png", "jpg", "jpeg", "gif", "webp"]),
  },
  audio: {
    maxBytes: 30 * 1024 * 1024,
    mimePrefix: "audio/",
    extensions: new Set(["mp3", "wav", "ogg", "m4a"]),
  },
};

function extensionFor(filename: string): string {
  const ext = path.extname(filename).replace(/^\./, "").toLowerCase();
  return ext;
}

/** Validate + save an uploaded image/audio File to disk. Returns its public URL path. */
export async function saveUploadedAsset(kind: "image" | "audio", file: File): Promise<string> {
  const limits = KIND_LIMITS[kind];
  if (!limits) throw new UploadError("Unsupported asset kind.");
  if (file.size === 0) throw new UploadError("Empty file.");
  if (file.size > limits.maxBytes) {
    throw new UploadError(`File too large (max ${Math.round(limits.maxBytes / (1024 * 1024))}MB).`);
  }
  if (file.type && !file.type.startsWith(limits.mimePrefix)) {
    throw new UploadError(`Expected a ${kind} file.`);
  }
  const ext = extensionFor(file.name);
  if (!limits.extensions.has(ext)) {
    throw new UploadError(`Unsupported file extension ".${ext}".`);
  }

  const dir = path.join(UPLOAD_ROOT, kind);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${kind}/${filename}`;
}

/** Delete a previously-saved upload by its public URL path. Best-effort — never throws. */
export async function deleteUploadedAsset(urlPath: string): Promise<void> {
  if (!urlPath.startsWith("/uploads/")) return;
  const abs = path.join(process.cwd(), "public", urlPath);
  if (!abs.startsWith(UPLOAD_ROOT)) return; // guard against path traversal
  await unlink(abs).catch(() => {});
}

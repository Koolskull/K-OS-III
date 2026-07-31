/*
 *                    ☦
 *        DATAMOSHPIT RENDER — PUBLIC PLAYBACK
 *
 *   Script-free by design: nothing here but a native <audio>/<video> tag
 *   pointed at a server-generated file (src/app/api/datamoshpit/renders).
 *   No client JS, no live Datamoshpit engine, no user-suppliable content —
 *   so there's no script-execution surface to abuse. Publicly viewable
 *   (like a YouTube link) — the "airtight" concern is about the render
 *   *trigger* (rate-limited, owner-only, see the API route), not playback.
 *   Embeddable same-origin via <iframe src="/render/[id]">.
 */

import { notFound } from "next/navigation";
import { pool } from "@/lib/db";

interface RenderRow {
  id: number;
  title: string;
  kind: "audio" | "video";
  file_path: string;
  mime_type: string;
  duration_seconds: string;
}

async function getRender(id: number): Promise<RenderRow | null> {
  const result = await pool.query(
    `SELECT id, title, kind, file_path, mime_type, duration_seconds FROM datamoshpit_renders WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export default async function RenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const renderId = Number(id);
  if (!Number.isInteger(renderId)) notFound();

  const render = await getRender(renderId);
  if (!render) notFound();

  return (
    <div
      style={{
        margin: 0,
        width: "100%",
        height: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
      }}
    >
      {render.kind === "video" ? (
        <video
          src={render.file_path}
          controls
          autoPlay={false}
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        >
          <track kind="captions" />
        </video>
      ) : (
        <div style={{ width: "min(92vw, 480px)", textAlign: "center" }}>
          <div style={{ color: "#ccc", fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>
            {render.title.toUpperCase()}
          </div>
          <audio src={render.file_path} controls style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
}

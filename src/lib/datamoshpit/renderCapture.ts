/*
 *                    ☦
 *        DATAMOSHPIT — BOUNCE TO FILE
 *
 *   Real-time capture, not an instant offline render: MediaRecorder tapping
 *   AudioEngine.getRecordingStream() while the song actually plays. See that
 *   method's comment for why (GranularEngine's setInterval-driven grain
 *   scheduling isn't offline-render-safe). A render take exactly as long as
 *   the song does — this trades render speed for correctness and zero new
 *   audio-engine complexity.
 */

export const MAX_RENDER_SECONDS = 10 * 60; // hard cap — also enforced server-side via file size

const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

function pickMimeType(): string | undefined {
  for (const type of PREFERRED_MIME_TYPES) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

export interface RenderCapture {
  /** Stop early (also fires automatically at MAX_RENDER_SECONDS). Resolves with the recorded blob. */
  stop: () => void;
  /** Resolves once recording actually stops (either via stop() or the duration cap). */
  done: Promise<{ blob: Blob; mimeType: string; seconds: number }>;
}

/** Start recording a MediaStream (see AudioEngine.getRecordingStream()) to a Blob. */
export function startRenderCapture(stream: MediaStream): RenderCapture {
  const mimeType = pickMimeType();
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  const startedAt = performance.now();

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<{ blob: Blob; mimeType: string; seconds: number }>((resolve) => {
    recorder.onstop = () => {
      const seconds = (performance.now() - startedAt) / 1000;
      resolve({ blob: new Blob(chunks, { type: recorder.mimeType }), mimeType: recorder.mimeType, seconds });
    };
  });

  recorder.start();
  const capTimer = setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, MAX_RENDER_SECONDS * 1000);

  return {
    stop: () => {
      clearTimeout(capTimer);
      if (recorder.state !== "inactive") recorder.stop();
    },
    done,
  };
}

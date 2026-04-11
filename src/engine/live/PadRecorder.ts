/*
 *            ☦
 *      ╔════════════════════╗
 *      ║  ST. ISIDORE OF    ║
 *      ║  SEVILLE — Patron  ║
 *      ║  of the Internet   ║
 *      ╚════════════════════╝
 *
 *   PAD RECORDER
 *   Records audio from the default input device directly onto a pad.
 *   Tap empty pad → start recording. Tap again → stop and assign sample.
 *   Uses MediaStream API + Web Audio for capture.
 */

import * as Tone from "tone";
import type { ProjectSample } from "@/types/tracker";

export class PadRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private recording = false;
  private recordingPad: { padIndex: number; bank: number } | null = null;

  isRecording(): boolean {
    return this.recording;
  }

  getRecordingPad(): { padIndex: number; bank: number } | null {
    return this.recordingPad;
  }

  /**
   * Start recording from the default audio input.
   * Returns false if mic access is denied.
   */
  async startRecording(padIndex: number, bank: number): Promise<boolean> {
    if (this.recording) return false;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.warn("[PAD RECORDER] Mic access denied:", e);
      return false;
    }

    this.chunks = [];
    this.recordingPad = { padIndex, bank };

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start(100); // collect data every 100ms
    this.recording = true;
    console.log(`[PAD RECORDER] Recording to pad ${padIndex} bank ${bank}`);
    return true;
  }

  /**
   * Stop recording and return the decoded sample.
   * Returns null if nothing was recorded.
   */
  async stopRecording(): Promise<ProjectSample | null> {
    if (!this.recording || !this.mediaRecorder || !this.recordingPad) return null;

    const pad = this.recordingPad;

    return new Promise<ProjectSample | null>((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        // Clean up media stream
        this.mediaStream?.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
        this.recording = false;

        if (this.chunks.length === 0) {
          this.recordingPad = null;
          resolve(null);
          return;
        }

        const blob = new Blob(this.chunks, { type: this.mediaRecorder!.mimeType });
        this.chunks = [];

        try {
          const arrayBuffer = await blob.arrayBuffer();
          // Decode to verify it's valid audio
          const ctx = Tone.getContext().rawContext;
          await ctx.decodeAudioData(arrayBuffer.slice(0));

          const sampleId = Date.now(); // unique ID from timestamp
          const sample: ProjectSample = {
            id: sampleId,
            name: `REC_${pad.bank}_${pad.padIndex}`,
            data: arrayBuffer,
          };

          console.log(`[PAD RECORDER] Captured ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB`);
          this.recordingPad = null;
          resolve(sample);
        } catch (e) {
          console.warn("[PAD RECORDER] Failed to decode recording:", e);
          this.recordingPad = null;
          resolve(null);
        }
      };

      this.mediaRecorder!.stop();
    });
  }

  dispose(): void {
    if (this.recording) {
      this.mediaRecorder?.stop();
      this.mediaStream?.getTracks().forEach((t) => t.stop());
    }
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.recording = false;
    this.recordingPad = null;
  }
}

/*
 *                    ☦
 *      SPIKE ROUTE — /spike/retro
 *
 *  Verification mount for the emulator shell research. Not linked from
 *  the desktop or manual. Navigate to /spike/retro (or the equivalent
 *  with NEXT_PUBLIC_BASE_PATH prepended) to kick the tires.
 *
 *  Arrow keys scroll the test pattern. Q/W/Space/Shift cycle palettes.
 *  Click LOAD ROM and pick any file — the test core accepts anything
 *  and just flips a "running" flag. Replace the core factory in the
 *  component props to swap in a real WASM core.
 */

import { RetroSpikeApp } from "@/components/apps/retro-spike";

export const metadata = {
  title: "K-OS · RETRO SPIKE",
};

export default function RetroSpikePage() {
  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#000" }}>
      <RetroSpikeApp />
    </div>
  );
}

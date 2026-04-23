import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function SceneVM() {
  return (
    <>
      <Lead>
        The <Strong>Scene VM</Strong> (Visual Module) is K-OS's runtime for
        visuals that fire alongside tracker notes. It's small, deliberately
        theatre-free, and routes every frame through the same tick clock that
        drives audio — so visuals can never drift out of sync. This article
        covers how it works under the hood. Start with{" "}
        <Crossref to="per-instrument-visuals" /> if you just want to use it.
      </Lead>

      <H2>Where it came from</H2>
      <P>
        The Scene VM is a slimmed port of the cutscene runtime from BeetleGame
        (a sister project). BeetleGame's editor was useful but heavy; for K-OS
        we wanted just the runtime — keyframe interpolation, simplex noise,
        manifest-driven layer rendering — without the editor chrome and without
        Theatre.js.
      </P>
      <P>
        Live in the codebase at{" "}
        <Code>src/components/apps/datamoshpit/visuals/scene-vm/</Code>. About
        1,200 lines total. Pure functions in the lib folder, React components
        in the same folder.
      </P>

      <H2>The mental model</H2>
      <P>
        A <Strong>scene</Strong> is described by a JSON-shaped manifest: which
        layers to render, where to place them, what keyframes each layer
        animates through. The renderer walks this manifest every frame and
        produces the visible output (currently DOM-based with CSS transforms;
        Three.js for 3D models is planned).
      </P>
      <P>
        A <Strong>visual module</Strong> is a scene bound to a Datamoshpit
        instrument. When the tracker fires a note, the engine emits a note
        event; the bound scene's playhead advances, jumps, or scrubs based on
        the trigger mode.
      </P>

      <H2>The manifest</H2>
      <P>
        At its smallest, a scene manifest looks like this:
      </P>
      <CodeBlock label="Minimum viable scene">
{`{
  id: "kick-punch",
  name: "KICK PUNCH",
  duration: 0.5,            // seconds
  totalFrames: 12,
  layers: [
    {
      id: "punch",
      type: "solid",
      z: 1,
      solidColor: "#ffffff",
      solidSize: { w: 96, h: 96 },
      transformKeyframes: [
        { frame: 1,  mode: "linear", x: 0.5, y: 0.5, scaleX: 0.2, scaleY: 0.2, rotation: 0, opacity: 1 },
        { frame: 3,  mode: "bezier", x: 0.5, y: 0.5, scaleX: 2.5, scaleY: 2.5, rotation: 0, opacity: 1 },
        { frame: 12, mode: "linear", x: 0.5, y: 0.5, scaleX: 0.4, scaleY: 0.4, rotation: 0, opacity: 0 },
      ],
    },
  ],
}`}
      </CodeBlock>
      <P>
        That's a white square that pops from small to big and fades out — a
        kick-drum flash. Three keyframes; the renderer interpolates between them
        every frame.
      </P>

      <H2>The lib</H2>
      <P>
        The lib folder under <Code>visuals/scene-vm/lib/</Code>:
      </P>
      <UList>
        <Li>
          <Strong><Code>types.ts</Code></Strong> — slimmed scene types. Layer types,
          keyframe shapes, manifest. Mirrors but doesn't import BeetleGame's
          types.
        </Li>
        <Li>
          <Strong><Code>keyframe-interpolation.ts</Code></Strong> — the easing
          engine. Modes are <Code>linear</Code>, <Code>bezier</Code>,{" "}
          <Code>hold</Code>, <Code>bounce-in/out/both</Code>. Pure functions.
        </Li>
        <Li>
          <Strong><Code>simplex-noise.ts</Code></Strong> — 2D Stefan-Gustavson
          simplex noise + helpers for ambient wobble and keyframed shake. Zero
          dependencies; fits in 130 lines.
        </Li>
        <Li>
          <Strong><Code>timeline-utils.ts</Code></Strong> — frame ↔ time conversion
          plus <Code>tickToFrame(tick, bpm, tpb)</Code> for converting tracker
          ticks into scene frames.
        </Li>
        <Li>
          <Strong><Code>asset-resolver.ts</Code></Strong> — manifest-local asset
          lookup. Stub for v0; will grow when we add OS-level asset registries.
        </Li>
      </UList>

      <H2>The renderer</H2>
      <P>
        <Code>SceneVMPlayer.tsx</Code> walks the manifest's layers, sorts by{" "}
        <Code>z</Code>, and renders each one as a positioned, transformed DOM
        element. CSS transforms (<Code>translate</Code>, <Code>scale</Code>,{" "}
        <Code>rotate</Code>) and CSS filters (<Code>brightness</Code>,{" "}
        <Code>blur</Code>, <Code>hue-rotate</Code>, <Code>saturate</Code>) come
        from interpolating the layer's transformKeyframes against the current
        frame. CSS <Code>mix-blend-mode</Code> handles per-layer compositing.
      </P>
      <P>
        DOM-based rendering is intentional for v0. It's cheap, debuggable, and
        the bottleneck for K-OS visuals isn't fill rate — it's the variety of
        layer types we want to support (image, video, shader, 3D model). When
        3D layers land they'll mount a Three.js Canvas alongside the DOM stack.
      </P>

      <H2>The audio bridge</H2>
      <P>
        The <Code>TrackerEngine</Code> in <Code>src/engine/tracker/</Code> emits
        a <Code>NoteEvent</Code> every time a phrase row triggers a note. Scene
        VM windows subscribe to that event stream via <Code>onNoteEvent(cb)</Code>{" "}
        and use it to drive playhead changes.
      </P>
      <P>
        Crucially, the note events fire at the <Strong>same Tone.js schedule</Strong>{" "}
        as the audio attack — sample-accurate. The playhead update happens
        immediately; the rAF loop interpolating between keyframes catches up to
        whatever the audio just did.
      </P>
      <CodeBlock label="The note event shape">
{`interface NoteEvent {
  channel: number;       // 0..7
  note: number;          // MIDI note after transpose
  velocity: number;      // 0..127 (constant 100 for now)
  tick: number;          // global tick counter
  phraseRow: number;
  instrument: number | null;
  type: "on" | "off";
}`}
      </CodeBlock>

      <H2>Trigger modes recap</H2>
      <UList>
        <Li><Code>play-from-start</Code> — note resets playhead to 1, plays forward.</Li>
        <Li><Code>play-from-frame</Code> — note jumps playhead to a specified frame.</Li>
        <Li><Code>pitch-mapped</Code> — note pitch scrubs the playhead within a MIDI range.</Li>
        <Li><Code>velocity-amp</Code> — note doesn't move the playhead; modulates noise amplitude.</Li>
        <Li><Code>none</Code> — playhead loops continuously, ignoring notes.</Li>
      </UList>

      <H2>Ambient noise + keyframed shake</H2>
      <P>
        Two layers of organic motion:
      </P>
      <UList>
        <Li>
          <Strong>Ambient noise</Strong> per layer — runs continuously,
          configurable per property (x, y, rotation, scaleX, scaleY). Independent
          channels with their own amplitude / frequency / seed. Adds gentle
          life to static compositions.
        </Li>
        <Li>
          <Strong>Keyframed shake</Strong> — noise amplitude/frequency
          interpolated between noise keyframes on the timeline. Dramatic shake
          moments that ramp in and fade out. Stacks additively with ambient.
        </Li>
      </UList>

      <H2>The compositor (planned)</H2>
      <P>
        v0 renders one Scene VM window at a time. The full design (see{" "}
        <Code>docs/DATAMOSHPIT_VIDEO_SPEC.md</Code> in the repo) is an 8-layer
        compositor where each Datamoshpit channel can carry its own scene, and
        the layers are blended into one output canvas. Today, multiple windows
        coexist; tomorrow, a single composited canvas.
      </P>

      <H2>Performance</H2>
      <P>
        Target is 60fps on a mid-range laptop with 8 channels active and 3 of
        them running shaders. DOM-based v0 hits that easily for color/image
        layers. Shader layers will need an FBO pool when they ship; iframes can
        jank the main thread, with a documented best-practice for visualizer
        authors.
      </P>

      <Aside title="The tracker is the master clock" variant="info">
        Visuals slave to ticks; ticks come from Tone.js's transport, which is
        sample-accurate against the audio output. If a visual layer can't keep
        up, it drops frames; it does not slow the audio. This is non-negotiable
        and is why the Scene VM is built around frame interpolation rather than
        elapsed-time animation.
      </Aside>

      <H2>What to read next</H2>
      <UList>
        <Li><Crossref to="per-instrument-visuals" /> for the user-facing settings.</Li>
        <Li><Crossref to="dmpit-format" /> for how scenes get serialized into project files.</Li>
        <Li>
          The full design spec lives at{" "}
          <Code>docs/DATAMOSHPIT_VIDEO_SPEC.md</Code> in the repo. It covers the
          three v0 VM types (Image Sequence, Iframe, Shader), the compositor
          model, and the ten open questions still pending design decisions.
        </Li>
      </UList>
    </>
  );
}

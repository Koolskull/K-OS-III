import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref, Hex } from "@/components/doc/elements";

export default function PerInstrumentVisuals() {
  return (
    <>
      <Lead>
        Every instrument in Datamoshpit can carry a tiny visual scene — a flat
        color, an image, a shader, a 3D model — that fires when its notes
        trigger. The visual settings live on the F4 Instrument page; the
        rendering is handled by the <Crossref to="scene-vm">Scene VM</Crossref>.
        It's off by default; turning it on reveals the controls.
      </Lead>

      <H2>The mental model</H2>
      <P>
        Think of each instrument as having two halves: a sound source (the FM
        synth, sample player, or noise gen you already know) and an optional
        visual source (a small scene with its own short timeline). When the
        tracker plays a note on a channel using that instrument, the audio fires{" "}
        <Strong>and</Strong> the visual fires, in lockstep with each other.
      </P>
      <P>
        Multiple instruments → multiple visuals. The Scene VM has a "follow active
        instrument" mode that always shows whichever instrument fired most
        recently — switch instruments in your phrase, the visual switches.
      </P>

      <H2>Turning visuals on for an instrument</H2>
      <P>
        On the F4 Instrument page, scroll down past the FM operators. You'll see
        a <Code>── VISUAL ──</Code> separator. Below it, a single row:
      </P>
      <CodeBlock>
{`ENABL  OFF`}
      </CodeBlock>
      <P>
        Cursor onto it, Q-flick to <Code>ON</Code>, and the rest of the controls
        appear.
      </P>

      <H2>The quick settings</H2>
      <P>
        Each instrument has these:
      </P>
      <UList>
        <Li><Code>RND</Code> — Q-flick to re-roll the random fields with a new seed.</Li>
        <Li><Code>SRC</Code> — visual source: <Code>NONE / COLOR / IMAGE / VIDEO / SHADER / MODEL / IFRAME</Code>.</Li>
        <Li><Code>COLOR</Code> — only when SRC=COLOR. 256-step HSL palette. Q-flick cycles.</Li>
        <Li><Code>SHADR</Code> — only when SRC=SHADER. Cycles between built-in shader IDs.</Li>
        <Li><Code>ASSET / LOAD / DRAW / CLR</Code> — only when SRC=IMAGE. See "Asset sources" below.</Li>
        <Li><Code>W H</Code> — pixel size before scale (8 to 1024).</Li>
        <Li><Code>X Y</Code> — position from <Hex value={0x00} link={false} /> (top-left) to <Hex value={0xff} link={false} /> (bottom-right). <Hex value={0x80} link={false} /> in both is centered.</Li>
        <Li><Code>LEN</Code> — total frames for the scene timeline. Range is 8 to 128.</Li>
        <Li><Code>TRIG</Code> — how a note drives the playhead: <Code>START / FRAME / PITCH / VELAMP / NONE</Code>.</Li>
        <Li><Code>TFRM</Code> — only when TRIG=FRAME. Frame to jump to on note.</Li>
        <Li><Code>PLO PHI</Code> — only when TRIG=PITCH. MIDI note range that maps to scene frames.</Li>
        <Li><Code>TLINE</Code> — opens the timeline editor for fine-grained keyframe authoring.</Li>
        <Li><Code>TCLR</Code> — appears when custom keyframes exist. Reverts to auto-generated.</Li>
      </UList>

      <H2>Trigger modes</H2>
      <H3>play-from-start (default)</H3>
      <P>Every note resets the scene to frame 1 and plays forward through the timeline. Best for one-shot effects (a flash on a kick, a spin on a snare).</P>
      <H3>play-from-frame</H3>
      <P>Note jumps the playhead to a configured frame and plays forward from there. Useful when you want to drop into the middle of an animation.</P>
      <H3>pitch-mapped</H3>
      <P>The note's pitch maps to a scene frame within the configured range. Higher notes = later frames. Lets the scene act like a "scrubber" controlled by melody.</P>
      <H3>velocity-amp</H3>
      <P>The playhead doesn't move on a note; the scene plays continuously. Note velocity scales noise amplitude (more on that under <Crossref to="scene-vm" />).</P>
      <H3>none</H3>
      <P>The scene loops forever, indifferent to notes. Use for ambient backdrop.</P>

      <H2>Asset sources</H2>
      <H3>Color</H3>
      <P>
        A flat colored rectangle. No external file needed. The 256-step palette
        is HSL — Q-flick the <Code>COLOR</Code> field to cycle. The first entries
        are white and near-black; the rest sweep through hues at moderate
        saturation.
      </P>

      <H3>Image (PNG / JPG / GIF)</H3>
      <P>
        On the <Code>SRC=IMAGE</Code> row, three new rows appear:{" "}
        <Code>ASSET</Code> (read-only display of current asset), <Code>LOAD</Code>{" "}
        (Q-flick opens a native file picker), and <Code>DRAW</Code> (Q-flick
        opens KoolDraw embedded so you can paint a sprite for this instrument).
      </P>
      <P>
        Picked or drawn images are stored as data URLs inside the project file.
        That means a saved <Code>.dmpit</Code> project is portable — anyone with
        the file has the images too. The trade-off: image data inflates the
        project size, so very large images (multi-MB) add up.
      </P>

      <H3>GIF, video, shader, model, iframe</H3>
      <P>
        These are first-class types in the data model but the Scene VM v0
        renderer only fully implements color and image so far. The other source
        types render colored placeholders today; full implementations land in
        future releases. The save format is forward-compatible — set them now
        and they'll come alive when the renderers ship.
      </P>

      <H2>Live preview</H2>
      <P>
        Toggle the top-bar <Code>VM</Code> button until you see <Code>VM:FLW</Code>{" "}
        (follow). A draggable window appears showing whatever instrument's
        visual fired most recently. Play your phrase — visuals follow each note.
      </P>

      <H2>Custom keyframes (the timeline editor)</H2>
      <P>
        The auto-generated scene from your quick-settings is a good starting
        point. For finer control — multiple keyframes, custom easing, brightness
        / blur / hue-rotate / saturate filters — open the inline timeline editor
        with <Code>TLINE</Code>.
      </P>
      <P>
        The editor has a keyframe table on the left and a live preview on the
        right. Add and remove keyframes, edit each one's frame number, position,
        scale, rotation, opacity, and CSS filters. Hit <Code>SAVE</Code> to
        commit; the visual now uses your authored keyframes instead of the
        auto-generated ones. <Code>TCLR</Code> reverts.
      </P>

      <Aside title="Defaults are good" variant="tip">
        For most instruments, the default randomized scene + the trigger-mode
        choice is enough. Only open the timeline editor when you have a
        specific shape in mind. Otherwise the randomizer + RND re-roll is much
        faster.
      </Aside>

      <H2>The "FLW" mode visualizer</H2>
      <P>
        The Scene VM window in follow mode is a draggable floating panel with a
        title bar showing the currently-firing instrument. It's pixel-correct
        chrome, no rounded corners, no AA. Designed to be parked in the corner
        of your screen during a session.
      </P>

      <H2>What to read next</H2>
      <UList>
        <Li><Crossref to="scene-vm" /> for the technical model behind how visuals stay in lockstep with audio.</Li>
        <Li><Crossref to="song-chain-phrase" /> for how instruments fit into the larger composition.</Li>
      </UList>
    </>
  );
}

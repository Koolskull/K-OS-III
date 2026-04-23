import { Lead, P, H2, Strong, Code, Crossref } from "@/components/doc/elements";

export default function Glossary() {
  return (
    <>
      <Lead>
        Quick lookup for K-OS-specific terms. Cross-referenced with the longer
        articles where each concept is explained in depth.
      </Lead>

      <Term name="Asset Base">
        The absolute URL where K-OS bundled assets live, configurable at build
        time via <Code>NEXT_PUBLIC_ASSET_BASE</Code>. Lets the same{" "}
        <Code>out/</Code> artifact serve different hosts. See{" "}
        <Code>docs/DEPLOYMENT.md</Code>.
      </Term>

      <Term name="Base Path">
        The URL path prefix the app is served under, e.g. <Code>/k-os</Code> for
        <Code>koolskull.github.io/k-os</Code>. Set via{" "}
        <Code>NEXT_PUBLIC_BASE_PATH</Code> at build time.
      </Term>

      <Term name="Beta">
        The current release stage (<Code>0.2.0-beta.1</Code>). Working,
        buildable, but rough. Save format may change before 0.3.
      </Term>

      <Term name="BPM">
        Beats per minute — the song's tempo. Set on the F7 Project screen, can
        be changed mid-song with the <Code>T</Code> effect command.
      </Term>

      <Term name="Chain">
        A sequence of up to 16 phrase IDs that play in order, with optional
        per-step transpose. The middle layer of the song hierarchy. See{" "}
        <Crossref to="song-chain-phrase" />.
      </Term>

      <Term name="Channel">
        One of the 8 audio output channels. Each channel plays a chain at any
        given time. Channels are independent — they walk their own chains at
        their own pace.
      </Term>

      <Term name="CMD1 / CMD2">
        The two effect command columns in a phrase row. See{" "}
        <Crossref to="effect-commands" />.
      </Term>

      <Term name="Datamoshpit">
        K-OS's flagship app — the music tracker. Includes the Song / Chain /
        Phrase editors, instrument editing, sample loading, live pads, the
        Scene VM. Named after the visual datamoshing aesthetic of the
        crt-feedback shader.
      </Term>

      <Term name=".dmpit">
        K-OS project file extension. A ZIP archive containing{" "}
        <Code>project.json</Code> and binary sample files. See{" "}
        <Crossref to="dmpit-format" />.
      </Term>

      <Term name="FM Synthesis">
        Frequency modulation synthesis. K-OS's primary synth engine, modeled on
        the Yamaha YM2612 used in the Sega Genesis / Mega Drive. Four operators
        per voice, eight algorithms for routing them.
      </Term>

      <Term name="Hex / Hexadecimal">
        Base-16 number system. Used everywhere in K-OS for IDs and effect values.
        See <Crossref to="hexadecimal" />.
      </Term>

      <Term name="Instrument">
        A sound source plus optional visual. K-OS supports 256 instruments per
        project. Types include FM, sample, and synth. See{" "}
        <Crossref to="per-instrument-visuals" /> for the visual side.
      </Term>

      <Term name="Keyframe">
        A point on the visual timeline where transform values are explicitly
        set. The Scene VM interpolates between keyframes using the configured
        easing mode (linear, bezier, hold, bounce). See <Crossref to="scene-vm" />.
      </Term>

      <Term name="KoolDraw">
        K-OS's pixel-art sprite editor. Standalone app on the desktop;
        embeddable as a sprite-creation surface from the F4 instrument visual
        editor.
      </Term>

      <Term name="LGPT">
        LittleGPTracker. The PSP-era tracker that K-OS's input model is based
        on. Source mirrored at <Code>../LittleGPTracker-master/</Code> in the
        workspace.
      </Term>

      <Term name="Live Mode">
        A playback mode where chains loop on the current song row instead of
        advancing. Toggle from F1 Song screen with <Code>Shift+W+Up</Code>.
      </Term>

      <Term name="Macro">
        A user-assignable knob/slider on an instrument that maps to one or more
        synthesis parameters. Lets you create high-level controls.
      </Term>

      <Term name="MIDI">
        Musical Instrument Digital Interface. K-OS supports MIDI input via the
        Web MIDI API — connect a controller and notes flow into the active
        phrase. MIDI Learn assigns physical knobs to parameters.
      </Term>

      <Term name="Phrase">
        The smallest reusable musical unit — typically 16 rows of note,
        instrument, and effect data. See <Crossref to="song-chain-phrase" />.
      </Term>

      <Term name="PicoTracker">
        RP2040-based hardware tracker, spiritual successor to LGPT. Similar
        input model. Source mirrored at <Code>../picoTracker-master/</Code> in
        the workspace.
      </Term>

      <Term name="Quick-Fill">
        K-OS pre-fills empty chain steps and song cells with the most-recently-
        touched phrase or chain ID. The LGPT <Code>lastPhrase_</Code> trick.
      </Term>

      <Term name="Scene VM">
        The Visual Module runtime — K-OS's mechanism for visuals that fire in
        lockstep with audio. See <Crossref to="scene-vm" />.
      </Term>

      <Term name="Slimentologika">
        K-OS's custom 16-glyph alphabet that replaces hex digits in the tracker
        UI. Toggle with <Code>Tab</Code>. See <Crossref to="slimentologika" />.
      </Term>

      <Term name="Song">
        The top-level arrangement — rows × 8 channels, each cell holding a
        chain ID. See <Crossref to="song-chain-phrase" />.
      </Term>

      <Term name="Song Mode">
        The default playback mode. Chains play through their populated steps
        and loop within the chain; the song row advances when a chain reaches
        all 16 steps populated.
      </Term>

      <Term name="Static Export">
        A build mode where Next.js produces a static <Code>out/</Code> folder
        that can be served by any web host. Used for K-OS deploys to GitHub
        Pages and 2kool.tv. See <Code>docs/DEPLOYMENT.md</Code>.
      </Term>

      <Term name="Table">
        A 16-row looping subroutine of effects per tick. Bound to an instrument
        for fine-grained sound shaping (vibrato, arpeggios, automated
        modulation).
      </Term>

      <Term name="Tick">
        The smallest time unit in the tracker. One tick = 60 / (BPM × TPB)
        seconds. The TrackerEngine emits one tick at a time and walks the
        phrase rows accordingly.
      </Term>

      <Term name="TPB">
        Ticks Per Beat. The number of ticks in one beat. Default 6.
        Phrase rows advance every TPB ticks (so by default, 6 ticks per row).
      </Term>

      <Term name="Tracker">
        A class of music software using a vertical spreadsheet of text instead
        of a piano roll. See <Crossref to="what-is-a-tracker" />.
      </Term>

      <Term name="Transpose">
        A semitone offset applied to every note in a phrase, set per-step in a
        chain. Lets you reuse one phrase at different pitches.
      </Term>

      <Term name="Turbopack">
        Next.js's incremental bundler, used by K-OS's <Code>npm run dev</Code>{" "}
        and <Code>npm run build</Code>. Faster than the older webpack mode.
      </Term>

      <Term name="VAL1 / VAL2">
        The two effect value columns in a phrase row. Two hex digits each,
        paired with their respective CMD column.
      </Term>

      <Term name="VMI">
        Visual Machine Interface — the layered PNG sequence convention K-OS uses
        for button states and animated UI elements. See{" "}
        <Code>VMI_ARTIST_GUIDE.md</Code>.
      </Term>

      <Term name="WASM">
        WebAssembly — a binary format that runs in browsers. K-OS uses WASM for
        the bundled games (Commander Keen, SuperTux when available).
      </Term>

      <Term name="YM2612">
        The Yamaha 4-operator FM synthesis chip from the Sega Genesis. K-OS's
        FM synth voice is modeled on it.
      </Term>
    </>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid #222",
      }}
    >
      <div
        style={{
          fontFamily: "var(--dm-font-primary), monospace",
          fontSize: 13,
          letterSpacing: 1,
          color: "#ffff00",
          marginBottom: 4,
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "#dddddd" }}>{children}</div>
    </div>
  );
}

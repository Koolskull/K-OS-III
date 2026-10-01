import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Table, Crossref } from "@/components/doc/elements";

export default function ThrashTrackerBrowser() {
  return (
    <>
      <Lead>
        Thrash Tracker 0.2.0 is the tracker window. Same song
        shape as the desktop build: eight channels, chains of sixteen steps,
        phrases, tables, oscillators, samples, and a four-operator FM synth.
        Plugin instruments are kept in the file and stay silent.
      </Lead>

      <Aside title="A fresh song starts on the Amen break" variant="warn">
        Instrument <Code>00</Code> is named <Code>AMEN</Code>. It is the Amen
        break, played as a sample. Phrase <Code>00</Code> is <Code>80</Code>{" "}
        rows, eight rows to the beat, and row <Code>00</Code> is <Code>C-4</Code>{" "}
        so the file plays at its own speed. Tempo is locked so those four bars
        match the recording. Space on the song page plays the break, then the
        channel wraps back to song row <Code>00</Code> and the break starts
        again until you press Space or Escape. A new blank instrument is still
        the short square: Ctrl+Shift+N.
      </Aside>

      <H2>Where you are</H2>
      <P>
        The canvas is 960×540. The map in the corner is two rows of tiles.
        Shift+F1 through Shift+F8 jump to a tile. Shift+arrows step across the
        map and stop at the edge.
      </P>
      <CodeBlock label="Screen map">{`S  C  P  L     song, chain, phrase, rack
T  I  V  R     table, instrument, visualiser, project`}</CodeBlock>
      <Table
        headers={["Tile", "Shift", "What it is"]}
        rows={[
          ["S", "F1", "Song. 256 rows, channels C0–C7. Each cell is a chain id, or --."],
          ["C", "F2", "Chain. 16 steps. PH is the phrase. TR is the transpose."],
          ["P", "F3", "Phrase. Columns NT IN VL SL LP FX VA ST. ST is the dance arrow."],
          ["L", "F4", "Rack. Four layer gains for the phrase you were just on."],
          ["T", "F5", "Table. The desktop columns, including the ones the browser does not sound yet."],
          ["I", "F6", "Instrument. Name, type, oscillator or FM algorithm, volume, ADSR."],
          ["V", "F7", "Visualiser. The grid, map, and mixer are hidden. You see the background and the scope."],
          ["R", "F8", "Project. Name, BPM, ticks per beat, save, load."],
        ]}
      />

      <H2>Keys</H2>
      <P>
        The window has to be the focused window. Keys are ignored while you are
        typing in another app.
      </P>
      <Table
        headers={["Key", "What it does"]}
        rows={[
          ["Arrows", "Move the cursor."],
          ["Shift+arrows", "Change page on the map."],
          ["Space", "Song: play from the cursor row, or stop. Chain or phrase: audition that pattern, or stop."],
          ["Escape", "Stop. The tone ends with the window; closing Thrash Tracker closes the audio too."],
          ["Enter", "Song opens the chain, making one if the cell is empty. Chain opens the phrase the same way. On a phrase, Enter in the instrument column opens that instrument."],
          ["Hex 0–9, A–F", "Two digits write a chain, phrase, instrument, volume, slice, or effect value. The first digit shifts into the high place."],
          ["Piano, phrase note column", "Lower row zsxdcvgbhnjm,l.;/ and upper row q2w3er5t6y7ui9o0p. Octave is the number in the header. - and = move it. Octave 4 puts z on C-4."],
          ["Backspace / Delete", "Clear the cell. On an instrument or project name, Backspace deletes a letter."],
          ["[ ]", "Shorten or lengthen the phrase. Length is capped at FF."],
          ["Ctrl+arrows", "On the instrument, rack, or project page, change the value under the cursor. Up and down step by larger amounts."],
          ["Ctrl+Shift+Left/Right", "On a phrase or chain, change which pattern you are looking at."],
          ["Ctrl+Shift+N", "Make the next free instrument a square pluck and open it."],
          ["L D U R", "On the phrase ST column, write a left, down, up, or right arrow. One arrow per row."],
          ["Ctrl+Shift+E", "Download a Stepmania .sm for Track Stomper, plus a wav of the first sample when the song has one. Charts go out. They are not read back."],
          ["Ctrl+S", "Download NAME.dm2.json, samples included."],
          ["Ctrl+O", "Open a browser project file."],
          ["X / Shift+X", "On the song page, mute that channel, or solo it."],
          ["Z", "On the song page, unmute every channel."],
        ]}
      />

      <H2>What you hear</H2>
      <P>
        Playback runs in an AudioWorklet, <Code>public/dm2-worklet.js</Code>.
        One row is one tick. A tick lasts <Code>60 / (BPM × ticks-per-beat)</Code>{" "}
        seconds. A new project is 8 ticks per beat, so a beat is eight rows.
        Tempo is set from the Amen file so 128 rows match the recording.
      </P>
      <H3>Oscillator, sample, FM</H3>
      <UList>
        <Li>
          <Strong>Synth.</Strong> Sine, square, saw, triangle, noise. Ctrl+left
          and Ctrl+right on the oscillator row cycle them.
        </Li>
        <Li>
          <Strong>Sampler.</Strong> Set the type to sampler, then Enter. The
          browser decodes the file. Pitch follows the note, with C-4 as the
          original speed.
        </Li>
        <Li>
          <Strong>FM.</Strong> A four-operator synth in the YM2612 algorithm
          layout, algorithms <Code>00</Code>–<Code>07</Code>. This is a
          reimplementation in the worklet, not the desktop chip.
        </Li>
        <Li>
          <Strong>Plugin.</Strong> The type can sit in a song so a later load
          does not throw the row away. It does not sound. The status line says{" "}
          <Code>PLUGIN STAYS ON THE DESKTOP</Code> once.
        </Li>
      </UList>
      <P>
        An instrument that is not slotted plays only layer 0. A slotted
        instrument plays each layer that is marked used. Phrase <Code>00</Code>{" "}
        starts with layer 0 open and the other three gains at <Code>00</Code>,
        so those layers are quiet.
      </P>
      <H3>The Amen break and the square pluck</H3>
      <P>
        Instrument <Code>00</Code> is <Code>AMEN</Code>, a sampler. Attack{" "}
        <Code>00</Code>, decay <Code>00</Code>, sustain <Code>64</Code>, release{" "}
        <Code>00</Code>. The file plays once and stops at the end of the
        recording. Envelope times are <Code>(value / 127)² × 4</Code> seconds.
      </P>
      <P>
        Ctrl+Shift+N, or the first time you type an unused instrument into an
        empty phrase cell, builds a square pluck. Its name is <Code>SQ</Code>{" "}
        plus the hex id. Attack <Code>00</Code>, decay <Code>40</Code>, sustain{" "}
        <Code>00</Code>, release <Code>40</Code>. It does not replace{" "}
        <Code>AMEN</Code> until a cell points at it. Assigning it onto an empty
        cell also writes <Code>C-4</Code> and volume <Code>80</Code>.
      </P>
      <H3>Effects and tables</H3>
      <P>
        The phrase has one effect command and one value. Two letters, then two
        hex digits. The worklet sounds two commands:
      </P>
      <Table
        headers={["Cmd", "What you hear"]}
        rows={[
          ["KL", "Kills the note. The gate drops on that row."],
          ["VO", "Sets the row gain from the value. 7F is about unity."],
        ]}
      />
      <P>
        The older command list in <Crossref to="effect-commands" /> — pitch
        bend, slide, vibrato, chords, tempo, groove — is not what this window
        plays. Those letters can be typed. They do not change the sound yet.
      </P>
      <P>
        A table can transpose the sounding note when transpose is on. Slice,
        retrigger, filter, crush, and the table’s own effect columns are stored
        and drawn. The worklet does not apply them yet.
      </P>

      <H2>How a chain ends</H2>
      <P>
        A chain step with no phrase ends that chain. The song row then advances.
        If the next song cell on that channel is empty, the channel wraps to the
        start of its run. The factory song only fills row <Code>00</Code> of
        channel 0, so Space loops that one phrase. A chain audition (Space on
        the chain page) loops the chain instead of walking the song.
      </P>
      <P>
        An empty phrase row does not cut a note. A sampler stops when the file
        ends, so the Amen break plays once each time the phrase loops. A
        sustaining oscillator would keep sounding through the empty rows.
      </P>

      <H2>Saving</H2>
      <P>
        Every edit is written to this browser under the key{" "}
        <Code>dm2-web-pattern</Code>. That copy leaves the sample audio out, so
        a long recording is not what gets stored automatically. Ctrl+S, or
        Enter on the project SAVE row, downloads <Code>NAME.dm2.json</Code> with
        the samples packed as little-endian 16-bit audio in base64. The file’s{" "}
        <Code>version</Code> field is <Code>dm2.web</Code>.
      </P>
      <Aside title="Not a desktop .dm2, and not a .dmpit" variant="info">
        A desktop Thrash Tracker <Code>.dm2</Code> is a different JSON document.
        A <Crossref to="dmpit-format">.dmpit</Crossref> is a zip from the older
        browser tracker. Neither opens in this window yet. Use the{" "}
        <Code>.dm2.json</Code> this window writes.
      </Aside>

      <H2>What this window is not</H2>
      <UList>
        <Li>No VST, AU, or LV2. No plugin audio.</Li>
        <Li>No clipboard, undo, groove page, or Slimentologika toggle.</Li>
        <Li>The V tile is the scope, not the desktop font flight.</Li>
        <Li>
          2kool.tv is still the previous site. This tracker is the Thrash Tracker
          window in the copy you are running.
        </Li>
      </UList>
      <P>
        The source is <Code>src/components/apps/thrash-tracker/dm2/</Code> and{" "}
        <Code>public/dm2-worklet.js</Code>.
      </P>
    </>
  );
}

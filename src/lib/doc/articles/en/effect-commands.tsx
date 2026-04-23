import { Lead, P, H2, H3, Strong, Code, CodeBlock, Aside, Table, Crossref, Hex } from "@/components/doc/elements";

export default function EffectCommands() {
  return (
    <>
      <Lead>
        Each phrase row has two effect columns: <Code>CMD1/VAL1</Code> and
        {" "}<Code>CMD2/VAL2</Code>. Effects are how a tracker bends notes, slides
        between pitches, cuts samples short, and otherwise gets expressive without
        adding more rows. A command is a two-character code; the value is two
        {" "}<Crossref to="hexadecimal">hex</Crossref> digits.
      </Lead>

      <H2>The shape</H2>
      <CodeBlock>
{`row  note  inst  cmd1 val1   cmd2 val2
00   C-4   00    P0   01     V4   02
                  │   │      │   │
                  │   └──────┘   ← pitch-bend down by 0x01 per tick
                  └─ pitch effect`}
      </CodeBlock>
      <P>
        The cmd is two ASCII letters. The val is two hex digits (
        <Hex value={0} link={false} />–<Hex value={0xff} link={false} />). Most
        commands act on the note in their row. Some persist across rows until
        canceled.
      </P>

      <H2>The most useful first</H2>
      <Table
        headers={["CMD", "Name", "What it does", "Example"]}
        rows={[
          ["P", "Pitch bend", "Bends the pitch up or down. High bit (0x80) = down. Low byte = speed.", "P01 bends up slow"],
          ["L", "Slide", "Glides smoothly to the next note in the phrase.", "L03 = slide speed 3"],
          ["V", "Vibrato", "Adds an oscillating pitch wobble. High nibble = speed, low = depth.", "V42 = speed 4, depth 2"],
          ["E", "Envelope", "Sets the volume / amplitude.", "E08 = set volume to 8"],
          ["O", "Output / Pan", "Pan the channel. 00=L, 80=center, FF=R.", "OFF = full right"],
          ["K", "Kill", "Cuts the note after N ticks.", "K03 = cut after 3 ticks"],
          ["D", "Delay", "Delays the note's start by N ticks.", "D03 = delay 3 ticks"],
          ["C", "Chord", "Arpeggiates between notes in a chord.", "C37 = minor; C47 = major"],
          ["H", "Hop", "Jumps within the phrase.", "H08 = jump to row 8; H00 = stop"],
          ["T", "Tempo", "Changes BPM mid-song.", "T80 = 128 BPM"],
        ]}
      />

      <H2>Less common but powerful</H2>
      <Table
        headers={["CMD", "Name", "What it does"]}
        rows={[
          ["A", "Table", "Starts/stops a per-tick automation table."],
          ["B", "MayBe", "Note plays only sometimes — value is probability."],
          ["G", "Groove", "Switches the timing groove mid-phrase."],
          ["R", "Retrig", "Retriggers the note rapidly (rolls / stutters)."],
          ["W", "Wave", "Swaps the waveform/algorithm of the active instrument."],
          ["Z", "Random", "Randomizes the previous command's value within a range."],
        ]}
      />

      <H2>How values work</H2>
      <P>
        Almost every value field uses the same conventions:
      </P>
      <Table
        headers={["Value", "Meaning"]}
        rows={[
          [<Hex value={0x00} key="0" link={false} />, "Off / minimum / no effect"],
          [<Hex value={0xff} key="ff" link={false} />, "Maximum"],
          [<Hex value={0x80} key="80" link={false} />, "Center / neutral / 'no offset' (for signed values)"],
          [<Hex value={0x40} key="40" link={false} />, "One quarter; common for medium values"],
          [<Hex value={0xc0} key="c0" link={false} />, "Three quarters"],
        ]}
      />
      <Aside title="Reading a hex value at a glance" variant="tip">
        High nibble × 16 + low nibble = decimal value. <Hex value={0x42} link={false} /> is 4×16 + 2 = 66.
        You almost never have to do this; you'll feel where <Hex value={0x40} link={false} /> is on the dial after a few sessions.
      </Aside>

      <H2>Two-effect rows</H2>
      <P>
        Each row has <Strong>two</Strong> effect columns. Both fire on the same
        row, in left-to-right order. Useful for combinations like:
      </P>
      <CodeBlock>
{`note   inst   CMD1 VAL1   CMD2 VAL2
C-4    00     L03         OFF       ← slide up + pan hard right
D#4    01     V42         K06       ← vibrato + cut after 6 ticks
A-3    00     P81         R04       ← pitch-bend down + retrig`}
      </CodeBlock>

      <H2>Effects that "stick"</H2>
      <P>
        Some effects (pitch, vibrato, slide) keep operating until something
        replaces them. Setting <Code>V00</Code> on a later row turns vibrato off
        explicitly. Leaving the column empty just continues the previous setting.
      </P>
      <P>
        Other effects (kill, delay, retrig) only fire on the row they're written
        on and then they're done.
      </P>

      <H2>The Hop command (H)</H2>
      <P>
        Hop jumps the playhead within the current phrase. <Code>H00</Code> stops
        playback for that channel. <Code>H08</Code> jumps to row 8. Used for
        creating loops inside a phrase, or for stopping a channel mid-pattern.
      </P>
      <P>
        Hop's mostly useful in advanced patterns (one-shot phrases that play part
        of a chain step then stop, etc.). Don't worry about it on day one.
      </P>

      <H2>Why effect commands beat audio plugins for this</H2>
      <P>
        In a DAW you'd add a pitch-bend automation lane, draw a curve, hit play.
        In a tracker you write <Code>P03</Code> in a cell and the work is done in
        zero clicks. Multiplied across a song, the time saved is substantial. The
        cost is that you have to memorize the command codes — but there are about
        a dozen common ones and you'll know them after a week.
      </P>

      <H2>What to read next</H2>
      <P>
        <Crossref to="song-chain-phrase" /> for how phrases live inside the larger
        structure. <Crossref to="hexadecimal" /> if values like{" "}
        <Hex value={0x42} link={false} /> still feel mysterious.
      </P>
    </>
  );
}

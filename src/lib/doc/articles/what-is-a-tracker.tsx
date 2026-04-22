import { Lead, P, H2, UList, Li, Strong, Crossref, CodeBlock, Aside } from "@/components/doc/elements";

export default function WhatIsATracker() {
  return (
    <>
      <Lead>
        A <Strong>tracker</Strong> is a kind of music software that uses a vertical
        spreadsheet of text instead of a piano roll. It looks intimidating at first
        and then turns out to be one of the fastest ways to write music ever invented.
        K-OS's flagship app, <Strong>Datamoshpit</Strong>, is a tracker.
      </Lead>

      <H2>Where they came from</H2>
      <P>
        Trackers were invented on the Commodore Amiga in the late 1980s by Karsten
        Obarski for the demoscene. The original program was Ultimate Soundtracker.
        From there, the format spread to FastTracker II, Impulse Tracker, ProTracker,
        and eventually onto game consoles — most famously LSDJ on the Game Boy and
        LittleGPTracker (LGPT) on the PSP.
      </P>
      <P>
        Modern descendants include Renoise (PC, professional), Polyend Tracker
        (hardware), Furnace (open source, multi-system), and PicoTracker (RP2040
        hardware). Datamoshpit takes its UI conventions from the LSDJ / LGPT family —
        few keys, dense screens, every keystroke does work.
      </P>

      <H2>What you actually see</H2>
      <P>
        A column of rows. Each row is one beat, or some fraction of one. You move a
        cursor up and down with the arrow keys and type things into the cells —
        notes, instrument numbers, effect commands. When you press play, the cursor
        steps through the rows top-to-bottom and the program plays whatever's there.
      </P>
      <CodeBlock label="A simple drum pattern in tracker form">
{`row  note  inst  cmd
00   C-4   00    --      ← kick
01   ---   --    --
02   ---   --    --
03   ---   --    --
04   D-4   01    --      ← snare
05   ---   --    --
06   ---   --    --
07   ---   --    --
08   C-4   00    --      ← kick
09   ---   --    --
0A   ---   --    --
0B   ---   --    --
0C   D-4   01    --      ← snare
0D   ---   --    --
0E   ---   --    --
0F   ---   --    --`}
      </CodeBlock>
      <P>
        That's a 16-step drum pattern. Row numbers are written in{" "}
        <Crossref to="hexadecimal">hexadecimal</Crossref> (base 16), so you'll see
        <code> 00</code>–<code>0F</code> instead of <code>0</code>–<code>15</code>.
      </P>

      <H2>Why people love them</H2>
      <UList>
        <Li><Strong>Speed.</Strong> Once you know the keystrokes, you stop using a mouse. Whole songs get written without clicking anything.</Li>
        <Li><Strong>Precision.</Strong> Every note has an exact integer position. No drag-and-snap, no quantize after the fact. What you typed is what you hear.</Li>
        <Li><Strong>Smallness.</Strong> A tracker song is a few kilobytes of plain data. Demoscene composers wrote whole soundtracks that fit in 64 KB total — including the player code.</Li>
        <Li><Strong>Hardware portability.</Strong> The data model is so compact it runs on Game Boys, calculators, microcontrollers. Datamoshpit runs in a browser; the same ideas work on a $10 device.</Li>
      </UList>

      <H2>The hierarchy</H2>
      <P>
        Trackers don't write one giant pattern. They build songs out of three nested
        layers:
      </P>
      <UList>
        <Li><Strong>Phrase</Strong> — a short pattern, usually 16 rows. The smallest reusable unit.</Li>
        <Li><Strong>Chain</Strong> — a list of up to 16 phrases played in sequence. Like a section of the song.</Li>
        <Li><Strong>Song</Strong> — a list of which chains play on which channels at which time. The arrangement.</Li>
      </UList>
      <P>
        Read <Crossref to="song-chain-phrase" /> for how this works in detail.
      </P>

      <Aside title="The first time you'll feel it">
        The moment trackers click is when you realize you can write a 4-bar drum
        pattern, save it as a phrase, and reuse it three times in your chain. You
        just wrote 16 bars by typing 4. Then you write a small variation in another
        phrase, slot it in for the 4th bar, and now you have an arrangement.
        Multiply this across 8 channels playing different chains and you've made a
        whole song with very little typing.
      </Aside>

      <H2>What's different about K-OS</H2>
      <P>
        Three things you won't find in classic trackers:
      </P>
      <UList>
        <Li><Strong>Per-instrument visuals.</Strong> Every instrument can carry a tiny visual scene that fires when its notes play. See <Crossref to="per-instrument-visuals" />.</Li>
        <Li><Strong><Crossref to="slimentologika" />.</Strong> An optional pixel-glyph alphabet that replaces the standard hex digits. Tab toggles it.</Li>
        <Li><Strong>Browser-native.</Strong> Audio via the Web Audio API, no installation, projects saved as <code>.dmpit</code> files (see <Crossref to="dmpit-format" />).</Li>
      </UList>
    </>
  );
}

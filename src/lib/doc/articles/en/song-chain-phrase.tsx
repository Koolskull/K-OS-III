import { Lead, P, H2, H3, UList, OList, Li, Strong, Code, CodeBlock, Aside, Crossref, Hex } from "@/components/doc/elements";

export default function SongChainPhrase() {
  return (
    <>
      <Lead>
        Datamoshpit songs are built from three nested layers — <Strong>phrases</Strong>{" "}
        nest into <Strong>chains</Strong>, chains nest into the <Strong>song</Strong>.
        Each layer is identified by a two-digit hex ID. Once you understand how
        they reference each other, the whole tracker stops looking like alphabet
        soup and starts looking like a small, dense music language.
      </Lead>

      <H2>The three layers in plain words</H2>
      <UList>
        <Li>
          A <Strong>phrase</Strong> is a small pattern — typically 16 rows of notes,
          instruments, and effects. The smallest reusable musical unit.
        </Li>
        <Li>
          A <Strong>chain</Strong> is up to 16 phrase IDs played in sequence.
          Sometimes with a transpose offset per step. Like "Verse A".
        </Li>
        <Li>
          A <Strong>song</Strong> is a grid: rows × 8 channels. Each cell holds a
          chain ID. The song row determines what plays on what channel at what time.
        </Li>
      </UList>
      <CodeBlock label="The hierarchy, picture-style">
{`SONG  (the arrangement; many rows × 8 channels)
   │
   └── each cell holds a CHAIN id, like 02
       │
       └── that chain has up to 16 steps,
           each pointing to a PHRASE id, like 0A
           │
           └── that phrase has 16 rows of
               note / instrument / effect data`}
      </CodeBlock>

      <H2>Why the indirection?</H2>
      <P>
        At first glance it looks complicated — why not just write one big timeline?
        The answer is reuse. A drum pattern usually repeats. If your kick pattern
        is phrase <Hex value={0} />, you can put phrase <Hex value={0} /> as step 0
        of every drum chain in the song. Edit phrase <Hex value={0} /> once, and
        every place that uses it changes.
      </P>
      <P>
        The same idea at the next level up. A chain like "verse drums" can appear
        as the chain ID at multiple song rows. Restructure your song without
        rewriting the patterns.
      </P>

      <H2>The IDs are 0–FF (0–255)</H2>
      <P>
        Every chain and every phrase has a unique{" "}
        <Crossref to="hexadecimal">hex</Crossref> ID from <Hex value={0} link={false} />{" "}
        to <Hex value={0xff} link={false} />. That gives you 256 phrases and 256
        chains per project — plenty.
      </P>
      <P>
        K-OS only creates a phrase or chain when you first edit it. If you write
        notes into phrase <Hex value={0xa5} link={false} />, that phrase didn't
        exist before that keystroke and now it does. Phrases you never touch take
        zero memory and don't appear in the saved project file.
      </P>

      <H2>The screens</H2>
      <H3>F1 — Song</H3>
      <P>
        The arrangement view. Rows go down, eight channel columns across. Each
        cell is two hex digits (a chain ID) or <Code>--</Code> (empty). The
        currently-playing row highlights during playback.
      </P>
      <CodeBlock label="A song with a basic intro">
{`     CH0 CH1 CH2 CH3 CH4 CH5 CH6 CH7
00   00  --  --  --  --  --  --  --   ← intro: just channel 0 (drums)
01   00  01  --  --  --  --  --  --   ← drums + bass
02   00  01  02  --  --  --  --  --   ← drums + bass + lead
03   00  01  02  --  --  --  --  --   ← repeat
04   --  --  --  --  --  --  --  --   ← end (empty rows = song over for that channel)`}
      </CodeBlock>

      <H3>F2 — Chain</H3>
      <P>
        The currently-edited chain. 16 step rows. Each step has a phrase ID and an
        optional transpose. Transpose lets you reuse the same phrase but shifted
        up or down in pitch — handy for arpeggios or song sections in different
        keys.
      </P>
      <CodeBlock label="Chain 02 — verse lead">
{`step  phrase  transpose
00    0A      00     ← play phrase 0A at original pitch
01    0A      03     ← play phrase 0A transposed up 3 semitones
02    0A      05     ← up 5 semitones
03    0B      00     ← variation phrase, original pitch
04    --      --     ← (empty steps end the chain — see below)`}
      </CodeBlock>

      <H3>F3 — Phrase</H3>
      <P>
        The currently-edited phrase. Default 16 rows (resizable from 2 to 256 with{" "}
        <Code>Shift+W+Up/Down</Code>). Each row has columns for note, instrument,
        slice, and two effect commands. See <Crossref to="effect-commands" /> for
        what the effect columns can do.
      </P>

      <H2>How playback walks the layers</H2>
      <P>
        K-OS plays chains LGPT-style: the chain plays through its{" "}
        <Strong>populated</Strong> steps, then loops back to step 0 within itself.
        The song row only advances when a chain reaches the literal end of all 16
        steps — meaning short chains (1–8 populated steps) loop on the current
        song row indefinitely.
      </P>
      <P>
        This is by design. To make the song advance, populate more chain steps,
        OR populate more song rows and let the long-running chains complete.
      </P>

      <Aside title="The 'why isn't it advancing' moment" variant="tip">
        First-time tracker users often expect songs to march row-by-row in time.
        They don't. Each channel walks its own chain at its own pace. A two-step
        chain on channel 0 will replay forever while channel 1's eight-step chain
        is still on its first pass. The song row advances when the chain hits
        step <Hex value={0xf} link={false} /> + 1 — not before.
      </Aside>

      <H2>Drilling between screens</H2>
      <P>
        K-OS lets you "drill in" from a higher-level screen to the layer it
        references. From the Song screen, with the cursor on a populated chain
        cell, press <Code>Shift+Right</Code> to navigate to the Chain screen — and
        K-OS automatically opens that chain. From the Chain screen, with the
        cursor on a step's phrase column, <Code>Shift+Right</Code> takes you to
        that phrase.
      </P>
      <P>
        The active chain ID and active phrase ID show in the top status bar:{" "}
        <Code>CHAIN 02</Code> on the chain screen, <Code>PHRASE 0A</Code> on the
        phrase screen. They tell you exactly which item you're editing.
      </P>

      <H2>Quick-fill (the LGPT lastPhrase trick)</H2>
      <P>
        When you type a phrase ID into a chain step, K-OS remembers it as the
        "last touched" phrase. Place an empty chain step (Z key) and it pre-fills
        with that ID — fast for stamping the same phrase across multiple chain
        steps. Same idea with chain IDs in the song view.
      </P>

      <H2>Cloning a phrase</H2>
      <P>
        On the chain screen, with the cursor on a step's phrase column, press{" "}
        <Code>Shift+W+Right</Code> to clone the referenced phrase to the next free
        phrase ID. The chain step now points at the clone. Useful when you want
        "almost the same phrase, with one note changed." Edit the clone without
        affecting the original.
      </P>

      <H2>How this maps to other trackers</H2>
      <P>
        If you came from LGPT or PicoTracker: identical model. Phrase, chain,
        song. Drill-down via the right key. <Code>Shift+W+arrow</Code> for
        secondary controls. Same row counts.
      </P>
      <P>
        If you came from LSDJ on the Game Boy: also identical, just with 8
        channels instead of 4 and slightly more effect commands.
      </P>
      <P>
        If you came from Renoise or Furnace: those don't have the chain layer —
        they go pattern → song directly. The chain layer is a Game-Boy-tracker
        idiom; it's optional but useful for compact arrangements.
      </P>

      <H2>What to read next</H2>
      <UList>
        <Li><Crossref to="effect-commands" /> — the two-letter codes that go in the CMD columns of a phrase.</Li>
        <Li><Crossref to="per-instrument-visuals" /> — instruments can carry visuals that fire alongside their notes.</Li>
        <Li><Crossref to="dmpit-format" /> — what a saved project file looks like under the hood.</Li>
      </UList>
    </>
  );
}

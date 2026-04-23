import { Lead, P, H2, UList, Li, Strong, Code, Aside, Crossref } from "@/components/doc/elements";

export default function Slimentologika() {
  return (
    <>
      <Lead>
        <Strong>Slimentologika</Strong> is a sixteen-glyph pixel-art alphabet
        unique to KOOLSKULL OS. Each glyph maps one-to-one to a{" "}
        <Crossref to="hexadecimal">hex</Crossref> digit (<Code>0</Code>–<Code>F</Code>).
        Press <Code>Tab</Code> in any tracker screen to toggle between standard
        hex digits and Slimentologika. The numbers underneath are identical —
        only the visual representation changes.
      </Lead>

      <H2>Where it comes from</H2>
      <P>
        From the Ancient Temple of the Green Slime. (Also: from Koolskull. The
        glyph set has been quietly evolving over more than a decade of side
        projects, finally codified for K-OS III.)
      </P>

      <H2>Why a project would invent its own number system</H2>
      <UList>
        <Li>
          <Strong>Visual density.</Strong> The glyphs are designed to be readable
          at small sizes — 8×8 pixels — without compromising distinction. Standard
          hex digits at 8×8 start to look the same.
        </Li>
        <Li>
          <Strong>Identity.</Strong> Slimentologika is the most visible piece of
          K-OS's aesthetic. It's how the OS announces what it is.
        </Li>
        <Li>
          <Strong>Pattern recognition.</Strong> Once your eye learns the glyph
          families (the round ones, the square ones, the ones with diagonals),
          you read multi-digit values shape-by-shape instead of digit-by-digit.
          Faster than reading hex, eventually.
        </Li>
        <Li>
          <Strong>Optional.</Strong> If you don't want it, you don't use it. Tab
          toggles. Nothing in the data model uses Slimentologika; it's purely a
          display layer.
        </Li>
      </UList>

      <H2>The glyphs</H2>
      <P>
        Sixteen pixel-art icons. The first four (<Code>0</Code>–<Code>3</Code>)
        are the simplest and worth memorizing first because they appear in nearly
        every value (since <Hex0 /> through <Code>3F</Code> covers the smallest
        common range).
      </P>
      <P>
        The full reference image is in K-OS at <Code>public/sprites/ST0.png</Code>{" "}
        through <Code>STF.png</Code>. They render via the <Code>SlimeDigit</Code>{" "}
        component (<Code>src/components/apps/datamoshpit/ui/SlimeDigit.tsx</Code>).
      </P>

      <H2>Orientation rule</H2>
      <P>
        When you see Slimentologika in K-OS, it follows a strict rule for
        multi-digit values:
      </P>
      <UList>
        <Li>
          In a <Strong>horizontal layout</Strong> (knobs side-by-side, pad-grid
          columns), digits stack <Strong>vertically</Strong> — one above the
          other.
        </Li>
        <Li>
          In a <Strong>vertical layout</Strong> (phrase rows, lists), digits sit
          <Strong> side by side</Strong>, left-to-right.
        </Li>
      </UList>
      <P>
        The rule is "digits go perpendicular to the layout direction." It looks
        weird written down and it's instantly obvious in practice. The point is
        to keep multi-digit values from collapsing into the values next to them.
      </P>

      <H2>Practical advice</H2>
      <UList>
        <Li>Don't try to memorize all sixteen at once. Learn 0–3 first.</Li>
        <Li>Toggle to hex (<Code>Tab</Code>) any time you're confused.</Li>
        <Li>The phrase-row numbers are the best learning surface — you see them constantly and they go <Code>00</Code>–<Code>0F</Code>, so you naturally learn the same handful of glyphs over and over.</Li>
        <Li>Don't expect to ever read Slimentologika faster than hex unless you actually want to. Both work fine.</Li>
      </UList>

      <Aside title="It's not a religion" variant="info">
        K-OS doesn't grade you on whether you use Slimentologika. The glyphs are
        a flavor, not a requirement. If you make all your music in hex mode and
        never look at a single glyph, that's fine. If you go all-in on
        Slimentologika and start dreaming in green-square ideograms, that's also
        fine. The point is that the option exists.
      </Aside>

      <H2>Where else it shows up</H2>
      <UList>
        <Li>The K-OS boot sequence flashes a few Slimentologika characters between Psalms.</Li>
        <Li>The taskbar uses standard ASCII; Slimentologika is exclusive to the tracker.</Li>
        <Li>The Sprite Editor's color picker shows hex values in standard form (Slimentologika doesn't toggle there yet — pending).</Li>
        <Li>2KOOL Productions merch and the K-OS aesthetic spread it further out.</Li>
      </UList>

      <H2>What to read next</H2>
      <UList>
        <Li><Crossref to="hexadecimal" /> for the underlying number system.</Li>
        <Li><Crossref to="the-rules" /> for the broader visual conventions Slimentologika sits inside.</Li>
      </UList>
    </>
  );
}

function Hex0() {
  return <Code>00</Code>;
}

import { Lead, P, H2, H3, UList, OList, Li, Strong, Code, CodeBlock, Aside, Table, Crossref } from "@/components/doc/elements";

export default function Hexadecimal() {
  return (
    <>
      <Lead>
        Hexadecimal — usually shortened to <Strong>hex</Strong> — is just a way of
        writing numbers using <Strong>16 digits</Strong> instead of the 10 you grew
        up with. K-OS uses hex everywhere: row numbers, channel numbers, effect
        values. Once you can read it, the whole interface gets easier.
      </Lead>

      <H2>You already know base 10</H2>
      <P>
        The number <Code>347</Code> means: 3 hundreds, 4 tens, 7 ones. Each digit
        position is worth ten times the one to its right. We use ten symbols
        (<Code>0</Code> through <Code>9</Code>) because we have ten fingers.
      </P>
      <P>
        Computers don't have fingers. They have on/off switches. Doing math with
        sixteen-symbol numbers turned out to be much more convenient for them —
        sixteen is a power of two, so each hex digit fits exactly four binary digits.
        A pair of hex digits is one byte (eight bits). That's why you see hex
        everywhere in computing.
      </P>

      <H2>The sixteen digits</H2>
      <P>
        The first ten are familiar: <Code>0 1 2 3 4 5 6 7 8 9</Code>. Then we run
        out of single digits, so we steal the first six letters of the alphabet for
        ten through fifteen:
      </P>
      <Table
        headers={["Hex", "Decimal", "Hex", "Decimal"]}
        rows={[
          ["0", "0", "8", "8"],
          ["1", "1", "9", "9"],
          ["2", "2", "A", "10"],
          ["3", "3", "B", "11"],
          ["4", "4", "C", "12"],
          ["5", "5", "D", "13"],
          ["6", "6", "E", "14"],
          ["7", "7", "F", "15"],
        ]}
      />

      <H2>Counting up</H2>
      <P>
        Hex counts the same way decimal does: when you run out of digits, carry to
        the next position. After <Code>F</Code> comes <Code>10</Code> (which means
        sixteen, not ten). After <Code>1F</Code> comes <Code>20</Code> (thirty-two).
      </P>
      <CodeBlock label="Counting from 0 to 32 in hex">
{`00  01  02  03  04  05  06  07
08  09  0A  0B  0C  0D  0E  0F   ← end of first sixteen
10  11  12  13  14  15  16  17
18  19  1A  1B  1C  1D  1E  1F   ← end of second sixteen
20                                ← thirty-two`}
      </CodeBlock>

      <H2>Reading two-digit hex bytes</H2>
      <P>
        Most things in K-OS show as <Strong>two hex digits</Strong> — a single byte,
        which can hold values <Code>00</Code> through <Code>FF</Code> (zero through
        255). The left digit is the "high nibble" — worth 16 each. The right digit
        is the "low nibble" — worth 1 each.
      </P>
      <P>
        To convert <Code>4C</Code> to decimal: high nibble is <Code>4</Code> (4 ×
        16 = 64). Low nibble is <Code>C</Code> (worth 12). Total: 64 + 12 = 76.
      </P>
      <P>
        You almost never need to do this conversion in your head. The point of hex
        is that you can compare and combine values quickly without converting:
      </P>
      <UList>
        <Li><Code>00</Code> is "off" or "minimum"</Li>
        <Li><Code>FF</Code> is "max" or "full"</Li>
        <Li><Code>80</Code> is right in the middle (128, half of 256)</Li>
        <Li><Code>40</Code> is one quarter, <Code>C0</Code> is three quarters</Li>
      </UList>

      <Aside title="Cheat: pan, volume, and 'centered'" variant="tip">
        Pan in K-OS is <Code>00</Code> (full left) to <Code>FF</Code> (full right),
        with <Code>80</Code> being centered. Anywhere you see <Code>80</Code> in a
        K-OS field, that field treats it as "neutral" or "no offset." Once you spot
        the pattern you'll see it in granular movement, transpose, and several
        effects.
      </Aside>

      <H2>Why trackers use hex specifically</H2>
      <P>
        Three reasons:
      </P>
      <OList>
        <Li>
          <Strong>16 fits.</Strong> A tracker phrase is conventionally 16 rows. So
          row numbers go <Code>00</Code>–<Code>0F</Code> — exactly one hex digit.
          It just lines up.
        </Li>
        <Li>
          <Strong>Compact.</Strong> Two characters can hold any single-byte value.
          Decimal would need three (<Code>000</Code>–<Code>255</Code>) and would
          waste screen space.
        </Li>
        <Li>
          <Strong>Bit patterns are visible.</Strong> Many tracker effects are bit
          flags. <Code>0x80</Code> means "the high bit is set." Knowing that's
          binary <Code>10000000</Code> is useful when you're tweaking effect
          commands and seeing how they layer.
        </Li>
      </OList>

      <H2>The "0x" prefix</H2>
      <P>
        In code (and sometimes in this manual), you'll see numbers written as{" "}
        <Code>0x4C</Code>. The <Code>0x</Code> is just a marker that says "this is
        hex" so you don't confuse <Code>10</Code> (the decimal number ten) with{" "}
        <Code>0x10</Code> (the hex number sixteen). Inside K-OS's tracker UI, the
        prefix is dropped because every value on screen is hex by default.
      </P>

      <H2>Quick conversion shortcuts</H2>
      <UList>
        <Li>One hex digit ≤ <Code>9</Code>: it equals its decimal self.</Li>
        <Li><Code>A</Code>=10, <Code>B</Code>=11, <Code>C</Code>=12, <Code>D</Code>=13, <Code>E</Code>=14, <Code>F</Code>=15. Just memorize this row.</Li>
        <Li>To convert two hex digits: multiply the left one by 16, add the right one.</Li>
        <Li>To go decimal → hex: divide by 16. Quotient is the left digit, remainder is the right.</Li>
      </UList>

      <H3>Try it</H3>
      <CodeBlock>
{`Hex   How to read it       Decimal
0F    15                    15
10    1×16 + 0              16
20    2×16 + 0              32
40    4×16 + 0              64
80    8×16 + 0              128
A0    10×16 + 0             160
FF    15×16 + 15            255`}
      </CodeBlock>

      <H2>Slimentologika is just hex with different shapes</H2>
      <P>
        K-OS includes a 16-glyph pixel alphabet called{" "}
        <Crossref to="slimentologika" />. The glyphs map exactly to hex digits
        <Code>0</Code>–<Code>F</Code>. Pressing <Code>Tab</Code> in any tracker
        screen toggles between the standard hex digits and the Slimentologika
        glyphs. The numbers underneath are identical — only the visual
        representation changes.
      </P>
    </>
  );
}

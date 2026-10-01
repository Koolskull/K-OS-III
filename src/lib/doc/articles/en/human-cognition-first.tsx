import { Lead, P, H2, UList, Li, Strong, Em, Crossref, Aside } from "@/components/doc/elements";

export default function HumanCognitionFirst() {
  return (
    <>
      <Lead>
        K-OS takes a position on the person using it. Most modern software is
        optimized to train <Em>passive consumption</Em> — feeds that keep
        scrolling, interfaces that hide their own mechanics, apps that do the
        thinking for you so you can keep producing clicks. K-OS is built the
        other way. Its tools ask you to learn how they work so you can actually
        wield them.
      </Lead>

      <H2>Consumption vs. digestion</H2>
      <P>
        Consuming media is what mainstream entertainment optimizes for: short
        loops, easy wins, nothing to carry with you afterward. The business
        incentive is obvious — attention is inventory, and inventory that sits
        still doesn't need to be interesting. Decades of this pattern have
        trained entire audiences to <Em>watch</Em> more and <Em>do</Em> less.
      </P>
      <P>
        Digesting information is the opposite. You slow down, you notice what
        you just took in, you can turn around and use it. A tool that teaches
        its own mechanics — even when that's less pleasant in the first five
        minutes — treats you as a person whose processing power is worth
        investing in. A tool that hides its own mechanics to feel easier
        treats you as a surface to deliver content to.
      </P>

      <H2>Why trackers teach, and DAWs hide</H2>
      <P>
        A tracker lays its entire music model out on screen. You see every
        note, every instrument ID, every effect command as literal hex. Nothing
        is abstracted into a mystery. Once you read the grid, you understand
        what the machine is doing — which means you can bend it in any
        direction you like.
      </P>
      <P>
        Most modern DAWs do the opposite. The data model is hidden behind
        "friendly" abstractions that only expose the happy path. You get
        further faster on day one, and you hit a ceiling on day thirty that
        you don't have the vocabulary to push past. The tool that was easier
        ends up smaller.
      </P>
      <P>
        K-OS is built around the tracker tradeoff on purpose. See{" "}
        <Crossref to="what-is-a-tracker" /> for the tracker argument and{" "}
        <Crossref to="hexadecimal" /> for why the numeric surface is worth
        learning.
      </P>

      <H2>The creative-power thesis</H2>
      <P>
        Here is the long-term bet: maximizing the processing power of a human
        is as important as maximizing the efficiency of a machine. Tools that
        grow their users create artists, engineers, organizers, and thinkers
        faster than tools that pamper them. Over a long enough timeline, the
        second kind of tool produces a dependent audience and the first kind
        produces a capable one.
      </P>
      <P>
        Capable people with creative agency are the mechanism by which
        financial and social power actually shifts. Not through theory. Through
        making things — music, software, devices, systems, arguments — that
        other people can use. The more of that capacity exists, distributed
        widely, the less fragile the culture around it gets. K-OS exists, in
        the largest sense, to add fuel to that.
      </P>

      <H2>What this asks of you as a reader</H2>
      <P>
        You don't have to agree with any of the above to use K-OS. But it's
        worth knowing why the manual was written the way it was. When an
        article asks you to read a hex table instead of watching a thirty-second
        video, that's on purpose. When a UI shows you raw numeric fields
        instead of presets, that's on purpose. When a hotkey has to be learned
        instead of discovered through tapping every icon, that's on purpose.
      </P>
      <P>
        The reward is that you come out the other side with something you can
        actually use — not something you consumed and forgot.
      </P>

      <Aside title="Related reading">
        <Crossref to="why-k-os" /> · <Crossref to="the-rules" /> ·{" "}
        <Crossref to="what-is-a-tracker" />
      </Aside>

      <H2>See also</H2>
      <UList>
        <Li><Strong>The project's vision:</Strong> <Crossref to="why-k-os" /></Li>
        <Li><Strong>How it gets delivered:</Strong> <Crossref to="from-browser-to-hardware" /></Li>
        <Li><Strong>The constraints that come from this stance:</Strong> <Crossref to="the-rules" /></Li>
      </UList>
    </>
  );
}

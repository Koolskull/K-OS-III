import { Lead, P, H2, UList, Li, Strong, Crossref, Aside } from "@/components/doc/elements";

export default function Welcome() {
  return (
    <>
      <Lead>
        K-OS III is a fake operating system that runs in your browser and actually
        makes music, art, and (eventually) on-chain work. This manual will teach
        you what's inside it, how to use it, and — if you want — how to read its code.
      </Lead>

      <P>
        You don't need to know anything about programming, music software, or
        operating systems to start. This manual is built like a small encyclopedia —
        short articles up front, deeper articles linked from them. Read whatever
        catches your eye.
      </P>

      <H2>If you've never used a tracker before</H2>
      <P>
        Start with <Crossref to="what-is-a-tracker" />. It explains the kind of music
        software K-OS is built around — different from anything in Spotify or
        GarageBand, but easier than it looks. From there, <Crossref to="hexadecimal" />{" "}
        (one short page) teaches you the only weird math you'll ever need.
      </P>

      <H2>If you've used LSDJ, LGPT, or PicoTracker</H2>
      <P>
        K-OS will feel familiar fast. Skim <Crossref to="song-chain-phrase" /> for the
        few places K-OS does things slightly differently, then jump to{" "}
        <Crossref to="effect-commands" /> and <Crossref to="per-instrument-visuals" />
        {" "}— the visual stuff is K-OS's biggest departure from those trackers.
      </P>

      <H2>If you want to run K-OS on your own machine</H2>
      <P>
        Read <Crossref to="terminal-basics" /> if you've never opened a terminal,
        then <Crossref to="running-k-os-locally" /> for the exact commands. Twenty
        minutes total, including the wait for <code>npm install</code>.
      </P>

      <H2>If you want to know how it's all built</H2>
      <P>
        <Crossref to="scene-vm" /> goes deep on the visual engine.{" "}
        <Crossref to="dmpit-format" /> describes the project save format.{" "}
        <Crossref to="the-rules" /> explains the design constraints — no rounded
        corners, no anti-aliasing, no popular-preset fonts — and why they matter.
      </P>

      <Aside title="The manual is opinionated, like the rest of K-OS">
        On topics where serious people disagree (history, technology, theology,
        economics), this manual presents the debate rather than a verdict. See the
        project's <a href="https://github.com/Koolskull/K-OS-III/blob/master/docs/EPISTEMIC_STANCE.md" style={{ color: "#ffff00" }}>EPISTEMIC_STANCE.md</a>{" "}
        for the full posture. The technical articles below stick to facts; we tell
        you when something is a project preference vs. an objective measurement.
      </Aside>

      <H2>Quick links</H2>
      <UList>
        <Li><Strong>Tracker basics:</Strong> <Crossref to="what-is-a-tracker" /> · <Crossref to="hexadecimal" /> · <Crossref to="song-chain-phrase" /></Li>
        <Li><Strong>Visuals:</Strong> <Crossref to="per-instrument-visuals" /> · <Crossref to="scene-vm" /></Li>
        <Li><Strong>Local dev:</Strong> <Crossref to="terminal-basics" /> · <Crossref to="running-k-os-locally" /></Li>
        <Li><Strong>Reference:</Strong> <Crossref to="effect-commands" /> · <Crossref to="dmpit-format" /> · <Crossref to="glossary" /></Li>
      </UList>
    </>
  );
}

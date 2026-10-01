import { Lead, P, H2, UList, Li, Strong, Crossref, Aside } from "@/components/doc/elements";

export default function WhyKOS() {
  return (
    <>
      <Lead>
        K-OS is a real operating system delivered first through a web browser.
        That's a deliberate choice, not a limitation — it's the fastest way to
        reach the most people on the most kinds of hardware, including hardware
        that modern software has given up on.
      </Lead>

      <H2>A real OS, not a simulation</H2>
      <P>
        K-OS is not a visual homage to Windows 95 or a browser-skinned desktop
        screenshot. Underneath the windowed apps is a real operating environment:
        a shell that launches programs, a window manager, a virtual filesystem,
        an input router that normalizes keyboards, gamepads, and touch into one
        stream, and real engines for sound and visuals. Everything an OS does,
        K-OS does — it just happens to run inside a browser tab for now.
      </P>
      <P>
        That "for now" matters. A 3D-printed handheld prototype using
        off-the-shelf LCD panels has already been built and is being tested.
        An installable Linux edition (built on a Zorin OS fork) is in progress.
        Web is the first delivery surface. It is not the only one.
      </P>

      <H2>The browser is the universal portal</H2>
      <P>
        No other software surface is as universally available as a URL. No app
        store approval, no install, no device lock-in, no operating-system tax.
        If you can open a browser, you can open K-OS. Phones count. Old laptops
        count. School Chromebooks count. The machine you thought was too slow
        to run anything new counts.
      </P>
      <P>
        This matters because the project's success depends on many hands
        finding it, using it, breaking it, filing issues, and sending patches.
        A web build maximizes the surface area for that loop. Hardware that
        only a few people have can't produce the same volume of feedback, and
        closed platforms can't produce it at all.
      </P>

      <H2>Running where modern software won't</H2>
      <P>
        The computing industry has decided, quietly, that five-year-old hardware
        is garbage. Consumer OSes drop support; app stores stop serving
        updates; websites ship megabytes of JavaScript for a button. K-OS takes
        the other position. Light builds, plain web platform primitives where
        possible, optional heavy subsystems (3D, WASM emulators) that load only
        when invoked. The goal is that K-OS stays usable on the machines most
        people actually have, not the one a reviewer is holding this quarter.
      </P>

      <H2>What "starting here" means</H2>
      <P>
        The browser version is the minimum viable project. It's the public
        testing ground: an open, linkable, free way for anyone to try what K-OS
        is trying to be, pull it apart, and tell us what's wrong. Every
        friction point a browser user hits now is one the handheld and
        installable versions get to avoid later. Maturity before ship is the
        strategy.
      </P>

      <Aside title="This is also a stance on who software is for">
        K-OS is framed as a creative tool, not a content-delivery surface. See{" "}
        <Crossref to="human-cognition-first" /> for the full argument, and{" "}
        <Crossref to="from-browser-to-hardware" /> for the delivery roadmap.
      </Aside>

      <H2>Go deeper</H2>
      <UList>
        <Li><Strong>The roadmap:</Strong> <Crossref to="from-browser-to-hardware" /></Li>
        <Li><Strong>The stance on the reader:</Strong> <Crossref to="human-cognition-first" /></Li>
        <Li><Strong>Design constraints that fall out of this:</Strong> <Crossref to="the-rules" /></Li>
      </UList>
    </>
  );
}

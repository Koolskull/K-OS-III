import { Lead, P, H2, UList, OList, Li, Strong, Code, Crossref, Aside } from "@/components/doc/elements";

export default function FromBrowserToHardware() {
  return (
    <>
      <Lead>
        K-OS is shipped in stages. The browser is stage zero — the minimum
        viable project. Each subsequent stage feeds on what the previous one
        learned. No stage replaces the ones before it; the browser build stays
        live forever.
      </Lead>

      <H2>Stage 0 — the browser build (right now)</H2>
      <P>
        What you're reading this manual inside. Runs on anything that can load
        a webpage: desktops, laptops, phones, tablets, school Chromebooks,
        aging hardware that newer apps have written off. Distribution is a
        link. Installation is pressing <Code>F11</Code> if you want it
        fullscreen. Zero gatekeepers.
      </P>
      <P>
        This stage is also the public laboratory. It's where users test, break,
        revise, criticize, and copy. The longer and harder this stage gets
        used, the more mature the interface gets before it lands on hardware
        that can't be patched as casually.
      </P>

      <H2>Stage 1 — the PWA</H2>
      <P>
        Same codebase, packaged as a Progressive Web App. Installs to the home
        screen on phones and the app list on desktops. Works offline.
        Launches without visible browser chrome so it feels like a native app.
        No app-store approval needed on most platforms — though we'll submit
        where it helps discovery.
      </P>
      <P>
        The PWA mostly closes the gap between "a website" and "a program you
        own." It's the natural bridge between stage zero and real hardware.
      </P>

      <H2>Stage 2 — the handheld prototype</H2>
      <P>
        A physical device designed for K-OS and nothing else. The case is
        3D-printed using a file that can be shared and reproduced by anyone
        with access to a printer. The screen is a commodity LCD — the kind
        already mass-produced for dashboards, instrument clusters, and hobby
        electronics. The goal is a device whose bill of materials is small
        enough, and whose parts are common enough, that people can build one
        themselves if they want to.
      </P>
      <P>
        A first print of this enclosure exists and is being used for testing
        right now. The design isn't final; that's partly what stage zero is
        for — shaking out what the interface actually needs to feel good on a
        dedicated device.
      </P>

      <H2>Stage 3 — installable Linux edition</H2>
      <P>
        A desktop operating system built on a Zorin OS fork, with K-OS shipped
        as the shell. For users who want a full machine dedicated to this —
        the same experience as in the browser, but as their actual desktop
        with file-system integration, native performance, and no browser sitting
        in between.
      </P>

      <H2>Why this order</H2>
      <OList>
        <Li><Strong>Browser first = testing reach.</Strong> The more people who try K-OS before we ship a dedicated device, the fewer device units are wasted on a design that needed more iteration.</Li>
        <Li><Strong>PWA next = almost-native feel on the devices people already own.</Strong> Proves the shell works without a visible browser.</Li>
        <Li><Strong>Handheld then = targeted, repairable hardware.</Strong> Built from parts anyone can buy, in a case anyone can print.</Li>
        <Li><Strong>Installable Linux last = full-scale desktop use.</Strong> By this point the design choices are earned; the only thing left is to let the shell stand on its own as a primary OS.</Li>
      </OList>

      <Aside title="The road is public">
        All four stages live in one repository. Stage-zero bugs that you file
        today become stage-two decisions that you benefit from later — even if
        you never own the handheld.
      </Aside>

      <H2>See also</H2>
      <UList>
        <Li><Strong>The why:</Strong> <Crossref to="why-k-os" /></Li>
        <Li><Strong>Run K-OS from source today:</Strong> <Crossref to="running-k-os-locally" /></Li>
        <Li><Strong>The stance on the reader:</Strong> <Crossref to="human-cognition-first" /></Li>
      </UList>
    </>
  );
}

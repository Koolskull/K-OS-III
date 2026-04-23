import { Lead, P, H2, UList, Li, Strong, Code, Aside, Crossref } from "@/components/doc/elements";

export default function TheRules() {
  return (
    <>
      <Lead>
        K-OS has a small set of design rules that every UI element follows. They
        shape the look, the behavior of contributors, and the kinds of features
        that get added. Some are aesthetic. All are intentional. Together they
        keep the OS coherent across hundreds of contributors and decades of code.
      </Lead>

      <H2>The five rules</H2>
      <UList>
        <Li>
          <Strong>1. No rounded corners.</Strong> Borders are sharp. Buttons are
          rectangles. Icons are pixel grids. The CSS rule{" "}
          <Code>border-radius: 0</Code> applies globally.
        </Li>
        <Li>
          <Strong>2. No anti-aliasing.</Strong> Pixels are crisp.{" "}
          <Code>image-rendering: pixelated</Code> on every image.{" "}
          <Code>-webkit-font-smoothing: none</Code> on body text.
        </Li>
        <Li>
          <Strong>3. No gradient buttons.</Strong> Pixel-art surfaces only. Flat
          fills, illustrated borders, hand-drawn sprites. No CSS gradients dressing
          up rectangles to look 3D.
        </Li>
        <Li>
          <Strong>4. Every pixel earns its place.</Strong> No filler chrome.
          Every glyph, every line, every spacer should be doing something.
        </Li>
        <Li>
          <Strong>5. Every file is blessed.</Strong> See the ASCII art at the
          top of most source files. Cultural rule, not a CSS rule.
        </Li>
      </UList>

      <H2>Why these specifically</H2>
      <P>
        Rounded corners, anti-aliasing, and gradients are the visual language of
        consumer SaaS. Almost every modern UI has them. They're meant to communicate
        "premium, friendly, professional." They're also generic — when you see
        them you don't know what app you're in until you read the labels.
      </P>
      <P>
        K-OS goes the other direction. Sharp corners and visible pixels signal:
        this is a tool, not a product. It belongs to a tradition that includes
        the Game Boy, the Amiga, LSDJ, demoscene production. You know what kind
        of room you're in the moment the boot sequence starts.
      </P>

      <H2>What this means in practice</H2>
      <UList>
        <Li>
          <Strong>Use bitmap fonts.</Strong> Kongtext is the primary face. Sometype
          Mono at HD scales (1280px+). Other pixel/bitmap fonts are fine; modern
          system fonts (San Francisco, Segoe UI, Roboto) are not.
        </Li>
        <Li>
          <Strong>Color is monochromatic for text.</Strong> White on black or
          black on white. Yellow accents for cross-references and the BETA badge.
          Green for code. Red for errors and dangerous actions. Magenta for
          placeholders.
        </Li>
        <Li>
          <Strong>VMI assets for buttons.</Strong> The "Visual Machine Interface"
          system uses layered PNG sequences for button states (default, hover,
          pressed). See <Code>VMI_ARTIST_GUIDE.md</Code> for the naming
          convention.
        </Li>
        <Li>
          <Strong>Ask before inventing.</Strong> If you need a button or window
          that doesn't have an existing template, ask the maintainer. Don't
          freelance new chrome.
        </Li>
      </UList>

      <H2>For contributors writing code</H2>
      <P>
        The CSS rules above are enforced globally in{" "}
        <Code>src/app/globals.css</Code> via{" "}
        <Code>border-radius: 0 !important</Code>. Inline styles can technically
        override but should not. PR reviewers check.
      </P>
      <P>
        CSS variables get the <Code>--dm-</Code> prefix. Class names use the{" "}
        <Code>dm-</Code> prefix. This keeps Tailwind utility classes and
        K-OS-specific styling distinguishable.
      </P>

      <Aside title="The Slimentologika rule" variant="info">
        Multi-digit <Crossref to="slimentologika">Slimentologika</Crossref> values
        follow an orientation rule: digits stack <Strong>perpendicular</Strong>{" "}
        to the layout. Vertical lists get horizontal digit pairs;
        horizontal rows get vertical digit pairs. This isn't decoration, it's
        readability — adjacent values stay distinct.
      </Aside>

      <H2>The cultural side</H2>
      <P>
        The "every file is blessed" rule means each source file gets a small
        ASCII art header — usually a saint, the Templar cross, or a Psalm
        excerpt. This is part of K-OS's identity.
      </P>
      <P>
        From <Code>CONTRIBUTING.md</Code>: "You don't have to share the
        worldview to contribute. You do have to respect that the identity is
        part of the project, not decoration to be sanded off."
      </P>

      <H2>What to read next</H2>
      <UList>
        <Li><Crossref to="welcome" /> for how the rules fit the broader project mission.</Li>
        <Li><Crossref to="slimentologika" /> for the most-visible aesthetic decision.</Li>
        <Li>The repo's <Code>koolskull-os-ui-notes.md</Code> for the longer-form essay on "Maximalistic Minimalism" — the philosophy behind the rules.</Li>
      </UList>
    </>
  );
}

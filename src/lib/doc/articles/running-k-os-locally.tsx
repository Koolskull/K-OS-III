import { Lead, P, H2, H3, OList, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function RunningKOSLocally() {
  return (
    <>
      <Lead>
        Running K-OS on your own machine takes about ten minutes the first time,
        mostly waiting for downloads. After that, starting it is one command. This
        article walks through every step from "I have a terminal open" to "K-OS is
        running in my browser at localhost." If you don't have a terminal open
        yet, start with <Crossref to="terminal-basics" />.
      </Lead>

      <H2>What you need first</H2>
      <UList>
        <Li>
          <Strong>Node.js v20 or newer.</Strong> Download from{" "}
          <a href="https://nodejs.org" style={{ color: "#ffff00" }}>nodejs.org</a>.
          Install with default settings.
        </Li>
        <Li>
          <Strong>Git.</Strong> Almost certainly already installed on Mac and Linux.
          On Windows, install via{" "}
          <a href="https://git-scm.com" style={{ color: "#ffff00" }}>git-scm.com</a>{" "}
          or use WSL.
        </Li>
        <Li>
          <Strong>About 1 GB of disk space.</Strong> K-OS itself is small, but its
          dependencies (Next.js, Three.js, Tone.js, etc.) add up.
        </Li>
      </UList>

      <Aside title="Verify your installations" variant="tip">
        In a terminal, run <Code>node --version</Code> and <Code>git --version</Code>.
        Both should print version numbers. If either says "command not found,"
        install that tool first.
      </Aside>

      <H2>Step by step</H2>

      <H3>1. Pick a folder to work in</H3>
      <P>
        K-OS will become a subfolder wherever you are. Most people put projects
        under <Code>~/Documents</Code> or <Code>~/Projects</Code>:
      </P>
      <CodeBlock>{`cd ~/Documents`}</CodeBlock>

      <H3>2. Clone the repository</H3>
      <CodeBlock>{`git clone https://github.com/Koolskull/K-OS-III.git`}</CodeBlock>
      <P>
        Git downloads the entire project (~50 MB). When it's done you'll see a
        new folder. <Code>ls</Code> to confirm:
      </P>
      <CodeBlock>{`ls
# you should see K-OS-III in the list`}</CodeBlock>

      <H3>3. Move into the project folder</H3>
      <CodeBlock>{`cd K-OS-III`}</CodeBlock>
      <P>
        Everything below assumes you're inside this folder. If you ever lose
        track, run <Code>pwd</Code> — it should end with <Code>K-OS-III</Code>.
      </P>

      <H3>4. Install dependencies</H3>
      <CodeBlock>{`npm install --legacy-peer-deps`}</CodeBlock>
      <P>
        This is the slow part. <Code>npm</Code> reads <Code>package.json</Code>,
        downloads every library K-OS depends on, and puts them in a folder called{" "}
        <Code>node_modules</Code>. First run takes 1–3 minutes depending on your
        internet. You'll see a lot of scrolling output ending in something like
        "added 412 packages." That's success.
      </P>
      <P>
        The <Code>--legacy-peer-deps</Code> flag is needed because some K-OS
        dependencies declare overly strict version requirements that npm normally
        refuses to satisfy. The flag tells npm "ignore those, use what's actually
        in package.json." It's safe and intentional — if you forget it, you'll
        see a wall of red errors and the install will abort.
      </P>

      <H3>5. Start the development server</H3>
      <CodeBlock>{`npm run dev`}</CodeBlock>
      <P>
        Next.js spins up a local web server. Within a few seconds you'll see:
      </P>
      <CodeBlock label="You should see something like this">
{`▲ Next.js 16.1.6 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.1.X:3000

✓ Ready in 358ms`}
      </CodeBlock>

      <H3>6. Open it in your browser</H3>
      <P>
        Visit <Code>http://localhost:3000</Code>. The K-OS boot sequence scrolls,
        the desktop loads, and you're in. That's it. You're running K-OS.
      </P>

      <Aside title="The dev server stays running" variant="info">
        The terminal you started <Code>npm run dev</Code> from is now busy serving
        the app. Leave it open. When you edit source files, the server detects
        changes and the browser refreshes automatically (this is called Hot Module
        Reload). To stop the server, press <Code>Ctrl+C</Code> in that terminal.
      </Aside>

      <H2>Other commands you might want</H2>

      <H3><Code>npm run build</Code></H3>
      <P>
        Builds the production version of K-OS. Runs the TypeScript compiler,
        bundles everything, optimizes assets. Used by the GitHub Pages deploy and
        anything that ships the site for real. Fails if there are TypeScript
        errors or if your code has issues that <Code>npm run dev</Code> tolerates
        but production doesn't.
      </P>

      <H3><Code>npm run lint</Code></H3>
      <P>
        Runs the linter. Tells you if your code has style problems or known
        anti-patterns. Run before submitting a pull request.
      </P>

      <H3><Code>npm run preview:export</Code></H3>
      <P>
        Builds the static export (the same output that ships to{" "}
        <Code>koolskull.github.io/k-os</Code>) and serves it locally on port
        4044. Use this to verify changes work in the production build, not just
        in dev mode. The URL is <Code>http://localhost:4044/k-os/</Code>{" "}
        — note the <Code>/k-os/</Code> path prefix.
      </P>

      <H2>If something goes wrong</H2>

      <H3>"npm: command not found"</H3>
      <P>Node.js isn't installed, or your terminal session hasn't picked it up.
        Install Node from nodejs.org, then close and reopen your terminal.</P>

      <H3>"port 3000 is already in use"</H3>
      <P>
        Something else is using port 3000 (maybe an earlier <Code>npm run dev</Code>
        you forgot about). Either kill the other process or run on a different
        port:
      </P>
      <CodeBlock>{`PORT=3050 npm run dev`}</CodeBlock>

      <H3>"Cannot find module ..."</H3>
      <P>
        The dependencies didn't install fully. Delete <Code>node_modules</Code>{" "}
        and run install again:
      </P>
      <CodeBlock>{`rm -rf node_modules package-lock.json
npm install --legacy-peer-deps`}</CodeBlock>

      <H3>The browser shows a blank page or "ECONNREFUSED"</H3>
      <UList>
        <Li>Check the terminal — is the dev server still running? Did it crash with an error?</Li>
        <Li>Is the browser pointed at the right port? (Usually 3000.)</Li>
        <Li>Try a different browser. Audio + WebGL + Web MIDI all work best in recent Chrome/Firefox/Safari.</Li>
      </UList>

      <H2>What to read next</H2>
      <P>
        Once K-OS is running, dive into the actual app:
      </P>
      <UList>
        <Li><Crossref to="what-is-a-tracker" /> — if you want to start using Datamoshpit.</Li>
        <Li><Crossref to="dmpit-format" /> — if you're curious how saved projects are stored.</Li>
        <Li><Crossref to="the-rules" /> — if you want to contribute code.</Li>
      </UList>
    </>
  );
}

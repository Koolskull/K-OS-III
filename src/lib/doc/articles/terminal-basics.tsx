import { Lead, P, H2, H3, UList, OList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function TerminalBasics() {
  return (
    <>
      <Lead>
        The <Strong>terminal</Strong> (also called the command line, shell, or
        console) is a text-only interface to your computer. You type a command, hit
        Enter, the computer responds. It looks ancient and is one of the most
        powerful tools a developer has. To run K-OS on your own machine you need
        to use one — but only briefly, and only for a handful of commands.
      </Lead>

      <H2>Why bother</H2>
      <P>
        Almost everything you do on a computer is a wrapper around what the
        terminal does. A graphical app to install software is a wrapper around a
        terminal command that downloads and unpacks files. A finder window is a
        wrapper around terminal commands that list and open files. The wrappers
        are nicer to look at; the terminal does more, faster, and lets you string
        commands together.
      </P>
      <P>
        For K-OS specifically, you need the terminal to: install Node.js
        dependencies (one command), start the local development server (one
        command), and pull project updates from GitHub (one command). That's it.
        You don't need to live there.
      </P>

      <H2>How to open one</H2>
      <H3>On macOS</H3>
      <UList>
        <Li>Press <Code>⌘ + Space</Code> to open Spotlight, type <Strong>terminal</Strong>, hit Enter.</Li>
        <Li>Or open Finder → Applications → Utilities → Terminal.</Li>
      </UList>
      <H3>On Windows</H3>
      <UList>
        <Li>Press the Windows key, type <Strong>terminal</Strong>, hit Enter. (Windows 11 ships with Windows Terminal; Windows 10 has PowerShell — both work.)</Li>
        <Li>For the most Linux-like experience, install <Strong>WSL</Strong> (Windows Subsystem for Linux) from the Microsoft Store. K-OS instructions assume a Unix-like shell, which WSL gives you.</Li>
      </UList>
      <H3>On Linux</H3>
      <UList>
        <Li>You probably already know. <Code>Ctrl+Alt+T</Code> on most distros, or right-click the desktop → "Open Terminal."</Li>
      </UList>

      <H2>What you'll see</H2>
      <P>
        A blinking cursor next to a prompt that ends with a <Code>$</Code> or{" "}
        <Code>%</Code> or <Code>&gt;</Code>. That's the shell waiting for you to
        type. Anything before the prompt is information: your username, the
        current folder, sometimes the time. Don't worry about it for now.
      </P>
      <CodeBlock label="What a typical prompt looks like">
{`koolskull@laptop ~/Documents $ _`}
      </CodeBlock>

      <H2>The five commands you actually need</H2>
      <P>
        Trim list. Master these and you can do everything K-OS asks for.
      </P>
      <Aside title="Command convention" variant="info">
        When this manual shows commands like <Code>cd K-OS-III</Code>, you type{" "}
        <Code>cd K-OS-III</Code> exactly, then press Enter. The terminal does the
        action and shows you the result (or nothing, if the action was silent and
        successful).
      </Aside>

      <H3>1. <Code>pwd</Code> — "print working directory"</H3>
      <P>Tells you which folder you're currently in. When in doubt, run this.</P>
      <CodeBlock>{`pwd`}</CodeBlock>

      <H3>2. <Code>ls</Code> — list files in the current folder</H3>
      <P>
        Shows what's in the folder you're in. <Code>ls -la</Code> shows hidden
        files and details (size, date modified).
      </P>
      <CodeBlock>{`ls
ls -la`}</CodeBlock>

      <H3>3. <Code>cd</Code> — "change directory" (move into a folder)</H3>
      <P>
        <Code>cd Documents</Code> moves you into a folder called Documents (if it
        exists in your current folder). <Code>cd ..</Code> moves up one level. <Code>cd ~</Code>{" "}
        takes you back to your home folder.
      </P>
      <CodeBlock>{`cd Documents
cd ~/Projects/K-OS-III
cd ..`}</CodeBlock>

      <H3>4. <Code>git clone</Code> — download a project from GitHub</H3>
      <P>
        Copies a remote repository to your current folder. K-OS lives at{" "}
        <Code>github.com/Koolskull/K-OS-III</Code>:
      </P>
      <CodeBlock>{`git clone https://github.com/Koolskull/K-OS-III.git`}</CodeBlock>
      <P>
        After this finishes, <Code>ls</Code> will show a new <Code>K-OS-III</Code>{" "}
        folder in your current location. <Code>cd</Code> into it.
      </P>

      <H3>5. <Code>npm</Code> — Node Package Manager</H3>
      <P>
        K-OS is a Node.js project. <Code>npm</Code> is the tool that installs the
        libraries it depends on and runs its scripts. The exact npm commands K-OS
        needs are on the next page (<Crossref to="running-k-os-locally" />). For now,
        just know <Code>npm</Code> is what you'll use to start the local dev server.
      </P>

      <H2>Things that will save you time</H2>
      <UList>
        <Li>
          <Strong>Tab completion.</Strong> Type a partial filename, hit Tab, the
          shell finishes it. Two presses lists matches.
        </Li>
        <Li>
          <Strong>Up arrow.</Strong> Recalls the last command you ran. Up arrow
          twice for two commands ago, etc. Save your fingers.
        </Li>
        <Li>
          <Strong><Code>Ctrl+C</Code> stops a running command.</Strong> When the dev server is
          running and you want to stop it, that's the keystroke. Not Cmd+W, not
          closing the terminal — Ctrl+C.
        </Li>
        <Li>
          <Strong><Code>Ctrl+L</Code> (or <Code>clear</Code>) clears the screen.</Strong> When the output gets noisy.
        </Li>
        <Li>
          <Strong>Drag-and-drop a folder onto the terminal window</Strong> on most
          OSes — it pastes the folder's full path. Useful when you can't remember
          the exact path to type.
        </Li>
      </UList>

      <H2>If something goes wrong</H2>
      <UList>
        <Li>
          <Code>command not found</Code> — the program you tried to run isn't
          installed (or isn't on your PATH). For npm, that means you need Node.js.
        </Li>
        <Li>
          <Code>permission denied</Code> — usually you're trying to write to a
          folder you don't own. Most of the time the fix is to run from a folder
          you do own (your home directory, not a system folder).
        </Li>
        <Li>
          <Code>no such file or directory</Code> — typo in the path, or you're
          not where you think you are. Run <Code>pwd</Code> and <Code>ls</Code>{" "}
          to orient.
        </Li>
        <Li>
          <Strong>The terminal is stuck.</Strong> Try <Code>Ctrl+C</Code>.
          If that doesn't help, close the terminal and open a fresh one.
        </Li>
      </UList>

      <H2>What to read next</H2>
      <P>
        With the terminal open and your bearings, head to{" "}
        <Crossref to="running-k-os-locally" /> for the actual K-OS commands.
      </P>
    </>
  );
}

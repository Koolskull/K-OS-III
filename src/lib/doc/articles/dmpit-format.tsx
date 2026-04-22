import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function DmpitFormat() {
  return (
    <>
      <Lead>
        A K-OS project file (<Code>.dmpit</Code>) is a ZIP archive containing a
        single JSON document plus binary sample files. It's deliberately readable
        — you can unzip one with any standard tool and inspect what's inside.
        This article documents the structure so you can write tooling, audit
        saves, or migrate projects between hosts.
      </Lead>

      <H2>The file is a zip</H2>
      <P>
        Rename a <Code>.dmpit</Code> to <Code>.zip</Code> and your OS will open
        it. Or use the command line:
      </P>
      <CodeBlock>
{`unzip -l my-song.dmpit

# typical output:
#   project.json
#   samples/00_KICK.wav
#   samples/01_SNARE.wav
#   samples/02_HAT.wav`}
      </CodeBlock>

      <H2>project.json</H2>
      <P>
        The single source of truth for the project. JSON-formatted. Looks
        roughly like this:
      </P>
      <CodeBlock label="Top-level shape (shortened)">
{`{
  "version": "0.1.0",
  "name": "MY SONG",
  "song": {
    "id": 0,
    "name": "MY SONG",
    "bpm": 120,
    "tpb": 6,
    "channels": 8,
    "rows": [
      { "chains": [0, null, null, null, null, null, null, null] },
      { "chains": [0, 1, null, null, null, null, null, null] },
      ...
    ]
  },
  "chains": [
    { "id": 0, "steps": [{ "phrase": 0, "transpose": 0 }, { ... }] },
    ...
  ],
  "phrases": [
    { "id": 0, "rows": [
      { "note": 60, "instrument": 0, "effect1": null, "effect2": null, "slice": null },
      ...
    ]},
    ...
  ],
  "tables": [
    { "id": 0, "rows": [...], "loopStart": 0 }
  ],
  "instruments": [
    {
      "id": 0,
      "name": "FM BASS",
      "type": "fm",
      "volume": 100,
      "pan": 64,
      "fmAlgorithm": 0,
      "fmFeedback": 3,
      "fmOperators": [...],
      "macros": [],
      "visual": {
        "enabled": true,
        "source": "color",
        "color": "#ff00aa",
        "width": 96,
        "height": 96,
        "posX": 128,
        "posY": 128,
        "totalFrames": 24,
        "triggerMode": "play-from-start"
      }
    },
    ...
  ],
  "samples": [
    { "id": 0, "name": "KICK", "file": "samples/00_KICK.wav" },
    ...
  ]
}`}
      </CodeBlock>

      <H2>Sample files</H2>
      <P>
        Audio samples are stored as raw <Code>.wav</Code> files inside a{" "}
        <Code>samples/</Code> folder in the zip. The JSON references them by
        relative path. On load, K-OS reads the WAV bytes and decodes them into
        in-memory audio buffers.
      </P>

      <H2>How records are stored</H2>
      <H3>Phrases and chains: sparse</H3>
      <P>
        K-OS only stores phrases and chains that have actually been edited. A
        project with one phrase has one entry in <Code>phrases[]</Code>, not 256.
        See <Crossref to="song-chain-phrase" /> for how the IDs work and why this
        matters for portability.
      </P>

      <H3>Instruments: always 256</H3>
      <P>
        Instruments are pre-allocated as a 256-entry array (one per ID). Most
        slots are blank "null" instruments; the few you've configured carry
        meaningful data. The fixed length keeps lookups O(1) by ID.
      </P>

      <H3>Visual data on instruments</H3>
      <P>
        If an instrument has a configured visual (the F4 VISUAL section is on),
        the visual record is included on the instrument under the{" "}
        <Code>visual</Code> key. Image data uploaded via <Code>LOAD</Code> or
        drawn via <Code>DRAW [KOOLDRAW]</Code> is embedded as a data URL in the
        <Code>assetUrl</Code> field — the project file remains self-contained.
      </P>
      <P>
        Trade-off: a project with three large embedded sprites can be many MB.
        If you're sharing many sprites, consider keeping them outside the
        project and referencing them by URL — the engine accepts both.
      </P>

      <H3>Custom keyframes</H3>
      <P>
        If you've used the timeline editor to author custom keyframes for an
        instrument visual, those land in <Code>visual.customKeyframes[]</Code>.
        The render engine prefers them over the auto-generated keyframes when
        present.
      </P>

      <H2>Versioning</H2>
      <P>
        The top-level <Code>version</Code> field is currently <Code>"0.1.0"</Code>.
        K-OS reads any project regardless of version (no migrations yet) and
        writes whatever version it shipped with. As the format evolves, we'll
        add migrations on load and bump the version field on write.
      </P>
      <Aside title="Beta-format warning" variant="warn">
        The <Code>0.2.0-beta</Code> release of K-OS may change the format
        before <Code>0.3</Code>. Save your projects locally as you build them.
        We don't expect breaking changes but the beta carries the risk.
      </Aside>

      <H2>Loading a project</H2>
      <P>
        Code path: <Code>src/engine/project/ProjectIO.ts</Code>. The function{" "}
        <Code>loadProjectFile(blob)</Code> takes a Blob (typically from a file
        picker), unzips it, parses <Code>project.json</Code>, restores sample
        binary data from the zip into <Code>ArrayBuffer</Code>s, and returns a
        fully-typed <Code>ProjectData</Code> object.
      </P>
      <CodeBlock label="The actual API">
{`import { loadProjectFile, downloadProject } from "@/engine/project/ProjectIO";

// Load
const project = await loadProjectFile(file);

// Save (downloads via browser)
await downloadProject(project);`}
      </CodeBlock>

      <H2>Writing tooling against the format</H2>
      <P>
        The format is plain ZIP + plain JSON. Writing a tool that, say, batch-
        renames instruments across many projects, or extracts sample names
        without loading the whole project into K-OS, is straightforward:
      </P>
      <UList>
        <Li>Use any ZIP library to extract <Code>project.json</Code>.</Li>
        <Li>Parse the JSON.</Li>
        <Li>Manipulate the in-memory object.</Li>
        <Li>Write back with the modified JSON, leaving sample binaries intact, re-zipping.</Li>
      </UList>
      <P>
        The TypeScript types live in <Code>src/types/tracker.ts</Code> and are
        the canonical schema. If you want to write a Python or Rust tool, those
        types are easy to mirror.
      </P>

      <H2>What to read next</H2>
      <UList>
        <Li><Crossref to="song-chain-phrase" /> for what each top-level data structure represents.</Li>
        <Li><Crossref to="per-instrument-visuals" /> for what the visual sub-object means.</Li>
        <Li><Crossref to="running-k-os-locally" /> if you want to clone the repo and inspect <Code>ProjectIO.ts</Code> yourself.</Li>
      </UList>
    </>
  );
}

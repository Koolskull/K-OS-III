import { Lead, P, H2, H3, UList, OList, Li, Strong, Code, CodeBlock, Aside, Table, Crossref } from "@/components/doc/elements";

export default function KoolDrawTimeline() {
  return (
    <>
      <Lead>
        KoolDraw's timeline is a small animation studio: layers stack like
        clear sheets, frames get permanent <Strong>hex names</Strong> so you
        can reuse a drawing anywhere in the sequence without redrawing it,
        and the whole strip can flip into a vertical, exposure-sheet-style
        grid that lines up with a Shotlist shot's X-Sheet.
      </Lead>

      <H2>Every drawing gets a permanent hex name</H2>
      <P>
        Add a frame and it's stamped with a <Strong>3-digit hex id</Strong>,{" "}
        <Code>000</Code> through <Code>FFF</Code> — 4096 possible drawings per
        layer. That id never changes, even if you move the drawing to a
        different point in time. If you've read{" "}
        <Crossref to="hexadecimal" />, this is the same counting system —
        K-OS uses hex everywhere, and frame names are no exception.
      </P>
      <P>
        This matters because a layer actually keeps <Strong>two</Strong>{" "}
        lists under the hood:
      </P>
      <UList>
        <Li>
          A <Strong>pool</Strong> — every distinct drawing that exists on
          this layer, each with its own hex id.
        </Li>
        <Li>
          An <Strong>exposure track</Strong> — the timeline itself: for each
          position in the sequence, which pool drawing is shown there.
        </Li>
      </UList>
      <P>
        If you never reuse anything, this is invisible — every timeline
        position just shows its own drawing, exactly like a plain
        frame-by-frame strip. The pool only becomes visible once you want a
        drawing to appear more than once.
      </P>

      <H2>Duplicate vs. reuse — these are different things</H2>
      <Table
        headers={["Action", "Shortcut", "What happens"]}
        rows={[
          ["New blank frame", "Shift+F", "New pool drawing, new hex id, inserted after the active frame."],
          ["Duplicate", "Shift+D", "Copies the active drawing into a NEW pool entry (new hex id) you can edit independently."],
          ["Reuse", "REUSE ▾ button", "Points the active timeline slot at an EXISTING pool drawing — no new hex id, no copy."],
        ]}
      />
      <P>
        <Strong>Duplicate</Strong> gives you an editable copy — change it and
        the original is untouched. <Strong>Reuse</Strong> is a reference —
        edit the drawing at any position that exposes it, and every other
        position sharing that hex id updates too. This is exactly how
        Clip Studio Paint and OpenToonz let you hold a drawing across many
        frames without redrawing it: write it once, expose it wherever it's
        needed.
      </P>
      <Aside title="Deleting a frame doesn't delete the drawing" variant="tip">
        Removing a timeline slot only removes that exposure. The pool
        drawing it pointed to sticks around (just unused) until you reuse it
        again from the REUSE picker — nothing is lost.
      </Aside>

      <H2>Held frames look different on purpose</H2>
      <P>
        In vertical (X-Sheet) mode, a run of positions that all expose the{" "}
        <Strong>same</Strong> hex id doesn't repeat the thumbnail and label
        for every row. Only the first position in the run shows the drawing;
        the rest show a thin <Code>┆</Code> continuation mark. That's the
        same convention paper exposure sheets and OpenToonz's Xsheet use —
        it reads as "this is held," not as N separate drawings.
      </P>

      <H2>Dragging layers and frames</H2>
      <P>
        Grab the <Code>⠿</Code> handle on a layer row, or a frame cell
        itself, and drag to reorder — the same press-and-drag interaction
        used by the color picker and knob controls elsewhere in KoolDraw
        (not a browser drag-and-drop; it works the same with a mouse, pen,
        or finger). Dragging a layer changes stacking order. Dragging a
        frame changes when it plays in the sequence.
      </P>
      <P>Keyboard alternative, no drag required — focus a layer row and press:</P>
      <UList>
        <Li><Code>Alt</Code>+<Code>↑</Code> / <Code>Alt</Code>+<Code>↓</Code> — move the layer up/down</Li>
        <Li><Code>↑</Code> / <Code>↓</Code> — select the layer above/below</Li>
        <Li><Code>Enter</Code> — rename</Li>
        <Li><Code>Delete</Code> — remove the layer</Li>
      </UList>

      <H2>Horizontal filmstrip vs. vertical X-Sheet</H2>
      <P>
        The header button (labeled <Code>AUTO</Code>, <Code>FILM</Code>, or{" "}
        <Code>X-SHEET</Code> — same button on the mobile INFO panel) cycles
        the whole timeline through three modes. It's one timeline with two
        layouts plus an auto-picker, not separate features:
      </P>
      <OList>
        <Li>
          <Strong>Horizontal (FILM)</Strong> — the classic filmstrip: one
          composited thumbnail per frame, scrubbing left to right, docked in
          a resizable strip under the canvas. Good for quick animation work.
        </Li>
        <Li>
          <Strong>Vertical (X-SHEET)</Strong> — a true exposure-sheet grid:
          rows are timeline positions (top to bottom, frame 1 at the top),
          columns are layers, docked in a thin column to the right of the
          preview/color/export rail (never crammed into it). This mirrors a
          paper X-Sheet, and it's the layout OpenToonz and Tahoma2D use for
          their own Xsheet panel — frame 1 at the top, increasing downward —
          so cross-referencing a printed sheet or either of those apps
          alongside KoolDraw already lines up.
        </Li>
        <Li>
          <Strong>AUTO</Strong> — the default. Follows the KoolDraw window's
          own shape live: taller-than-wide picks horizontal (bottom strip);
          wider-than-tall picks vertical (right column). Clicking the button
          steps <Code>AUTO → FILM → X-SHEET → AUTO</Code> — picking FILM or
          X-SHEET pins that layout regardless of window shape until you cycle
          back to AUTO.
        </Li>
      </OList>
      <P>
        Your choice is remembered between sessions (it's saved locally, the
        same way KoolDraw's other UI state persists).
      </P>

      <H2>Lining up with a Shotlist X-Sheet</H2>
      <P>
        Open a shot's plate in KoolDraw from Shotlist (the <Code>KOOL</Code>{" "}
        button, or <Code>S</Code>) and KoolDraw receives a snapshot of that
        shot's fps, duration, and X-Sheet rows along with the plate — the
        timeline pins to X-SHEET mode automatically and groups its rows to
        match, with each row's action/dialogue note shown alongside.
      </P>
      <P>
        This is a <Strong>snapshot</Strong>, taken at the moment you hand the
        plate off — not a live link. If you go back to Shotlist and edit the
        X-Sheet further while KoolDraw stays open, KoolDraw won't see those
        changes until the next handoff. Re-open the shot from Shotlist to
        refresh the snapshot.
      </P>

      <H2>Saving projects & the asset library</H2>
      <P>
        KoolDraw projects can be saved to your account instead of only ever
        living in the current browser tab. The <Strong>PROJECT</Strong>{" "}
        panel's <Strong>SAVE</Strong> button stores the whole animation —
        every layer, every pool drawing, loop mode, palette — and{" "}
        <Strong>SAVE AS NEW</Strong> branches off a copy without touching the
        original. <Strong>OPEN EXISTING PROJECT</Strong>, offered on the
        mandatory name/size screen when you launch KoolDraw fresh, lists
        everything you've saved.
      </P>
      <P>
        Saving also registers the project in your{" "}
        <Strong>asset library</Strong> — the same shared pool ProDev and
        Shotlist draw from. Open a Shotlist shot's <Strong>ASSETS</Strong>{" "}
        panel and any saved KoolDraw project shows up there, ready to attach;
        an attached drawing gets an <Strong>EDIT</Strong> button that jumps
        straight back into KoolDraw with that exact project loaded. This is
        how a drawing made for one shot stays reachable from ProDev and
        Shotlist without re-exporting or re-uploading it by hand.
      </P>
      <Aside title="Save format" variant="tip">
        Saved projects use the same hex-id/layer/JSON bundle structure as the{" "}
        <Strong>BUNDLE</Strong> export button below — the same format
        Datamoshpit's Scene VM already knows how to read.
      </Aside>

      <H2>Planned: a vector pen tool</H2>
      <P>
        KoolDraw's tools are all raster (pixel) today. A future update plans
        a <Strong>vector mode</Strong> alongside it — a pen tool in the
        spirit of classic Macromedia Flash / the open-source Wick Editor,
        where a drawn stroke becomes an editable vector shape (fillable,
        scalable without going blocky) instead of a fixed set of colored
        pixels. This is a genuinely large, separate feature — turning a
        freehand stroke into a clean vector shape in real time is its own
        design problem, distinct from KoolDraw's current pixel-art engine —
        so it's tracked as future work, not built yet. The asset library
        above is the intended home for vector drawings too, once this
        lands, alongside raster KoolDraw projects.
      </P>

      <H3>Quick reference</H3>
      <CodeBlock label="KoolDraw timeline shortcuts">
{`Shift+F   New blank frame (new hex id)
Shift+D   Duplicate active frame (new hex id, independent copy)
,  /  .   Previous / next frame
W         Jump to first frame
O         Toggle onion skin
P         Play / pause`}
      </CodeBlock>
    </>
  );
}

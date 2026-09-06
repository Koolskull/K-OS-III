import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function RichardByrd() {
  return (
    <>
      <Lead>
        Rear Admiral Richard Evelyn Byrd (1888&ndash;1957) flew over
        the South Pole on 28&ndash;29 November 1929, commanded five
        Antarctic expeditions for the United States Navy, and in
        1946&ndash;47 led Operation Highjump &mdash; the largest polar
        force ever mounted, with roughly 4,700 men, thirteen ships,
        and 33 aircraft. He came back early. In a 1947 interview with
        the Chilean paper <Em>El Mercurio</Em> he warned that the
        United States would &ldquo;have to adopt measures of
        protective security against the possibility of an invasion of
        the country by hostile planes coming from the polar
        regions.&rdquo; The constituency that has carried his memory
        forward holds that what Highjump met at the bottom of the
        world was not Soviet.
      </Lead>

      <H2>The public record</H2>

      <P>
        Byrd received the Medal of Honor in 1926 for what was then
        announced as the first flight over the North Pole, with pilot
        Floyd Bennett, and his South Pole flight of 28&ndash;29
        November 1929 with Bernt Balchen is undisputed. Between those
        flights and his death in 1957 he led the Byrd Antarctic
        Expeditions of 1928&ndash;30, 1933&ndash;35, 1939&ndash;41,
        Operation Highjump in 1946&ndash;47, and Operation Deep Freeze
        from 1955 onward &mdash; the operation that established the
        permanent American presence on the continent and the one he
        was officer-in-charge of when he died. <Em>Alone</Em> (1938),
        his account of four-and-a-half months by himself at Advance
        Base in the Antarctic winter of 1934, is one of the
        twentieth century&apos;s standing documents of solitude under
        carbon-monoxide poisoning and polar dark.
      </P>

      <P>
        Highjump itself sailed under Task Force 68 with the carrier
        USS <Em>Philippine Sea</Em>, mapped vast stretches of coast,
        produced the photographic baseline that fed American Antarctic
        cartography for the next decade, and returned in February
        1947, months ahead of the planned eight-month operation. The
        <Em> El Mercurio</Em> remarks were given on his way home. In
        the press conferences and lecture appearances of his final
        years he returned, more than once, to the figure of a
        &ldquo;land beyond the pole&rdquo; and to the suggestion that
        the polar regions held something the public did not yet have
        the language for.
      </P>

      <Diagram
        cols={7}
        rows={3}
        nodes={[
          { id: "n1926", text: "North Pole flight", col: 0, row: 1, sub: "1926" },
          { id: "n1929", text: "South Pole flight", col: 1, row: 1, sub: "29 Nov 1929" },
          { id: "nbae", text: "BAE expeditions", col: 2, row: 1, sub: "1928-30, 1933-35, 1939-41" },
          { id: "nhj", text: "Operation Highjump", col: 3, row: 0, rowSpan: 3, accent: true, sub: "4,700 men - returned early" },
          { id: "nem", text: "El Mercurio warning", col: 4, row: 1, sub: "1947" },
          { id: "ndf", text: "Operation Deep Freeze", col: 5, row: 1, sub: "1955" },
          { id: "ndeath", text: "Death", col: 6, row: 1, sub: "1957" },
        ]}
        edges={[
          { from: "n1926", to: "n1929" },
          { from: "n1929", to: "nbae" },
          { from: "nbae", to: "nhj", accent: true },
          { from: "nhj", to: "nem", accent: true },
          { from: "nem", to: "ndf" },
          { from: "ndf", to: "ndeath" },
        ]}
        caption="BYRD POLAR TIMELINE — HIGHJUMP RETURNED MONTHS AHEAD OF AN EIGHT-MONTH PLAN."
      />

      <H2>The inner continent</H2>

      <P>
        The constituency that received Byrd most fully &mdash; the
        hollow-earth and Inner Earth tradition with antecedents in
        Edmund Halley, John Cleves Symmes, and the nineteenth-century
        polar literature, and a twentieth-century lineage running
        through Raymond Bernard&apos;s <Em>The Hollow Earth</Em>
        (1964) and onward into the present work of researchers such
        as Robert Sepehr &mdash; holds that on one of the polar
        flights Byrd passed through a polar opening into an interior
        region, met an advanced civilisation named in the literature
        as Agartha or the Arianni, and was given a warning regarding
        surface humanity&apos;s atomic and technological trajectory.
        The central document of this tradition, <Em>The Missing Diary
        of Admiral Byrd</Em>, records the flight in the first person
        and is the textual core around which the Inner Earth reading
        of Byrd is organised.
      </P>

      <P>
        Within the tradition the diary is read as the suppressed
        record &mdash; the entries the Navy did not publish, the
        speech the press conferences talked around. The reading sits
        inside a longer field in which the firmament cosmology, the
        polar opening, and the question of who actually lives on this
        earth are treated as one continuous subject rather than as
        separate eccentricities. Byrd is, for that field, the
        twentieth-century witness whose rank, record, and access
        place his testimony where it cannot be dismissed as fringe.
      </P>

      <H2>Audit lens</H2>

      <P>
        K-OS III sits, humbly, on the user-facing side of a much
        larger transition: a generation of researchers, witnesses,
        and ordinary readers has begun to recover a cosmology the
        official record was not built to carry. Byrd&apos;s file
        belongs to that recovery. The Navy archive is what one Navy
        preserved; the diary, the <Em>El Mercurio</Em> warning, the
        early return of Highjump, and the &ldquo;land beyond the
        pole&rdquo; remarks are what the constituency around him has
        kept. The reader who has come this far is asked to read both
        and to keep going &mdash; into the firmament material, into
        the hollow-earth track, into Robert Sepehr and the lineages
        Byrd opens onto.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Byrd, R. E. (1930). <Em>Little America: Aerial Exploration in
          the Antarctic, the Flight to the South Pole</Em>. G. P.
          Putnam&apos;s Sons.
        </Li>
        <Li>
          Byrd, R. E. (1938). <Em>Alone</Em>. G. P. Putnam&apos;s Sons.
          (His four-and-a-half-month solo winter at Advance Base.)
        </Li>
        <Li>
          Rose, L. A. (2008).{" "}
          <Em>Explorer: The Life of Richard E. Byrd</Em>. University of
          Missouri Press. (Principal scholarly biography.)
        </Li>
        <Li>
          U.S. Navy (1947). <Em>Report of Operation Highjump</Em>.
          Task Force 68 after-action materials, National Archives.
        </Li>
        <Li>
          Bernard, R. (1964).{" "}
          <Em>The Hollow Earth</Em>. Fieldcrest. (The principal
          twentieth-century text placing Byrd in the hollow-earth
          tradition.)
        </Li>
        <Li>
          Beekman, D. (1996). <Em>Byrd&apos;s Flight Diary</Em> &mdash;
          the Ohio State Polar Archives release and the subsequent
          navigational reanalysis by G. Liljequist (1960) and W.
          Molett (2001).
        </Li>
      </UList>
    </>
  );
}

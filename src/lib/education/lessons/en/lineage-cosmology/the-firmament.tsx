import { Lead, P, H2, UList, Li, Em, Aside } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function TheFirmament() {
  return (
    <>
      <Lead>
        Genesis 1:6-8 says God placed a <Em>solid vault</Em> between
        the waters above and the waters below, and the oldest readers
        of the text — Hebrew, Greek, Latin, patristic, medieval — took
        the picture literally: a hammered dome overhead, lights set
        <Em> in</Em> it, an ocean stored above it, the earth a
        habitable interior beneath. The modern reader meets this
        cosmology and assumes primitive error. The tradition does not
        agree, and a live cosmographic revival running from Rob Skiba
        and the 2017 Flat Earth International Conference forward has
        put the question back on the table. This entry takes the
        enclosed cosmos on its own ground.
      </Lead>

      <H2>The word</H2>

      <Diagram
        cols={3}
        rows={5}
        nodes={[
          { id: "above", text: "WATERS ABOVE", col: 0, row: 0, span: 3, sub: "stored chambers (Gen 1:7)" },
          { id: "raqia", text: "FIRMAMENT (raqia)", col: 0, row: 1, span: 3, accent: true, sub: "hammered vault — stereoma / firmamentum" },
          { id: "lights", text: "SUN · MOON · STARS", col: 0, row: 2, span: 3, sub: "set IN the firmament (Gen 1:14-17)" },
          { id: "earth", text: "EARTH", col: 0, row: 3, span: 3, sub: "habitable interior" },
          { id: "below", text: "WATERS BELOW", col: 0, row: 4, span: 3, sub: "the deep (Gen 1:7)" },
        ]}
        edges={[
          { from: "above", to: "raqia" },
          { from: "raqia", to: "lights", accent: true },
          { from: "lights", to: "earth" },
          { from: "earth", to: "below" },
        ]}
        caption="ENCLOSED COSMOS — VERTICAL LAYERS OF GENESIS 1."
      />

      <P>
        The Hebrew of Genesis 1:6-8 is <Em>r&#257;q&#238;a&apos;</Em>, from the
        root <Em>r-q-&apos;</Em> meaning to beat out, to hammer, to
        spread thin as a sheet of metal. The same root governs Exodus
        39:3 (gold beaten into thin plates) and Isaiah 40:19 (a smith
        hammering an idol). The Septuagint (c. 250 BC) renders it{" "}
        <Em>stere&#333;ma</Em>, a solid structure. Jerome&apos;s Vulgate
        (c. 405 AD) renders it <Em>firmamentum</Em>, the firm thing,
        from which English takes the word. Genesis 1:14-17 sets the
        sun, the moon, and the stars <Em>in</Em> the firmament — not
        beyond it. Genesis 1:7 divides the waters into those above
        and those below. Genesis 7:11 describes the Flood as the
        opening of the &ldquo;windows of heaven&rdquo; through which
        the waters above re-entered the world. In every layer of the
        textual tradition the image is of a firm thing, not a diffuse
        atmosphere.
      </P>

      <H2>The witnesses</H2>

      <P>
        The Book of Enoch — preserved canonically in the Ethiopian
        Orthodox Church and cited directly in Jude 1:14-15 —
        describes in chapters 17 through 36 a guided journey through
        the cosmos: gates in the firmament through which sun, moon,
        and winds enter and depart; the chambers where the waters
        above are stored; the ends of the earth where the pillars of
        heaven meet the pillars of the deep. Saint Basil of Caesarea,
        in the <Em>Hexaemeron</Em> (c. 370 AD, homilies 1–3), exposits
        Genesis 1 with the firmament as structurally real. Saint John
        Chrysostom, in his <Em>Homilies on Genesis</Em> (c. 386 AD),
        treats the upper waters as physically present and theologically
        necessary. Saint Augustine, in <Em>De Genesi ad Litteram</Em>{" "}
        (c. 415 AD), defends the upper waters at length against the
        natural philosophers of his own day. Cosmas Indicopleustes, in
        the <Em>Christian Topography</Em> (c. 547 AD), drew diagrams of
        the enclosed cosmos as a vaulted tabernacle after the pattern
        of Moses&apos; tent — heavens a curtain, earth a rectangle
        beneath.
      </P>

      <P>
        These are not outlier eccentricities. They are the working
        cosmology of the Christian East for more than a millennium,
        and portions of it are preserved verbatim in Orthodox
        liturgical practice today. The Great Blessing of the Waters
        at Theophany addresses the Lord{" "}
        <Em>&ldquo;who hath established the earth upon the
        waters&rdquo;</Em>. The fixed prayers of the Sixth Hour
        invoke <Em>&ldquo;the King of Ages, who hast clothed the
        heavens with clouds and encompassed the sea with sand.&rdquo;</Em>{" "}
        The language is the language of an enclosed, layered,
        habitable cosmos whose upper vault was the concern of the
        priesthood before it was the concern of astronomy.
      </P>

      <H2>The modern revival</H2>

      <P>
        The cosmographic question reopened in earnest in the 2010s.
        Rob Skiba&apos;s lecture series <Em>Testing the Globe</Em>{" "}
        (2015–2017) read the firmament texts beside the Mount Hermon
        material in 1 Enoch 6–11 and argued that the enclosed cosmos
        and the Watcher narrative belong to a single inherited
        cosmology. The Flat Earth International Conference held in
        Raleigh, North Carolina on 9–10 November 2017, and its sequel
        in Denver in November 2018, drew several hundred attendees
        each and produced a substantial recorded archive of lectures.
        Eric Dubay&apos;s <Em>The Flat-Earth Conspiracy</Em> (2014)
        argued the case in a more polemical register. The movement is
        not theologically uniform and the reader interested in the
        sacred cosmology will find the conference archive uneven, but
        the recovery of the enclosed-cosmos reading as a live
        question — rather than a settled embarrassment — dates from
        this period.
      </P>

      <H2>What is being said, and what is not</H2>

      <P>
        The sympathetic reading does not require the modern reader to
        adjudicate every observational claim. It can take a quieter
        and more interesting line: that two descriptions of the
        cosmos are in play in the tradition — the measured and the
        sacred — and that the tradition&apos;s own instinct, over
        many centuries, was to treat the sacred as the more
        fundamental of the two. The firmament cosmology is a claim
        about what the world is <Em>for</Em>, and what the
        reader&apos;s own orientation ought to be within it. The
        upper vault in this reading is a threshold — the dwelling
        place of the cherubic orders, the ceiling of the created
        order and the floor of the uncreated. To walk in a cosmos so
        constituted is to stand inside a structure that was intended,
        shaped, and ceilinged, rather than to stand on a rock
        hurtling through empty dark.
      </P>

      <Aside title="A note on the modern movement">
        Much of the popular flat-earth discussion online is arguing
        with a different opponent about a different thing. The
        reader interested in the sacred cosmology is encouraged to
        go through the primary sources below — Enoch, Basil,
        Chrysostom, Augustine, Cosmas — before the YouTube
        ecosystem. The firmament is older than the argument.
      </Aside>

      <H2>Audit lens</H2>

      <P>
        The audit a reader can perform is the audit the tradition
        itself has always recommended: take the text, read it in the
        languages it was written in, and weigh what the people who
        prayed inside that cosmos for two thousand years were
        actually saying. The Hebrew is hammered metal. The Greek is
        a solid structure. The Latin is the firm thing. The
        patristic exposition is unanimous on the structural point
        and varied only on the metaphysical one. The Orthodox
        liturgy still sings the cosmos that way each week. The
        Copernican turn did not refute that cosmology so much as
        change the subject; the older subject is still there,
        waiting for the reader who wants to go back to it.
      </P>

      <P>
        The lineage track that follows takes the enclosed cosmos as
        its starting point and reads outward from there into the
        broader contested geography: <Em>Atlantis</Em> as a
        pre-Flood civilisation referenced by Plato and reread by the
        nineteenth-century antiquarians; <Em>Hyperborea</Em> as the
        northern polar homeland in the Greek and later Theosophical
        sources; the <Em>hollow-earth</Em> traditions from Edmond
        Halley&apos;s 1692 paper to the twentieth-century revivals;
        and the broader <Em>lost history of the earth</Em> that the
        older cosmology was always presuming as its background. The
        firmament is the ceiling of that house. The next entries
        walk its rooms.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          <Em>The Book of Enoch</Em>, especially chapters 6–11 (the
          Watchers and Mount Hermon) and 17–36 (the cosmographic
          journey). English translation by R. H. Charles (1917),
          still standard.
        </Li>
        <Li>
          Saint Basil of Caesarea, <Em>Hexaemeron</Em> (c. 370 AD).
          Translated in the Nicene and Post-Nicene Fathers, series II,
          vol. 8.
        </Li>
        <Li>
          Saint John Chrysostom, <Em>Homilies on Genesis 1–17</Em>{" "}
          (c. 386 AD). Fathers of the Church, vol. 74.
        </Li>
        <Li>
          Saint Augustine, <Em>De Genesi ad Litteram</Em> (c. 415 AD),
          Books I–II on the firmament and the upper waters.
        </Li>
        <Li>
          Cosmas Indicopleustes,{" "}
          <Em>Christian Topography</Em> (c. 547 AD). Translated by
          J. W. McCrindle (1897).
        </Li>
        <Li>
          Seely, P. H. (1991).{" "}
          <Em>The Firmament and the Water Above</Em>. Westminster
          Theological Journal 53:227–240. (Philological treatment of{" "}
          <Em>r&#257;q&#238;a&apos;</Em>.)
        </Li>
        <Li>
          Cassuto, U. (1961).{" "}
          <Em>A Commentary on the Book of Genesis</Em>, vol. 1. Magnes.
        </Li>
        <Li>
          Louth, A. (2007).{" "}
          <Em>Greek East and Latin West: The Church, AD 681–1071</Em>.
          St Vladimir&apos;s. (For the continuity of the Orthodox
          liturgical imagination.)
        </Li>
        <Li>
          Skiba, R. (2015–2017). <Em>Testing the Globe</Em> lecture
          series. Self-published video archive.
        </Li>
        <Li>
          Dubay, E. (2014). <Em>The Flat-Earth Conspiracy</Em>.
          Lulu / self-published.
        </Li>
        <Li>
          Flat Earth International Conference, Raleigh, NC, 9–10
          November 2017. Recorded lecture archive.
        </Li>
      </UList>
    </>
  );
}

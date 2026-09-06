import { Lead, P, H2, UList, Li, Em, Aside } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function RobertSepehr() {
  return (
    <>
      <Lead>
        Robert Sepehr is the most-watched living popular anthropologist
        on the lost-history beat, and he got there by reopening, in
        plain sight, the source tradition the academic discipline
        quietly closed after 1945: the polar-origin hypothesis, the
        theosophical root-race cosmology, the literal Platonic
        Atlantis, the polygenist readings of human descent, and the
        archaeological anomalies that do not sit cleanly on the
        Out-of-Africa timeline. The work is published through his own
        imprint and through the YouTube channel{" "}
        <Em>Atlantean Gardens</Em>, running continuously since 2013.
        The corpus is substantial. The source tradition is older than
        he is, and he treats it as still live.
      </Lead>

      <H2>The work</H2>

      <P>
        Sepehr&apos;s principal volumes — <Em>Species with Amnesia: Our
        Forgotten History</Em> (2015), <Em>1666: Redemption Through
        Sin</Em> (2015), <Em>Gods with Amnesia</Em> (2017),{" "}
        <Em>Atlantis and the Garden of Eden</Em> (2017), and{" "}
        <Em>Death of the Cosmic Serpent</Em> (2020), among more than a
        dozen others — share a single working thesis: that humanity in
        its present form is the descendant of prior advanced
        civilisations whose collapse has been systematically forgotten,
        and that the memory of this earlier inheritance is preserved
        cryptically in the world&apos;s scriptural and mythological
        corpora. The <Em>Atlantean Gardens</Em> channel presents the
        material in short-form lectures of six to twelve minutes and
        has accumulated an audience considerably larger than the print
        readership of the academic anthropology from which he dissents.
      </P>

      <H2>The lineage he draws from</H2>

      <P>
        The intellectual ancestry is clear and worth naming. Helena
        Blavatsky&apos;s <Em>The Secret Doctrine</Em> (1888) supplied
        the root-race cosmology and the Atlantean and Lemurian
        chronology. Bal Gangadhar Tilak&apos;s{" "}
        <Em>The Arctic Home in the Vedas</Em> (1903) supplied the
        polar-origin thesis from the linguistic-textual side. Herman
        Wirth&apos;s <Em>Der Aufgang der Menschheit</Em> (1928) and
        Jürgen Spanuth&apos;s <Em>Das enträtselte Atlantis</Em> (1953)
        supplied the North-Atlantic relocations of the Atlantean
        narrative. Edgar Cayce&apos;s readings supplied the
        mid-twentieth-century American inflection. Sepehr&apos;s
        polygenist sympathies — the position that the present human
        groups are the issue of separate ancestral lines rather than
        of a single recent African origin — sit inside this tradition
        and against the post-1945 monogenist consensus.
      </P>

      <Diagram
        cols={7}
        rows={3}
        nodes={[
          { id: "blav", text: "Blavatsky", col: 0, row: 0, sub: "Secret Doctrine 1888" },
          { id: "tilak", text: "Tilak", col: 1, row: 0, sub: "Arctic Home 1903" },
          { id: "wirth", text: "Wirth", col: 2, row: 0, sub: "Aufgang 1928" },
          { id: "span", text: "Spanuth", col: 0, row: 2, sub: "Atlantis 1953" },
          { id: "cayce", text: "Cayce", col: 1, row: 2, sub: "Readings mid-20c" },
          { id: "poly", text: "Polygenist tradition", col: 2, row: 2, sub: "pre-1945" },
          { id: "seph", text: "SEPEHR", col: 4, row: 1, accent: true, sub: "Atlantean Gardens 2013-" },
          { id: "aud", text: "Modern audience", col: 6, row: 1, sub: "YouTube + print" },
        ]}
        edges={[
          { from: "blav", to: "seph" },
          { from: "tilak", to: "seph" },
          { from: "wirth", to: "seph" },
          { from: "span", to: "seph" },
          { from: "cayce", to: "seph" },
          { from: "poly", to: "seph" },
          { from: "seph", to: "aud", accent: true, label: "re-presents" },
        ]}
        caption="INTELLECTUAL LINEAGE — SOURCE TRADITION CONVERGING INTO A LIVING POPULARISER."
      />

      <Aside title="A reader&apos;s orientation">
        The polar-origin hypothesis, the theosophical root-races, and
        the polygenist reading are separable threads, and the reader
        who wishes to follow the tradition carefully will want to do
        so with the source bibliography open rather than through the
        YouTube format alone, where compression obliges reliance on the
        author&apos;s selection.
      </Aside>

      <H2>Audit lens</H2>

      <P>
        Sepehr&apos;s corpus is a contemporary re-presentation, in
        accessible form, of an esoteric-anthropological synthesis the
        institutional academy stopped treating as a live option. It
        does not pretend to peer review and should not be read as if
        it did. It should be read as what it is: a working archive of
        the non-standard sources, kept alive and distributed to a wide
        audience by a single author whose editorial choices are his
        own. The reader is the evaluator. The primary literature below
        is where that evaluation usefully begins — and from here the
        natural next step on this track is the cosmology itself:
        Atlantis, Hyperborea, the hollow-earth tradition, and the lost
        history of the earth that Sepehr&apos;s sources were trying to
        recover.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Sepehr, R. (2015). <Em>Species with Amnesia: Our Forgotten
          History</Em>. Atlantean Gardens.
        </Li>
        <Li>
          Sepehr, R. (2017). <Em>Gods with Amnesia: Subterranean
          Worlds of Inner Earth</Em>. Atlantean Gardens.
        </Li>
        <Li>
          Blavatsky, H. P. (1888). <Em>The Secret Doctrine</Em>, 2 vols.
        </Li>
        <Li>
          Tilak, B. G. (1903). <Em>The Arctic Home in the Vedas</Em>.
          Tilak Bros.
        </Li>
        <Li>
          Spanuth, J. (1953). <Em>Das enträtselte Atlantis</Em>; English:{" "}
          <Em>Atlantis of the North</Em> (1979). Van Nostrand.
        </Li>
        <Li>
          Goodrick-Clarke, N. (1985).{" "}
          <Em>The Occult Roots of Nazism: Secret Aryan Cults and Their
          Influence on Nazi Ideology</Em>. I. B. Tauris. (For the
          ariosophical branch of the tradition, and why it diverges
          from the theosophical and perennial readings.)
        </Li>
        <Li>
          Atlantean Gardens — the author&apos;s YouTube channel and
          publishing imprint.
        </Li>
      </UList>
    </>
  );
}

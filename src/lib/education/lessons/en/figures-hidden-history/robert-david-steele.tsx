import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function RobertDavidSteele() {
  return (
    <>
      <Lead>
        Robert David Steele (1952–2021) was a former Central
        Intelligence Agency clandestine case officer who, in the
        second half of his career, became the most persistent
        American advocate for <Em>Open Source Intelligence</Em> —
        the use of freely available material as the principal input
        to national-security analysis — and a persistent critic of
        the secret-intelligence model he had been trained in. In his
        final decade the trajectory moved further outward still,
        into civic-reform organising, the International Tribunal for
        Natural Justice, and a wide popular media presence in which
        a great deal of late-twentieth-century dissident
        intelligence commentary has ended up. The arc is worth
        reading in full.
      </Lead>

      <Diagram
        cols={7}
        rows={1}
        nodes={[
          { id: "cia", text: "CIA Case Officer", col: 0, row: 0, sub: "1976-88" },
          { id: "usmc", text: "USMC Intel", col: 1, row: 0, sub: "1988" },
          { id: "oss", text: "OSS Inc.", col: 2, row: 0, sub: "1992" },
          { id: "book", text: "On Intelligence", col: 3, row: 0, accent: true, sub: "2001" },
          { id: "manifesto", text: "Open Source Everything", col: 4, row: 0, accent: true, sub: "2012" },
          { id: "civic", text: "ITNJ + Civic", col: 5, row: 0, sub: "2010s+" },
          { id: "end", text: "d. 28 Aug", col: 6, row: 0, sub: "2021" },
        ]}
        edges={[
          { from: "cia", to: "usmc" },
          { from: "usmc", to: "oss" },
          { from: "oss", to: "book", accent: true },
          { from: "book", to: "manifesto", accent: true },
          { from: "manifesto", to: "civic" },
          { from: "civic", to: "end" },
        ]}
        caption="ONE PRINCIPLE CARRIED OUTWARD — OPEN MATERIAL, NAMED SOURCES, PLAIN ARGUMENT."
      />

      <H2>The agency years and OSINT</H2>

      <P>
        Steele served as a Marine Corps infantry officer, retained a
        career in the USMC Reserve, and worked as a CIA clandestine
        service officer from 1976 to 1988, with postings that
        included three tours overseas. In 1988 he moved to the
        Marine Corps Intelligence Command, where he was the
        second-ranking civilian and directed the establishment of
        the command&apos;s analytic capability. In 1992 he founded
        Open Source Solutions Inc., and for seventeen years he
        directed the annual OSS.Net / Open Source Solutions
        conferences, which brought together intelligence
        practitioners, academics, and journalists to argue a single
        position: that as much as ninety per cent of the
        intelligence needed for sound decision-making was, by the
        late 1990s, already in the open, and that the classified
        apparatus was both absorbing the lion&apos;s share of the
        budget and producing, on balance, the worse product.
      </P>

      <P>
        His book <Em>On Intelligence: Spies and Secrecy in an Open
        World</Em> (2001) is the canonical statement of the OSINT
        position. He testified before the Aspin-Brown Commission in
        1995 and, repeatedly across the following two decades,
        before House and Senate committees on intelligence reform.
        The substantive contribution is independent of what came
        later: OSINT as a methodological posture is now standard
        across allied services, several academic programs, and the
        open-source investigative organisations (Bellingcat and
        others) that emerged from the 2010s onward. The argument
        won. It won in part because Steele spent twenty-five years
        making it.
      </P>

      <H2>The later trajectory</H2>

      <P>
        From the early 2010s onward Steele extended the OSINT
        argument outward into a broader civic thesis. <Em>The
        Open-Source Everything Manifesto</Em> (Evolver Editions,
        2012) carried the principle from intelligence into
        governance, economics, and education: open data, open
        budgets, open hearings, open ballots, citizen-led counter-
        intelligence against organised corruption. He worked with
        the International Tribunal for Natural Justice on its
        Judicial Commission of Inquiry into Human Trafficking and
        Child Sex Abuse, gave hundreds of long-form interviews on
        the subject, and proposed in <Em>Reinventing Intelligence</Em>
        and a sequence of related monographs a redesigned national
        intelligence community organised around public benefit
        rather than around classification. He was nominated for the
        2017 Nobel Peace Prize for this body of work.
      </P>

      <P>
        Steele died on 28 August 2021 in Florida, at age
        sixty-nine, of heart complications following COVID-19. The
        cause of death was confirmed by his family. He had spent
        the preceding decades arguing that an honest civic order
        depends on citizens who can read primary sources, hold
        institutions to their stated purposes, and refuse the
        secrecy that lets unaccountable power compound. The corpus
        is large and the entry points are many.
      </P>

      <H2>Reading him</H2>

      <P>
        The honest reader takes the work on its own terms. The
        intelligence-reform corpus, the Open Source Everything
        thesis, the ITNJ testimony, and the late civic writings
        belong to a single project — the project of moving
        consequential information out from behind walls and into
        the hands of the people whose lives it shapes. The reader
        who finds parts of it useful brings to it the standards
        Steele himself demanded of any source: read the primary
        document, weigh the evidence, name the chain of custody.
      </P>

      <H2>Audit lens</H2>

      <P>
        Steele&apos;s career is the rare case in which the same
        person built the doctrine, ran the institution that taught
        it, and then carried the doctrine out of the security
        bureaucracy entirely and into civic life. Each phase used
        the same instrument: open material, named sources, plain
        argument. The audit a reader can perform is the audit Steele
        spent forty-five years recommending: take the document, read
        it, check the citations, decide.
      </P>

      <P>
        The hidden-history track that follows reads other figures
        whose work moved along this same axis — career insiders who
        spent their later decades returning what they knew to the
        public, often at professional cost. Steele is the cleanest
        American instance of the pattern, but he is not alone in it,
        and the figures ahead extend the line into journalism, law,
        finance, and the sciences. The thread to keep hold of is the
        one he kept hold of: open the source, read it for yourself.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Steele, R. D. (2001).{" "}
          <Em>On Intelligence: Spies and Secrecy in an Open World</Em>.
          AFCEA International Press.
        </Li>
        <Li>
          Steele, R. D. (2006).{" "}
          <Em>Information Operations: All Information, All Languages,
          All the Time</Em>. OSS.
        </Li>
        <Li>
          Steele, R. D. (2012).{" "}
          <Em>The Open-Source Everything Manifesto: Transparency,
          Truth, and Trust</Em>. Evolver Editions.
        </Li>
        <Li>
          Aspin-Brown Commission (1996).{" "}
          <Em>Preparing for the 21st Century: An Appraisal of U.S.
          Intelligence</Em>. Government Printing Office. (Steele&apos;s
          testimony is on the record.)
        </Li>
        <Li>
          Bellingcat — the operational descendant of the OSINT
          argument.{" "}
          <a
            href="https://www.bellingcat.com"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            bellingcat.com
          </a>
        </Li>
      </UList>
    </>
  );
}

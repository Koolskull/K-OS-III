import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function JohnMcAfee() {
  return (
    <>
      <Lead>
        John David McAfee (1945–2021) founded the antivirus company
        whose name became a noun, walked away from it in 1994 with
        roughly a hundred million dollars, fled Belize one step
        ahead of a murder inquiry, ran twice for President of the
        United States on the Libertarian ticket, became one of the
        loudest American promoters of cryptocurrency, and was found
        hanged in a Spanish prison cell on 23 June 2021 — hours
        after a court authorised his extradition to the United
        States. The Spanish autopsy ruled suicide. His family,
        and his own years of public statements, contest the finding.
        This entry treats the tabloid register and the technical one
        as a single record.
      </Lead>

      <H2>The antivirus years</H2>

      <P>
        Born in Cinderford, Gloucestershire and raised in Virginia,
        McAfee studied mathematics at Roanoke College and worked
        through the 1970s and 1980s as a programmer at NASA&apos;s
        Institute for Space Studies, Univac, Xerox, Computer
        Sciences Corporation, and Lockheed. He founded McAfee
        Associates in 1987 around VirusScan, the first commercial
        antivirus product to reach significant distribution. The
        company went public in 1992. McAfee left in 1994 and had no
        further operational role in the business that bore his name;
        Intel acquired it in 2011 for approximately $7.68 billion.
      </P>

      <H2>Belize</H2>

      <P>
        From 2008 to 2012 McAfee lived in Orange Walk District,
        Belize, conducting what he described as research into
        plant-derived antibiotics through a company called QuorumEx.
        On 11 November 2012 his American neighbour Gregory Faull was
        found shot dead in a property adjoining McAfee&apos;s.
        Belizean authorities sought him for questioning, not arrest.
        He fled across the Guatemalan border with <Em>Vice</Em>{" "}
        journalists Rocco Castoro and Robert King, whose inadvertent
        publication of a geotagged iPhone photograph placed him at a
        Guatemalan guesthouse. Guatemala detained him on immigration
        grounds and deported him to the United States. No charges
        were ever filed against him in Faull&apos;s death. The Faull
        estate won a $25 million wrongful-death default judgement in
        Florida in 2019, which McAfee did not contest.
      </P>

      <H2>The crypto period</H2>

      <P>
        Between roughly 2016 and 2020 McAfee became one of the most
        visible American promoters of cryptocurrency — initially of
        Bitcoin, then of a long sequence of altcoins and initial
        coin offerings he pushed from his Twitter account. He ran
        for the Libertarian Party&apos;s presidential nomination in
        2016 and again in 2020, losing both primaries. He issued the
        infamous bet that he would eat his own genitals on television
        if Bitcoin had not reached one million dollars per coin by
        the end of 2020. In 2020 he was indicted in two federal
        cases in the Southern District of New York — one for five
        years of unfiled income tax returns, the other for a $13
        million &ldquo;pump-and-dump&rdquo; scheme conducted through
        his public channel for fees the DOJ characterised as
        undisclosed. He was arrested at Barcelona–El Prat Airport on
        3 October 2020 attempting to board a flight to Turkey.
      </P>

      <H2>The cell</H2>

      <Diagram
        cols={7}
        rows={1}
        nodes={[
          { id: "found", text: "Founds McAfee Associates", col: 0, row: 0, sub: "1987" },
          { id: "leave", text: "Leaves company", col: 1, row: 0, sub: "1994" },
          { id: "belize", text: "Belize / QuorumEx", col: 2, row: 0, sub: "2008-2012" },
          { id: "faull", text: "Faull death + flight", col: 3, row: 0, sub: "Nov 2012" },
          { id: "lp", text: "Libertarian runs", col: 4, row: 0, sub: "2016 / 2020" },
          { id: "bcn", text: "Barcelona arrest", col: 5, row: 0, sub: "3 Oct 2020" },
          { id: "cell", text: "Found hanged in cell", col: 6, row: 0, accent: true, sub: "23 Jun 2021" },
        ]}
        edges={[
          { from: "found", to: "leave" },
          { from: "leave", to: "belize" },
          { from: "belize", to: "faull" },
          { from: "faull", to: "lp" },
          { from: "lp", to: "bcn" },
          { from: "bcn", to: "cell", accent: true, label: "extradition approved" },
        ]}
        caption="MCAFEE TIMELINE — 1987 TO 23 JUNE 2021."
      />

      <P>
        McAfee spent eight months in the Brians 2 penitentiary
        outside Barcelona. On 23 June 2021 the Spanish Audiencia
        Nacional published its ruling approving his extradition to
        the United States at approximately 2 p.m. local time. At
        approximately 6 p.m. prison staff found him hanged in his
        cell. The autopsy that week ruled suicide.
      </P>

      <P>
        For years prior, McAfee had stated publicly and repeatedly —
        in television interviews, on Twitter, and in a 2019 tweet
        that circulated as a tattoo photograph — that if he were
        ever found hanged or otherwise apparently self-killed, the
        appearance should not be trusted, and that he was not in the
        class of persons who take their own lives. His wife Janice
        has maintained this position publicly since his death. The
        Spanish court records, the autopsy, and the timing of the
        extradition ruling are in the public record. The inference
        the reader draws from that record is the reader&apos;s.
      </P>

      <H2>Audit lens</H2>

      <P>
        The available record comprises: Spanish court filings on the
        extradition ruling and the cell-death investigation; SDNY
        indictment documents; the Faull wrongful-death default
        judgement; McAfee&apos;s own published and broadcast
        statements across two decades; and the independent reporting
        (<Em>Wired</Em>, <Em>Vice</Em>, Showtime&apos;s{" "}
        <Em>Gringo</Em>, Netflix&apos;s <Em>Running with the Devil</Em>)
        that accumulated around each phase. The reader who wants a
        verdict on the cell death will not find one in the documents.
        The reader who wants to understand what a twenty-first-century
        life under persistent U.S. government scrutiny looks like
        from inside the subject&apos;s head will find McAfee
        unusually well-documented on that question. He was a talker.
        The transcripts are his.
      </P>

      <H2>Onward</H2>

      <P>
        McAfee is the loud terminus of one privacy-figure archetype:
        the rogue insider who turns his own life into the message
        and pays for it in a foreign cell. The next entry in this
        track, Kim Dotcom, is a different archetype on the same
        spectrum — the foreign national whose platform became a U.S.
        Department of Justice target, who watched a New Zealand
        helicopter raid hit his house in 2012, and whose extradition
        fight has now run longer than McAfee was alive after Belize.
        Read McAfee, then read Dotcom, and the shape of the pattern
        the figures track is trying to describe begins to surface.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          McAfee, J. (2020). Interview with Alex Jones, InfoWars.{" "}
          <a
            href="https://www.youtube.com/watch?v=lWkjYyB6jXQ"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            youtube.com/watch?v=lWkjYyB6jXQ
          </a>
        </Li>
        <Li>
          McAfee, J. Televised interview, long-form.{" "}
          <a
            href="https://www.youtube.com/watch?v=KGh8UV8TDqc"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            youtube.com/watch?v=KGh8UV8TDqc
          </a>
        </Li>
        <Li>
          McAfee, J. Interview, primary-source footage.{" "}
          <a
            href="https://youtu.be/G5S0bK8mqAM"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            youtu.be/G5S0bK8mqAM
          </a>
        </Li>
        <Li>
          U.S. Department of Justice (2020). Indictments, S.D.N.Y.
          (Tax and ICO-fraud cases against McAfee.)
        </Li>
        <Li>
          Audiencia Nacional of Spain (2021). Extradition ruling,
          23 June 2021. Case file public.
        </Li>
        <Li>
          Perlroth, N. (2013).{" "}
          <Em>The Strange Case of John McAfee</Em>. <Em>The New York
          Times</Em>, 4 January 2013.
        </Li>
        <Li>
          <Em>Gringo: The Dangerous Life of John McAfee</Em> (2016).
          Showtime documentary, dir. Nanette Burstein.
        </Li>
        <Li>
          <Em>Running with the Devil: The Wild World of John
          McAfee</Em> (2022). Netflix documentary, dir. Charlie Russell.
        </Li>
      </UList>
    </>
  );
}

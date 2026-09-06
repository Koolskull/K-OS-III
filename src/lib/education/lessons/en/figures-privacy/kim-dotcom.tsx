import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function KimDotcom() {
  return (
    <>
      <Lead>
        On the morning of 20 January 2012, two helicopters landed
        on the lawn of a mansion north of Auckland and seventy-six
        armed New Zealand officers entered the house to arrest a
        German-Finnish file-sharing entrepreneur on behalf of the
        United States. Kim Dotcom — born Kim Schmitz in Kiel, West
        Germany, on 21 January 1974 — has spent the fourteen years
        since that morning fighting an extradition request that
        has, at the time of this entry, no clear end date. The case
        is the working demonstration of what it looks like when one
        state prosecutes a foreign national, operating a foreign
        service under foreign law, on copyright-conspiracy charges,
        and persuades a small allied state to carry the arrest.
      </Lead>

      <H2>Megaupload</H2>

      <P>
        Megaupload was founded in Hong Kong in 2005 and grew within
        six years into one of the most trafficked sites on the
        public Internet. By the U.S. government&apos;s own
        indictment figures it accounted for roughly four per cent
        of global Internet traffic and had around 150 million
        registered users at its peak. The service operated under
        the safe-harbour provisions of the U.S. Digital Millennium
        Copyright Act: it accepted takedown notices, maintained a
        repeat-infringer policy, and answered rights-holder
        complaints through the prescribed channels. Whether that
        compliance was good-faith or performative is the central
        factual question of the prosecution that followed.
      </P>

      <H2>The raid</H2>

      <P>
        The raid fell on Dotcom&apos;s wife&apos;s birthday. Acting
        on an FBI request, New Zealand&apos;s Special Tactics Group
        landed two helicopters at the Coatesville mansion and
        located Dotcom inside a safe room. The indictment unsealed
        the same day in the Eastern District of Virginia charged
        him and six co-defendants with racketeering, conspiracy to
        commit copyright infringement, conspiracy to commit money
        laundering, and two counts of criminal copyright
        infringement. Roughly $67 million in assets were seized
        across New Zealand, Hong Kong, and the Netherlands.
        Megaupload and its associated user data were taken offline
        and have never been restored.
      </P>

      <H2>Twelve years of extradition</H2>

      <P>
        The New Zealand High Court found Dotcom eligible for
        extradition in 2017. The Court of Appeal upheld the ruling
        in 2018 and the Supreme Court of New Zealand upheld it
        again in 2020. On 15 August 2024 the Minister of Justice,
        Paul Goldsmith, signed the surrender order to the United
        States; further judicial review remained available under
        New Zealand law and Dotcom had not been physically
        transferred. The case has already outlasted the
        presidencies of Barack Obama, Donald Trump, and Joseph
        Biden.
      </P>

      <Diagram
        cols={7}
        rows={1}
        nodes={[
          { id: "found", text: "Megaupload founded", col: 0, row: 0, sub: "Hong Kong, 2005" },
          { id: "raid", text: "NZ raid", col: 1, row: 0, sub: "20 Jan 2012" },
          { id: "hc", text: "High Court eligible", col: 2, row: 0, sub: "NZ, 2017" },
          { id: "coa", text: "Court of Appeal upholds", col: 3, row: 0, sub: "NZ, 2018" },
          { id: "sc", text: "Supreme Court upholds", col: 4, row: 0, sub: "NZ, 2020" },
          { id: "order", text: "Surrender order signed", col: 5, row: 0, accent: true, sub: "15 Aug 2024" },
          { id: "appeals", text: "Ongoing appeals", col: 6, row: 0, sub: "no transfer" },
        ]}
        edges={[
          { from: "found", to: "raid" },
          { from: "raid", to: "hc" },
          { from: "hc", to: "coa" },
          { from: "coa", to: "sc" },
          { from: "sc", to: "order", accent: true },
          { from: "order", to: "appeals", dashed: true },
        ]}
        caption="DOTCOM EXTRADITION TIMELINE — 2005 TO PRESENT, NO PHYSICAL TRANSFER."
      />

      <P>
        Parallel to the extradition proceeding, New Zealand courts
        found that the initial raid exceeded the terms of its
        warrant, that the Government Communications Security Bureau
        had illegally surveilled Dotcom — a New Zealand resident —
        in its assistance to the FBI, and that Prime Minister John
        Key owed a public apology, which was given. Neither
        finding closed the extradition.
      </P>

      <H2>Mega, and the later work</H2>

      <P>
        In 2013, while on bail, Dotcom founded Mega: an end-to-end
        encrypted cloud-storage service engineered so that the
        operator itself cannot read user files, with keys generated
        and held client-side. Mega remains operational and has been
        independent of Dotcom since 2015. The years that followed
        included the New Zealand Internet Party (2014) and the
        allied Internet–Mana bloc; the September 2014 &ldquo;Moment
        of Truth&rdquo; event in Auckland, at which he appeared
        with Glenn Greenwald and, by video, Edward Snowden and
        Julian Assange to present documents on Five Eyes operations
        in New Zealand; subsequent crypto and media ventures
        (Bitcache, K.im); a public weight-loss arc; and a sustained
        public advocacy of bitcoin as the asset and the network
        most likely to outlast the legal regime he is being
        prosecuted under.
      </P>

      <H2>Audit lens</H2>

      <P>
        The Dotcom case is unusually well-documented because it has
        been in open court for more than a decade across three
        jurisdictions. The U.S. indictment, the New Zealand
        judgments at every level, the surveillance-illegality
        findings, the warrant-defect findings, the minister&apos;s
        surrender order, and Dotcom&apos;s own continuously updated
        public statements are all available. The reader who reads
        them in sequence finds that the factual questions — whether
        Megaupload met the DMCA, whether the raid was lawful,
        whether the surveillance was lawful — have been answered
        differently by different courts, and that the extradition
        has proceeded regardless of the answers. That pattern —
        extradition as a separate object from the factual record —
        is the one worth watching. The figures in the rest of this
        track (Assange, Snowden, Ulbricht, the cypherpunk lineage
        that built the tools they all relied on) are best read as
        further data points on the same pattern, not as separate
        cases.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          U.S. v. Dotcom et al., indictment, E.D. Va., unsealed 20
          January 2012.
        </Li>
        <Li>
          <Em>Ortmann and Others v. United States</Em>, Supreme
          Court of New Zealand, [2020] NZSC 120.
        </Li>
        <Li>
          <Em>Dotcom v. Attorney-General</Em>, New Zealand High
          Court, on the GCSB illegal-surveillance finding (2012)
          and subsequent apology (2012).
        </Li>
        <Li>
          New Zealand Ministry of Justice (2024). Surrender order,
          15 August 2024.
        </Li>
        <Li>
          Dotcom, K.{" "}
          <a
            href="https://twitter.com/KimDotcom"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            @KimDotcom
          </a>{" "}
          — the subject&apos;s own continuous public statement.
        </Li>
        <Li>
          Mega Limited. <Em>Mega Privacy White Paper</Em>.{" "}
          <a
            href="https://mega.io/security"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            mega.io/security
          </a>
        </Li>
        <Li>
          <Em>Kim Dotcom: Caught in the Web</Em> (2017).
          Documentary, dir. Annie Goldson.
        </Li>
      </UList>
    </>
  );
}

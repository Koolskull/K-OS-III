import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function NickSzabo() {
  return (
    <>
      <Lead>
        Nick Szabo coined the phrase <Em>smart contract</Em> in 1994, fourteen
        years before the chain that would eventually run one. In the
        intervening decade he wrote the canonical essay on the prehistory of
        money, the canonical essay on why trusted third parties are security
        holes, and a proposal called <Em>bit gold</Em> that arranged
        proof-of-work, public registries, and unforgeable digital scarcity
        into the shape Bitcoin would later assume almost without alteration.
        He has been named as a Satoshi candidate more often than any other
        living person, and has consistently declined the attribution.
      </Lead>

      <H2>The work</H2>

      <P>
        Szabo trained as a computer scientist at the University of Washington
        (BS, 1989) and later took a JD at George Washington University Law
        School, where he afterward taught classes on digital contracts and
        property rights in cyberspace. The combination — operating-system
        literacy on one side, common-law contract doctrine on the other —
        is the shape of nearly everything he has published since. He was an
        early member of the cypherpunks list and corresponded with most of
        the figures who matter to this curriculum: David Chaum, Wei Dai,
        Hal Finney, Adam Back, Tim May, Eric Hughes. His long-running blog{" "}
        <Em>Unenumerated</Em>, active from 2005 onward, collects the bulk
        of the public thinking.
      </P>

      <P>
        The 1994 essay <Em>Smart Contracts</Em> introduced the term and the
        thesis: that contractual clauses can be embedded in hardware and
        software in ways that make breach expensive or impossible, and that
        the canonical example is already deployed and uncontroversial — the
        vending machine, which exchanges a coin for a can without a court,
        a clerk, or an appeal. Szabo extended the analysis through a series
        of papers in the late 1990s, most notably <Em>
        Formalizing and Securing Relationships on Public Networks</Em> in
        First Monday (1997), which laid out the four design objectives of
        observability, verifiability, privity, and enforceability that
        later smart-contract platforms would either honour or violate. The
        word travelled. The implementation did not arrive for another
        decade and a half, when Vitalik Buterin&apos;s Ethereum whitepaper
        (2013) borrowed the term and built the first general-purpose
        machine that could host one.
      </P>

      <P>
        <Em>Bit gold</Em> was first proposed in posts on the cypherpunks
        list and on Szabo&apos;s personal site in 1998, and was given its
        most cited written form in the 2005 Unenumerated essay of the same
        name. The construction is recognisable to any reader of the Bitcoin
        whitepaper. A participant solves a computationally costly puzzle
        whose solution is a hash of a recent benchmark string; the solution
        is timestamped, registered in a distributed property title
        registry, and chained to the previous puzzle so that the cost of
        rewriting history grows with every new entry. Szabo did not
        complete a working consensus mechanism — the registry in bit gold
        relies on a Byzantine quorum that he sketched but did not solve at
        scale — but the architectural debt that Bitcoin owes him is, on
        the page, very large. The whitepaper does not cite him by name.
        The cypherpunk readership recognised the lineage immediately.
      </P>

      <Diagram
        cols={7}
        rows={3}
        nodes={[
          { id: "p1994", text: "Smart Contracts", col: 0, row: 0, sub: "1994" },
          { id: "p1997", text: "Formalizing", col: 1, row: 0, span: 2, sub: "1997" },
          { id: "p2001", text: "Trusted 3rd Parties", col: 3, row: 0, sub: "2001" },
          { id: "p2002", text: "Shelling Out", col: 4, row: 0, sub: "2002" },
          { id: "p2005", text: "bit gold", col: 5, row: 0, span: 2, accent: true, sub: "2005" },
          { id: "btc", text: "BITCOIN", col: 1, row: 2, span: 2, accent: true, sub: "2008 — consensus added" },
          { id: "eth", text: "ETHEREUM", col: 4, row: 2, span: 3, accent: true, sub: "2015 — smart-contract platform" },
        ]}
        edges={[
          { from: "p2001", to: "btc", label: "no TTP" },
          { from: "p2002", to: "btc", label: "unforgeable" },
          { from: "p2005", to: "btc", label: "PoW + registry", accent: true },
          { from: "p1994", to: "eth", label: "term", accent: true },
          { from: "p1997", to: "eth", label: "design objectives" },
        ]}
        caption="SZABO'S PUBLISHED WORK — LINEAGE INTO BITCOIN AND ETHEREUM."
      />

      <H2>Shelling Out, and the prehistory of money</H2>

      <P>
        <Em>Shelling Out: The Origins of Money</Em>, published on
        Unenumerated in 2002, is the essay most often handed to readers
        who arrive at Bitcoin from outside computer science. It is an
        anthropological argument: that money did not begin as a
        government-issued unit of account, nor as a neutral medium of
        exchange, but as <Em>collectibles</Em> — durable, scarce,
        unforgeably costly objects (shells, beads, teeth, gold) whose
        value was the accumulated cost of their acquisition. Szabo draws
        on Mary Douglas, on the archaeological record of beadwork in
        Blombos Cave, and on Carl Menger&apos;s 1892 theory of the origin
        of money to argue that proto-money emerged wherever small bands
        needed a way to settle obligations across kinship lines, time,
        and distance. The essay&apos;s point, when read alongside bit
        gold, is that proof-of-work is not a novelty. It is the digital
        return of a property that human beings have used to constitute
        money for at least seventy-five thousand years: <Em>unforgeable
        costliness</Em>.
      </P>

      <P>
        <Em>Trusted Third Parties Are Security Holes</Em> (2001) supplies
        the other half of the conceptual frame. The argument is brief and
        unornamented: any architecture that requires a trusted
        intermediary inherits that intermediary&apos;s failure modes —
        compromise, coercion, capture, bankruptcy — and the security of
        the system reduces to the security of the weakest party with a
        key. The paper is ten pages. Bitcoin&apos;s design problem, as
        the whitepaper states it, is the elimination of the trusted third
        party from electronic cash. The phrasing is Szabo&apos;s.
      </P>

      <H2>The Satoshi question</H2>

      <P>
        Stylometric analyses — most prominently the 2014 Aston University
        study by Jack Grieve and the independent comparisons published on
        LikeInAMirror in 2013 — have repeatedly placed Szabo&apos;s
        writing closer to the Bitcoin whitepaper than that of any other
        named candidate. The circumstantial argument adds the bit gold
        proposal, the explicit problem statement in <Em>Trusted Third
        Parties</Em>, the cypherpunk-list overlap, and a curious silence
        on Unenumerated through the months around Bitcoin&apos;s launch.
        Szabo has denied the attribution in every venue in which it has
        been put to him, including a 2014 email exchange with Dominic
        Frisby and a 2015 <Em>New York Times</Em> profile by Nathaniel
        Popper.
      </P>

      <P>
        The point of this entry is not to adjudicate. It is to record
        that whether or not Szabo wrote the Bitcoin whitepaper, the
        whitepaper sits inside a body of work he had already published
        under his own name. The intellectual debt is independent of the
        identity question, and the curriculum can teach the lineage
        without resolving the pseudonym.
      </P>

      <H2>Audit lens</H2>

      <P>
        The primary sources are short, public, and indexed. <Em>Smart
        Contracts</Em> (1994), <Em>Formalizing and Securing
        Relationships</Em> (1997), <Em>Trusted Third Parties Are Security
        Holes</Em> (2001), <Em>Shelling Out</Em> (2002), and <Em>Bit
        Gold</Em> (2005) together total under a hundred pages. A reader
        who works through them in order has the conceptual scaffolding
        of every digital-scarcity system that has shipped since,
        including the ones whose authors have not read Szabo and have
        rediscovered his conclusions the slow way. Unenumerated remains
        online and is worth reading from the beginning; the writing is
        dense, the references are real, and the legal instincts give the
        cryptographic claims a discipline that purely technical writing
        on the same subject usually lacks.
      </P>

      <P>
        The lineage continues forward from here. Wei Dai&apos;s{" "}
        <Em>b-money</Em> proposal, also from 1998, is bit gold&apos;s
        nearest sibling and arrived on the cypherpunks list in the same
        season; Hal Finney&apos;s <Em>RPOW</Em> (Reusable Proofs of
        Work, 2004) implemented a working server that took Hashcash
        tokens and reissued them, making proof-of-work a circulating
        unit for the first time. Satoshi&apos;s contribution, read in
        this lineage, is the consensus mechanism that bit gold was
        missing and the incentive structure that made the registry
        self-policing. The next entry takes Wei Dai&apos;s b-money and
        reads it next to bit gold, side by side.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Szabo, N. (1994). <Em>Smart Contracts</Em>. Personal site;
          archived widely.
        </Li>
        <Li>
          Szabo, N. (1997).{" "}
          <Em>Formalizing and Securing Relationships on Public Networks</Em>.
          First Monday 2(9).
        </Li>
        <Li>
          Szabo, N. (2001).{" "}
          <Em>Trusted Third Parties Are Security Holes</Em>. Personal
          site; reprinted at the Nakamoto Institute.{" "}
          <a
            href="https://nakamotoinstitute.org/trusted-third-parties/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            nakamotoinstitute.org/trusted-third-parties
          </a>
        </Li>
        <Li>
          Szabo, N. (2002). <Em>Shelling Out: The Origins of Money</Em>.
          Unenumerated / Nakamoto Institute.{" "}
          <a
            href="https://nakamotoinstitute.org/shelling-out/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            nakamotoinstitute.org/shelling-out
          </a>
        </Li>
        <Li>
          Szabo, N. (2005). <Em>Bit Gold</Em>. Unenumerated, 27 December
          2005.{" "}
          <a
            href="https://unenumerated.blogspot.com/2005/12/bit-gold.html"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            unenumerated.blogspot.com/2005/12/bit-gold.html
          </a>
        </Li>
        <Li>
          Szabo, N. (2005–present). <Em>Unenumerated</Em> — long-running
          blog on contracts, history, and cryptographic systems.
        </Li>
        <Li>
          Grieve, J. et al. (2014). Aston University stylometric analysis
          of the Bitcoin whitepaper.
        </Li>
        <Li>
          Popper, N. (2015). <Em>Decoding the Enigma of Satoshi
          Nakamoto</Em>. The New York Times, 15 May 2015.
        </Li>
      </UList>
    </>
  );
}

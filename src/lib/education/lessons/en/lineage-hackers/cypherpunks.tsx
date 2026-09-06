import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function Cypherpunks() {
  return (
    <>
      <Lead>
        In September 1992, three men in the Bay Area &mdash; Eric Hughes, Tim
        May, and John Gilmore &mdash; began meeting in a small office in
        Oakland and opened a mailing list to extend the conversation between
        sessions. Within a year the list had a manifesto, a name, and a
        working hypothesis: that the political problem of privacy in an
        electronic age would be solved by people who wrote code, or it
        would not be solved at all. The list ran until roughly 2001 in its
        original form, drew more than seven hundred and fifty named
        participants, and produced &mdash; directly or by passage &mdash; PGP,
        Hashcash, b-money, bit gold, RPOW, and the conceptual scaffolding
        on which Bitcoin was eventually assembled.
      </Lead>

      <H2>The founding</H2>

      <P>
        The first meeting was held at the offices of Cygnus Solutions, John
        Gilmore&apos;s free-software company, in late September 1992. Eric
        Hughes, a Berkeley mathematician, had been corresponding with Tim
        May, a retired Intel physicist, about the practical implications of
        public-key cryptography for civil society. Gilmore &mdash; one of
        the early employees of Sun Microsystems and a founder of the
        Electronic Frontier Foundation &mdash; provided the room and the
        infrastructure. The mailing list followed within days, hosted on
        toad.com, Gilmore&apos;s personal server. The name{" "}
        <Em>cypherpunks</Em> was suggested by Jude Milhon, the writer and
        hacker known as <Em>St. Jude</Em>, who attended the early meetings
        and edited <Em>Mondo 2000</Em>; it was a portmanteau of{" "}
        <Em>cypher</Em> and <Em>cyberpunk</Em>, and it stuck.
      </P>

      <P>
        Tim May had circulated <Em>The Crypto Anarchist Manifesto</Em> at
        the Crypto &apos;88 conference in Santa Barbara, four years
        earlier; copies were redistributed at Crypto &apos;92 and then
        posted to the new list. It opens:{" "}
        <Em>
          &ldquo;A specter is haunting the modern world, the specter of
          crypto anarchy.&rdquo;
        </Em>{" "}
        The pastiche of Marx is deliberate; the substance is not. May
        argued that strong cryptography would dissolve the state&apos;s
        monopoly on identity, taxation, and contract enforcement, and that
        this dissolution was a matter of arithmetic rather than of policy.
        On 9 March 1993 Eric Hughes posted{" "}
        <Em>A Cypherpunk&apos;s Manifesto</Em>, which set the practical
        register the list would carry for the next decade:{" "}
        <Em>
          &ldquo;Privacy is necessary for an open society in the electronic
          age. &hellip; Cypherpunks write code. We know that someone has to
          write software to defend privacy, and since we can&apos;t get
          privacy unless we all do, we&apos;re going to write it.&rdquo;
        </Em>
      </P>

      <H2>Who passed through</H2>

      <P>
        The archive of the list from 1992 to 2001 is preserved at{" "}
        <Em>cypherpunks.venona.com</Em> and at several mirrors. The names
        on the rolls form a substantial part of the modern cryptography
        canon. David Chaum, whose 1983 paper on blinded signatures and
        whose company DigiCash supplied the first working anonymous
        electronic cash, corresponded with the list. Phil Zimmermann,
        author of PGP, posted updates and answered questions during the
        years he was under federal investigation for the export of his
        software. Hal Finney &mdash; later the recipient of the first
        peer-to-peer Bitcoin transaction &mdash; was a regular contributor
        and built RPOW, an early reusable proof-of-work system. Nick Szabo
        wrote his bit-gold proposal in this milieu. Wei Dai posted{" "}
        <Em>b-money</Em> to the list in November 1998. Adam Back, Bruce
        Schneier, Steven Bellovin, Matt Blaze, Bram Cohen, and Julian
        Assange all participated at one point or another. Levy&apos;s{" "}
        <Em>Crypto</Em> (Viking, 2001) remains the standard narrative
        history; it is the book to start with and the book to argue with.
      </P>

      <H2>The fights, and what was won</H2>

      <Diagram
        cols={6}
        rows={4}
        nodes={[
          { id: "list", text: "CYPHERPUNKS LIST", col: 2, row: 0, span: 2, accent: true, sub: "1992" },
          { id: "pgp", text: "PGP", col: 0, row: 1, sub: "Zimmermann 1991" },
          { id: "hash", text: "Hashcash", col: 1, row: 2, sub: "Back 1997" },
          { id: "bmoney", text: "b-money", col: 2, row: 2, sub: "Dai 1998" },
          { id: "bgold", text: "bit gold", col: 3, row: 2, sub: "Szabo 1998" },
          { id: "rpow", text: "RPOW", col: 5, row: 1, sub: "Finney 2004" },
          { id: "btc", text: "BITCOIN", col: 2, row: 3, span: 2, accent: true, sub: "Nakamoto 2008" },
        ]}
        edges={[
          { from: "list", to: "pgp" },
          { from: "list", to: "hash" },
          { from: "list", to: "bmoney" },
          { from: "list", to: "bgold" },
          { from: "list", to: "rpow" },
          { from: "pgp", to: "btc", dashed: true },
          { from: "hash", to: "btc", accent: true },
          { from: "bmoney", to: "btc", accent: true },
          { from: "bgold", to: "btc", accent: true },
          { from: "rpow", to: "btc", accent: true },
        ]}
        caption="CYPHERPUNKS LIST — SOIL FROM WHICH BITCOIN GREW."
      />

      <P>
        The list was not a reading group. Its participants were engaged in
        two specific political fights through most of the 1990s. The first
        was the Clipper chip, a key-escrow encryption proposal advanced by
        the National Security Agency and the Clinton administration
        between April 1993 and 1996. Cypherpunks contributed technical
        critiques &mdash; Matt Blaze&apos;s 1994 paper demonstrating a
        protocol failure in the underlying Skipjack key-exchange was
        particularly consequential &mdash; and the proposal was withdrawn.
        The second fight was the export-control regime that classified
        strong cryptography as a munition under the International Traffic
        in Arms Regulations. The decisive case was{" "}
        <Em>Bernstein v. United States</Em>: Daniel Bernstein, then a
        graduate student at Berkeley, sued the State Department for the
        right to publish his Snuffle cipher, and the Ninth Circuit ruled
        in 1999 that source code was protected speech under the First
        Amendment. The combination of these two outcomes &mdash; Clipper
        defeated, source code protected &mdash; made the open
        cryptographic ecosystem of the 2000s legally possible.
      </P>

      <P>
        The artifact list is the more durable inheritance. PGP, released
        by Zimmermann in June 1991 and refined throughout the list&apos;s
        active years, gave ordinary users a working public-key system.
        Hashcash, proposed by Adam Back in March 1997, introduced the
        cost-function approach to spam and denial-of-service that would
        later anchor Bitcoin&apos;s consensus. Wei Dai&apos;s{" "}
        <Em>b-money</Em> and Nick Szabo&apos;s <Em>bit gold</Em> sketched,
        a decade in advance, most of the moving parts of a decentralised
        digital currency: distributed ledgers, proof-of-work issuance,
        and signature-based ownership. Hal Finney&apos;s RPOW, released
        in 2004, was a working &mdash; if centrally hosted &mdash;
        implementation of reusable proofs of work. The 2008 Bitcoin
        whitepaper cites Hashcash by name and assembles, in nine pages,
        the parts the list had been writing about for sixteen years.
      </P>

      <H2>Audit lens</H2>

      <P>
        The political theory of the list is unusual in twentieth-century
        political theory in that it is testable. The claim &mdash; that
        privacy in an electronic age is a property of deployed
        cryptographic software rather than of legislation &mdash; can be
        evaluated by reading the software, running it, and observing
        whether it does what it says. The Hughes Manifesto is one page.
        The May Manifesto is shorter. The list archive is roughly nine
        years of public correspondence and is fully indexed. PGP, GPG,
        OpenSSL, Tor, Signal, and Bitcoin are all readable in source. A
        reader who treats the cypherpunks as a subculture to be psycho-
        analysed will find ample material; a reader who treats them as a
        working group whose claims are settled in code will find the
        record unusually concrete for a political movement of the period.
      </P>

      <P>
        The list did not arrive without precedent. Its participants were,
        by and large, products of the broader free-software culture that
        had emerged from the MIT Artificial Intelligence Laboratory in
        the 1970s and from the Homebrew Computer Club on the peninsula
        in the same decade. The next entry in the lineage-hackers track
        moves backward to that earlier soil &mdash; to the AI Lab in
        Tech Square, to Richard Stallman and the founding of the GNU
        Project in 1983, and to the question of why the discipline of
        sharing source code came to be understood, by the people who
        practised it, as a matter of conscience rather than convenience.
        The cypherpunks inherited that discipline; the free-software
        movement is where it was named.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Hughes, E. (1993). <Em>A Cypherpunk&apos;s Manifesto</Em>,
          9 March 1993. Activism.net mirror and{" "}
          <a
            href="https://www.activism.net/cypherpunk/manifesto.html"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            activism.net/cypherpunk/manifesto.html
          </a>
          .
        </Li>
        <Li>
          May, T. (1988). <Em>The Crypto Anarchist Manifesto</Em>.
          Distributed at Crypto &apos;88 and Crypto &apos;92.
        </Li>
        <Li>
          Levy, S. (2001).{" "}
          <Em>
            Crypto: How the Code Rebels Beat the Government &mdash; Saving
            Privacy in the Digital Age
          </Em>
          . Viking.
        </Li>
        <Li>
          <Em>Cypherpunks mailing list archive, 1992&ndash;2001</Em>.
          Mirror at{" "}
          <a
            href="https://cypherpunks.venona.com/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            cypherpunks.venona.com
          </a>
          .
        </Li>
        <Li>
          <Em>Bernstein v. United States</Em>, 176 F.3d 1132 (9th Cir.
          1999).
        </Li>
        <Li>
          Blaze, M. (1994).{" "}
          <Em>
            Protocol Failure in the Escrowed Encryption Standard
          </Em>
          . Proceedings of the 2nd ACM Conference on Computer and
          Communications Security.
        </Li>
        <Li>
          Dai, W. (1998). <Em>b-money</Em>. Posted to the cypherpunks
          mailing list, November 1998.
        </Li>
        <Li>
          Back, A. (1997). <Em>Hashcash</Em>. Announcement post,
          March 1997; later formalised in the 2002 paper.
        </Li>
      </UList>
    </>
  );
}

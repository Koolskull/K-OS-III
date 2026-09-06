import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function HalFinney() {
  return (
    <>
      <Lead>
        On 12 January 2009, in block 170 of a chain that was nine days old,
        Hal Finney received ten Bitcoin from Satoshi Nakamoto at an address
        Satoshi had asked him to generate. It was the first peer-to-peer
        Bitcoin transaction in history, and the second person to ever run
        the software was already, by then, the engineer who had built the
        nearest precursor to its mining model and one of the lead hands
        behind the encryption tool that had taught a generation of
        programmers what a key actually was.
      </Lead>

      <H2>The work</H2>

      <P>
        Harold Thomas Finney II was born on 4 May 1956. He took a degree in
        engineering from Caltech in 1979 and spent the early part of his
        career writing console games before joining Phil Zimmermann at PGP
        Corporation, where he became one of the lead engineers behind PGP
        2.0 — the version that put public-key cryptography into the hands
        of ordinary users in the early 1990s and became the reference
        implementation around which the OpenPGP standard was eventually
        written. Finney was an active and unusually patient member of the
        Cypherpunks mailing list from its earliest days, posting code,
        protocol critiques, and long-form replies that worked through the
        engineering details rather than the politics. The list&apos;s
        archives are public and his contributions are signed; a reader who
        wants to study how a working cryptographer talked to other working
        cryptographers in 1992 can read him directly.
      </P>

      <P>
        In August 2004 Finney published <Em>RPOW</Em> — Reusable Proofs of
        Work — a system in which Hashcash-style proof-of-work tokens could
        be exchanged at a server for fresh tokens of equal value, with the
        server&apos;s integrity guaranteed by IBM 4758 secure hardware
        running signed, publishable code. RPOW is the direct engineering
        precursor to Bitcoin&apos;s mining model: a proof-of-work token
        that could circulate as a unit of value rather than be consumed on
        first use. The Bitcoin whitepaper four years later replaced
        Finney&apos;s trusted hardware with a distributed timestamp server
        and a longest-chain rule, but the shape of the artifact — work
        burned to mint a transferable token — is recognisably the same
        idea built once already by the same hands.
      </P>

      <Diagram
        cols={5}
        rows={3}
        nodes={[
          { id: "hc", text: "HASHCASH", col: 0, row: 1, sub: "Back, 1997" },
          { id: "pgp", text: "PGP 2.0", col: 0, row: 0, sub: "Finney, 1992" },
          { id: "cp", text: "Cypherpunks list", col: 0, row: 2, sub: "1992-2001" },
          { id: "rpow", text: "RPOW", col: 2, row: 1, accent: true, sub: "Finney, 2004" },
          { id: "btc", text: "BITCOIN", col: 4, row: 1, sub: "Satoshi, 2008" },
          { id: "tx", text: "Block 170", col: 4, row: 2, accent: true, sub: "12 Jan 2009 — to Finney" },
        ]}
        edges={[
          { from: "pgp", to: "rpow", dashed: true },
          { from: "hc", to: "rpow", label: "PoW token" },
          { from: "cp", to: "rpow", dashed: true },
          { from: "rpow", to: "btc", label: "distributed", accent: true },
          { from: "btc", to: "tx", accent: true },
        ]}
        caption="LINEAGE — REUSABLE PROOF-OF-WORK BECOMES DISTRIBUTED CONSENSUS."
      />

      <H2>The first transaction</H2>

      <P>
        Finney&apos;s account of the first days is the canonical
        first-person record. He saw Satoshi&apos;s announcement on the
        cryptography list in late 2008, downloaded version 0.1 when it was
        released on 9 January 2009, and ran it. Satoshi, watching the
        node connect, sent him an email; Finney generated an address and
        replied with it, and on 12 January 2009 received ten BTC at block
        170. He filed bug reports. He answered questions. He mined for a
        few days on his desktop before the heat and the fan noise pushed
        him to turn it off. The exchange he describes between himself and
        Satoshi in those weeks is the only piece of correspondence with
        the project&apos;s author published by someone with that level of
        early access and that level of technical literacy.
      </P>

      <P>
        A peculiarity of the public record, noted later by reporters
        chasing a face for the pseudonym, is that Finney lived for years
        in Temple City, California — the same suburban town as Dorian
        Prentice Satoshi Nakamoto, the engineer <Em>Newsweek</Em>{" "}
        misidentified as Bitcoin&apos;s author in March 2014. Finney
        consistently denied being Satoshi. Stylometric studies have
        repeatedly returned his name as a candidate; he answered each
        round on the public forums in his own voice, and the denials are
        on the record.
      </P>

      <H2>ALS, and the work continued</H2>

      <P>
        In August 2009, the year of the genesis block, Finney was
        diagnosed with amyotrophic lateral sclerosis. The disease
        progressed through the years that followed; by the early 2010s he
        was using a wheelchair, and by 2013 he was contributing to
        cryptographic projects — a bcflick experiment for hardware-secured
        Bitcoin wallets among them — through eye-tracking input software,
        composing posts and code one glance at a time. His March 2013
        BitcoinTalk post <Em>Bitcoin and me</Em> is the document of
        record: a calm, technical, first-person account written under
        those conditions, describing what it was to receive the first
        transaction and to watch the project he had spent decades of
        prior work preparing for finally arrive. His last forum post
        followed later that year.
      </P>

      <P>
        Hal Finney died on 28 August 2014. At his prior request his body
        was cryopreserved by the Alcor Life Extension Foundation, of
        which he had been a long-standing member; the choice was
        consistent with a lifetime of treating engineering and the
        possibility of future repair as the same kind of question. His
        wife, Fran Finney, has continued public advocacy for ALS research
        and for Hal&apos;s memory in the years since, including
        fundraising rides and public appearances at Bitcoin conferences.
      </P>

      <H2>Audit lens</H2>

      <P>
        The primary sources are unusually clean. The Cypherpunks list
        archive is indexed and searchable; Finney&apos;s posts there are
        signed and dated. The RPOW paper and its source are mirrored at
        Cryptome and at the Internet Archive. <Em>Bitcoin and me</Em> is
        on BitcoinTalk under his account. Block 170 is on the chain, and
        any node will reproduce it on request. A reader who wants to
        verify the dates above does not need to take this lesson&apos;s
        word for any of them; the record is finite, public, and in the
        same machine-readable forms that Finney himself helped make
        ordinary. The figure he leaves is of a working engineer who did
        the slow, patient, civic version of the craft for thirty years
        and was, for that reason, the right person to be standing at the
        other end of the wire when the first transaction settled.
      </P>

      <P>
        Finney is the near root of the lineage Bitcoin grew from, but he
        is not the deepest one. The track from here moves backward
        through Wei Dai&apos;s <Em>b-money</Em> proposal of 1998 — cited
        by name in the whitepaper — and further back to David Chaum, the
        cryptographer whose 1982 thesis introduced blinded signatures
        and whose DigiCash, in the 1990s, was the first serious attempt
        to put untraceable electronic cash into a real economy. The
        cypherpunk lineage that produced Bitcoin did not begin with
        Satoshi, and it did not begin with Finney; it began a generation
        earlier, in a Berkeley dissertation, and the next entries follow
        that thread the rest of the way down.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Finney, H. (2004). <Em>RPOW — Reusable Proofs of Work</Em>.
          Specification and source mirrored at Cryptome.{" "}
          <a
            href="https://cryptome.org/rpow.htm"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            cryptome.org/rpow.htm
          </a>
        </Li>
        <Li>
          Finney, H. (2013). <Em>Bitcoin and me</Em>. BitcoinTalk forum,
          19 March 2013.{" "}
          <a
            href="https://bitcointalk.org/index.php?topic=155054.0"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            bitcointalk.org/index.php?topic=155054.0
          </a>
        </Li>
        <Li>
          <Em>Cypherpunks mailing list archive</Em> (1992&ndash;2001).
          Finney&apos;s posts are signed and dated; mirrors at the
          Internet Archive and at cypherpunks.venona.com.
        </Li>
        <Li>
          Nakamoto, S. (2008).{" "}
          <Em>Bitcoin: A Peer-to-Peer Electronic Cash System</Em>.{" "}
          <a
            href="https://bitcoin.org/bitcoin.pdf"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            bitcoin.org/bitcoin.pdf
          </a>
        </Li>
        <Li>
          Greenberg, A. (2014).{" "}
          <Em>
            Nakamoto&apos;s Neighbor: My Hunt For Bitcoin&apos;s Creator
            Led To A Paralyzed Crypto Genius
          </Em>
          . Forbes, 25 March 2014.
        </Li>
        <Li>
          Finney, F. (2014&ndash;present). Public ALS advocacy and
          remembrances; appearances and writings preserved by the
          Bitcoin community and the ALS Association.
        </Li>
      </UList>
    </>
  );
}

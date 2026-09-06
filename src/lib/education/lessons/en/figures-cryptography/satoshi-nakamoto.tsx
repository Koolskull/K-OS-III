import { Lead, P, H2, UList, Li, Em, Strong } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function SatoshiNakamoto() {
  return (
    <>
      <Lead>
        On 31 October 2008, an email signed <Em>Satoshi Nakamoto</Em> arrived
        on the metzdowd cryptography mailing list with a nine-page attachment
        and a claim that fixed double-spending without a trusted third party.
        Two and a half years later the author walked away, leaving roughly
        1.1 million Bitcoin untouched and a pseudonym that no journalist,
        court, or chain analyst has reliably pierced.
      </Lead>

      <H2>The record</H2>

      <P>
        The 31 October 2008 message was titled &ldquo;Bitcoin P2P e-cash
        paper&rdquo; and sent from <Em>satoshi@gmx.com</Em>; the attachment
        was <Em>Bitcoin: A Peer-to-Peer Electronic Cash System</Em>. On 3
        January 2009 the genesis block was mined, its coinbase carrying that
        day&apos;s London <Em>Times</Em> headline,{" "}
        <Em>&ldquo;Chancellor on brink of second bailout for banks.&rdquo;</Em>{" "}
        On 12 January 2009 Hal Finney received the first peer-to-peer Bitcoin
        transaction — block 170, ten BTC — at an address Satoshi had asked
        him to generate. On 11 February 2009 Satoshi posted an introduction
        of the project to the P2P Foundation forum, framing it explicitly
        against fractional-reserve banking and central-bank debasement.
      </P>

      <P>
        For roughly two years there is a continuous public correspondence:
        posts to the cryptography list, then to BitcoinTalk after its launch,
        commits to the reference client, and private emails to a small set
        of early contributors, most of which have since been published by
        their recipients. The last known communication is an email to
        developer Mike Hearn, generally dated 23 April 2011:{" "}
        <Em>
          &ldquo;I&apos;ve moved on to other things. It&apos;s in good hands
          with Gavin and everyone.&rdquo;
        </Em>{" "}
        No verified message has followed. The block rewards mined in 2009
        and early 2010 attributable to a single early miner — the so-called
        <Em> Patoshi pattern</Em> — sit, by chain-analysis estimates, around
        1.1 million BTC, and have never moved.
      </P>

      <Diagram
        cols={5}
        rows={3}
        nodes={[
          { id: "wp", text: "Whitepaper", col: 0, row: 1, sub: "31 Oct 2008" },
          { id: "gen", text: "Genesis Block", col: 1, row: 1, accent: true, sub: "3 Jan 2009" },
          { id: "tx1", text: "First TX to Finney", col: 2, row: 1, sub: "12 Jan 2009" },
          { id: "p2p", text: "P2P Foundation", col: 3, row: 1, sub: "11 Feb 2009" },
          { id: "last", text: "Last Email", col: 4, row: 1, sub: "23 Apr 2011" },
          { id: "void", text: "Silence — 1.1M BTC unmoved", col: 1, row: 2, span: 3, sub: "void at the origin" },
        ]}
        edges={[
          { from: "wp", to: "gen" },
          { from: "gen", to: "tx1" },
          { from: "tx1", to: "p2p" },
          { from: "p2p", to: "last" },
          { from: "last", to: "void", dashed: true, accent: true },
        ]}
        caption="SATOSHI TIMELINE — FROM PUBLICATION TO WITHDRAWAL."
      />

      <H2>The candidates, and the point of not caring</H2>

      <P>
        The public list of plausible identities is well-trodden: Hal Finney,
        Nick Szabo, Wei Dai, Len Sassaman, Adam Back, Paul Le Roux, and
        Dorian Nakamoto (misidentified by <Em>Newsweek</Em> in March 2014
        and consistently denying involvement since). Each candidacy has its
        stylometric, temporal, or anecdotal argument; none has met a
        standard of proof. Craig Wright&apos;s public claim was adjudicated
        false by the High Court of England and Wales in March 2024 in{" "}
        <Em>COPA v. Wright</Em>. As of this writing, Satoshi remains
        pseudonymous in the strict sense — the name has not been bound to a
        natural person by any evidence that has survived adversarial review.
      </P>

      <P>
        The cultural function of the absence is structural rather than
        incidental. A monetary system whose founder cannot be coerced,
        prosecuted, or deposed, and whose founding stake has not moved in
        more than fifteen years, produces a political object that other
        cryptocurrencies have not been able to reproduce by design. The{" "}
        <Strong>void at the origin</Strong> is part of what the protocol
        protects.
      </P>

      <H2>Audit lens</H2>

      <P>
        The whitepaper is nine pages and reads in an hour. The early forum
        archive is finite, public, and indexed. The chain itself is the
        primary source: every block Satoshi mined is on it, every coin he
        was paid is on it, and the silence since April 2011 is a verifiable
        property of the ledger rather than a rumour about a person. A
        reader who treats Satoshi as a mystery to be solved will find the
        record thin. A reader who treats Satoshi as the author of a
        specific document and the operator of a specific set of addresses,
        and stops there, will find the record sufficient.
      </P>

      <P>
        Satoshi did not arrive without precedent. The whitepaper cites
        Adam Back&apos;s Hashcash and references the timestamp-server
        literature; the wider cypherpunk lineage running through David
        Chaum&apos;s blinded-signature digital cash, Wei Dai&apos;s
        <Em> b-money</Em>, Nick Szabo&apos;s <Em>bit gold</Em>, and Hal
        Finney&apos;s reusable proofs of work supplied most of the parts
        that Bitcoin assembled. The next entries in this track follow that
        thread backward — beginning with Hal Finney, the first person
        besides Satoshi to run the software, receive a coin, and answer a
        bug report.
      </P>

      <H2>References</H2>

      <UList>
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
          <Em>The Complete Satoshi</Em> — collected writings at the
          Satoshi Nakamoto Institute.{" "}
          <a
            href="https://nakamotoinstitute.org/the-complete-satoshi/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            nakamotoinstitute.org
          </a>
        </Li>
        <Li>
          Finney, H. (2013).{" "}
          <Em>Bitcoin and me</Em> — bitcointalk forum post recounting
          the first transaction.
        </Li>
        <Li>
          <Em>COPA v. Wright</Em>, High Court of England and Wales,
          judgment March 2024.
        </Li>
        <Li>
          Cognetto, S. et al. (2020).{" "}
          <Em>Patoshi Pattern</Em> — analysis of early mining
          attributable to a single entity.
        </Li>
      </UList>
    </>
  );
}

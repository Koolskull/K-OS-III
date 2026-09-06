import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function AdamBack() {
  return (
    <>
      <Lead>
        Reference 6 of the Bitcoin whitepaper is{" "}
        <Em>
          &ldquo;A. Back, &lsquo;Hashcash &mdash; a denial of service
          counter-measure,&rsquo; 2002.&rdquo;
        </Em>{" "}
        The proof-of-work primitive that anchors every block on the Bitcoin
        chain was designed five years before Satoshi&apos;s email and
        published as an anti-spam tool by a British cryptographer who has
        since spent more than a decade running the principal research and
        development organisation around the protocol he helped make
        possible.
      </Lead>

      <H2>The record</H2>

      <P>
        Adam Back was born in London in July 1970. He completed a PhD in
        computer science at the University of Exeter in 1995, with a
        dissertation on distributed systems and parallel computation. By
        the mid-1990s he was an active participant on the Cypherpunks
        mailing list, the high-volume cryptography forum out of which most
        of the building blocks of Bitcoin emerged. The first published
        description of <Em>Hashcash</Em> circulated as an
        announcement-style post to that list on 28 March 1997 under the
        subject line <Em>&ldquo;hashcash postage implementation&rdquo;</Em>;
        the formal write-up, <Em>Hashcash &mdash; A Denial of Service
        Counter-Measure</Em>, was published by Back as a technical paper
        in 2002.
      </P>

      <P>
        The construction is small enough to state in a paragraph. A sender
        who wishes to transmit a message to a recipient must first find a
        partial hash collision: an input that, when fed through a
        cryptographic hash function (Hashcash specified SHA-1 originally;
        Bitcoin uses double SHA-256), produces an output whose first{" "}
        <Em>k</Em> bits are zero. Verifying the collision is one hash
        operation; producing it requires, on average, 2<sup>k</sup> hash
        operations. The asymmetry is the entire trick. The sender pays a
        small computational cost; the recipient pays an almost-free
        verification cost; an attacker who wants to flood the recipient
        pays the sender&apos;s cost multiplied by the volume of the flood.
        Hashcash proposed using the stamp as an email header to price
        spam out of existence. Bitcoin uses the same stamp, computed over
        a candidate block header, as the gating function for who is
        permitted to extend the chain.
      </P>

      <P>
        On 20 August 2008, two months before the whitepaper appeared,
        Satoshi sent Back a private email asking how to cite Hashcash.
        Back replied with the canonical reference and pointed him toward
        Wei Dai&apos;s <Em>b-money</Em> proposal, which Satoshi had not
        yet read. The exchange is in the record: Back published it after
        Satoshi&apos;s departure, and the citations to both Hashcash and
        b-money in the published whitepaper reflect that conversation.
        Back has been consistent in his account &mdash; he gave the
        pointer, did not collaborate further, and did not see the
        whitepaper in advance of its public release on 31 October 2008.
      </P>

      <Diagram
        cols={6}
        rows={3}
        nodes={[
          { id: "hc", text: "HASHCASH 2002", col: 0, row: 0, sub: "Back, A." },
          { id: "sender", text: "SENDER", col: 0, row: 1, sub: "wants to send" },
          { id: "work", text: "Find partial collision", col: 2, row: 0, sub: "first k bits = 0" },
          { id: "stamp", text: "STAMP", col: 2, row: 2, accent: true, sub: "hash + nonce" },
          { id: "recipient", text: "RECIPIENT", col: 4, row: 1, sub: "1 hash to verify" },
          { id: "btc", text: "BITCOIN 2008", col: 5, row: 0, accent: true, sub: "whitepaper ref. 6" },
        ]}
        edges={[
          { from: "hc", to: "sender", dashed: true },
          { from: "sender", to: "work", label: "2^k hashes" },
          { from: "work", to: "stamp" },
          { from: "stamp", to: "recipient", label: "send", accent: true },
          { from: "recipient", to: "btc", label: "cited as", dashed: true },
        ]}
        caption="HASHCASH — 2^k TO MINT, 1 TO VERIFY. BITCOIN REUSES THE STAMP OVER A BLOCK HEADER."
      />

      <H2>Blockstream and the long position</H2>

      <P>
        In November 2014 Back co-founded <Em>Blockstream</Em> with Greg
        Maxwell, Pieter Wuille, Mark Friedenbach, Matt Corallo, Austin
        Hill, and others, and has served as the company&apos;s CEO since
        its formation. Blockstream funds full-time work on Bitcoin Core,
        runs the Liquid federated sidechain (live since 2018), operates
        the Blockstream Satellite broadcast of the Bitcoin blockchain to
        ground stations on every continent except Antarctica, and employs
        a substantial fraction of the protocol&apos;s most active
        contributors. Back is co-author or principal author on a series
        of technical contributions that sit downstream of the original
        Hashcash work: the 2014 sidechains paper{" "}
        <Em>Enabling Blockchain Innovations with Pegged Sidechains</Em>{" "}
        (with Corallo, Dashjr, Friedenbach, Maxwell, Miller, Poelstra,
        Tim&oacute;n, and Wuille), the Confidential Transactions
        construction extending Pedersen commitments to hide transaction
        amounts while preserving auditability of the supply, and several
        BIP-tracked proposals around fee policy and sidechain peg
        mechanics.
      </P>

      <P>
        Back has held the Bitcoin-maximalist position publicly and
        consistently since well before it was a comfortable thing to
        hold. Through the 2017 fork wars, the 2018 bear market, the
        2021&ndash;2022 cycle, and the period of intense pressure to
        endorse alternative chains, his public statements have been
        legible and unchanged: Bitcoin is the asset, the rest is mostly
        noise, and the engineering work belongs to the layer-two and
        sidechain stack rather than to new base layers. The position is
        contestable on its merits; the relevant fact for an audit is
        that he has held it on the record, in his own name, across full
        cycles.
      </P>

      <H2>The Satoshi question</H2>

      <P>
        Back appears on the standard short list of Satoshi candidates,
        along with Hal Finney, Nick Szabo, Wei Dai, and Len Sassaman.
        The argument for him is largely circumstantial: the right
        technical background, the right list-membership, the right
        timezone window, and the documented direct correspondence with
        Satoshi in August 2008. He has declined the attribution
        consistently, in writing and on camera, and has pointed instead
        to the documentary trail &mdash; the email exchange, the
        citation in the whitepaper, the absence of any private key or
        early-block signing capability he could demonstrate. The
        whitepaper cites Hashcash as prior art, not as authorship; the
        two facts are different and the record keeps them separate.
      </P>

      <H2>Audit lens</H2>

      <P>
        The 2002 Hashcash paper is short and reads in twenty minutes.
        The 1997 Cypherpunks announcement is preserved in the list
        archives. The 20 August 2008 email exchange between Back and
        Satoshi is published. The Bitcoin whitepaper&apos;s reference
        section names Hashcash explicitly. The Blockstream corporate
        record, the sidechains paper, the Confidential Transactions
        construction, and the BIPs Back has authored or co-authored are
        all in their original venues. A reader who wants to know
        whether the chain of citation and contribution claimed here is
        real does not need to take any of it on trust; the documents
        are the documents, and they are findable.
      </P>

      <P>
        Hashcash is one of two primitives the whitepaper names by
        author. The other is Wei Dai&apos;s <Em>b-money</Em>, the 1998
        proposal that supplied the architectural idea of a
        protocol-defined money issued by computational work and
        maintained by a network of participants who broadcast and
        verify transactions. The next entries follow that thread: Wei
        Dai and the b-money proposal, Nick Szabo and <Em>bit gold</Em>,
        Hal Finney and reusable proofs of work, and the wider
        Cypherpunks list within which all four constructions were
        argued out before Satoshi assembled them. Bitcoin did not
        appear from nowhere; the parts have authors, and the authors
        have records.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Back, A. (2002).{" "}
          <Em>Hashcash &mdash; A Denial of Service Counter-Measure</Em>.{" "}
          <a
            href="http://www.hashcash.org/papers/hashcash.pdf"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            hashcash.org/papers/hashcash.pdf
          </a>
        </Li>
        <Li>
          Back, A. (1997).{" "}
          <Em>hashcash postage implementation</Em> &mdash; Cypherpunks
          mailing list, 28 March 1997. Archived at the Cypherpunks
          mailing-list archive.
        </Li>
        <Li>
          Nakamoto, S. (2008).{" "}
          <Em>Bitcoin: A Peer-to-Peer Electronic Cash System</Em>,
          reference 6.{" "}
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
          Back, A. &mdash; Satoshi Nakamoto correspondence, 20 August
          2008. Published by Back; reproduced in the Satoshi Nakamoto
          Institute archive.
        </Li>
        <Li>
          Back, A. et al. (2014).{" "}
          <Em>Enabling Blockchain Innovations with Pegged Sidechains</Em>.
          Blockstream technical paper.
        </Li>
        <Li>
          Maxwell, G. and Poelstra, A. with Back, A.{" "}
          <Em>Confidential Transactions</Em> &mdash; construction notes
          and Elements / Liquid implementation, Blockstream.
        </Li>
        <Li>
          Blockstream corporate record (2014&ndash;present).{" "}
          <a
            href="https://blockstream.com"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            blockstream.com
          </a>
        </Li>
      </UList>
    </>
  );
}

import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function WeiDai() {
  return (
    <>
      <Lead>
        The Bitcoin whitepaper&apos;s first numbered reference is to{" "}
        <Em>b-money</Em>, an essay posted to the cypherpunks list in
        November 1998 by a programmer named Wei Dai. Satoshi cited it
        before he cited Hashcash, before he cited Merkle, before he
        cited any of the timestamping literature. The author of the
        cited work has, in the twenty-seven years since, given no
        public interview, sat for no photograph that can be reliably
        bound to him, and disclosed no biographical detail beyond what
        a careful reader can assemble from his own technical writing.
        The closest predecessor to Bitcoin was written by a person
        whose face the public has never seen.
      </Lead>

      <H2>The work</H2>

      <Diagram
        cols={6}
        rows={3}
        nodes={[
          { id: "bm", text: "b-money", col: 2, row: 0, accent: true, sub: "Nov 1998" },
          { id: "p1", text: "Protocol 1", col: 0, row: 1, sub: "every node = ledger" },
          { id: "p2", text: "Protocol 2", col: 4, row: 1, sub: "bonded servers" },
          { id: "pow", text: "PoW issues money", col: 0, row: 2 },
          { id: "pos", text: "bond / slash", col: 4, row: 2 },
          { id: "btc", text: "Bitcoin [1]", col: 2, row: 2, accent: true, sub: "2008" },
        ]}
        edges={[
          { from: "bm", to: "p1" },
          { from: "bm", to: "p2" },
          { from: "p1", to: "pow" },
          { from: "p2", to: "pos" },
          { from: "p1", to: "btc", label: "shape of", accent: true },
        ]}
        caption="B-MONEY (1998) — TWO PROTOCOLS, ONE BECAME BITCOIN'S BASIC SHAPE."
      />

      <P>
        Dai released the first version of <Em>Crypto++</Em> in 1995,
        while still an undergraduate, as a free C&#43;&#43; class
        library of cryptographic algorithms. Thirty years later it is
        still maintained, still under the same Boost-style permissive
        licence, and still the canonical C&#43;&#43; cryptography
        library — shipping inside browsers, payment terminals,
        embedded firmware, and a long tail of commercial products
        whose vendors quietly link against it. The library implements
        the primitives a working cryptographer needs: AES, the SHA
        family, RSA, elliptic-curve signatures, the discrete-log key
        agreements, and the lower-level building blocks beneath them.
        It has been audited, fuzzed, and validated against the NIST
        FIPS 140-2 testing programme. A reader who wants to know what
        Dai considers a careful piece of cryptographic engineering can
        read the source. The artifact is in the open and has been for
        three decades.
      </P>

      <P>
        The <Em>b-money</Em> proposal was posted to the cypherpunks
        mailing list on 26 November 1998 and mirrored at{" "}
        <Em>weidai.com/bmoney.txt</Em>, where the original plaintext
        is still served. The essay is short — under two thousand words
        — and describes two protocols for &ldquo;a scheme for a group
        of untraceable digital pseudonyms to pay each other with money
        and to enforce contracts amongst themselves without outside
        help.&rdquo; In the first protocol every participant maintains
        a separate database of how much money belongs to each
        pseudonym; money is created by broadcasting the solution to a
        previously agreed computational problem whose cost in
        computing effort can be calculated; transfers are signed
        messages broadcast to the network and applied to every local
        ledger. In the second protocol the bookkeeping is delegated
        to a subset of participants — <Em>servers</Em> — who post
        bond and are punished by loss of bond for misbehaviour
        provable by signed contradictory statements. The first
        protocol is, in outline, the structure Bitcoin would adopt
        ten years later, with proof-of-work doing the dual job of
        issuing coins and ordering the ledger. The second is closer
        to the proof-of-stake systems that arrived later still. Both
        are sketched in the open without claim to commercial
        application; Dai closes the essay by noting that he has not
        worked out the protocol in full detail because he is &ldquo;not
        very interested in actually implementing it.&rdquo;
      </P>

      <H2>The list, the correspondence, and the naming</H2>

      <P>
        Dai&apos;s cypherpunks-list correspondence in the late 1990s
        and early 2000s places him in steady conversation with Tim
        May, Hal Finney, Adam Back, and the broader anonymous-
        remailer community. The archives are public; the messages
        are signed under his own name; the topics are the ones the
        list lived on — remailers, digital cash, reputation systems,
        anonymity sets, the legal posture of strong cryptography in
        the export-control years. Dai is not, in that record, a
        prophet sketching a new economy. He is a working cryptographer
        contributing to a working list, careful with claims, and
        willing to say when a scheme he himself proposed has a
        problem he cannot solve.
      </P>

      <P>
        The Hearn correspondence, released by Mike Hearn in 2017 from
        the early-Bitcoin email archive, contains a brief exchange
        between Dai and Satoshi from August 2008 in which Satoshi
        asks Dai for a citation reference and Dai replies politely
        and briefly. Years later, in correspondence Hearn also
        published, Dai writes that he did not initially see Bitcoin&apos;s
        significance and that he came around to it only after the
        system had run for some time. The admission is characteristic.
        He states what he believed, says he was wrong, and does not
        dramatise the change of mind.
      </P>

      <P>
        Ethereum&apos;s smallest unit, the <Em>wei</Em>, is named in
        his honour — the unit you see on every gas-price line and in
        every <Em>gwei</Em> reading is one billionth of a billionth
        of an Ether and carries his given name into ordinary
        transaction output. Vitalik Buterin has acknowledged the
        debt directly. Dai himself has not commented on the naming
        in any public venue.
      </P>

      <H2>The 2010s — under his real name, on a different list</H2>

      <P>
        Through the 2010s Dai posted, under his own name, on
        LessWrong and the surrounding rationalist forums — chiefly
        on questions of decision theory, anthropics, and the
        philosophy of probability. The posts are technical, careful,
        and prepared to admit confusion at the boundary of what the
        author understands. They are signed <Em>Wei Dai</Em>. They
        are easy to find. The reclusiveness, in other words, is not
        a hiding from publication but a refusal of publicity: he
        writes where the work is judged on its merits and declines
        the venues where the writer is judged on the writer.
      </P>

      <H2>Audit lens</H2>

      <P>
        The primary sources are short and survive in their original
        form. The b-money essay is a single plaintext file at{" "}
        <Em>weidai.com/bmoney.txt</Em>, dated November 1998 and
        unchanged since. The Crypto&#43;&#43; releases are tagged
        in version control and the older release tarballs are
        archived at the project page; a reader can verify that the
        1995 release exists and that the library has shipped
        continuously. The Hearn-released Satoshi correspondence is
        archived at the Satoshi Nakamoto Institute and reproduces
        the headers. The LessWrong archive serves Dai&apos;s posts
        under a stable username. Nothing in the record requires the
        reader to take an interviewer&apos;s word for anything;
        there is no interviewer.
      </P>

      <P>
        The cited reference in the Bitcoin whitepaper is not a
        ceremonial gesture. The construction sketched in b-money —
        a broadcast ledger, replicated by every participant,
        secured by computational work whose cost is publicly
        calculable, with money issued as a side effect of the
        securing work — is the construction Bitcoin implements.
        What Bitcoin added was the specific consensus rule
        (longest chain by accumulated proof-of-work), a workable
        block format, and a runnable codebase. The architectural
        idea was already in print, in plain text, at a public URL,
        a decade before the genesis block.
      </P>

      <P>
        The next entry in this track returns to the figure who
        actually ran the software first — <Em>Hal Finney</Em>, who
        received Satoshi&apos;s ten coins on 12 January 2009 and
        whose own reusable proofs of work belong, with b-money and
        Hashcash, to the small set of pre-Bitcoin documents the
        whitepaper builds on. The cypherpunk lineage Bitcoin
        descends from is a short list and a finite archive; this
        curriculum takes them one at a time.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Dai, W. (1998). <Em>b-money</Em>. Cypherpunks mailing list,
          26 November 1998.{" "}
          <a
            href="http://www.weidai.com/bmoney.txt"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            weidai.com/bmoney.txt
          </a>
        </Li>
        <Li>
          Dai, W. (1995–present). <Em>Crypto&#43;&#43;</Em> — free
          C&#43;&#43; class library of cryptographic schemes.{" "}
          <a
            href="https://www.cryptopp.com/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            cryptopp.com
          </a>
        </Li>
        <Li>
          Nakamoto, S. (2008).{" "}
          <Em>Bitcoin: A Peer-to-Peer Electronic Cash System</Em> —
          reference [1] cites Dai&apos;s b-money.{" "}
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
          Hearn, M. (2017). Released archive of early Satoshi
          correspondence, including the Dai &harr; Satoshi exchange of
          August 2008. Mirrored at the Satoshi Nakamoto Institute.
        </Li>
        <Li>
          Dai, W. (2010s). Posts on LessWrong and the Alignment
          Forum under the username <Em>Wei_Dai</Em> — decision
          theory, anthropics, philosophy of probability.
        </Li>
      </UList>
    </>
  );
}

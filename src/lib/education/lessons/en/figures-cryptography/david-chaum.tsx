import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function DavidChaum() {
  return (
    <>
      <Lead>
        Before the cypherpunks had a name, David Chaum (b. 1955) had
        already published the paper that would seed Tor, the primitive
        that would seed every anonymous digital cash system after it,
        and the company that would attempt — a full decade before
        Bitcoin — to put cryptographic e-cash into the hands of bank
        customers in Amsterdam. The 1981 mixnet paper, the 1982 blind
        signature, and the 1990 founding of DigiCash are not three
        separate careers. They are one continuous argument, prosecuted
        across forty-five years, that <Em>privacy is a precondition of
        a free society and that mathematics is the only durable place
        to put it</Em>.
      </Lead>

      <H2>The record</H2>

      <P>
        Chaum&apos;s February 1981 paper in <Em>Communications of the
        ACM</Em>, <Em>&ldquo;Untraceable Electronic Mail, Return
        Addresses, and Digital Pseudonyms,&rdquo;</Em> describes the
        construction now universally called a <Em>mix network</Em>: a
        chain of relays, each of which decrypts one layer and forwards
        a re-ordered batch, such that no single relay observes both the
        sender and the recipient of a message. Every onion-routed
        system in deployment — Tor, I2P, Nym, the Loopix family of
        designs — descends from that paper. The construction was
        twenty years ahead of the public network it eventually
        protected.
      </P>

      <P>
        His 1982 Berkeley dissertation, <Em>Computer Systems
        Established, Maintained, and Trusted by Mutually Suspicious
        Groups</Em>, is the first systematic treatment of the problem
        that became the central problem of the next forty years of
        cryptography: how to build shared infrastructure among parties
        that do not, and should not have to, trust one another. The
        same year he introduced the <Em>blind signature</Em>: a
        protocol in which a bank can sign a token without seeing its
        contents, so that the token, when later spent, cannot be
        linked back to the withdrawal. The construction was published
        as <Em>&ldquo;Blind Signatures for Untraceable Payments&rdquo;</Em>{" "}
        in the proceedings of Crypto &apos;82. It is the foundational
        primitive of anonymous digital cash. Every later e-cash
        scheme — DigiCash&apos;s eCash, Brands&apos; credentials, the
        Zerocoin/Zerocash lineage that became Zcash, the recent
        revivals in privacy stablecoins — descends from it.
      </P>

      <P>
        At Crypto &apos;88, with Amos Fiat and Moni Naor, Chaum
        published <Em>&ldquo;Untraceable Electronic Cash,&rdquo;</Em> the
        offline double-spending construction in which a coin spent
        once remains anonymous but a coin spent twice mathematically
        reveals the spender&apos;s identity. The same period produced
        his work on <Em>group signatures</Em> (with Eugène van Heyst,
        Eurocrypt 1991), <Em>undeniable signatures</Em> (with Hans van
        Antwerpen, Crypto 1989), and <Em>secret-ballot voting
        protocols</Em> in which the tally is publicly verifiable while
        each individual ballot remains private. Each of these is
        still, in 2026, an active research line.
      </P>

      <Diagram
        cols={7}
        rows={3}
        nodes={[
          { id: "mix", text: "1981 Mixnet", col: 0, row: 0, span: 2, accent: true, sub: "CACM Feb 1981" },
          { id: "tor", text: "Tor / I2P / Nym", col: 5, row: 0, span: 2, sub: "deployed 2000s+" },
          { id: "bs", text: "1982 Blind Sig", col: 0, row: 1, span: 2, accent: true, sub: "Crypto '82" },
          { id: "dc", text: "DigiCash", col: 2, row: 1, span: 2, sub: "Amsterdam 1990" },
          { id: "mtb", text: "Mark Twain Bank", col: 4, row: 1, span: 2, sub: "St. Louis Oct 1995" },
          { id: "bk", text: "Bankruptcy", col: 2, row: 2, span: 2, sub: "SDNY 1998" },
          { id: "xx", text: "xx network", col: 5, row: 2, span: 2, sub: "Nov 2021 (cMix)" },
        ]}
        edges={[
          { from: "mix", to: "tor", label: "descends" },
          { from: "mix", to: "xx", dashed: true },
          { from: "bs", to: "dc", label: "founds" },
          { from: "dc", to: "mtb", label: "deploys", accent: true },
          { from: "mtb", to: "bk", label: "collapse" },
        ]}
        caption="CHAUM LINEAGE — TWO PRIMITIVES, FORTY-FIVE YEARS, ONE ARGUMENT."
      />

      <H2>DigiCash, 1990&ndash;1998</H2>

      <P>
        In 1990 Chaum founded <Em>DigiCash</Em> in Amsterdam to bring
        the blind-signature construction to market. The product, eCash,
        was the first commercial deployment of cryptographic digital
        cash. <Em>Mark Twain Bank</Em> of St. Louis became the first
        U.S. issuer in October 1995; <Em>Deutsche Bank</Em>, Credit
        Suisse, and a small set of other European institutions followed.
        Microsoft, by widely reported accounts, offered roughly
        $100 million in 1996 to integrate eCash into Windows 95;
        the deal did not close. Netscape conversations went the same
        way. DigiCash filed for bankruptcy in 1998. The patents passed
        through several hands; the technology did not reach the
        consumer rail it had been built for.
      </P>

      <P>
        The collapse is usually told as a business-school case about
        founder intransigence, but the technical record is its own
        document. eCash <Em>worked</Em>. Withdrawals were unlinkable
        from spends, double-spending was caught, the cryptography was
        sound, and ordinary customers in Amsterdam were spending
        cryptographic coins at participating merchants in 1995. The
        gap between that fact and the world that exists in 2026 — in
        which most retail payment is observed, logged, and sold — is
        the gap Chaum has spent the rest of his career narrating.
      </P>

      <H2>The Scientific American line</H2>

      <P>
        In the August 1992 issue of <Em>Scientific American</Em>,
        in the article <Em>&ldquo;Achieving Electronic Privacy,&rdquo;</Em>{" "}
        Chaum wrote: <Em>&ldquo;If your transaction is observed, your
        purchases are recorded — even your aspirations.&rdquo;</Em>{" "}
        The sentence is from 1992. The infrastructure it describes was
        not yet built. The point of the sentence is that the
        infrastructure was avoidable, and that the avoidance had a
        specific mathematical shape that was already in hand. Read in
        2026, with thirty years of intervening surveillance
        infrastructure, the sentence reads less like a warning than
        like an obituary for a road not taken.
      </P>

      <H2>Modern projects</H2>

      <P>
        Chaum has remained active. <Em>Elixxir</Em> and the{" "}
        <Em>xx network</Em>, announced in 2018 and launched on
        mainnet in November 2021, apply mixnet techniques to a
        consensus network — quantum-resistant signatures, metadata-
        shredding messaging via the cMix protocol, and a token
        economy designed around the costs of running mix nodes. His
        voting research has continued in parallel, principally
        through the <Em>Scantegrity</Em> and <Em>Remotegrity</Em>{" "}
        projects, which were used in binding municipal elections in
        Takoma Park, Maryland in 2009 and 2011.
      </P>

      <H2>Audit lens</H2>

      <P>
        The papers are public and citable: <Em>Communications of the
        ACM</Em>, February 1981, for mixnets; the Crypto &apos;82
        proceedings for blind signatures; Crypto &apos;88 for
        untraceable e-cash; <Em>Scientific American</Em>, August
        1992, for the public statement of the privacy thesis. The
        DigiCash bankruptcy filing is on the docket of the U.S.
        Bankruptcy Court for the Southern District of New York, 1998.
        The xx network mainnet is observable. A reader who wants to
        check whether the primitives Chaum described actually do what
        he said they do can read the original constructions, in their
        original venues, in less than a working week. The arguments
        have not aged; the deployments around them have.
      </P>

      <P>
        Chaum is sometimes called <Em>the cypherpunk before the
        cypherpunks</Em>, and the phrase is accurate in a narrow
        sense: every later figure on this track inherited from him.
        The cypherpunk mailing list founded by Eric Hughes, Tim May,
        and John Gilmore in 1992 took Chaum&apos;s primitives as
        starting material. Wei Dai&apos;s b-money, Nick Szabo&apos;s
        bit gold, Hal Finney&apos;s reusable proofs of work, and the
        Bitcoin whitepaper that assembled them are downstream of
        eCash in the same way that Tor is downstream of the 1981
        mixnet paper. The next entry in this track — <Em>Hal
        Finney</Em> — picks up the thread one generation later, at
        the point where Chaum&apos;s commercial deployment had failed
        and a new attempt, peer-to-peer rather than bank-issued, was
        being assembled on the cryptography mailing list.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Chaum, D. (1981).{" "}
          <Em>Untraceable Electronic Mail, Return Addresses, and
          Digital Pseudonyms</Em>. Communications of the ACM, 24(2),
          84&ndash;90.
        </Li>
        <Li>
          Chaum, D. (1982).{" "}
          <Em>Computer Systems Established, Maintained, and Trusted by
          Mutually Suspicious Groups</Em>. PhD dissertation, University
          of California, Berkeley.
        </Li>
        <Li>
          Chaum, D. (1983).{" "}
          <Em>Blind Signatures for Untraceable Payments</Em>. In
          Advances in Cryptology &mdash; Proceedings of Crypto &apos;82
          (pp. 199&ndash;203). Plenum Press.
        </Li>
        <Li>
          Chaum, D., Fiat, A., &amp; Naor, M. (1990).{" "}
          <Em>Untraceable Electronic Cash</Em>. In Advances in
          Cryptology &mdash; Crypto &apos;88 (pp. 319&ndash;327).
          Springer LNCS 403.
        </Li>
        <Li>
          Chaum, D., &amp; van Heyst, E. (1991).{" "}
          <Em>Group Signatures</Em>. In Advances in Cryptology &mdash;
          Eurocrypt &apos;91 (pp. 257&ndash;265). Springer LNCS 547.
        </Li>
        <Li>
          Chaum, D. (1992).{" "}
          <Em>Achieving Electronic Privacy</Em>. Scientific American,
          August 1992, 96&ndash;101.
        </Li>
        <Li>
          Pitta, J. (1999).{" "}
          <Em>Requiem for a Bright Idea</Em> &mdash; profile of
          DigiCash and its collapse. Forbes, 1 November 1999.
        </Li>
        <Li>
          Chaum, D. et al. (2021).{" "}
          <Em>cMix: Mixing with Minimal Real-Time Asymmetric
          Cryptographic Operations</Em>. xx network technical
          documentation; mainnet launched November 2021.
        </Li>
        <Li>
          Chaum, D., Carback, R., Clark, J., et al. (2008).{" "}
          <Em>Scantegrity: End-to-End Voter-Verifiable Optical-Scan
          Voting</Em>. IEEE Security &amp; Privacy, 6(3), 40&ndash;46.
        </Li>
      </UList>
    </>
  );
}

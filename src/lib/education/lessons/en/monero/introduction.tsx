import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function MoneroIntroduction() {
  return (
    <>
      <Lead>
        Every transaction you have ever made on Bitcoin or Ethereum
        is a permanent public record, available to any chain-analysis
        firm with a subpoena and a search box. Monero is the
        most widely used cryptocurrency designed from the ground up
        to refuse that property — to hide the sender, the receiver,
        and the amount by default rather than as an opt-in feature.
        Forked from Bytecoin on 18 April 2014 and developed publicly
        from Nicolas van Saberhagen&apos;s 2013 CryptoNote v2 paper,
        Monero is now the privacy chain most resistant to the
        enforcement shape that has been used against transparent-chain
        privacy tools. This track is a companion for users who choose
        to operate in the Monero ecosystem and want to do so
        correctly — most users do not, and that is fine.
      </Lead>

      <P>
        The track is honest about limits. Monero&apos;s privacy
        properties depend on the user&apos;s behaviour at the
        boundary (deposits and withdrawals to KYC exchanges,
        network-level fingerprinting, transaction-graph analysis when
        funds re-enter the surveilled financial system). Holding XMR
        is not the same as transacting privately.
      </P>

      <Diagram
        cols={5}
        rows={3}
        nodes={[
          { id: "tx", text: "SPEND", col: 0, row: 1, accent: true, sub: "1 signer" },
          { id: "d1", text: "Decoy", col: 2, row: 0, sub: "past output" },
          { id: "d2", text: "Decoy", col: 3, row: 0, sub: "past output" },
          { id: "real", text: "REAL", col: 2, row: 1, accent: true, sub: "hidden" },
          { id: "d3", text: "Decoy", col: 3, row: 1, sub: "past output" },
          { id: "d4", text: "Decoy", col: 2, row: 2, sub: "past output" },
          { id: "obs", text: "Observer", col: 4, row: 1, shape: "ellipse", sub: "cannot tell" },
        ]}
        edges={[
          { from: "tx", to: "real", label: "signs", accent: true, dashed: true },
          { from: "tx", to: "d1", label: "ring" },
          { from: "tx", to: "d2", label: "ring" },
          { from: "tx", to: "d3", label: "ring" },
          { from: "tx", to: "d4", label: "ring" },
          { from: "d1", to: "obs", dashed: true },
          { from: "d2", to: "obs", dashed: true },
          { from: "real", to: "obs", dashed: true },
          { from: "d3", to: "obs", dashed: true },
          { from: "d4", to: "obs", dashed: true },
        ]}
        caption="RING SIGNATURE — REAL SIGNER INDISTINGUISHABLE FROM DECOYS (RING SIZE 16)."
      />

      <H2>Why a privacy-by-default chain matters</H2>

      <P>
        Every major public ledger launched in the last fifteen years has
        transparency as its default. Bitcoin, Ethereum, and the
        overwhelming majority of their descendants record the full graph
        of value flows permanently and publicly. That property was
        originally framed as a feature, and in auditability terms it is
        one. In practice, however, it has produced an outcome the early
        designers did not fully anticipate: a class of chain-analysis
        firms whose product is the re-identification of users against
        that graph, and a policy environment in which exchanges,
        custodians, and payment processors can be pressured into freezing
        or refusing funds whose history fails to satisfy whatever
        standard the current administrator prefers. The consequence is
        that transacting on a transparent chain with anything approaching
        normal economic life — payroll, rent, medical costs, donations to
        causes outside official favor — publishes a permanent dossier by
        construction. This is the same extractive logic described
        elsewhere in the curriculum, translated onto a new substrate: the
        ledger itself becomes a mechanism through which an individual&apos;s
        financial life is continuously converted into readable
        intelligence, usable by whoever is best positioned to read it.
      </P>

      <P>
        Monero&apos;s response is to make privacy the default rather
        than an opt-in feature. Five primitives do the work.{" "}
        <Em>Ring signatures</Em> mix the real signer with decoy
        signers drawn from the chain&apos;s own history (the current
        ring size is 16) so that an outside observer cannot determine
        which participant authorised a given spend.{" "}
        <Em>Stealth addresses</Em> generate a fresh one-time
        destination for each incoming transaction, breaking the link
        between a public identifier and the account that ultimately
        receives the funds. <Em>RingCT</Em> — Ring Confidential
        Transactions, deployed in January 2017 and made mandatory at
        the September 2017 hardfork — hides the amount transferred
        while preserving the chain&apos;s ability to verify that no
        value was created or destroyed.{" "}
        <Em>Bulletproofs</Em>, activated in October 2018, replaced
        the original range-proof construction and reduced
        transaction sizes by roughly 80%. The forthcoming{" "}
        <Em>Triptych / Seraphis</Em> upgrade extends ring signatures
        to substantially larger anonymity sets and reorganises the
        protocol around a cleaner address scheme. None of the five
        is a perfect defence against a well-resourced adversary
        operating across both the chain and the user&apos;s network
        environment, and this track is explicit about where each
        primitive&apos;s guarantees end. Taken together, they raise
        the cost of casual mass surveillance by enough orders of
        magnitude that a normal user&apos;s normal activity is no
        longer the default-readable object it is on a transparent
        chain. Tail emission — a fixed 0.6 XMR per block, in effect
        since May 2022 — keeps miner incentives aligned indefinitely
        without resort to a hard cap.
      </P>

      <H2>The Tornado Cash precedent</H2>

      <P>
        The political stakes around privacy-by-default were clarified by
        the recent prosecution of the Tornado Cash developers. In August
        2022 the U.S. Treasury&apos;s Office of Foreign Assets Control
        sanctioned the Tornado Cash smart contracts directly — the first
        time the sanctions regime had been applied to autonomous code
        rather than to a named person or entity. Co-developer Alexey
        Pertsev was arrested in the Netherlands that month and convicted
        in May 2024 by a Dutch court to five years and four months
        imprisonment. Co-founder Roman Storm was indicted in the Southern
        District of New York in August 2023 and tried in the summer of
        2025; on 6 August 2025 the jury returned a split verdict,
        convicting on one count of conspiracy to operate an unlicensed
        money-transmitting business and deadlocking on the heavier
        conspiracy counts for money laundering and sanctions violation.
        Post-trial motions remained live into late 2026. Whatever the
        ultimate disposition, the precedent the sequence establishes is
        unambiguous: the production of open-source privacy code has been
        criminalized in at least one major jurisdiction, and the line
        between publishing software and transmitting money has been
        legally blurred.
      </P>

      <P>
        The consequence for users is that privacy tools bolted onto a
        transparent chain live on borrowed time. The contracts can be
        sanctioned directly, the front-ends pressured offline, the
        developers indicted for having written the code. A chain on which
        privacy is the default, and from which a central privacy
        primitive cannot be amputated without amputating the chain
        itself, occupies a categorically different position in this legal
        landscape — not a guaranteed safe harbor, but a structural posture
        that resists the enforcement shape used against Tornado Cash.
        That distinction, more than any individual feature, is the reason
        Monero remains worth learning correctly.
      </P>

      <H2>Audit lens</H2>

      <P>
        Monero is the cleanest available case of a public chain whose
        privacy posture is structural rather than bolted on, and the
        considerate citizen of this computer is the user who runs
        their own node, verifies their own transactions, and treats
        the boundary with the surveilled financial system as the
        place where the discipline begins, not where it ends. The
        protocol is open, the specifications are open, the monetary
        schedule is open. The reader who reads, runs, and verifies
        gets what the protocol can give them.
      </P>

      <P>
        Where this track goes next: financial privacy is one slice of
        a larger discipline. The remaining lessons descend into
        developer OPSEC, threat modelling, key custody, and the
        operational hygiene that keeps a privacy-by-default chain
        from being defeated at the boundary. The chain hides what it
        can hide; the user hides what the chain cannot.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          van Saberhagen, N. (2013). <Em>CryptoNote v 2.0</Em>.
        </Li>
        <Li>
          Noether, S., &amp; Mackenzie, A. (2016).{" "}
          <Em>Ring Confidential Transactions</Em>. Ledger Journal.
        </Li>
        <Li>
          OFAC designation of Tornado Cash, 8 August 2022.
        </Li>
        <Li>
          <Em>United States v. Roman Storm</Em>, S.D.N.Y. 2023–2026
          (partial verdict, 6 August 2025).
        </Li>
      </UList>
    </>
  );
}

import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function BitcoinIntroduction() {
  return (
    <>
      <Lead>
        Bitcoin was written during a bank bailout and shipped during
        a depression. Satoshi Nakamoto released the whitepaper{" "}
        <Em>Bitcoin: A Peer-to-Peer Electronic Cash System</Em> on 31
        October 2008; the genesis block was mined on 3 January 2009
        and carries in its coinbase the London Times headline{" "}
        <Em>
          &ldquo;The Times 03/Jan/2009 Chancellor on brink of second
          bailout for banks.&rdquo;
        </Em>{" "}
        That reference is not decorative. The system is older than
        Ethereum, smaller in scope, and built on a fundamentally
        different model of state. This track is short by design —
        most K-OS users will not need to write Bitcoin software, but
        many will need to understand what their Bitcoin wallet is
        actually doing.
      </Lead>

      <H2>The problem Bitcoin was written against</H2>

      <P>
        Bitcoin did not emerge from academic cryptography in a
        vacuum. The whitepaper was published in the middle of a
        global financial crisis whose proximate cause was a credit
        cycle produced by decades of discretionary central-bank
        policy, and whose resolution transferred a generation of
        private losses onto the public balance sheet. The
        long-running critique of that arrangement — articulated most
        accessibly by G. Edward Griffin in{" "}
        <Em>The Creature from Jekyll Island</Em> (1994), and earlier
        and more rigorously by Ludwig von Mises, Friedrich Hayek, and
        Murray Rothbard — holds that central banking is not a neutral
        technical facility but a standing mechanism that transfers
        value away from savers, wage-earners, and the unborn in
        favour of institutions positioned near the point of currency
        creation.
      </P>

      <P>
        The historical record of that mechanism is grim. Wars
        financed through inflation that would not have survived an
        honest tax vote; savings silently confiscated through
        currency debasement across lifetimes; sovereign debt crises
        whose human cost is measured in famine, displacement, and
        foreclosed futures; payment rails weaponised against entire
        populations who had no part in the dispute that triggered
        the sanction. Bitcoin is, read in this light, the first
        working response to that architecture rather than another
        complaint lodged against it. The UTXO model, the fixed
        21-million supply schedule, the absence of a privileged
        issuer, and the energy cost of proof-of-work are each a
        direct answer to a specific failure mode of the system the
        whitepaper was written during.
      </P>

      <H2>How the chain actually works</H2>

      <Diagram
        cols={5}
        rows={3}
        nodes={[
          { id: "u1", text: "UTXO", col: 0, row: 0, sub: "0.5 BTC" },
          { id: "u2", text: "UTXO", col: 0, row: 2, sub: "0.3 BTC" },
          { id: "tx", text: "TRANSACTION", col: 2, row: 1, accent: true, sub: "signed" },
          { id: "out", text: "Recipient", col: 4, row: 0, sub: "0.7 BTC" },
          { id: "chg", text: "Change", col: 4, row: 2, sub: "0.1 BTC" },
        ]}
        edges={[
          { from: "u1", to: "tx", label: "input" },
          { from: "u2", to: "tx", label: "input" },
          { from: "tx", to: "out", label: "output", accent: true },
          { from: "tx", to: "chg", label: "output" },
        ]}
        caption="UTXO MODEL — INPUTS CONSUMED, OUTPUTS CREATED. BALANCE IS A DERIVED SUM."
      />

      <P>
        Bitcoin tracks coins as <Em>unspent transaction outputs</Em>{" "}
        (UTXOs) rather than as account balances. A &ldquo;balance&rdquo;
        is a derived sum: the total of every UTXO that a given key
        can spend. Transactions consume one or more UTXOs as inputs
        and produce one or more new UTXOs as outputs. Coin issuance
        runs on a deflationary schedule: the block reward halves
        every 210,000 blocks (roughly four years). The fourth halving
        occurred at block 840,000 in April 2024, taking the subsidy
        from 6.25 to 3.125 BTC; the schedule asymptotes at 21 million
        coins.
      </P>

      <P>
        The protocol is conservative and changes slowly. The major
        upgrades worth knowing: BIP 16 (P2SH) in April 2012, which
        opened the script system to redeem scripts hashed into
        addresses; BIP 141 (Segregated Witness) activated at block
        481,824 on 24 August 2017, which moved signature data out of
        the transaction body and lifted the effective block-size
        ceiling; and BIP 341 (Taproot) activated at block 709,632 on
        14 November 2021, which replaced ECDSA with Schnorr signatures
        and made multi-party scripts indistinguishable on-chain from
        single-signer ones. The only chain rollback in the protocol&apos;s
        history was the March 2013 split, resolved within a few
        hours, between two versions of Bitcoin Core that disagreed on
        a database limit. The conservatism is part of the product.
      </P>

      <P>
        Lightning is a settlement-layer overlay rather than an
        on-chain feature. A Lightning channel is a 2-of-2 multisig
        UTXO opened on the base chain; the two parties then update a
        local balance sheet between themselves through signed
        off-chain messages, and only commit to chain when the channel
        closes. The result is fast, cheap micropayments that inherit
        Bitcoin&apos;s settlement guarantees without burdening the
        base layer with every transaction.
      </P>

      <H2>Topics covered</H2>

      <UList>
        <Li>
          The UTXO model and why &ldquo;balance&rdquo; is a derived
          concept.
        </Li>
        <Li>Bitcoin Script basics, P2SH, SegWit, Taproot.</Li>
        <Li>Wallet types — single-sig, multisig, watch-only.</Li>
        <Li>Lightning at a high level.</Li>
      </UList>

      <H2>Audit lens</H2>

      <P>
        Bitcoin is the cleanest case of a system whose source, whose
        consensus rules, whose monetary schedule, and whose history
        are all public. The reader is invited to run a node and
        verify the chain themselves; the citizen who takes care of
        themselves and is considerate of how they interact with
        others can hold their own coins, run their own node, and
        check their own balance against the same rules everyone else
        is checking against. The discipline this track is handing
        forward is exactly that — the refusal to outsource the
        question of what is in the ledger to anyone whose incentive
        is not aligned with the answer.
      </P>

      <P>
        The next two chains take Bitcoin&apos;s primitive in
        different directions. <Em>Ethereum</Em> turns the ledger into
        a programmable computer that nobody owns. <Em>Monero</Em>{" "}
        keeps the money but hides the transaction graph, restoring
        the property — financial privacy — that Bitcoin&apos;s
        transparent ledger gives away.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Nakamoto, S. (2008).{" "}
          <Em>Bitcoin: A Peer-to-Peer Electronic Cash System</Em>.
        </Li>
        <Li>
          Antonopoulos, A. M. (2017).{" "}
          <Em>Mastering Bitcoin</Em> (2nd ed.). O&apos;Reilly.
        </Li>
        <Li>
          Bitcoin Improvement Proposals (BIPs).{" "}
          <a
            href="https://github.com/bitcoin/bips"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            github.com/bitcoin/bips
          </a>
        </Li>
        <Li>
          Griffin, G. E. (1994).{" "}
          <Em>The Creature from Jekyll Island</Em>.{" "}
          <a
            href="https://archive.org/details/creaturefromjeky0000grif/mode/2up"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            Internet Archive
          </a>
          .
        </Li>
        <Li>
          Ammous, S. (2018). <Em>The Bitcoin Standard</Em>. Wiley.
        </Li>
        <Li>
          Rothbard, M. N. (1963).{" "}
          <Em>What Has Government Done to Our Money?</Em>
        </Li>
      </UList>
    </>
  );
}

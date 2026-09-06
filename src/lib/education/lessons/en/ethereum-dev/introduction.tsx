import { Lead, P, H2, UList, Li, Em, Strong } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function EthereumDevIntroduction() {
  return (
    <>
      <Lead>
        Ethereum is a public computer that nobody owns, and the
        fastest way to understand it is to deploy a small program to
        it and watch strangers use the program without your
        permission. The chain has been described in turn as a{" "}
        &ldquo;world computer,&rdquo; a &ldquo;settlement layer,&rdquo;
        a &ldquo;decentralized application platform,&rdquo; and{" "}
        &ldquo;internet money.&rdquo; None of those descriptions is
        wrong. None is sufficient. The Yellow Paper (Wood, 2014)
        specifies the Ethereum Virtual Machine; the genesis block was
        mined on 30 July 2015; EIP-1559 reshaped the fee market in
        August 2021; The Merge replaced proof-of-work with
        proof-of-stake on 15 September 2022; Shapella unlocked
        validator withdrawals in April 2023. This track teaches the
        chain the way a developer learns it — write something, deploy
        it, watch what happens.
      </Lead>

      <P>
        Ethereum is the priority technical platform for K-OS. The reasons
        are practical: the richest contribution surface in this project is
        in on-chain tooling and the crypto-native creative scene; Ethereum
        and EVM-compatible chains are where the builder energy
        concentrates; and the developer skillset translates across an
        enormous and growing number of L2s, sidechains, and adjacent
        ecosystems. If you build well on Ethereum, you can build well in
        most of the spaces that matter for the next decade of this
        technology.
      </P>

      <P>
        This track does not assume you have used a wallet, written a smart
        contract, or thought much about cryptography. It does assume you
        can program — any modern language is fine; we&apos;ll pick up
        Solidity together — and that you&apos;re willing to read primary
        sources. The Ethereum ecosystem rewards reading the actual specs,
        the actual contracts, and the actual research, not just the
        tutorials about them.
      </P>

      <H2>Why Ethereum, and why not</H2>

      <P>
        Ethereum has legitimate critics and they are not cranks. The most
        persistent line of critique comes from the Bitcoin tradition and
        runs roughly as follows. Ethereum&apos;s public sale ran from
        July to September 2014 — a time-priced presale denominated in
        Bitcoin, with a sizable allocation reserved for the Ethereum
        Foundation and the founding contributors, Vitalik Buterin
        among them. The genesis block was mined the following year,
        on 30 July 2015. Read uncharitably, the presale is an early
        instance of the pattern that has since become standard across
        the token economy: insiders and favoured venture funds
        acquire the asset on terms not available to the retail buyers
        who later supply the exit liquidity. Two years after launch,
        on 17 June 2016, the DAO contract was drained of approximately
        3.6 million ETH through a reentrancy bug, and the community,
        organised around the Ethereum Foundation, voted to hard-fork
        the chain at block 1,920,000 on 20 July 2016 to reverse the
        loss. The dissenting minority kept the original history and has
        continued it under the name Ethereum Classic. To a Bitcoiner the
        two events compose a single argument: a chain with a privileged
        founding allocation and a demonstrated willingness to rewrite its
        own ledger under sufficient social pressure is not a neutral
        settlement layer. It is a governed system whose governors happen
        to be informal.
      </P>

      <P>
        The argument is not wrong, and this track will not pretend it is.
        It is, however, incomplete.
      </P>

      <P>
        The reason Ethereum has retained the loyalty of a specific slice
        of the internet-native cultural world — the Milady and Remilia
        milieu, the Remilio derivatives, the Radbro Webring, the loose
        constellation of NFT-native artists and writers who were present
        on the chain before it was fashionable to be there — is that
        these communities were never primarily interested in Ethereum as
        sound money. They were interested in it as a permanence layer
        for culture. Vitalik Buterin&apos;s working conception of the
        chain, recurring throughout his writing, is of a neutral and
        credibly persistent computational substrate, and that image maps
        cleanly onto what an internet-native artist actually wants from a
        public record: a place where a work, an identity, or a social
        graph can outlive any particular platform, company, or
        nation-state. A useful shorthand for the image is a floating
        castle — a structure whose load is borne by the air around it
        rather than by any specific piece of ground, and which therefore
        cannot be condemned, seized, or rezoned by the authority that
        happens to own the ground beneath it. The Bitcoiner reply that
        this vision is overreaching, and that the willingness to fork
        for the DAO proves the castle is in fact resting on something,
        is fair. The counter-reply is that a partially floating castle
        is already a material advance over the alternative, which is to
        entrust culture to a sequence of corporate databases demolished
        on a rolling cadence.
      </P>

      <P>
        A second-order consequence of the permanence thesis is that the
        part of the ecosystem where serious design work is still
        happening has moved toward strengthening the floor under the
        castle. The current frontier is the L2 problem. The bulk of
        present-day Ethereum activity happens on rollups, and most
        production rollups retain an administrative key that can, in
        principle, modify the contract suite holding user funds without
        giving users a guaranteed interval to withdraw before the change
        takes effect. This is the custody failure the old financial
        system was built on, rebuilt in miniature inside a system that
        was meant to dissolve it. The response from the
        trustless-maximalist corner of the ecosystem is the{" "}
        <Em>exit window</Em> — a rollup property that guarantees users a
        fixed, non-bypassable interval between the announcement of a
        contract upgrade and its execution, long enough that any user
        who objects can remove their funds before the change lands.
      </P>

      <P>
        Sigil, the rollup under construction at the{" "}
        <a
          href="https://github.com/unattended-backpack"
          style={{ color: "#ffff00" }}
          target="_blank"
          rel="noreferrer"
        >
          Unattended Backpack
        </a>{" "}
        organization, is the clearest present expression of that design
        commitment. The org&apos;s public bio is literal on the point —{" "}
        <Em>
          &ldquo;zealously building a rollup uncompromising in its
          trustlessness and commitment to Ethereum alignment&rdquo;
        </Em>{" "}
        — and Sigil&apos;s own materials describe the project as
        &ldquo;an Ethereum L2 for believers,&rdquo; framed as an heir to
        the permanence vision rather than a continuation of the
        financialized L2 model that pursued deposits first and governed
        custody afterward. Its lead contributor, Tim Clancy (ENS{" "}
        <Em>tim-clancy.eth</Em>, GitHub{" "}
        <a
          href="https://github.com/TimTinkers"
          style={{ color: "#ffff00" }}
          target="_blank"
          rel="noreferrer"
        >
          @TimTinkers
        </a>
        ), has published the supporting infrastructure under aggressively
        copyleft terms (Viral Public License coupled with AGPL-3.0)
        specifically to prevent the tooling from being absorbed into a
        closed competitor. The associated build image,{" "}
        <Em>Petros</Em>, is a reproducible Nix-based Docker toolchain
        that vendors its own dependencies to remove the project&apos;s
        exposure to third-party package registries whose contents can
        change without notice. The reproducibility model Petros
        demonstrates is the kind of supply-chain hardening K-OS expects
        to adopt in its own distribution work as that matures.
      </P>

      <P>
        The broader context worth naming is that this work is being done
        under adversarial conditions. The institutional capital now
        entering the L2 space is not, on average, aligned with the
        permanence thesis; its interest in the chain is as a yield
        substrate to be financialized and, where possible, governed into
        a form more familiar to traditional finance. Whether the next
        generation of rollups preserves real user custody or quietly
        reintroduces the older extractive architecture in new packaging
        will be decided by which teams ship working trustless systems
        before the window closes. The cultural cluster this track belongs
        to — internet-native, aesthetically coherent, historically
        oriented toward permanence rather than quarterly returns — has a
        direct stake in that outcome, and on present evidence has a
        workmanlike chance of winning it.
      </P>

      <P>
        That is the broader frame. The track itself is about building;
        the framing is here because several of the design choices you
        will encounter later only parse against it.
      </P>

      <H2>What you&apos;ll be able to do by the end</H2>

      <P>
        By the time you finish this track, you should be comfortable
        doing all of the following without looking it up:
      </P>

      <UList>
        <Li>
          Explain the difference between an externally owned account
          (EOA) and a contract account, and what each can and cannot do.
        </Li>
        <Li>
          Read a transaction on a block explorer and tell, from the
          trace, what the contract did and why it cost what it cost.
        </Li>
        <Li>
          Write a non-trivial Solidity contract from scratch — handling
          state, events, access control, and external calls — without
          copying it from a template.
        </Li>
        <Li>
          Test that contract with unit tests, fuzz tests, and at least
          one invariant test, using Foundry locally on your machine.
        </Li>
        <Li>
          Deploy the contract to a testnet and verify it on a block
          explorer so other people can read its source.
        </Li>
        <Li>
          Read an unfamiliar mainnet contract — pick something live with
          hundreds of millions of dollars in it — and explain to another
          developer what it does, where its risks are, and how it would
          behave under unexpected inputs.
        </Li>
        <Li>
          Recognize the common categories of smart-contract vulnerability
          (reentrancy, access control flaws, integer issues, oracle
          manipulation, donation attacks) when you see them, in code
          that wasn&apos;t labeled.
        </Li>
        <Li>
          Hold an opinion about account abstraction and smart-contract
          wallets, and explain it.
        </Li>
        <Li>
          Place L2s in your mental model — what a rollup is, what it
          isn&apos;t, where data availability fits, why bridges are the
          riskiest part, what an exit window means and why Sigil is the
          project to watch.
        </Li>
      </UList>

      <P>
        This is not a track for becoming a senior smart-contract auditor.
        That takes years of additional reading and adversarial practice.
        It <Em>is</Em> a track for becoming a developer who can build and
        reason carefully on Ethereum, which is the foundation that
        further specialization builds on.
      </P>

      <H2>How this track is structured</H2>

      <Diagram
        cols={6}
        rows={3}
        nodes={[
          { id: "eoa", text: "EOA", col: 0, row: 1, sub: "user wallet" },
          { id: "sign", text: "SIGN TX", col: 1, row: 1, sub: "ECDSA" },
          { id: "mp", text: "MEMPOOL", col: 2, row: 1, sub: "pending" },
          { id: "val", text: "VALIDATOR", col: 3, row: 1, sub: "PoS" },
          { id: "evm", text: "EVM", col: 4, row: 1, accent: true, sub: "execute" },
          { id: "state", text: "STATE", col: 5, row: 1, sub: "trie update" },
          { id: "gas", text: "gas + fee", col: 2, row: 0, shape: "ellipse" },
          { id: "ctr", text: "contract", col: 4, row: 2, shape: "ellipse" },
        ]}
        edges={[
          { from: "eoa", to: "sign" },
          { from: "sign", to: "mp", label: "broadcast" },
          { from: "mp", to: "val", label: "include" },
          { from: "val", to: "evm", label: "run", accent: true },
          { from: "evm", to: "state", label: "commit", accent: true },
          { from: "gas", to: "mp", dashed: true },
          { from: "ctr", to: "evm", dashed: true, label: "code" },
        ]}
        caption="ETHEREUM TX FLOW — EOA SIGNS, MEMPOOL QUEUES, VALIDATOR EXECUTES, STATE COMMITS."
      />

      <P>
        Twelve lessons. The first four build the conceptual model. The
        next three put you in front of a real toolchain (Foundry first,
        with notes on Hardhat for context). The next three turn outward —
        reading other people&apos;s code, understanding what goes wrong
        when it goes wrong, and engaging with the part of Ethereum where
        smart-contract wallets are starting to replace EOAs. The last
        two place all of this in the broader landscape of L2s and tell
        you where to keep reading after the track ends.
      </P>

      <P>
        Code examples are runnable as written. When a lesson points you
        at a real mainnet contract or a real audit report, the link is
        to a primary source — the contract on Etherscan, the audit PDF,
        the research post — not a summary of one.
      </P>

      <H2>How this track is <Em>not</Em> structured</H2>

      <P>
        This is not a tutorial track that gets you to &ldquo;deploy your
        first ERC-20&rdquo; in twenty minutes and calls it complete. The
        reason most people who write their first ERC-20 in twenty minutes
        never write a second contract is that they did not build the
        underlying model that lets them know why theirs is a normal
        ERC-20 and what would make it not one. We will go slower, on
        purpose, so that what you build later you actually understand.
      </P>

      <P>
        This is also not a get-rich-on-tokens track. The track says
        nothing about token prices. It says nothing about which projects
        are good investments. It treats Ethereum the way you would treat
        Linux: as a technical platform you are learning to build on, not
        a financial product you are learning to hold.
      </P>

      <H2>Where to start</H2>

      <P>
        The next lesson — <Strong>Accounts, contracts, and how Ethereum
        thinks about state</Strong> — is the right place to begin. If you
        are coming into this track already comfortable with that
        material, skip to lesson 04 and start from Solidity basics; the
        lessons are designed to be skippable for someone who already
        knows what&apos;s in them.
      </P>

      <P>
        A working K-OS install is not required to follow this track, but
        the in-OS course runner (when it ships) will track your progress
        and run code examples for you in a sandboxed environment. Until
        then, follow the lessons in your editor of choice and run the
        code in your own terminal.
      </P>

      <H2>Audit lens</H2>

      <P>
        Ethereum is governed by rough consensus, not by neutral
        physics. The Yellow Paper, the EIPs, and the client source
        are all public; the social process by which changes get
        adopted is also public, if messier. The reader is invited to
        judge the whole — code, specs, governance — rather than any
        one slice. The chain is what its participants have agreed to
        treat as the chain.
      </P>

      <P>
        The next several lessons converge on Solidity specifically:
        writing, testing, and deploying contracts with Foundry, then
        reading other people&apos;s code, then placing all of it in
        the L2 landscape. The fastest way to understand a public
        computer that nobody owns is to deploy something on it. That
        starts in the next lesson.
      </P>
    </>
  );
}

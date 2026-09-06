import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function CryptographyBasicsIntroduction() {
  return (
    <>
      <Lead>
        Until 1976, the open literature contained no working method
        by which two strangers could agree on a shared secret over a
        public wire without ever having met. Whitfield Diffie and
        Martin Hellman published one in November of that year, in a
        paper titled <Em>New Directions in Cryptography</Em>, with
        explicit credit to Ralph Merkle&apos;s earlier puzzle
        construction. The following year Ron Rivest, Adi Shamir, and
        Leonard Adleman published RSA. From that decade onward,
        ordinary people had access to mathematics that until then had
        lived inside national signals-intelligence agencies — and
        once that mathematics was loose, the long arrangement by
        which a small number of institutions metered the value of
        everyone else&apos;s time began, slowly, to lose its grip.
      </Lead>

      <P>
        This track is a prerequisite for the Privacy, Bitcoin, Monero,
        and (informally) the K-Wallet portion of the user experience.
        It exists because most developers and users meet cryptography
        for the first time when they need it to work, which is the
        worst possible time to learn it. By the end of this track you
        should know what a hash is, what a signature is, what a key
        derivation function is, why seed phrases look like they do,
        and where each of these shows up inside K-OS. The track is
        concept-first; the math is introduced only when it earns its
        place.
      </P>

      <H2>Why this track exists at all</H2>

      <P>
        Cryptography is usually taught as a branch of mathematics or
        as a security tool. K-OS teaches it as something closer to a
        civil right. The reason is historical. For roughly a century
        the mechanisms that determine the value of a person&apos;s
        time — their wage, their savings, their ability to transact
        without a permission slip — have been administered by a
        narrow set of institutions whose incentives are not aligned
        with the people whose lives they meter. The most rigorous
        accounts of that arrangement come from Ludwig von Mises{" "}
        (<Em>The Theory of Money and Credit</Em>, 1912), Friedrich
        Hayek, and Murray Rothbard; the most popular and accessible
        is G. Edward Griffin&apos;s <Em>The Creature from Jekyll
        Island</Em> (1994), which traces the U.S. Federal Reserve to
        a private 1910 meeting on Jekyll Island off the coast of
        Georgia. The pattern these writers describe — currency
        debasement, interest levied on debt issued against nothing,
        and cyclical crises that transfer losses upward on a
        timescale long enough to evade generational memory — is
        consistent with the observed history of every fiat regime on
        record.
      </P>

      <P>
        Cryptography is the first technology in recorded history that
        lets ordinary people step out of that architecture without
        asking permission from anyone administering it. A signature
        scheme provides a way to prove ownership that no committee
        can revoke. A hash function provides a way to record history
        that no one can silently rewrite. A key derivation function
        provides a way to carry an entire financial identity across a
        border in one&apos;s head. Each primitive, studied on its
        own, is a small technical idea. Studied together, they
        describe a regime in which the machinery that has long
        metered human time and attention simply has nothing to grip
        onto.
      </P>

      <H2>The dates worth knowing</H2>

      <Diagram
        cols={6}
        rows={1}
        nodes={[
          { id: "dh", text: "DH", col: 0, row: 0, sub: "1976" },
          { id: "rsa", text: "RSA", col: 1, row: 0, sub: "1977" },
          { id: "merkle", text: "Merkle Tree", col: 2, row: 0, sub: "1979" },
          { id: "sha", text: "SHA-256", col: 3, row: 0, sub: "2001" },
          { id: "btc", text: "Bitcoin", col: 4, row: 0, accent: true, sub: "2008" },
          { id: "kos", text: "K-OS", col: 5, row: 0, sub: "today" },
        ]}
        edges={[
          { from: "dh", to: "rsa" },
          { from: "rsa", to: "merkle" },
          { from: "merkle", to: "sha" },
          { from: "sha", to: "btc", accent: true },
          { from: "btc", to: "kos", dashed: true },
        ]}
        caption="PUBLIC-KEY CRYPTOGRAPHY ENTERS THE OPEN LITERATURE — AND COMPOSES."
      />

      <UList>
        <Li>
          <Em>November 1976</Em> — Diffie and Hellman,{" "}
          <Em>New Directions in Cryptography</Em>; first public-key
          exchange.
        </Li>
        <Li>
          <Em>1977</Em> — Rivest, Shamir, Adleman publish RSA.
        </Li>
        <Li>
          <Em>1979</Em> — Merkle publishes the hash-tree construction
          that now bears his name; the structural primitive behind
          Bitcoin&apos;s blocks and IPFS&apos;s directories.
        </Li>
        <Li>
          <Em>2001</Em> — NIST publishes SHA-256 (FIPS 180-4); the
          hash function used by Bitcoin and most modern systems.
        </Li>
        <Li>
          <Em>2008</Em> — Satoshi Nakamoto publishes the Bitcoin
          whitepaper, the first system to compose all of the above
          into a running ledger that no single party administers.
        </Li>
      </UList>

      <H2>Audit lens</H2>

      <P>
        Cryptography is one of the few technical disciplines where
        the public literature is still ahead of the engineering. The
        primitives this track names — public-key exchange, hash
        functions, key derivation, signatures, Merkle trees — are
        each documented in papers any reader can find, implemented in
        open-source libraries any reader can audit, and used in
        production by systems any reader can run. The reader is
        invited to verify each claim before trusting any tool built
        on it. That posture — read the paper, read the code, read the
        threat model — is the discipline this track is trying to hand
        forward.
      </P>

      <P>
        The next track is Bitcoin: the first system to assemble these
        primitives into a running ledger that no single party
        administers, and the first place a reader new to cryptography
        can watch the math do work in the open.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Diffie, W. &amp; Hellman, M. (1976).{" "}
          <Em>New Directions in Cryptography</Em>. IEEE Transactions
          on Information Theory.
        </Li>
        <Li>
          Rivest, R., Shamir, A., &amp; Adleman, L. (1978).{" "}
          <Em>A Method for Obtaining Digital Signatures and
          Public-Key Cryptosystems</Em>. Communications of the ACM.
        </Li>
        <Li>
          Merkle, R. (1979).{" "}
          <Em>Secrecy, Authentication, and Public Key Systems</Em>.
          Stanford PhD thesis.
        </Li>
        <Li>
          Mises, L. von. (1912).{" "}
          <Em>The Theory of Money and Credit</Em>.
        </Li>
        <Li>
          Rothbard, M. N. (1994). <Em>The Case Against the Fed</Em>.
          Mises Institute.
        </Li>
        <Li>
          Griffin, G. E. (1994).{" "}
          <Em>
            The Creature from Jekyll Island: A Second Look at the
            Federal Reserve
          </Em>
          . American Media.{" "}
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
      </UList>
    </>
  );
}

import { Lead, P, H2, UList, Li, Em, Code } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function IPFS() {
  return (
    <>
      <Lead>
        Imagine a web in which the link itself cannot lie about what
        it points to. The InterPlanetary File System is the
        proposal — and the working implementation — for addressing
        documents by what they are rather than by where they live.
        First described by Juan Benet in 2014 and developed inside
        Protocol Labs, IPFS replaces the HTTP request for a URL with
        a content-addressed lookup: you ask the network for the
        document whose hash is <Em>X</Em>, and the network returns
        any copy it can find. The move from location-addressing to
        content-addressing is small in description and large in
        consequence. A web in which documents are named by their
        content is not a web in which a single authority can silently
        change, sanction, or erase one.
      </Lead>

      <H2>How it works</H2>

      <Diagram
        cols={5}
        rows={3}
        nodes={[
          { id: "file", text: "FILE", col: 0, row: 1, sub: "bytes" },
          { id: "hash", text: "HASH", col: 1, row: 1, shape: "diamond", sub: "SHA-256" },
          { id: "cid", text: "CID", col: 2, row: 1, accent: true, sub: "bafy..." },
          { id: "dht", text: "DHT LOOKUP", col: 3, row: 1, sub: "libp2p" },
          { id: "peer", text: "Peer", col: 4, row: 0, sub: "holds block" },
          { id: "verify", text: "Verify", col: 4, row: 2, sub: "rehash == CID" },
        ]}
        edges={[
          { from: "file", to: "hash", label: "multihash" },
          { from: "hash", to: "cid", accent: true },
          { from: "cid", to: "dht", label: "ask network" },
          { from: "dht", to: "peer", label: "bitswap" },
          { from: "peer", to: "verify", dashed: true },
          { from: "verify", to: "cid", label: "match", dashed: true, accent: true },
        ]}
        caption="CONTENT-ADDRESSING — THE LINK CANNOT LIE ABOUT WHAT IT POINTS TO."
      />

      <P>
        Every file added to IPFS is hashed under a self-describing
        wrapper called <Em>multihash</Em> (SHA-256 is the common
        default, but the format names the algorithm in its prefix so
        the system can migrate as primitives age), and the hash
        becomes its <Em>Content Identifier</Em> or CID. A CID looks
        like{" "}
        <Code>bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi</Code>.
        Directories and large files are split into chunks, each of
        which is itself a content-addressed node; the parent object
        is a Merkle-DAG whose edges are CIDs. Nodes advertise the CIDs
        they hold through a distributed hash table (the libp2p DHT),
        and exchange the actual blocks through <Em>Bitswap</Em>, the
        protocol that negotiates which peer sends which block to whom.
        If the content changes, the CID changes. If two users upload
        identical files, they upload the same CID, and the network
        naturally deduplicates.
      </P>

      <H2>What it breaks, and what it offers in exchange</H2>

      <P>
        The central breakage is the link. An HTTP link points at a
        host; the host can serve anything at that link, or refuse
        to, and the link will not know. An IPFS link points at a
        document; the document cannot be silently altered under the
        link without the link changing. This is exactly the property
        archives, legal citations, scientific papers, and any
        long-horizon record actually want, and it is exactly the
        property the advertising web has not delivered. The cost is
        that IPFS does not, by itself, guarantee persistence. A
        CID with no one hosting its content is a valid address that
        resolves to nothing. The network distinguishes{" "}
        <Em>addressing</Em> from <Em>hosting</Em> and treats them as
        separate problems.
      </P>

      <H2>Filecoin and the persistence problem</H2>

      <P>
        Protocol Labs&apos; second project, Filecoin, is the
        economic layer over the persistence problem. Filecoin{" "}
        <Em>storage providers</Em> (the post-mainnet term, replacing
        the original &ldquo;miners&rdquo;) offer verifiable storage
        deals — cryptographic proofs that they are, right now,
        holding a particular CID — in exchange for payment in FIL,
        the Filecoin token. The Filecoin mainnet launched on 15
        October 2020 following a 2017 initial coin offering that
        raised approximately $257 million. The integration is clean:
        an IPFS user who wants durability can pay for Filecoin deals
        against their CIDs and treat the deals as ongoing storage
        contracts; the content remains accessible by any IPFS client
        whether or not it ever touches Filecoin.
      </P>

      <H2>Uses in the field</H2>

      <P>
        The Brave browser ships native IPFS support; an{" "}
        <Code>ipfs://</Code> URL resolves through the browser&apos;s
        embedded node. The Ethereum Name Service stores many .eth
        domain records as IPFS CIDs, so that a human-readable name
        resolves to a content-addressed site. Several national-scale
        archives — the Catalan referendum sites in 2017, the
        Wikipedia Turkish mirror during the April 2017 – December
        2019 block, a number of censored news sites — were kept
        accessible through IPFS during periods when their origin
        hosts were unreachable. The
        property being exercised in those cases is specifically the
        one the protocol is designed around: that a document which
        has a CID can be kept alive by anyone who cares to keep it
        alive, and that the hostname which formerly granted and
        revoked access to it no longer sits at the centre of the
        system.
      </P>

      <H2>Audit lens</H2>

      <P>
        IPFS does not, on its own, make a document private. CIDs
        are public by construction; any node that learns of a CID
        can request its content. Privacy tools atop IPFS
        (encryption at the application layer, private swarms) are
        available but are not the default. The property IPFS
        provides is <Em>integrity and resilience of address</Em>,
        not confidentiality. The reader who wants confidentiality
        adds an encryption layer; the reader who wants to ensure
        the document they published last year still says what they
        said then, without depending on the goodwill of a single
        host, gets what content-addressing alone can give them.
      </P>

      <P>
        Re-architecting addresses changes what a single host can do
        and not do. The next lesson moves the same logic to value
        itself — what happens when financial rails are re-architected
        the way IPFS re-architects content, when settlement and worth
        follow the logic of verifiable addresses rather than trusted
        ledgers. The constituency that names that move calls it the{" "}
        <Em>Quantum Financial System</Em>; this track takes their
        framing seriously and looks at what the technology side of
        the transition actually requires.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Benet, J. (2014).{" "}
          <Em>IPFS — Content Addressed, Versioned, P2P File System</Em>.{" "}
          <a
            href="https://github.com/ipfs/papers"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            github.com/ipfs/papers
          </a>
        </Li>
        <Li>
          Protocol Labs. <Em>Filecoin: A Decentralized Storage
          Network</Em> (2017 whitepaper).
        </Li>
        <Li>
          The IPFS Specifications.{" "}
          <a
            href="https://specs.ipfs.tech"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            specs.ipfs.tech
          </a>
        </Li>
        <Li>
          libp2p — the networking library underneath IPFS.{" "}
          <a
            href="https://libp2p.io"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            libp2p.io
          </a>
        </Li>
      </UList>
    </>
  );
}

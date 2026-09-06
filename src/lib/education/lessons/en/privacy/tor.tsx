import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function Tor() {
  return (
    <>
      <Lead>
        Tor is the most widely deployed anonymity network in the
        world, and it is also, in a way its marketing rarely
        emphasises, a product with a specific origin. The
        onion-routing construction was designed in the mid-1990s at
        the U.S. Naval Research Laboratory by Paul Syverson, Michael
        Reed, and David Goldschlag (first paper, 1996), and the
        present Tor Project — spun out as an independent nonprofit in
        December 2006 — was incubated under substantial funding from
        the U.S. State Department, the Defense Advanced Research
        Projects Agency, and the Broadcasting Board of Governors
        (renamed U.S. Agency for Global Media in 2018). A sober
        privacy discipline treats the provenance and the utility of
        Tor as two distinct facts and refuses to collapse either one
        into the other.
      </Lead>

      <H2>How it works</H2>

      <Diagram
        cols={6}
        rows={3}
        nodes={[
          { id: "user", text: "User", col: 0, row: 1, accent: true, shape: "ellipse", sub: "client" },
          { id: "guard", text: "Guard", col: 1, row: 1, sub: "sees user" },
          { id: "middle", text: "Middle", col: 2, row: 1, sub: "sees neither" },
          { id: "exit", text: "Exit", col: 3, row: 1, sub: "sees dest" },
          { id: "dest", text: "Destination", col: 5, row: 1, shape: "ellipse", sub: "server" },
        ]}
        edges={[
          { from: "user", to: "guard", label: "layer 1", accent: true },
          { from: "guard", to: "middle", label: "layer 2" },
          { from: "middle", to: "exit", label: "layer 3" },
          { from: "exit", to: "dest", label: "plaintext", dashed: true },
        ]}
        caption="THREE-HOP CIRCUIT — EACH RELAY KNOWS ONLY ITS NEIGHBOURS."
      />

      <P>
        A Tor circuit is a three-hop chain of volunteer-run relays —
        an entry (or <Em>guard</Em>), a middle, and an exit — such
        that each relay knows only its immediate predecessor and
        successor. The client encrypts a packet in three nested
        layers of symmetric cryptography, one per relay; as the
        packet traverses the circuit each relay peels one layer, so
        that the entry node sees the user but not the destination,
        the exit node sees the destination but not the user, and no
        single node sees both. Hidden services (<Em>.onion</Em>{" "}
        addresses) extend the construction so that neither endpoint
        needs to know the other&apos;s network location; the circuit
        meets at an introduction point chosen by the service and a
        rendezvous point chosen by the client.
      </P>

      <H2>What Tor defeats, and what it does not</H2>

      <P>
        Tor defeats the passive observer between the user&apos;s
        machine and the destination. It defeats the destination&apos;s
        attempt to identify the user by IP address. It defeats the
        ISP&apos;s ability to see the content of the user&apos;s
        traffic or the domains requested. It does not defeat a global
        passive adversary with visibility into both ends of the
        circuit simultaneously — traffic-confirmation attacks against
        that adversary are a known limitation documented in the
        threat model. It does not defeat an application that leaks
        identifying information at the application layer (a logged-in
        account, a browser fingerprint, JavaScript-originated DNS
        lookups). It does not defeat endpoint compromise. It does not
        defeat the user themselves, who remains the largest single
        source of deanonymising events in practice.
      </P>

      <H2>The funding question</H2>

      <P>
        The Tor Project&apos;s annual reports are public. U.S.
        government sources have represented a majority of its funding
        in most years since 2006, declining to roughly half by the
        early 2020s as individual and foundation donations grew. The
        reader is invited to draw their own inference from that
        record. Two readings circulate. The first reads the funding
        as sponsorship of a tool whose primary beneficiaries — U.S.
        diplomats, dissidents in adversary states, military and
        intelligence field operatives — are served by an anonymity
        network being as populous and heterogeneous as possible,
        which requires free public access. The second reads it as
        structural compromise. The record is consistent with either
        reading and does not, on the present public evidence,
        distinguish between them.
      </P>

      <H2>Audit lens</H2>

      <P>
        Tor is a serious engineering project whose source is
        public, whose specification is public, whose funding is
        public, and whose limits are explicitly documented. A user
        who treats it as magic will be deanonymised. A user who
        treats it as a specific instrument for a specific threat —
        preventing the network observer and the destination from
        correlating the request with the user&apos;s IP — will find
        it works as advertised. The threat model is the document
        worth reading before the documentation.
      </P>

      <P>
        The next lesson takes the discipline down one layer of the
        stack, from the network to the browser. <Em>Brave</Em> is the
        Chromium-based browser that treats the advertising economy
        itself as the threat model, blocks third-party trackers by
        default, and ships its own opinionated takes on Tor
        integration and crypto rails. The same audit posture applies
        — read the funding, read the threat model, decide what the
        tool has actually bought you.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Dingledine, R., Mathewson, N., &amp; Syverson, P. (2004).{" "}
          <Em>Tor: The Second-Generation Onion Router</Em>. USENIX
          Security Symposium.
        </Li>
        <Li>
          Syverson, P., Goldschlag, D., &amp; Reed, M. (1997).{" "}
          <Em>Anonymous Connections and Onion Routing</Em>. IEEE
          Symposium on Security and Privacy.
        </Li>
        <Li>
          The Tor Project. <Em>Tor Design Specifications</Em>.{" "}
          <a
            href="https://spec.torproject.org"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            spec.torproject.org
          </a>
        </Li>
        <Li>
          The Tor Project. <Em>Annual Reports and Financials</Em>.{" "}
          <a
            href="https://www.torproject.org/about/reports/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            torproject.org/about/reports
          </a>
        </Li>
        <Li>
          Levine, Y. (2018).{" "}
          <Em>Surveillance Valley: The Secret Military History of the
          Internet</Em>. PublicAffairs. (Critical reading of the Tor
          funding record.)
        </Li>
      </UList>
    </>
  );
}

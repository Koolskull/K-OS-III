import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function PrivacyIntroduction() {
  return (
    <>
      <Lead>
        Privacy is a discipline, not a vibe, and the discipline
        begins with a refusal: the refusal to confuse a tool you
        have installed with a threat you have actually defeated.
        The first move in any serious privacy work is threat
        modelling — deciding what you are protecting, from whom, at
        what cost, and writing down the residual risk you accept
        before you touch a tool. The track is honest about limits.
        Tor does not make you anonymous if you log into Gmail.
        Monero does not make you private if you withdraw to a KYC
        exchange the next day. End-to-end encryption does not help
        you if your endpoint is compromised. Most &ldquo;privacy
        tools&rdquo; marketed to consumers buy modest improvements
        at best, and a few make things worse. The point of this
        track is to teach you to think in tradeoffs rather than in
        slogans.
      </Lead>

      <H2>The four questions</H2>

      <Diagram
        cols={5}
        rows={3}
        nodes={[
          { id: "tm", text: "THREAT MODEL", col: 2, row: 1, accent: true, shape: "diamond", sub: "discipline" },
          { id: "what", text: "WHAT?", col: 0, row: 0, sub: "asset to protect" },
          { id: "whom", text: "FROM WHOM?", col: 4, row: 0, sub: "adversary" },
          { id: "cost", text: "AT WHAT COST?", col: 0, row: 2, sub: "usability tradeoff" },
          { id: "res", text: "RESIDUAL RISK", col: 4, row: 2, sub: "accepted, written" },
        ]}
        edges={[
          { from: "tm", to: "what", label: "1" },
          { from: "tm", to: "whom", label: "2" },
          { from: "tm", to: "cost", label: "3" },
          { from: "tm", to: "res", label: "4", accent: true },
        ]}
        caption="FOUR QUESTIONS BEFORE A TOOL — ANSWER ALL FOUR OR DO NOT INSTALL."
      />

      <P>
        A usable threat model answers four questions before it
        touches a tool. <Em>What am I protecting?</Em> A password, a
        location history, a social graph, a sum of money, a
        manuscript, a conversation — each has a different shape and
        each requires a different defense. <Em>From whom?</Em> A
        nosy roommate, a commercial data broker, a local police
        department, a national security service, and a determined
        private adversary are not the same opponent, and a tool that
        defeats one will often be transparent to another.{" "}
        <Em>At what cost?</Em> Every privacy measure has a usability
        cost, a reliability cost, and often a social cost; a
        protection that makes you refuse to do the work you were
        going to do anyway is a failed protection.{" "}
        <Em>What is the residual risk I accept?</Em> Writing down the
        residual explicitly keeps the reader from lying to themselves
        about the remaining attack surface.
      </P>

      <H2>What this track covers</H2>

      <P>
        Three technologies and one mindset. The technologies are
        <Em> Tor</Em>, the anonymity network whose origin, funding,
        and real threat model the marketing has rarely described
        plainly; <Em>Brave</Em>, the browser that treats the ad
        economy as a threat model rather than as a substrate; and
        <Em> IPFS</Em>, the content-addressed alternative to the
        HTTP web, which re-architects where documents live and how
        they are retrieved. The mindset is the discipline of not
        deceiving yourself about what a measure has actually bought
        you. A user who believes themselves anonymous while trivially
        identifiable is more exposed than a user who knows they are
        identifiable and behaves accordingly.
      </P>

      <H2>Audit lens</H2>

      <P>
        Every tool named in this track has a public threat model, a
        public source, and a public funding record. The reader is
        invited to audit each one against the four questions above
        before trusting it, and to re-audit it annually, because
        threat models age. A tool that was right for you last year
        may have been acquired, subpoenaed, or quietly re-scoped in
        the meantime. Privacy is maintenance work — the citizen who
        takes care of themselves and is considerate of how they
        interact with others does that work patiently, and on the
        network, that care is spelled <Em>threat model</Em>.
      </P>

      <P>
        The next lesson is <Em>Tor</Em>: the most widely deployed
        anonymity network, the cleanest provenance-vs-utility case
        study in the curriculum, and the privacy tool most commonly
        half-understood by the people who rely on it. Read the
        funding, read the threat model, decide what the tool has
        actually bought you, and then keep going.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Electronic Frontier Foundation.{" "}
          <Em>Surveillance Self-Defense</Em>.{" "}
          <a
            href="https://ssd.eff.org"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            ssd.eff.org
          </a>
        </Li>
        <Li>
          Schneier, B. (2015).{" "}
          <Em>Data and Goliath: The Hidden Battles to Collect Your
          Data and Control Your World</Em>. W. W. Norton.
        </Li>
        <Li>
          Greenwald, G. (2014).{" "}
          <Em>No Place to Hide: Edward Snowden, the NSA, and the
          U.S. Surveillance State</Em>. Metropolitan.
        </Li>
        <Li>
          Shostack, A. (2014).{" "}
          <Em>Threat Modeling: Designing for Security</Em>. Wiley.
          (The reference text behind the four-questions methodology
          in this lesson.)
        </Li>
      </UList>
    </>
  );
}

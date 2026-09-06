import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function BraveBrowser() {
  return (
    <>
      <Lead>
        Brave is a web browser that treats the modern ad ecosystem as
        a threat model rather than as the air the page breathes.
        Brave Software was founded on 28 May 2015 by Brendan Eich —
        the creator of JavaScript and a co-founder of the Mozilla
        project, removed as Mozilla Corporation&apos;s CEO on 3 April
        2014 following public pressure over a political donation —
        and shipped its first stable release in 2019. The browser
        blocks trackers, resists fingerprinting, refuses third-party
        cookies, and refuses scripts by default; it ships a built-in
        Tor-mode window for selected tabs and a native Ethereum
        wallet. It is also the delivery vehicle for the Basic
        Attention Token, an attempt to replace the surveillance-driven
        ad economy with a consent-based one.
      </Lead>

      <H2>What it blocks, and what that buys</H2>

      <Diagram
        cols={5}
        rows={3}
        nodes={[
          { id: "req", text: "Web Request", col: 0, row: 1, sub: "page load" },
          { id: "engine", text: "BRAVE", col: 2, row: 1, accent: true, shape: "diamond", sub: "default shields" },
          { id: "trk", text: "Trackers + 3P Cookies", col: 3, row: 0, sub: "dropped" },
          { id: "fp", text: "Fingerprint Surfaces", col: 3, row: 2, sub: "randomised" },
          { id: "scr", text: "3P Scripts", col: 1, row: 0, sub: "refused" },
          { id: "clean", text: "Clean Page", col: 4, row: 1, accent: true, sub: "to user" },
        ]}
        edges={[
          { from: "req", to: "engine" },
          { from: "engine", to: "trk", label: "block", dashed: true },
          { from: "engine", to: "fp", label: "block", dashed: true },
          { from: "engine", to: "scr", label: "block", dashed: true },
          { from: "engine", to: "clean", accent: true },
        ]}
        caption="DEFAULT BRAVE PIPELINE — TRACKERS DROPPED, FINGERPRINT NARROWED, CLEAN PAGE DELIVERED."
      />

      <P>
        Default Brave blocks the large known trackers (Google
        Analytics, Facebook Pixel, the advertising graphs of the
        major ad-tech platforms), randomises a set of browser
        fingerprinting surfaces on a per-session and per-site basis,
        and refuses third-party cookies. The network-level
        protections are visible in the traffic logs and are
        measurable against an instrumented test page. The
        fingerprinting protections are partial; a serious
        fingerprinter that aggregates stable surfaces (canvas,
        audio, WebGL, the installed-font list, time-zone plus
        language plus accept headers) will still correlate many
        Brave sessions to a single user. Brave narrows the
        fingerprint; it does not eliminate it.
      </P>

      <H2>Basic Attention Token</H2>

      <P>
        BAT is an ERC-20 token; its initial coin offering closed on
        31 May 2017 (the public sale sold out in roughly thirty
        seconds). The model: the browser can, at the user&apos;s option, show a
        rotation of privacy-preserving advertisements served from
        the local machine (no ad-network tracking of the
        impression), and pay the viewer in BAT for their attention.
        Creators — websites, streamers, content producers — can
        verify with Brave and receive BAT tips from users. The
        economic claim is that the ad ecosystem&apos;s profit
        currently sits with the intermediaries, and that moving the
        match to the user&apos;s own machine redistributes that
        profit to the two parties who actually participated. The
        ethical claim is that ads chosen and delivered without
        tracking are a different object from ads chosen by a
        surveillance graph, and that the user should be allowed the
        choice. BAT adoption has been substantial — tens of millions
        of monthly active users, hundreds of thousands of verified
        creators — without having overturned the incumbent ad
        economy.
      </P>

      <H2>The Eich question</H2>

      <P>
        Eich&apos;s removal from Mozilla in April 2014 — eleven days
        after becoming CEO, following reporting that he had donated
        a thousand dollars in 2008 to the California Proposition 8
        campaign — is relevant to Brave&apos;s political
        identification and to the community that has grown around
        it. The episode is widely cited in the browser&apos;s
        reception as an instance of the ideological policing that a
        privacy-first tool is implicitly positioning against. The
        reader can form their own judgement; the factual record is
        that Eich left Mozilla, founded Brave, and the project&apos;s
        technical decisions have been consistent with the stated
        privacy posture regardless of what one thinks of the
        departure.
      </P>

      <H2>Audit lens</H2>

      <P>
        Brave is Chromium under the hood, which means it inherits
        Chromium&apos;s attack surface and engine decisions. The
        user who wants to test the claims of default privacy
        against a live ad-tech stack can do so; the EFF&apos;s{" "}
        <Em>Cover Your Tracks</Em> and similar instrumented test
        pages produce reproducible measurements. The user who
        expects Brave to make them anonymous will be disappointed.
        The user who treats it as a browser with the tracking
        defaults inverted — ship privacy by default, require
        opt-in for surveillance — will find the product does that.
      </P>

      <P>
        Brave changes who sees the request. It does not change where
        the page itself lives. The next lesson moves from the browser
        to the substrate: <Em>IPFS</Em>, and what it means to address
        a file by its content rather than by the server that happens
        to be holding it.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Brave Software. <Em>Brave Privacy Whitepaper</Em>.{" "}
          <a
            href="https://brave.com/privacy"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            brave.com/privacy
          </a>
        </Li>
        <Li>
          Eich, B., et al. (2017).{" "}
          <Em>Basic Attention Token Whitepaper</Em>.{" "}
          <a
            href="https://basicattentiontoken.org"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            basicattentiontoken.org
          </a>
        </Li>
        <Li>
          Englehardt, S. &amp; Narayanan, A. (2016).{" "}
          <Em>Online Tracking: A 1-million-site Measurement and
          Analysis</Em>. Princeton / ACM CCS. (Baseline for what the
          ambient web tracks.)
        </Li>
        <Li>
          EFF Cover Your Tracks.{" "}
          <a
            href="https://coveryourtracks.eff.org"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            coveryourtracks.eff.org
          </a>
        </Li>
      </UList>
    </>
  );
}

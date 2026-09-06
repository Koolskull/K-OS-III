import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function SelfSovereignty() {
  return (
    <>
      <Lead>
        Self-sovereignty is a civic posture before it is a stack of
        tools. In the sense this track intends, it is the working
        assumption that a free person takes practical care of
        themselves, holds the keys to what is theirs, and treats
        other people with the regard they expect in return. The
        curriculum lays out the cryptographic and operational tools
        that make the posture possible at internet scale, but the
        tools are downstream of the citizen who picks them up. A
        person who cannot be bothered to care for themselves or for
        their neighbour is not made sovereign by better software.
      </Lead>

      <H2>What the word is carrying</H2>

      <P>
        <Em>Sovereign</Em> is an old word and it is doing work in
        two registers at once. In the political register, it names
        the final human authority over a territory or a life;
        historically the sovereign was a person, then a throne,
        then — in the constitutional tradition the United States
        and its descendants inherited — the people themselves,
        individually and in common. In the operational register,
        which is the one the rest of this track cares about, a
        sovereign actor is simply one who can say <Em>no</Em> to
        an external demand and make the <Em>no</Em> stick. A
        person who controls their own keys can say no to a
        custodian freezing their account. A person who runs their
        own node can say no to an intermediary editing what they
        see. A person who holds paper backups in a place an
        adversary cannot reach can say no to a ransom. The word
        is doing the same work in both registers.
      </P>

      <H2>The civic half</H2>

      <P>
        The curriculum wants readers who take care of themselves
        and are considerate of how they interact with others.
        Those two clauses are not decorative. Most of the damage
        done in the name of privacy and sovereignty over the past
        fifteen years has been done by people who took the first
        clause and dropped the second: operators who moved fast
        and broke the lives of their users, promoters who sold
        coins they knew were worthless, projects that treated
        &ldquo;uncensorable&rdquo; as a licence to host what no
        neighbour would tolerate in physical space. A tradition
        that cannot hold the two clauses together does not
        survive contact with the public, and it does not deserve
        to. The opposite failure is also real: a citizen who
        outsources every decision to a platform, a regulator, or
        a doctor has not become considerate, only dependent, and
        the dependence is the condition the tools in this track
        are designed to treat.
      </P>

      <H2>The operational half</H2>

      <P>
        Operationally, self-sovereignty is the union of several
        practical capacities. <Em>Key custody</Em>: the ability to
        generate, store, back up, and use private keys without
        trusting a third party to do any of those steps for you.
        <Em> Data custody</Em>: the ability to keep one&apos;s own
        records — financial, medical, creative, relational —
        outside an environment where a platform can edit,
        surveil, or revoke them. <Em>Identity custody</Em>: the
        ability to present oneself to a counter-party under the
        name and in the form one chooses, without handing over
        more than the transaction requires. <Em>Compute custody</Em>:
        the ability to run the software you depend on on hardware
        you control, so that an update cannot quietly rewrite the
        terms of the tool you have been using. None of the four
        is total; each is a slider that can be pushed toward the
        sovereign end at the cost of convenience, and each
        usually is being pushed the other way by default.
      </P>

      <Diagram
        cols={5}
        rows={3}
        nodes={[
          { id: "core", text: "SELF-SOVEREIGNTY", col: 1, row: 1, span: 3, accent: true, sub: "say no, make it stick" },
          { id: "key", text: "KEY CUSTODY", col: 0, row: 0, sub: "private keys" },
          { id: "data", text: "DATA CUSTODY", col: 4, row: 0, sub: "your records" },
          { id: "id", text: "IDENTITY CUSTODY", col: 0, row: 2, sub: "chosen name/form" },
          { id: "compute", text: "COMPUTE CUSTODY", col: 4, row: 2, sub: "your hardware" },
        ]}
        edges={[
          { from: "core", to: "key", accent: true },
          { from: "core", to: "data", accent: true },
          { from: "core", to: "id", accent: true },
          { from: "core", to: "compute", accent: true },
        ]}
        caption="THE FOUR CUSTODIES — EACH A SLIDER, NONE TOTAL, ALL DOWNSTREAM OF THE CITIZEN."
      />

      <H2>What this looks like in practice</H2>

      <P>
        A sovereign-leaning day-to-day does not require a Faraday
        cage or a Liechtenstein shell company. In most cases
        it looks like: a hardware wallet that the bank does not
        see; at least one self-hosted service (email relay, file
        sync, notes) that you could move between providers in an
        afternoon; full-disk encryption on every device; a
        password manager whose vault you could export tomorrow;
        private keys written down on paper and stored in two
        places; a mobile number that is not the only factor
        anywhere that matters; a small recurring effort to audit
        which third parties hold which pieces of you. None of
        these costs much; together they produce a citizen who, if
        their primary platform disappeared overnight, would lose a
        morning and not a life. The purpose of the exercise is
        not paranoia; it is the ordinary civic dignity of being
        difficult to erase.
      </P>

      <H2>The Greenpill Map</H2>

      <P>
        Readers who want a single visual synthesis of the
        civic, bodily, practical, and spiritual currents feeding
        the modern self-sovereignty conversation should sit with
        <Em> The Green Pill</Em>, compiled by Veil Removed and
        subtitled <Em>Freedom Protocol &middot; New Templars &middot;
        Year 32</Em>. The map is organised as a four-cornered
        almanac. Each corner is a cardinal virtue; each virtue
        comes with a list of roughly seventeen first-person
        tenets that, taken together, describe what living inside
        that virtue actually looks like on a Tuesday.
      </P>

      <P>
        The four corners, in the map&apos;s own language:{" "}
        <Em>Sovereign &middot; Independent &middot; Rightful &middot;
        Free</Em> (the civic axis, keyed to the element Earth and
        the virtue of <Em>stability</Em>);{" "}
        <Em>Strong &middot; Healthy &middot; Natural &middot; Pure</Em>{" "}
        (the bodily axis, keyed to alignment with nature and the
        sources of food, medicine, and air);{" "}
        <Em>Safe &middot; Capable &middot; Prepared &middot; Secure</Em>{" "}
        (the practical axis, keyed to first aid, water, navigation
        without technology, defence of home and self); and{" "}
        <Em>Loving &middot; Creative &middot; Grounded &middot;
        Spiritual</Em> (the metaphysical axis, keyed to the claim
        that &ldquo;love is a technology, not an emotion&rdquo; and
        that the co-creator has obligations upward and downward).
        Around the outside of the map sit the paired principles the
        corners descend from — <Em>Masculine &middot; Courage</Em>,{" "}
        <Em>Feminine &middot; Wisdom</Em>, <Em>Love</Em>, and{" "}
        <Em>Vision</Em> — and the four classical elements.
      </P>

      <P>
        The map ships as two plates. The first is the four-virtue
        almanac described above. The second reorganises the same
        territory as four <Em>powers</Em> — the power of the
        Mind (<Em>Secure</Em>), the power of the Body
        (<Em>Strong</Em>), the power of the Spirit
        (<Em>Spiritual</Em>), and the power of the People
        (<Em>Sovereign</Em>) — and under each power lists roughly
        twenty-three practices a reader can research, plan, and
        adopt. Under <Em>Secure</Em>: firemaking, first aid,
        foraging, map navigation, rain gathering, regenerative
        farming, sanitation, shelter building, water purification.
        Under <Em>Strong</Em>: fasting, hydration and alkalinity,
        intuitive eating, meditation and breathwork, plant
        medicine, Schumann resonance, sleep, sound healing, sun
        exposure. Under <Em>Spiritual</Em>: ancient texts, ascended
        masters, discourse, Hero&apos;s Journey, intuitiveness,
        karmic balance, laws of creation, prayer, return to source,
        service to others. Under <Em>Sovereign</Em>: American
        Revolution, bartering, civic duty, constitutional republic,
        due process, entrepreneurship, free speech, gold and silver,
        grand juries, homesteading, landownership, laws of the
        land, Magna Carta, pioneer life, representative government,
        states&apos; rights. The instruction the map attaches to
        the lists is load-bearing: <Em>take what resonates and
        discard the rest</Em>.
      </P>

      <P>
        The map is issued under the Veil Removed imprint, is
        published as part of the Deep State Mapping Project
        (deepstatemappingproject.com), and carries — at the
        bottom plate, small but unambiguous — the signature
        <Em> Ashtar Command</Em>. The reader who has come through
        the Esoterica track already knows that phrase and its
        George Van Tassel origin; the curriculum flags the
        lineage rather than pretending the artifact is secular.
        The tagline the map travels under — <Em>a Green Pill a
        day keeps the Black Pill away</Em> — is serious and not
        serious in the same breath, which is about the right
        posture.
      </P>

      <P>
        The curriculum does not endorse the map wholesale. There
        are nodes on it — certain assertions about global
        governance, certain readings of health-and-nutrition
        evidence, certain metaphysical framings — that belong to
        different intellectual lineages than the ones K-OS
        foregrounds, and a careful reader will sit with the map
        and disagree with a node or two. But as a rendering of
        how the contemporary sovereignty field thinks of itself —
        a single two-page spread that holds the civic, the bodily,
        the practical, and the spiritual in one frame, and refuses
        to reduce any one of them to any of the others — it is
        the most useful single artifact the track can point you
        at. Treat it as a starting atlas, not a settled canon,
        and do the work of locating yourself on it. The reader
        who can, without wincing, say honestly which of the
        hundred-odd nodes they already live by and which they do
        not, has done more self-inventory in an evening than most
        modern privacy checklists will produce in a year.
      </P>

      <H2>Where this goes next</H2>

      <P>
        The remaining privacy lessons descend from this frame.
        <Em> Tor</Em> is key custody applied to the routing layer;
        <Em> Brave</Em> is compute custody applied to the browsing
        layer; <Em>IPFS</Em> is data custody applied to
        publication. The figures track alongside this one —
        McAfee, Dotcom, and the others — are case studies in what
        sovereignty costs when it is tested in public. Readers who
        only want the tools can skip the figures and they will
        still learn the tools. Readers who only want the figures
        without the tools will pick up the rhetoric without the
        practice, which is the failure mode the movement most
        needs to avoid. The next lesson is <Em>Tor</Em>: the routing
        layer is where the four custodies first meet a hostile
        network, and the discipline begins where the wire leaves
        the machine.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Veil Removed.{" "}
          <Em>The Green Pill — Freedom Protocol, New Templars,
          Year 32</Em> (v0.9, 2022 printing).{" "}
          <a
            href="https://drive.google.com/file/d/1DAhDK-L6Jke3ajKsTMI2emfnnUPBbL1M/view"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            drive.google.com
          </a>
        </Li>
        <Li>
          Deep State Mapping Project — the publisher of record for
          the Green Pill plates.{" "}
          <a
            href="https://www.deepstatemappingproject.com"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            deepstatemappingproject.com
          </a>
        </Li>
        <Li>
          Hughes, E. (1993).{" "}
          <Em>A Cypherpunk&apos;s Manifesto</Em>. (&ldquo;Privacy is
          necessary for an open society in the electronic age.&rdquo;)
        </Li>
        <Li>
          May, T. C. (1988, distributed at Crypto &apos;92).{" "}
          <Em>The Crypto Anarchist Manifesto</Em>.
        </Li>
        <Li>
          Szabo, N. (2002).{" "}
          <Em>Shelling Out: The Origins of Money</Em>. On the
          pre-cryptographic deep history of the self-custody
          impulse.
        </Li>
        <Li>
          Pocock, J. G. A. (1975).{" "}
          <Em>The Machiavellian Moment: Florentine Political
          Thought and the Atlantic Republican Tradition</Em>.
          Princeton UP. On the civic-republican stance that sits
          behind the word <Em>citizen</Em> in this entry.
        </Li>
      </UList>
    </>
  );
}

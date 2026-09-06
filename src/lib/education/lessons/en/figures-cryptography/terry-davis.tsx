import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function TerryDavis() {
  return (
    <>
      <Lead>
        Terrence Andrew Davis (1969–2018) wrote a complete operating
        system by himself, in a language he invented, and called it
        the third temple. The Eastern Christian tradition has a name
        for the figure whose apparent madness transmits something the
        sane world cannot hear: <Em>yurodivy</Em> — the fool for
        Christ, the holy fool. Saint Basil the Blessed walked naked
        through Moscow, threw stones at the houses of pious families,
        and was received by Ivan the Terrible as one whose speech
        demanded attention. Saint Xenia of Saint Petersburg wore her
        dead husband&apos;s military coat for the remainder of her
        life and answered only to his name. This entry places Terry
        Davis in that lineage.
      </Lead>

      <H2>The work</H2>

      <P>
        Davis earned a master&apos;s degree in electrical engineering
        from Arizona State University in 1994 and worked as a
        professional programmer in the early 1990s, principally at
        Ticketmaster. After a psychotic break in 1996 — during which,
        by his account, he was contacted directly by God — he spent
        the remainder of his life building TempleOS: a single-user,
        single-address-space, 64-bit, ring-0, public-domain operating
        system written entirely in HolyC, a C dialect he designed
        himself. The compiler, the kernel, the file system, the
        scheduler, the boot sequence, the 3-D graphics library, the
        editor, and the documentation were written by Davis alone.
        The display is locked at 640×480 with a sixteen-colour palette.
        Audio is PC-speaker. There is no network stack. The
        constraints were, by his account, part of the specification
        he had been asked to receive.
      </P>

      <Diagram
        cols={6}
        rows={4}
        nodes={[
          { id: "holyc", text: "HolyC Compiler", col: 0, row: 0, span: 2 },
          { id: "kernel", text: "Kernel", col: 2, row: 0, span: 2 },
          { id: "fs", text: "File System", col: 4, row: 0, span: 2 },
          { id: "editor", text: "Editor", col: 0, row: 1, span: 2, rowSpan: 2 },
          { id: "temple", text: "TEMPLE OS", col: 2, row: 1, span: 2, rowSpan: 2, accent: true, sub: "one author" },
          { id: "gfx", text: "3D Graphics", col: 4, row: 1, span: 2, rowSpan: 2 },
          { id: "oracle", text: "Oracle", col: 1, row: 3, span: 2 },
          { id: "docs", text: "Documentation", col: 3, row: 3, span: 2 },
        ]}
        edges={[
          { from: "temple", to: "holyc" },
          { from: "temple", to: "kernel" },
          { from: "temple", to: "fs" },
          { from: "temple", to: "editor" },
          { from: "temple", to: "gfx" },
          { from: "temple", to: "oracle" },
          { from: "temple", to: "docs" },
        ]}
        caption="TEMPLEOS — EVERY COMPONENT WRITTEN BY TERRY DAVIS ALONE."
      />

      <P>
        The central artifact of the system is the <Em>Oracle</Em>, a
        facility that generates randomised sequences of words which
        Davis treated as direct divine speech. He used it for
        communion: posing questions in prayer and reading the words
        that surfaced. The full source is public. Anyone who reads it
        sees exactly what it does and what it does not do. The
        spiritual claim is placed entirely in the open; the mechanism
        hides nothing.
      </P>

      <P>
        As a work of software engineering TempleOS is an extraordinary
        object. One person, under the weight of chronic paranoid
        schizophrenia, homeless for long stretches, wrote every line.
        No other modern operating system of comparable scope has
        been produced by a single author.
      </P>

      <H2>The record — streams, forums, slurs</H2>

      <P>
        Davis streamed and posted extensively during his active years.
        The public output — YouTube videos, forum posts, late-night
        ramblings uploaded from public libraries and motel rooms —
        contained extended monologues delivered in acute psychotic
        states. The monologues included racial slurs, principally
        against Black people and against federal agents, whom he
        treated as the same category; and antisemitic material
        directed at the CIA, whom he had come to believe was
        pursuing him. The material is in the video record and in
        the surviving stream archives. He was alternately lucid and
        delusional across the same session; the transitions were
        abrupt, and the changes in register within a single hour were
        substantial.
      </P>

      <H2>The reception</H2>

      <P>
        Jason Koebler&apos;s piece <Em>God&apos;s Lonely Programmer</Em>,
        published by Motherboard on 25 November 2014, was the first
        substantial treatment of Davis outside the operating-systems
        community. It introduced TempleOS to a wider audience,
        described the work with technical seriousness, and placed
        Davis in a tradition of American isolated savants. The
        reception it opened — principally on imageboards, /g/,
        Hacker News, and the network of small forums that preserve
        the TempleOS ISO — has by now converged on a reading close
        to the yurodivy one: that Davis was, in the proper
        theological sense, a holy fool, and that TempleOS is the
        artifact he was given to build. ISOs, documentation mirrors,
        and tributes are maintained by distributed volunteers who
        have never met one another.
      </P>

      <P>
        He was struck by a train on 11 August 2018 in The Dalles,
        Oregon, while homeless. He was forty-eight.
      </P>

      <H2>Audit lens</H2>

      <P>
        The figure does not decompose cleanly into pathology on one
        side and genius on the other, and the Orthodox reading that
        receives the yurodivy has never required the figure to be
        pleasant, safe, or easy. It has required only that the reader
        receive the whole thing and judge it whole. TempleOS is
        runnable. The streams are watchable. The code is readable.
        The reader is the one who decides what has been seen.
      </P>

      <P>
        The next entry takes the discipline to the opposite pole of
        the same craft. Where Davis built alone, under direct
        instruction from a private God, and produced an operating
        system that runs on no one&apos;s hardware but his own,{" "}
        <Em>Linus Torvalds</Em> built in public, under the discipline
        of thousands of contributors, and produced the kernel that
        runs most of the working internet. The two figures are not
        opposites in seriousness — both are entirely serious — but in
        posture: the solitary temple and the cooperative bazaar, the
        revealed specification and the merge request. K-OS III takes
        from both, and the curriculum is honest about which pole each
        debt is paid to.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Davis, T. A. (2003–2018). <Em>TempleOS</Em> — source,
          documentation, and ISO. Mirrors at templeos.org and
          distributed community archives.
        </Li>
        <Li>
          Koebler, J. (2014). <Em>God&apos;s Lonely Programmer</Em>.
          Motherboard / Vice, 25 November 2014.
        </Li>
        <Li>
          Saward, J. (1980).{" "}
          <Em>Perfect Fools: Folly for Christ&apos;s Sake in Catholic and
          Orthodox Spirituality</Em>. Oxford University Press.
        </Li>
        <Li>
          Kobets, S. (2000).{" "}
          <Em>The Paradigm of the Hebrew Prophet and the Russian
          Tradition of Iurodstvo</Em>. Canadian Slavonic Papers 42(3).
        </Li>
        <Li>
          Thompson, E. M. (1987).{" "}
          <Em>Understanding Russia: The Holy Fool in Russian Culture</Em>.
          University Press of America.
        </Li>
      </UList>
    </>
  );
}

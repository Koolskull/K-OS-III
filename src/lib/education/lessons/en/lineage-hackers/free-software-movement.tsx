import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";

export default function FreeSoftwareMovement() {
  return (
    <>
      <Lead>
        Before there was a kernel that ran the internet there was a
        printer in the MIT Artificial Intelligence Laboratory whose
        driver one researcher was forbidden to read, and the
        researcher in question — Richard Matthew Stallman, born 16
        March 1953 in Manhattan, hired into the AI Lab in 1971 —
        decided that the prohibition was the founding crime of the
        software industry and built the rest of his life around
        undoing it. The Free Software Movement is the legal,
        philosophical, and licensing scaffolding that made it
        possible for one author in Helsinki to release a kernel in
        1991 under terms that could not be re-privatised. Without
        the GNU project, the General Public License, and the four
        freedoms articulated by Stallman across the 1980s, Linux
        would have been absorbed into a proprietary Unix within a
        decade. The movement is the precondition for everything the
        rest of the lineage track studies.
      </Lead>

      <H2>The printer driver</H2>

      <P>
        The incident usually told as the origin myth happened at the
        AI Lab around 1980, when Xerox donated a new laser printer
        to the laboratory. The earlier printer the lab had used had
        come with source code; researchers had patched its driver to
        notify users on the network when their print job had jammed
        or completed. The new Xerox printer arrived as a sealed
        binary. Stallman asked a researcher at Carnegie Mellon, who
        had access to the source under non-disclosure, to share it.
        The researcher refused on the basis of the NDA. Stallman
        treated the refusal not as a personal slight but as a
        category error: the contract had asked one programmer to
        promise that he would not help his neighbour. The earlier
        culture of the lab — in which source was passed hand to hand
        and improvements were folded back into the common pool — was
        being replaced by a regime in which the act of helping was
        itself a contractual violation. The proprietary turn in
        commercial Unix across the late 1970s and early 1980s,
        culminating in AT&amp;T&apos;s commercialisation of System V
        in 1983, completed the enclosure. Stallman concluded that
        the only response was to build, from scratch, a complete
        free operating system that no NDA could ever close.
      </P>

      <H2>The announcement and the manifesto</H2>

      <P>
        On 27 September 1983 Stallman posted to the{" "}
        <Em>net.unix-wizards</Em> and <Em>net.usoft</Em> newsgroups
        the announcement &ldquo;new Unix implementation&rdquo;,
        declaring that he was beginning work on a Unix-compatible
        operating system to be called GNU — a recursive acronym for{" "}
        <Em>GNU&apos;s Not Unix</Em> — and inviting contributions of
        time, code, money, and equipment. He left his job at the AI
        Lab in January 1984 specifically so MIT could not claim
        ownership of the code he was about to write. The longer
        philosophical statement, <Em>The GNU Manifesto</Em>,
        appeared in the March 1985 issue of <Em>Dr. Dobb&apos;s
        Journal of Software Tools</Em>, and is the document that
        named the four freedoms the movement is now organised
        around: the freedom to run the program for any purpose, the
        freedom to study how the program works and adapt it to one&apos;s
        needs, the freedom to redistribute copies, and the freedom
        to improve the program and release the improvements to the
        public. The Free Software Foundation was incorporated as a
        Massachusetts non-profit on 4 October 1985 to hold copyright
        assignments, accept donations, and employ developers on the
        GNU project full-time.
      </P>

      <H2>Copyleft and the GPL</H2>

      <P>
        The legal innovation that made the four freedoms enforceable
        is <Em>copyleft</Em>: the use of copyright law against
        itself. A copyleft licence grants the recipient permission
        to copy, modify, and redistribute the work, on the condition
        that any redistribution carry the same permissions forward.
        The recipient cannot strip the freedoms from a downstream
        copy. Stallman released the first General Public License in
        February 1989 to govern GNU Emacs and the other GNU tools;
        GPL version 2 followed in June 1991, and became the licence
        Linus Torvalds adopted for the Linux kernel in early 1992.
        GPL version 3, released 29 June 2007, addressed three
        intervening problems: tivoization (hardware that runs only
        signed binaries, defeating the modify-and-run freedom in
        practice), software patents (parties who distributed GPL
        code while holding patents that made running it actionable),
        and incompatibility with other free licences. The transition
        from GPLv2 to GPLv3 was contested; the Linux kernel
        explicitly remained on v2 at Torvalds&apos;s decision, and
        much of the embedded-Linux industry remained with it. The
        family of GPL licences, alongside the LGPL for libraries and
        the AGPL for network services, is the legal substrate on
        which the modern free-software commons sits.
      </P>

      <H2>The operating system minus the kernel</H2>

      <P>
        By the early 1990s the GNU project had produced a remarkable
        catalogue of working components. GNU Emacs, the
        extensible-by-design text editor Stallman had begun in 1976
        and rewrote as a GNU project in 1984, was already mature.
        The GNU Compiler Collection — initially the GNU C Compiler,
        first released March 1987 — was the toolchain the rest of
        the system was being built with. The GNU C Library (glibc)
        provided the standard C runtime. The GNU Core Utilities
        merged the earlier fileutils, textutils, and shellutils into
        the everyday command-line tools — <Em>ls</Em>, <Em>cp</Em>,{" "}
        <Em>mv</Em>, <Em>cat</Em>, <Em>chmod</Em>. Bash, the Bourne
        Again SHell, written by Brian Fox beginning in January 1988,
        was the interactive shell. What the project did not yet have
        was a working kernel.
      </P>

      <P>
        The intended kernel was GNU Hurd, a microkernel-based design
        sitting on top of the Mach microkernel from Carnegie Mellon.
        Work on Hurd began in 1990 and proved to be one of the
        hardest engineering problems any free-software project ever
        attempted. The microkernel architecture, in which kernel
        services are split across cooperating servers communicating
        by message-passing, is theoretically clean and practically
        difficult to debug. Hurd has never reached the maturity that
        would allow it to host a production system. While the GNU
        project was waiting for its kernel, Linus Torvalds posted
        Linux 0.01 in mid-September 1991, switched the licence to
        GPLv2 in early 1992, and the working combination — the GNU
        userland on top of the Linux kernel — became the operating
        system the world actually runs. The project legitimately
        called <Em>GNU/Linux</Em> by the FSF, and almost universally
        called <Em>Linux</Em> by everyone else, is the practical
        realisation of the 1983 announcement, completed by a kernel
        Stallman did not write.
      </P>

      <H2>The decisive civic act</H2>

      <P>
        The single moment that fused the two halves of the
        free-software lineage was Torvalds&apos;s choice, in early
        1992, to relicense the Linux kernel under GPLv2. The earlier
        personal licence had forbidden commercial redistribution;
        GPLv2 permitted any redistribution while requiring that the
        source travel with the binary and that the freedoms travel
        with the source. Without that change the kernel would have
        remained a hobby project; with it, the kernel became
        legally inalienable property of the commons, and the GNU
        userland — already complete, already free, already waiting —
        could be combined with it without legal friction. The
        movement and the kernel met in a licence file. The result is
        the substrate that runs the majority of public servers,
        every Android device, the embedded layer of essentially all
        modern electronics, and — through WSL — the inside of
        Windows itself.
      </P>

      <H2>The schism — open source</H2>

      <P>
        On 3 February 1998, in the wake of Netscape&apos;s
        announcement that it would release the Navigator source
        code, a group convened in Palo Alto including Eric S.
        Raymond, Bruce Perens, Christine Peterson, Todd Anderson,
        and others adopted the term <Em>open source</Em> as a
        marketing-friendlier alternative to <Em>free software</Em>.
        The Open Source Initiative was incorporated shortly
        afterwards. Raymond&apos;s 1997 essay <Em>The Cathedral and
        the Bazaar</Em>, expanded into a book in 1999, argued that
        the development model — many eyes, rapid release, worse-is-
        better — was the substantive point and that the ethical
        framing Stallman insisted on was a marketing liability when
        approaching corporate adopters. Stallman rejected the
        rebrand and has rejected it consistently in the decades
        since. The two camps share most code and disagree about
        what the code is for: the FSF treats software freedom as a
        question of justice, and the OSI treats open development as
        a superior engineering practice. Both readings are now
        permanent features of the landscape.
      </P>

      <H2>The activist and the resignation</H2>

      <P>
        Stallman spent the following decades as the FSF&apos;s
        full-time travelling advocate, lecturing on free software,
        digital rights, and the dangers of proprietary lock-in to
        audiences across every continent. His book{" "}
        <Em>Free Software, Free Society</Em> collected the essays;
        the second-edition <Em>The GNU Operating System and the
        Free Software Movement</Em> consolidated the canonical
        statement. In September 2019, following remarks he posted to
        an internal MIT mailing list concerning the late Marvin
        Minsky and the Jeffrey Epstein matter, Stallman resigned
        from his visiting position at MIT and from the presidency
        of the Free Software Foundation. He returned to the FSF
        board in March 2021, a decision that drew its own round of
        public objection. The curriculum does not adjudicate the
        controversy and notes only that the primary documents — the
        original mailing-list post, the resignation announcement,
        the 2021 board statement — are public and the reader can
        read them in full.
      </P>

      <H2>The wider commons</H2>

      <P>
        The movement is larger than its founder. Werner Koch began
        writing GNU Privacy Guard in 1997 as a free replacement for
        Phil Zimmermann&apos;s PGP, and has maintained it under
        chronic underfunding for nearly three decades; GnuPG is the
        encryption tool by which most signed software releases on
        Earth are verified. Brian Fox wrote Bash. Roland McGrath
        and Ulrich Drepper carried glibc. Thousands of contributors
        to GCC, coreutils, binutils, and the rest of the GNU
        toolchain produced, across forty years, the boring
        infrastructure on which the spectacular projects rest. The
        copyleft commons is now a working, legally defended,
        internationally distributed public good — the closest the
        software industry has produced to the free libraries and
        free roads of the older civic tradition.
      </P>

      <H2>Audit lens</H2>

      <P>
        Stallman is the legal architect; Torvalds is the kernel
        author; the GPL is the document where their work meets. The
        GNU Manifesto is in print and online. The General Public
        License in all three versions is published verbatim by the
        FSF. The 1983 announcement is preserved in the Usenet
        archives. The full GNU source tree, the glibc source, the
        GCC source, the Emacs source, the Bash source, and the GPL
        text itself are all readable by anyone with a network
        connection — a recursive demonstration of the freedoms the
        movement names. The reader who wants to judge whether the
        four freedoms are coherent, whether copyleft is a defensible
        use of copyright, whether GNU/Linux or Linux is the proper
        name, can do so from primary sources. The movement&apos;s
        habit of putting the reasoning in writing, alongside the
        code, is the trait the K-OS III curriculum most directly
        inherits.
      </P>

      <P>
        The next entry in the lineage track moves from Cambridge,
        Massachusetts to the homebrew era — the personal-computer
        clubs and bedroom hackers of the 1970s and 1980s, out of
        which both the proprietary industry Stallman opposed and
        the hobbyist commons that supplied his early collaborators
        emerged. After that the curriculum picks up the cypherpunks
        of the early 1990s, who took the four freedoms as given and
        asked what cryptography would have to add to make them
        survive contact with the state. The free-software movement
        is the hinge between the two — the legal scaffolding the
        homebrew generation built and the cypherpunks inherited.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Stallman, R. M. (27 September 1983). &ldquo;new Unix
          implementation&rdquo;. Original announcement of the GNU
          project. Posted to <Em>net.unix-wizards</Em> and{" "}
          <Em>net.usoft</Em>; archived at{" "}
          <a
            href="https://www.gnu.org/gnu/initial-announcement.html"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            gnu.org
          </a>
          .
        </Li>
        <Li>
          Stallman, R. M. (March 1985). <Em>The GNU Manifesto</Em>.{" "}
          <Em>Dr. Dobb&apos;s Journal of Software Tools</Em>,
          Volume 10, Number 3.
        </Li>
        <Li>
          Free Software Foundation. <Em>GNU General Public License,
          version 1</Em> (February 1989); <Em>version 2</Em> (June
          1991); <Em>version 3</Em> (29 June 2007).
        </Li>
        <Li>
          Stallman, R. M. (2002, 2010).{" "}
          <Em>Free Software, Free Society: Selected Essays of Richard
          M. Stallman</Em>. GNU Press, Boston.
        </Li>
        <Li>
          Williams, S. (2002, 2010 rev. with Stallman).{" "}
          <Em>Free as in Freedom (2.0): Richard Stallman and the
          Free Software Revolution</Em>. Free Software Foundation.
        </Li>
        <Li>
          Raymond, E. S. (1999, expanded 2001).{" "}
          <Em>The Cathedral and the Bazaar</Em>. O&apos;Reilly.
          (Argument for the open-source rebrand.)
        </Li>
        <Li>
          GNU Project. Source trees and changelogs for GNU Emacs,
          GCC, glibc, GNU Coreutils, Bash, and GNU Hurd.{" "}
          <a
            href="https://www.gnu.org"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            gnu.org
          </a>
          .
        </Li>
        <Li>
          Koch, W. (1997– ).{" "}
          <Em>GNU Privacy Guard (GnuPG)</Em>. Source and release
          history at{" "}
          <a
            href="https://gnupg.org"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            gnupg.org
          </a>
          .
        </Li>
      </UList>
    </>
  );
}

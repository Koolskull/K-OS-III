import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";

export default function MitAiLab() {
  return (
    <>
      <Lead>
        Between roughly 1959 and 1985, on the ninth floor of Tech
        Square in Cambridge, Massachusetts, a small group of
        students, faculty, and staff invented most of what the
        word <Em>hacker</Em> originally meant — and most of what
        it later became. The MIT Artificial Intelligence
        Laboratory was not the only place where this happened, and
        it did not happen all at once, but the through-line from
        the Tech Model Railroad Club&apos;s Signals and Power
        subcommittee in the late 1950s to Richard Stallman&apos;s
        founding of the Free Software Foundation in 1985 runs
        through one set of rooms, one set of machines, and one set
        of people. This entry traces that line, names the figures,
        fixes the dates, and reads the AI Lab as the workshop in
        which the civic conscience of free software was first cast.
      </Lead>

      <H2>From the TMRC to Project MAC</H2>

      <P>
        The Tech Model Railroad Club had existed at MIT since 1946,
        but the relevant subgroup is the Signals and Power
        subcommittee, which by the late 1950s had built a relay-
        based control system for the layout that was, in effect,
        a small computer. The vocabulary that travelled out of
        that room — <Em>hack</Em> for an elegant or unauthorised
        modification, <Em>kludge</Em> for an ugly working one,{" "}
        <Em>cruft</Em> for accumulated mess — entered the larger
        culture from there. When the TX-0 and then the PDP-1
        arrived on campus, the Signals and Power people were the
        ones already trained to read a wiring diagram as a
        moral object.
      </P>

      <P>
        Project MAC was founded at MIT in 1963 under the direction
        of Robert Fano, with funding from ARPA&apos;s Information
        Processing Techniques Office under J. C. R. Licklider. The
        acronym was deliberately ambiguous —{" "}
        <Em>Mathematics and Computation</Em>,{" "}
        <Em>Multiple Access Computer</Em>,{" "}
        <Em>Man and Computer</Em> — and the project housed both a
        time-sharing systems group and an artificial-intelligence
        group under the same roof. John McCarthy, who had coined
        the phrase <Em>artificial intelligence</Em> at the
        Dartmouth workshop of 1956 and had designed the Lisp
        programming language at MIT in 1958, was a founding
        figure but left for Stanford in 1962, just before Project
        MAC formally opened. Marvin Minsky stayed. In 1970 the
        AI group split off from Project MAC and became the MIT
        Artificial Intelligence Laboratory in its own right; the
        remaining systems group became the Laboratory for
        Computer Science. The two laboratories were merged again
        on 1 July 2003 to form CSAIL, the Computer Science and
        Artificial Intelligence Laboratory, which is the present
        institutional descendant.
      </P>

      <H2>The cast</H2>

      <P>
        The names that recur in the record are by now a small
        canon. Marvin Minsky directed the lab through most of its
        active period and set its intellectual register. Ed
        Fredkin built the early PDP machines into research
        instruments and ran Information International Inc. on the
        side. Tom Knight designed the Lisp Machine&apos;s memory
        hardware. Richard Greenblatt wrote{" "}
        <Em>Mac Hack VI</Em>, the first chess program to defeat a
        human in tournament play, and was the principal architect
        of the original CONS Lisp Machine prototype. Bill Gosper
        produced the bulk of the famous{" "}
        <Em>HAKMEM</Em> memo (AI Memo 239, February 1972), a
        compendium of mathematical and programming hacks that
        remains in print as a primary document of the lab&apos;s
        sensibility. Russ Noftsker managed the lab in the 1970s
        and would later, in 1980, found Symbolics, the company
        whose dispute with Lisp Machines Inc. became the
        proximate cause of the free-software movement. Richard
        Stallman, who joined the lab as a staff programmer in
        1971, is the figure through whom that whole inheritance
        was carried into the next generation.
      </P>

      <H2>The machines and the system</H2>

      <P>
        The PDP-6 arrived at MIT in 1964 and the PDP-10 family
        succeeded it through the 1970s. The lab ran the{" "}
        <Em>Incompatible Timesharing System</Em> — ITS — which
        was written, principally by Tom Knight, Stewart Nelson,
        and others, in deliberate contrast to the more
        bureaucratically managed Compatible Time-Sharing System
        (CTSS) and Multics that had emerged from the Project MAC
        systems group. ITS had no passwords. Any user could read
        any file, modify any program, and observe any other
        user&apos;s session. The absence of access control was
        not an oversight; it was an architectural commitment.
        The reasoning, as it was practiced and as Levy later
        recorded it, was that a machine in a research lab is an
        instrument shared by the people working on it, that
        secrecy between collaborators is a kind of friction, and
        that anyone trustworthy enough to be on the system at all
        was trustworthy enough to read what was on it. The
        position was not naive — the lab was raided, broken into,
        and politically pressured across its lifetime — but it
        was held as a positive ideal rather than a default to be
        patched.
      </P>

      <P>
        On those machines the lab produced the foundational
        artifacts of symbolic computing. <Em>Macsyma</Em>, begun
        in 1968 under Joel Moses, William Martin, and Carl
        Engelman, was the first major computer-algebra system; it
        is the direct ancestor of Maxima and the indirect
        ancestor of Mathematica, whose author Stephen Wolfram had
        worked with Macsyma at MIT before founding his company.
        Maclisp, the dialect of Lisp the lab maintained, was the
        substrate on which Macsyma and most of the lab&apos;s
        AI work ran. <Em>Emacs</Em>, written by Stallman and Guy
        Steele beginning in 1976 as a set of editor macros for
        the older TECO editor, was first released as a coherent
        program in that year. The lab&apos;s style — Lisp all the
        way down, recursive macro expansion, the editor as a
        programmable environment rather than a fixed tool — set
        the template that GNU Emacs would carry into the wider
        world.
      </P>

      <H2>The hacker ethic</H2>

      <P>
        Steven Levy&apos;s <Em>Hackers: Heroes of the Computer
        Revolution</Em>, published by Anchor/Doubleday in 1984,
        is the canonical chronicle of the lab&apos;s first two
        decades. Levy did the interviews in 1982 and 1983, while
        most of the principals were still active and still on
        speaking terms with one another. The book&apos;s second
        chapter codified what Levy called the{" "}
        <Em>hacker ethic</Em> — not as a manifesto the people in
        the room had signed, but as a synthesis Levy drew from
        what they actually did. The seven points, as he stated
        them, are: that access to computers and to anything that
        might teach you something about the way the world works
        should be unlimited and total; that all information
        should be free; that authority should be mistrusted and
        decentralisation promoted; that hackers should be judged
        by their hacking and not by bogus criteria such as
        degrees, age, race, or position; that you can create art
        and beauty on a computer; and that computers can change
        your life for the better. The seven points are read here
        as a description of an existing practice rather than as a
        prescription, because that is how Levy wrote them.
      </P>

      <H2>The Lisp Machine wars</H2>

      <P>
        The Lisp Machine — a workstation whose hardware was
        designed to run Lisp natively — emerged from the AI Lab
        as a research project led by Greenblatt and Knight in
        the late 1970s. Two companies were spun out almost
        simultaneously to commercialise it. Lisp Machines Inc.
        (LMI) was founded by Greenblatt in 1979 with the
        intention of keeping the software in the lab&apos;s
        commons; Symbolics was founded by Russ Noftsker in 1980
        with the intention of building a faster, more
        aggressively engineered product on a stricter
        proprietary basis. Through 1980 and 1981 most of the
        lab&apos;s senior hackers were hired away by one company
        or the other. Symbolics, by 1982, was making
        improvements to the shared system software that it
        refused to contribute back unless LMI made matching
        commitments LMI could not match. The communal codebase
        the lab had been operating from broke. Stallman, who
        remained on the lab payroll, spent roughly two years
        re-implementing the Symbolics extensions independently
        so that LMI could continue to use them, in a deliberate
        rear-guard action against the enclosure of the commons.
        He later said this was the period in which he understood
        that the social arrangement under which the lab had
        worked could not be repaired by being defended one
        machine at a time, and that a new legal substrate would
        be required.
      </P>

      <H2>Stallman&apos;s break and the GNU Project</H2>

      <P>
        On 27 September 1983 Richard Stallman posted the GNU
        Manifesto to the <Em>net.unix-wizards</Em> and{" "}
        <Em>net.usoft</Em> newsgroups, announcing a plan to write
        a complete Unix-compatible operating system whose source
        would be free for any user to read, modify, and
        redistribute. He left his MIT staff position in January
        1984 to work on GNU full-time, while retaining unpaid
        access to lab facilities. The Free Software Foundation
        was incorporated on 4 October 1985. The GNU General
        Public License, in its first version, was released in
        1989; version 2, the licence Linus Torvalds would adopt
        for the Linux kernel in early 1992, followed in June
        1991. The chain from the Symbolics dispute to the
        licensing regime that now protects most of the world&apos;s
        free software runs through one specific person&apos;s
        decision, in one specific lab, that the commons was
        worth a new institution rather than a continued retreat.
      </P>

      <H2>Audit lens</H2>

      <P>
        The AI Lab is not a tidy story and the curriculum does
        not tidy it. The same room that produced Macsyma, Emacs,
        the Lisp Machine, and the GNU Project also produced
        feuds, splits, hires that hollowed the commons it had
        depended on, and a sexual and social culture documented
        in the same primary sources as everything else and
        readable there by anyone who wants to read it. The
        passwordless ITS was a working ideal and was also the
        product of a small group of men who trusted each other
        because they had selected each other; the model does not
        scale to a public network, and the lab&apos;s own
        history shows it failing to scale even within Cambridge.
        What the lab transmitted forward was not a finished
        social technology. It was a working example of what it
        looks like when programmers treat their machine as a
        common instrument and their code as a civic deposit, and
        a working example of what happens when that arrangement
        is enclosed. Both halves of the example are load-bearing.
      </P>

      <P>
        The next entry in this track follows the conscience the
        AI Lab transmitted into the wider world along two
        diverging routes. One route &mdash; the{" "}
        <Em>cypherpunks</Em> &mdash; took the mistrust-of-
        authority and decentralisation premises and ran them
        through cryptography, producing the mailing list, PGP,
        the remailers, and eventually the line of work that
        terminates in Bitcoin. The other route &mdash; the{" "}
        <Em>free-software movement</Em> proper &mdash; took the
        all-information-should-be-free premise and ran it
        through licensing, producing the GPL, the FSF, and the
        legal substrate underneath Linux. Both routes are
        children of the ninth floor of Tech Square. K-OS III
        reads itself as a third child of the same parent, and
        the curriculum is honest about which siblings it is in
        the room with.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Levy, S. (1984). <Em>Hackers: Heroes of the Computer
          Revolution</Em>. Anchor/Doubleday. (Twenty-fifth-
          anniversary edition, O&apos;Reilly, 2010, with
          afterword.)
        </Li>
        <Li>
          Beeler, M., Gosper, R. W., &amp; Schroeppel, R. (1972).{" "}
          <Em>HAKMEM</Em>. MIT AI Memo 239, February 1972.
        </Li>
        <Li>
          Stallman, R. (1983). <Em>GNU Manifesto</Em>, posted
          to <Em>net.unix-wizards</Em> on 27 September 1983;
          revised text published in <Em>Dr. Dobb&apos;s
          Journal</Em>, March 1985.
        </Li>
        <Li>
          Williams, S. (2002). <Em>Free as in Freedom: Richard
          Stallman&apos;s Crusade for Free Software</Em>.
          O&apos;Reilly. (Revised edition co-authored with
          Stallman, 2010.)
        </Li>
        <Li>
          Garfinkel, S., Stoll, C., Steele, G., &amp; others
          (1991). <Em>The Hacker&apos;s Dictionary</Em> /{" "}
          <Em>The Jargon File</Em>. MIT Press editions, 1983
          and 1991; Eric S. Raymond maintained later editions.
        </Li>
        <Li>
          Project MAC and MIT AI Lab technical memo series.
          MIT/CSAIL document archives, 1963&ndash;2003.
        </Li>
      </UList>
    </>
  );
}

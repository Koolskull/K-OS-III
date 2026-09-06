import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function LinusTorvalds() {
  return (
    <>
      <Lead>
        Linus Torvalds (born 28 December 1969 in Helsinki) wrote the
        kernel that runs the modern internet, and then, fourteen
        years later, wrote the version-control system that the
        modern internet&apos;s programmers use to write everything
        else. By lines-of-code reach he is the single author most
        responsible for the operating-system substrate underneath
        contemporary computing. The entry is paired with the one on
        Terry Davis because the two figures are the twin poles the
        K-OS III project is built between: the practical reach of a
        distributed kernel maintained by thousands, and the sacred
        directness of a system written alone by one man to the spec
        he believed he had been given. Saint Terry held Linus in
        open contempt. This entry takes that objection seriously,
        disagrees with its conclusion, and argues why the work of
        both belongs in the lineage the K-OS project means to carry
        forward.
      </Lead>

      <H2>The kernel</H2>

      <P>
        On 25 August 1991 Torvalds, then a 21-year-old student at
        the University of Helsinki, posted to the{" "}
        <Em>comp.os.minix</Em> newsgroup a short announcement
        describing &ldquo;a (free) operating system (just a hobby,
        won&apos;t be big and professional like gnu)&rdquo; he had
        been writing for his 386. The first public release, Linux
        0.01, followed in mid-September 1991. The post and the tar
        file are among the founding documents of modern computing.
        The kernel went public under a restrictive personal licence
        and moved to the GNU General Public License version 2 in
        early 1992. The choice of GPLv2 was the decisive civic act:
        it made Linux impossible to re-privatise. A later Linus
        would say that picking the GPL was the single best decision
        he ever made.
      </P>

      <P>
        What the kernel became is by now familiar. It runs the
        majority of servers on the public internet; every Android
        phone; nearly every embedded router, television, and car
        infotainment system; all of the top supercomputers in the
        world; and — through the Windows Subsystem for Linux —
        inside the operating system of its historical adversary.
        The social achievement matches the technical one: more than
        fifteen thousand individual contributors have landed
        changes in the mainline tree across more than three
        decades, without the project forking irreparably or losing
        coherence. That is rare. It is the practical work of one
        extremely stubborn maintainer and of the lieutenant
        structure he organised around himself.
      </P>

      <H2>The mailing-list discipline</H2>

      <P>
        The Linux Kernel Mailing List was for many years the
        primary public surface of the project, and Torvalds&apos;s
        conduct on it became its own object of commentary. He
        replied to patches he considered badly reasoned with
        extended, profane, technically specific dressings-down; the
        most-quoted of these — directed at NVIDIA in June 2012, at
        Mauro Carvalho Chehab over a regression in July 2012, at
        various subsystem maintainers across the 2000s and 2010s —
        circulated as screenshots for years. In September 2018
        Torvalds posted a public note acknowledging the cost of
        that style on the people around him, stepped back from the
        tree for a self-imposed reflection break of roughly a
        month, and returned alongside a Code of Conduct adopted for
        the kernel project. The shift was real and was made by him,
        in writing, on the list. The reader is invited to read both
        the earlier flames and the 2018 note in full and judge them
        whole.
      </P>

      <H2>Git</H2>

      <P>
        In April 2005, after the proprietary BitKeeper tool the
        kernel had been using revoked its free-of-charge licence
        for open-source projects, Torvalds spent roughly ten days
        writing the first working version of Git. He has said the
        design brief was &ldquo;take CVS as an example of
        everything that should <Em>not</Em> be done&rdquo;. Git is
        now the universal substrate of collaborative software work
        — GitHub, GitLab, Gitea, and the forges that replaced the
        mailing list as the primary public surface of open-source
        development all assume it. The number of programmers now
        alive who have never used a non-Git version-control system
        is the overwhelming majority. A single author wrote the
        core of both the kernel they work on and the tool they use
        to work on it. That is unusual enough to bear stating
        directly. Maintenance of Git itself passed to Junio Hamano
        within months; Torvalds&apos;s ten days were the seed, not
        the project.
      </P>

      <P>
        He has since written one further piece of public software
        of note — Subsurface, a dive-log application — which he
        maintained for several years before handing off. The
        pattern is consistent: build the thing, hand it to a
        maintainer who can carry it, return to the kernel.
      </P>

      <Diagram
        cols={6}
        rows={2}
        nodes={[
          { id: "linus", text: "LINUS", col: 0, row: 0, rowSpan: 2, accent: true, sub: "Helsinki, 1991" },
          { id: "k1", text: "Linux 0.01", col: 1, row: 0, sub: "25 Aug 1991" },
          { id: "k2", text: "GPLv2", col: 2, row: 0, accent: true, sub: "1992 — inalienable" },
          { id: "k3", text: "Kernel maintained", col: 4, row: 0, span: 2, sub: "Linus, 30+ yrs" },
          { id: "g1", text: "Git first commit", col: 2, row: 1, sub: "Apr 2005, ~10 days" },
          { id: "g2", text: "Junio Hamano", col: 4, row: 1, span: 2, sub: "maintainer, months later" },
        ]}
        edges={[
          { from: "linus", to: "k1", accent: true },
          { from: "k1", to: "k2", label: "license" },
          { from: "k2", to: "k3", label: "commons" },
          { from: "linus", to: "g1", accent: true },
          { from: "g1", to: "g2", label: "handoff" },
        ]}
        caption="TWO CIVIC ACTS — KERNEL HELD, GIT HANDED OFF. BOTH RELEASED TO THE COMMONS."
      />

      <H2>What Saint Terry actually said</H2>

      <P>
        Terry Davis&apos;s public output contained extended hostile
        monologues directed at Linus Torvalds personally and at
        Linux as a system. The surface of those monologues was
        slur-laden and delivered from acute psychotic states; the
        curriculum does not reproduce the language, and the reader
        curious about the archive can find it intact in the usual
        places. Underneath the slurs, however, there is a specific
        and theologically serious objection that deserves to be
        lifted out of the surrounding disorder and engaged on its
        own terms.
      </P>

      <P>
        The objection runs as follows. A computer, in Davis&apos;s
        reading, is an instrument on which a man performs an act
        that is in principle liturgical: he issues commands in a
        language he has written down, and the machine — which
        bears the image of the created order — responds. For that
        act to remain sacred, the mediator must be comprehensible
        to the one performing it. An operating system whose source
        is millions of lines long, whose kernel is maintained by a
        distributed bureaucracy, whose subsystems no single human
        being has ever fully held in mind, has ceased to be an
        instrument of worship and become an institution.
        Institutions, on Davis&apos;s theology, are fallen. Linux
        was the fallen form; TempleOS was the rebuilt temple,
        small enough for one priest to know. The conclusion he
        drew — that Linus was personally illegitimate — is the
        part the curriculum rejects. The premise it comes from is
        the part the curriculum keeps.
      </P>

      <H2>Why the premise is partly right</H2>

      <P>
        The aesthetic and theological core of Davis&apos;s
        objection is the same core that drives the K-OS III
        insistence on legibility, on one author&apos;s hand being
        visible in every pixel of the interface, on no rounded
        corners and no anti-aliasing and no software that lies to
        the user about what it is doing. A machine a man cannot
        read is a machine a man cannot pray on. This is not a joke
        and it is not metaphor. It is the animating conviction of
        the project.
      </P>

      <P>
        And yet the practical consequence Davis drew from the
        conviction — that the only permissible system is one
        written entirely by a single author, on a single machine,
        for a single user, without networking — means the system
        cannot be given to a neighbour without the neighbour
        becoming a hermit too. That is a real limitation.
        Salvation, in any tradition the curriculum recognises, is
        offered to the neighbour. The kingdom of heaven does not
        arrive as a private devotion that cannot be extended.
      </P>

      <H2>Why Linus&apos;s conclusion is also partly right</H2>

      <P>
        Linus built a kernel that a billion people can run on the
        hardware they already own. The work was not sacred in
        Davis&apos;s sense; by Torvalds&apos;s own public
        statements he is an atheist, and the kernel was engineered
        as a pragmatic object rather than as a liturgical one. But
        the effect of the work — that ordinary people can own
        their compute, that someone with a used laptop can have a
        full general-purpose operating system for nothing, that
        the substrate of the modern internet is legally
        inalienable property of the commons under the GPL — is an
        effect the theological reading of the machine should want.
        A tradition that insists on the sacredness of personal
        computing and then refuses the only licensing regime that
        has ever kept personal computing from being recaptured has
        not thought its position through.
      </P>

      <H2>The K-OS III synthesis</H2>

      <P>
        K-OS III takes the premise from Terry and the substrate
        from Linus. The hand of one author is visible in the
        interface; the pixels are counted; the typography is
        bitmap; nothing rounds and nothing anti-aliases; every
        surface the user sees is intended to be read. Underneath,
        when K-OS ships as an installable distribution, it will
        run on the Linux kernel, because that is the kernel the
        neighbour can receive. The project does not pretend that
        reconciling the two is easy, and it does not pretend that
        the sacred framing dissolves by being restated at
        interface level while the bureaucracy runs beneath. It
        claims only that the attempt is worth making, that the
        kingdom of heaven arriving at the computer is the explicit
        object, and that neither the hermit&apos;s cell nor the
        utility company is the final form. The form is the one in
        which a citizen can take care of themselves, be
        considerate of their neighbour, and run the machine as an
        instrument rather than as a tenant.
      </P>

      <H2>Audit lens</H2>

      <P>
        Linus is the practical pole and Terry is the sacred pole.
        Neither figure is reducible to the other and the
        curriculum does not ask the reader to choose. The kernel
        source is public, the mailing-list archive is public, the
        2018 note is public, the Git history of Git itself is
        public, and Torvalds&apos;s own book — <Em>Just for Fun</Em>,
        co-written with David Diamond in 2001 — is in print. The
        reader who wants to judge the man can read every primary
        document without intermediaries. That is itself a
        consequence of the licensing regime he chose.
      </P>

      <P>
        The next figure in this track is Satoshi Nakamoto, whose
        2008 release of the Bitcoin paper and 2009 release of the
        reference client are the cryptocurrency-equivalent civic
        act of one author handing a working system into the
        commons and walking away. Linus stayed and maintained;
        Satoshi vanished. Both shapes of the same gesture — write
        the thing, release it under terms that prevent recapture,
        let the neighbour receive it — are studied here as
        concrete instances of the kingdom of heaven arriving at
        the computer through specific human hands.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Torvalds, L. (1991). Original{" "}
          <Em>comp.os.minix</Em> announcement of the Linux kernel.
          25 August 1991. Archived widely; canonical mirror at{" "}
          <a
            href="https://www.cs.cmu.edu/~awb/linux.history.html"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            cs.cmu.edu
          </a>
          .
        </Li>
        <Li>
          Torvalds, L. &amp; Diamond, D. (2001).{" "}
          <Em>Just for Fun: The Story of an Accidental
          Revolutionary</Em>. HarperBusiness.
        </Li>
        <Li>
          Torvalds, L. (16 September 2018). Public note on the
          Linux Kernel Mailing List announcing a self-imposed
          reflection break and the adoption of a Code of Conduct
          for the kernel project. Archived in the LKML record.
        </Li>
        <Li>
          Linux kernel source tree and changelog.{" "}
          <a
            href="https://www.kernel.org"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            kernel.org
          </a>
          .
        </Li>
        <Li>
          Git. Design rationale and source. Initial commit by
          Torvalds, April 2005; maintenance assumed by Junio
          Hamano shortly afterward.{" "}
          <a
            href="https://git-scm.com"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            git-scm.com
          </a>
          .
        </Li>
        <Li>
          Koebler, J. (2014).{" "}
          <Em>God&apos;s Lonely Programmer</Em>. Motherboard /
          Vice, 25 November 2014. (Context on Davis&apos;s
          hostility to Linux, in his own voice.)
        </Li>
        <Li>
          Free Software Foundation.{" "}
          <Em>GNU General Public License, version 2</Em> (1991).
          (The licence that made Linux inalienable.)
        </Li>
      </UList>
    </>
  );
}

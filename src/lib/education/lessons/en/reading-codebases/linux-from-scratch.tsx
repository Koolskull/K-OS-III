import { Lead, P, H2, H3, UList, Li, Em, Code } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function LinuxFromScratch() {
  return (
    <>
      <Lead>
        You can build the operating system yourself, by hand, in a
        weekend or two — and <Em>Linux From Scratch</Em> is the book
        that shows you how. Started by Gerard Beekmans in 1999 and
        maintained continuously since, LFS is not a distribution and
        not an ISO. It is a book-length instruction manual that walks
        the reader, package by package, through the construction of a
        bootable Linux system from upstream source code. You begin
        with a host environment, a stack of tarballs, and the book;
        you finish, after roughly forty to sixty hours of careful
        work, with a Linux you compiled with your own hands. The
        resulting system is modest. The point is not the system. The
        point is that no part of the machine you are running is, to
        you, a mystery anymore.
      </Lead>

      <H2>What LFS is, precisely</H2>

      <P>
        The LFS Project is a documentation effort. There is no{" "}
        <Code>lfs-install.iso</Code>. There is a book, in several
        editions — stable, systemd, non-systemd, multilib, and
        development — released on a roughly six-month cadence in sync
        with the upstream toolchain. The stable book as of early 2026
        targets approximately the Linux 6.x kernel, GCC 14, and glibc
        2.39. Each chapter lists the source tarball, the SHA checksum,
        the configure invocation, the patch set if any, the build
        commands, and the tests that must pass before the reader
        proceeds.
      </P>

      <P>
        The build follows a fixed shape. You assemble a temporary
        cross-toolchain on the host (binutils, then GCC pass 1, then
        a sysroot glibc, then GCC pass 2), <Em>chroot</Em> into the
        partial system, rebuild the toolchain a second time against
        itself so the host compiler is no longer in the dependency
        graph, and only then build the final user-space and the
        kernel. The artifact at the end boots, offers a shell, and
        runs the standard POSIX utilities. It has no package manager,
        no desktop, no browser, no audio stack. Those belong to the
        companion book.
      </P>

      <Diagram
        cols={8}
        rows={2}
        nodes={[
          { id: "host", text: "Host OS", col: 0, row: 0, sub: "any Linux" },
          { id: "binutils", text: "binutils", col: 1, row: 0, sub: "ld, as" },
          { id: "gcc1", text: "GCC pass 1", col: 2, row: 0, sub: "cross cc" },
          { id: "glibc", text: "sysroot glibc", col: 3, row: 0, sub: "libc" },
          { id: "gcc2", text: "GCC pass 2", col: 4, row: 0, sub: "links libc" },
          { id: "pivot", text: "chroot + rebuild toolchain", col: 3, row: 1, span: 2, accent: true, sub: "BOOTSTRAP PIVOT" },
          { id: "userspace", text: "user-space + kernel", col: 5, row: 1, span: 2, sub: "coreutils, linux" },
          { id: "lfs", text: "bootable LFS", col: 7, row: 1, sub: "GRUB + init" },
        ]}
        edges={[
          { from: "host", to: "binutils", label: "build" },
          { from: "binutils", to: "gcc1" },
          { from: "gcc1", to: "glibc" },
          { from: "glibc", to: "gcc2" },
          { from: "gcc2", to: "pivot", label: "chroot", accent: true },
          { from: "pivot", to: "userspace", label: "host gone", accent: true },
          { from: "userspace", to: "lfs", label: "boot" },
        ]}
        caption="LFS TOOLCHAIN BOOTSTRAP — THE CHROOT + REBUILD STEP IS THE LESSON."
      />

      <H2>The family of books</H2>

      <UList>
        <Li>
          <Em>LFS</Em> — the base book. Bootable POSIX Linux,
          hand-assembled. The foundation text.
        </Li>
        <Li>
          <Em>BLFS</Em> (Beyond Linux From Scratch) — the companion
          covering X11, Wayland, desktop environments, audio,
          networking daemons, browsers, and the rest of what a usable
          workstation requires. A reader aiming at K-OS III spends the
          most time inside BLFS.
        </Li>
        <Li>
          <Em>CLFS</Em> (Cross Linux From Scratch) — for building LFS
          on one architecture targeting another: the correct path when
          the host is x86_64 and the target is ARM64, RISC-V, or
          embedded.
        </Li>
        <Li>
          <Em>ALFS</Em> (Automated Linux From Scratch) — the JHalfs
          and nALFS scripts that drive the book unattended. Do not
          start here. The educational value is in the typing.
        </Li>
        <Li>
          <Em>HLFS</Em> (Hardened Linux From Scratch) — an older
          variant oriented toward security hardening, now
          intermittently maintained. Useful as a reference even when
          the edition lags.
        </Li>
      </UList>

      <H2>Where LFS sits among the source-built distributions</H2>

      <P>
        LFS is the pedagogical extreme of a tradition that includes
        Slackware (Patrick Volkerding, 1993 — the oldest surviving
        distribution, deliberately minimal, no automated dependency
        resolution), Gentoo (Daniel Robbins, 2000 — every package
        compiled from source through the <Em>Portage</Em> tree, with
        per-machine USE flags), and Arch (Judd Vinet, 2002 — binary
        packages but a rolling, do-it-yourself base install). A Gentoo
        <Em> stage3</Em> tarball is, in spirit, the point in the LFS
        process where the temporary toolchain has already been built
        for you and the reader can begin from a known-good base
        system. LFS refuses even that shortcut. The reader bootstraps
        the toolchain themselves, because the toolchain bootstrap is
        the lesson.
      </P>

      <H2>Why LFS matters for K-OS III</H2>

      <P>
        K-OS III&apos;s eventual installable edition — the Zorin fork
        described in the master plan — is a long-horizon effort whose
        technical training ground is LFS. There is no shortcut. A
        maintainer who has not built a Linux system from source at
        least once will not understand what a distribution fork
        actually inherits, what it can patch cleanly, and what it has
        to live with. The curriculum treats LFS the way classical
        music education treats counterpoint: you will not write
        symphonies in this style, but you will not write good music
        without having done the exercises at least once. This is the
        Linus side of the Terry↔Linus synthesis the project is built
        on — the discipline of the working maintainer, the
        unromantic competence that lets a kingdom-of-heaven-to-the-computer
        actually boot on a Tuesday.
      </P>

      <P>
        The specific knowledge LFS gives the project, in order of
        practical importance: the boot chain from firmware through
        GRUB to kernel to init; the role and minimal surface of glibc;
        the toolchain bootstrap problem (GCC compiled with GCC
        compiled with GCC); the location and purpose of every file in
        the FHS base layout; the difference between what systemd
        replaces and what it does not. Those five things separate the
        person who can maintain a distribution from the person who
        can only use one.
      </P>

      <H2>How to approach the book</H2>

      <H3>Host and hardware</H3>

      <P>
        The host can be any recent Linux distribution with roughly
        20&nbsp;GB of free disk and a working C toolchain. A dedicated
        partition is the book&apos;s recommendation; a VM works for a
        first pass. The build is CPU-bound; a modern laptop completes
        the base book in a day or two of on-and-off compilation.
      </P>

      <H3>Reading posture</H3>

      <P>
        The book is a checklist and is meant to be read as one. The
        reader who wings it produces a system that mostly works and
        has three subtle failures they cannot locate. The reader who
        types every command as written, confirms the exit status, and
        runs the stated tests before proceeding produces a system
        that boots on the first try. This is the civic lesson of the
        exercise as well as the engineering one: the book is teaching
        the discipline of following a specification written by
        somebody who knows something you do not. Considerate citizens
        of a shared system begin here.
      </P>

      <H3>Where K-OS III diverges</H3>

      <P>
        The K-OS III installable edition, when it ships, will not be
        a pure LFS system. It will be a Zorin OS fork — which is to
        say, an Ubuntu derivative, which is to say, a Debian
        derivative — with the K-OS window manager, boot sequence,
        taskbar, and installed applications overlaid as a
        theme-and-package layer. That is the practical choice. The
        underlying architecture of that fork will be comprehensible
        to its maintainers precisely because they will have built an
        LFS system once by hand and will know what is below the
        distribution layer they are patching.
      </P>

      <H2>Audit lens</H2>

      <P>
        LFS is auditable in the strongest sense the curriculum knows:
        every byte that ends up on the running system was fetched
        with a published checksum, configured with a documented
        invocation, and compiled in front of the reader. Nothing is
        taken on trust except the upstream tarballs themselves, and
        even those can be verified against the maintainers&apos;
        signatures. The reader who finishes the book has, in the
        literal sense, no opaque components in their user-space
        below the desktop layer. That is the standard against which
        every other distribution — including the one K-OS III will
        eventually ship — has to be measured.
      </P>

      <P>
        The next move in the reading-codebases track is into the
        kernel itself: not to build it again, but to read it. LFS
        teaches the reader that an operating system is a finite stack
        of human-written files. The kernel chapter — Bovet and
        Cesati, the source tree under <Code>linux/</Code>, the
        mailing-list archives — teaches what those files actually
        say. The Linux mindset begins where LFS ends: the machine is
        not magic, the source is right there, and the only thing
        between you and understanding it is the time you are willing
        to spend reading.
      </P>

      <H2>References and further reading</H2>

      <UList>
        <Li>
          Beekmans, G., ed.{" "}
          <Em>Linux From Scratch</Em>. Current stable edition.{" "}
          <a
            href="https://www.linuxfromscratch.org"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            linuxfromscratch.org
          </a>
        </Li>
        <Li>
          <Em>Beyond Linux From Scratch</Em>.{" "}
          <a
            href="https://www.linuxfromscratch.org/blfs/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            linuxfromscratch.org/blfs
          </a>
        </Li>
        <Li>
          <Em>Cross Linux From Scratch</Em>.{" "}
          <a
            href="https://www.linuxfromscratch.org/clfs/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            linuxfromscratch.org/clfs
          </a>
        </Li>
        <Li>
          <Em>Automated Linux From Scratch</Em>.{" "}
          <a
            href="https://www.linuxfromscratch.org/alfs/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            linuxfromscratch.org/alfs
          </a>
        </Li>
        <Li>
          The LFS mailing lists and FAQ — the first place to ask for
          help after the book, and the place where issues against the
          current edition are logged.{" "}
          <a
            href="https://www.linuxfromscratch.org/mail.html"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            linuxfromscratch.org/mail.html
          </a>
        </Li>
        <Li>
          Bovet, D. P. &amp; Cesati, M. (2005).{" "}
          <Em>Understanding the Linux Kernel</Em> (3rd ed.).
          O&apos;Reilly. The companion reading for the kernel chapter
          of LFS.
        </Li>
        <Li>
          Filesystem Hierarchy Standard 3.0.{" "}
          <a
            href="https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            refspecs.linuxfoundation.org
          </a>
        </Li>
        <Li>
          Zorin OS — the base distribution K-OS III&apos;s installable
          edition will fork.{" "}
          <a
            href="https://zorin.com/os/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            zorin.com/os
          </a>
        </Li>
      </UList>
    </>
  );
}

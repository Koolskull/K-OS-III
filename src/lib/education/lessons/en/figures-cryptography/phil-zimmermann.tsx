import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function PhilZimmermann() {
  return (
    <>
      <Lead>
        In June 1991 Philip R. Zimmermann uploaded a program called{" "}
        <Em>Pretty Good Privacy</Em> to a friend who posted it to a
        Peacenet FTP site and a handful of bulletin boards, and within
        weeks ordinary civilians on five continents had, for the first
        time in the history of the medium, working public-key
        encryption strong enough to defeat the agencies that had
        designed the export-control regime to prevent exactly this.
        The United States Customs Service opened a criminal
        investigation against him in February 1993 on the theory that
        the source code was a munition and that uploading it had been
        an unlicensed export. The investigation ran for three years.
        It was dropped in January 1996 without indictment. The book
        through which the source code was legally exported during the
        investigation — printed by MIT Press, scannable by hand, and
        protected by the First Amendment — is the cleanest single
        artifact in the United States crypto-export record.
      </Lead>

      <H2>The work</H2>

      <P>
        Zimmermann, born 12 February 1954, trained as a computer
        scientist at Florida Atlantic University and spent the 1980s
        as a software engineer with a parallel commitment to
        anti-nuclear activism. He began writing PGP in the late 1980s
        in response to two convergent concerns: Senate Bill 266 of
        1991, which contained language that would have required
        manufacturers of secure communications equipment to insert
        government-readable trapdoors; and the practical observation
        that activists, journalists, and dissidents abroad had no
        access to the cryptographic tools that intelligence services
        and large corporations already used routinely. PGP 1.0,
        released in June 1991, combined the RSA public-key algorithm
        for key exchange and signatures with a symmetric cipher
        (originally Bassomatic, replaced in PGP 2.0 with IDEA) for
        bulk encryption, and shipped with a key-distribution model —
        the <Em>web of trust</Em> — in which users signed one
        another&apos;s keys directly rather than relying on a central
        certificate authority. The design assumed adversarial
        infrastructure and trusted only the endpoints.
      </P>

      <P>
        The mechanism, for a reader meeting it for the first time:
        each user generates a keypair, a public half that is
        published and a private half that never leaves the machine.
        A message encrypted with a recipient&apos;s public key can
        be read only with the matching private key; a message signed
        with a sender&apos;s private key can be verified by anyone
        holding the matching public key. The web of trust is the
        social layer on top: you sign the keys of people whose
        identity you have personally verified, and you choose to
        trust the signatures of people who have proven, over time,
        to sign carefully. There is no root authority. There is no
        company that can be served with a subpoena and forced to
        revoke. The trust graph is the users.
      </P>

      <H2>The investigation</H2>

      <Diagram
        cols={7}
        rows={3}
        nodes={[
          { id: "pgp", text: "PGP 1.0", col: 0, row: 1, sub: "Jun 1991" },
          { id: "spread", text: "Spreads worldwide", col: 1, row: 1, sub: "~2 weeks" },
          { id: "itar", text: "Customs probe", col: 2, row: 1, sub: "Feb 1993 ITAR", shape: "diamond" },
          { id: "book", text: "MIT Press book", col: 3, row: 0, accent: true, sub: "1995 1st Amend." },
          { id: "floppy", text: "Floppy = felony", col: 3, row: 2, sub: "same code" },
          { id: "drop", text: "Probe dropped", col: 5, row: 1, sub: "Jan 1996" },
          { id: "bern", text: "Bernstein v US", col: 6, row: 1, sub: "May 1999 9th Cir." },
        ]}
        edges={[
          { from: "pgp", to: "spread" },
          { from: "spread", to: "itar" },
          { from: "itar", to: "book", label: "loophole", accent: true },
          { from: "itar", to: "floppy", label: "munition", dashed: true },
          { from: "book", to: "drop", accent: true },
          { from: "floppy", to: "drop", dashed: true },
          { from: "drop", to: "bern" },
        ]}
        caption="ITAR LOOPHOLE — SOURCE CODE AS PROTECTED SPEECH WHEN PRINTED, FELONY WHEN DIGITAL."
      />

      <P>
        Under the International Traffic in Arms Regulations as they
        stood in 1991, cryptographic software using keys longer than
        forty bits was classified as a <Em>munition</Em> on the
        United States Munitions List, and exporting it without a
        State Department licence was a felony. PGP used 128-bit
        symmetric keys and 1024-bit and longer RSA keys. When PGP
        spread internationally — which, given the topology of FTP
        and Usenet in 1991, took roughly a fortnight — the U.S.
        Customs Service opened a grand-jury investigation in the
        Northern District of California, in February 1993, naming
        Zimmermann as the target. He was not the person who had
        uploaded PGP outside the United States. He was the author.
        The theory was that authorship of widely-redistributed
        munitions software constituted unlicensed export.
      </P>

      <P>
        Zimmermann&apos;s legal team, led by Phil Dubois, mounted a
        First Amendment defence: source code is expressive speech,
        and a regulation that criminalises the publication of
        expressive speech in one medium (electronic) but not another
        (print) is content-based and unconstitutional. To make the
        argument concrete, Zimmermann and the MIT Press published,
        in 1995, the complete PGP source code as a 600-page book —{" "}
        <Em>PGP Source Code and Internals</Em> — typeset in a font
        designed for OCR. A copy could be bought at a bookstore,
        carried across a border as a book, scanned, and recompiled.
        The export of the book was protected by the First Amendment.
        The export of the floppy disk was a felony. The asymmetry
        was the entire point.
      </P>

      <P>
        On 11 January 1996 the U.S. Attorney&apos;s Office in San
        Jose closed the investigation without filing charges. No
        published opinion accompanied the decision; the practical
        reading is that the prosecution had concluded the
        First-Amendment book argument would survive challenge and
        that a courtroom loss would have foreclosed the entire ITAR
        framework as applied to source code. The framework was
        foreclosed anyway three years later. In{" "}
        <Em>Bernstein v. United States</Em>, decided by the Ninth
        Circuit on 6 May 1999, the court held that source code is
        speech protected by the First Amendment and that the export
        regulations as applied to academic publication of
        cryptographic source were an unconstitutional prior
        restraint. The crypto-export regime was substantially
        liberalised by executive order later that year.
      </P>

      <H2>After PGP</H2>

      <P>
        Zimmermann published PGP 2.6.2 through MIT in 1994, founded
        Pretty Good Privacy, Inc. in 1996, and sold the company to
        Network Associates in 1997. He left in 2001 over disagreement
        about the closing of the source. The OpenPGP standard —
        RFC 2440 (1998), revised as RFC 4880 (2007) — codified the
        message format independently of any particular
        implementation; GnuPG, a clean-room re-implementation by
        Werner Koch begun in 1997, is the dominant production
        OpenPGP today and ships in essentially every Linux
        distribution. In 2006 Zimmermann published the ZRTP
        protocol for end-to-end-encrypted voice over IP, and in
        2012 co-founded Silent Circle with Jon Callas and Mike
        Janke to commercialise encrypted voice, text, and email
        for civilian users. He has given long-form interviews to
        Glenn Greenwald, has appeared in conversation with Edward
        Snowden, and is cited routinely in Bruce Schneier&apos;s
        public writing as one of the small set of people who moved
        strong cryptography from the academic and military worlds
        into ordinary civilian hands.
      </P>

      <P>
        His 1991 essay <Em>Why I Wrote PGP</Em>, expanded across
        successive editions of the PGP documentation, is the
        clearest single statement of the political case. The line
        that has travelled furthest from it —{" "}
        <Em>
          &ldquo;If privacy is outlawed, only outlaws will have
          privacy&rdquo;
        </Em>{" "}
        — is the rhetorical handle, but the substance of the
        argument is structural: a society in which strong privacy
        is the default for everyone is a different political object
        than a society in which strong privacy is a privilege
        granted by infrastructure. PGP was the first program to
        make the first kind of society materially possible at scale.
      </P>

      <H2>Audit lens</H2>

      <P>
        The PGP source has been continuously available for
        thirty-four years and the OpenPGP message format is
        specified in public RFCs that any reader can implement
        from scratch. The book — <Em>PGP Source Code and
        Internals</Em>, MIT Press, 1995 — exists in libraries and
        the underlying typeset has been digitised. The Customs
        investigation file is partially available through Freedom
        of Information Act requests filed by the Electronic
        Frontier Foundation; the closing letter of January 1996 is
        reproduced in Steven Levy&apos;s <Em>Crypto</Em> (Viking,
        2001), which remains the single best narrative source for
        the period. The Ninth Circuit&apos;s opinion in{" "}
        <Em>Bernstein v. United States</Em>, 176 F.3d 1132 (9th
        Cir. 1999), is on the public docket. A reader who wants to
        verify the chain — code released, code investigated, code
        published as a book, charges dropped, doctrine settled by
        a separate plaintiff three years later — will find every
        link of it primary-sourced.
      </P>

      <P>
        Zimmermann did not invent public-key cryptography. The
        Diffie-Hellman key-exchange paper appeared in 1976; the
        RSA paper in 1978; David Chaum&apos;s blinded-signature
        digital cash, which underwrites the entire later cypherpunk
        line through Wei Dai, Nick Szabo, Hal Finney, and Satoshi,
        appeared between 1982 and 1989. What Zimmermann did was
        package the existing primitives into a program a
        non-specialist could install, and accept the personal
        legal risk of being the named defendant when the state
        decided to test whether the export regime applied. The
        next entries in this track follow the line he stood on:
        David Chaum, who supplied the cryptographic primitives
        that the cypherpunks would weaponise; and Hal Finney, who
        ran PGP as employee number one of Zimmermann&apos;s
        company before he ran Bitcoin as user number two.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Zimmermann, P. R. (1991, expanded through 1999).{" "}
          <Em>Why I Wrote PGP</Em> — included in the PGP
          documentation; current version at{" "}
          <a
            href="https://www.philzimmermann.com/EN/essays/WhyIWrotePGP.html"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            philzimmermann.com
          </a>
          .
        </Li>
        <Li>
          Zimmermann, P. R. (1995).{" "}
          <Em>PGP Source Code and Internals</Em>. MIT Press.
          ISBN 0-262-24039-4. The book published to test the
          First Amendment status of cryptographic source under
          ITAR.
        </Li>
        <Li>
          Levy, S. (2001).{" "}
          <Em>
            Crypto: How the Code Rebels Beat the Government —
            Saving Privacy in the Digital Age
          </Em>
          . Viking. The standard narrative history of the
          investigation and the cypherpunk milieu.
        </Li>
        <Li>
          <Em>Bernstein v. United States</Em>, 176 F.3d 1132
          (9th Cir. 1999) — source code recognised as speech
          under the First Amendment; opinion on the public
          docket.
        </Li>
        <Li>
          Callas, J., Donnerhacke, L., Finney, H., Shaw, D., and
          Thayer, R. (2007). <Em>RFC 4880 — OpenPGP Message
          Format</Em>. Internet Engineering Task Force.
        </Li>
        <Li>
          Zimmermann, P. R., Johnston, A., and Callas, J. (2011).{" "}
          <Em>RFC 6189 — ZRTP: Media Path Key Agreement for
          Unicast Secure RTP</Em>. Internet Engineering Task
          Force.
        </Li>
      </UList>
    </>
  );
}

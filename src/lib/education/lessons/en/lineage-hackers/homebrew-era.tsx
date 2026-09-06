import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";

export default function HomebrewEra() {
  return (
    <>
      <Lead>
        On the evening of <Em>5 March 1975</Em>, in a two-car garage on
        the wet side of a hill in Menlo Park, California, thirty-two
        people sat on folding chairs and on the concrete floor and
        passed around a kit-built minicomputer that had arrived in the
        post in pieces. Gordon French, an electrical engineer, owned
        the garage. Fred Moore, a Quaker peace activist who had spent
        the previous decade organising against the Vietnam draft, had
        co-written the leaflet that brought the rest of them in. The
        gathering had no name yet. By the second meeting it did:
        the <Em>Homebrew Computer Club</Em>. The garage in Menlo Park
        is the room out of which the personal computer industry, the
        free-software movement, and the cypherpunk lineage all walk.
        This entry is the chronicle of that room.
      </Lead>

      <H2>The catalyst — Altair 8800, January 1975</H2>

      <P>
        The cover of <Em>Popular Electronics</Em> for January 1975
        carried a photograph of a blue-and-grey metal box covered in
        toggle switches and red LEDs above the headline{" "}
        <Em>&ldquo;World&apos;s First Minicomputer Kit to Rival
        Commercial Models&rdquo;</Em>. The machine was the Altair 8800,
        designed by Ed Roberts at MITS in Albuquerque around the new
        Intel 8080 processor and sold by mail order for{" "}
        <Em>$397 as a kit</Em> or $498 assembled. The article was
        written by Roberts and Bill Yates. MITS expected to sell a few
        hundred. Within weeks the order backlog ran into the
        thousands. There was no keyboard, no display, no software, and
        no obvious thing to do with the machine once it had been
        soldered together. What it had was the price point and the
        fact of being for sale at all. For the first time a person of
        ordinary income could own a computer outright. The machine
        passed around French&apos;s garage at the first Homebrew
        meeting was an Altair, on loan, still smelling faintly of
        solder.
      </P>

      <H2>The room — Felsenstein, Dompier, Wozniak</H2>

      <P>
        From the second meeting onward the club was moderated by{" "}
        <Em>Lee Felsenstein</Em>, a Berkeley radical and engineer who
        ran the proceedings with a wooden pointer and the parliamentary
        instincts of someone who had been organising sit-ins since the
        Free Speech Movement. Felsenstein&apos;s rule was that anyone
        could ask a question, anyone could answer, and the answer had
        to include either a schematic or a working demonstration.
        Meetings opened with a <Em>&ldquo;mapping period&rdquo;</Em>{" "}
        in which announcements were called out and indexed; then a
        <Em>&ldquo;random access period&rdquo;</Em> in which members
        wandered the room buttonholing one another over hardware
        problems. The format was deliberate. It was the format of a
        commons.
      </P>

      <P>
        The first demonstration that the machine could be made to do
        something other than blink was given by <Em>Steve Dompier</Em>{" "}
        at one of the early meetings. Dompier had discovered that the
        Altair&apos;s memory access patterns leaked radio-frequency
        interference, and that by writing a program to time the
        accesses precisely he could make a nearby AM radio play a
        recognisable tune. He chose <Em>The Fool on the Hill</Em>. The
        machine had no audio hardware. The radio was not connected to
        the machine. The room understood at once what had been done.
        An account of the demonstration appeared in the club&apos;s
        own newsletter and was reprinted in <Em>People&apos;s Computer
        Company</Em> shortly afterward.
      </P>

      <P>
        <Em>Steve Wozniak</Em> attended the club from its early months
        and brought a friend, <Em>Steve Jobs</Em>, who attended less
        often and listened more than he spoke. Wozniak demonstrated a
        single-board computer of his own design — the machine that
        became the <Em>Apple I</Em> — at Homebrew in 1976. The
        schematic was, in keeping with the club&apos;s norm, handed
        around freely; Wozniak has said in interviews and in his
        memoir <Em>iWoz</Em> (2006) that he intended the design as a
        gift to the club and that the company that became Apple
        Computer was Jobs&apos;s idea, organised around the same
        board. The Apple II followed in 1977 and was, in a real sense,
        a Homebrew artifact carried out of the garage and into a
        retail box.
      </P>

      <H2>The pivot — Bill Gates, February 1976</H2>

      <P>
        In <Em>February 1976</Em>, Bill Gates — twenty years old,
        running the small partnership Micro-Soft out of Albuquerque
        with Paul Allen — published an{" "}
        <Em>Open Letter to Hobbyists</Em> in the Homebrew Computer
        Club Newsletter and in several other hobbyist publications.
        Altair BASIC, which Gates and Allen had written for the new
        machine, was being passed hand-to-hand on paper tape at
        Homebrew meetings without payment. Gates&apos;s letter was a
        direct accusation: the practice was theft, it disincentivised
        the writing of good software, and it would ensure that no
        professional ever bothered to write for the hobbyist market.
        The letter is the founding document of the commercial
        software industry the way the GPL is the founding document of
        the free one. The hobbyist response — printed in subsequent
        newsletters — ranged from sheepish to outraged. The argument
        was not settled in the room. It was forwarded, unresolved, to
        the next forty years.
      </P>

      <H2>Adjacent rooms — Community Memory, PCC, Sol-20</H2>

      <P>
        The Homebrew Club did not appear in a vacuum. Two years
        earlier, in <Em>1973</Em>, a group around Lee Felsenstein,
        Efrem Lipkin, and Judith Milhon had set up the{" "}
        <Em>Community Memory</Em> project: a public-access computer
        terminal connected by leased line to a mainframe, installed at
        Leopold&apos;s Records on Telegraph Avenue in Berkeley. Anyone
        who walked in could post a message, search for messages, or
        leave classified ads. It was the first public-access computer
        terminal in the world. The project ran intermittently into the
        1990s and is the genealogical ancestor of the bulletin-board
        system, the Usenet group, and the public web forum.
      </P>

      <P>
        Around the same address ran the <Em>People&apos;s Computer
        Company</Em>, founded by <Em>Bob Albrecht</Em> in Menlo Park
        in 1972. PCC was a tabloid-format newsletter and a storefront
        in equal measure; it ran BASIC tutorials, printed games as
        listings, and held drop-in sessions where children could come
        in off the street and sit at a terminal. Albrecht&apos;s
        slogan, set in the masthead, read <Em>&ldquo;Computers are
        mostly used against people instead of for people; used to
        control people instead of to free them; time to change all
        that.&rdquo;</Em> The PCC publications were the entry point
        through which a substantial fraction of the Homebrew membership
        first encountered a working machine.
      </P>

      <P>
        Felsenstein&apos;s own hardware contribution arrived as the{" "}
        <Em>Sol-20</Em>, designed in 1976 for <Em>Bob Marsh</Em>&apos;s
        Processor Technology and produced in a wooden-sided case that
        looked, deliberately, like a piece of stereo equipment rather
        than laboratory gear. The Sol-20 included a keyboard and a
        video output as standard — both still optional on most
        contemporary kits — and is the direct ancestor of the
        all-in-one personal computer form factor. <Em>Adam Osborne</Em>,
        a club member who had been writing technical manuals for MITS,
        founded Osborne Computer Corporation in 1980 and shipped the
        Osborne 1 in 1981, the first commercially successful portable
        computer. The Sol-20, the Apple II, the Osborne 1, and the
        Cromemco systems were all carried out of the same room.
      </P>

      <H2>The wider culture — programmable calculators</H2>

      <P>
        A parallel hobbyist culture had formed a year earlier around
        Hewlett-Packard&apos;s <Em>HP-65</Em>, released in{" "}
        <Em>1974</Em> at $795. The HP-65 was the first handheld
        programmable calculator: programs were entered by keypress,
        stored on a small magnetic card, and executed step-by-step.
        It flew on the Apollo-Soyuz mission in 1975 as a backup for
        the onboard guidance computer. The user community produced
        program libraries, exchange clubs, and printed program
        listings in the same tabloid format as PCC. The
        programmable-calculator culture is the one most often
        forgotten in retrospective accounts of the era; it mattered
        because it taught a generation of engineers and accountants
        and physics students that a small machine they owned could
        be programmed by them, in their hand, with no institutional
        permission. Many of them showed up at Homebrew the moment a
        computer crossed the same price threshold.
      </P>

      <H2>The bridge — MIT to Silicon Valley</H2>

      <P>
        Steven Levy&apos;s <Em>Hackers: Heroes of the Computer
        Revolution</Em>, published by Anchor/Doubleday in{" "}
        <Em>1984</Em>, is the canonical chronicle of the period and
        organises its narrative in three parts. Part One covers the
        MIT AI Lab and the Tech Model Railroad Club from the late
        1950s through the 1970s — the original sense of the word{" "}
        <Em>hacker</Em> as a person who improves a system by playing
        with it. Part Two is the Homebrew era and is the chapter
        relevant here. Part Three covers the game-programming
        generation of the early 1980s. Levy&apos;s argument is that
        the hardware hackers of Homebrew were the bridge: they
        carried the ethic of the MIT lab — that information should
        be free, that authority should be mistrusted, that you can
        create art and beauty on a computer, that computers can
        change your life for the better — out of an academic
        institution and into a consumer product. The product carried
        the ethic with it, partially, imperfectly, and the partial
        carrying is what the rest of computing has been arguing about
        ever since.
      </P>

      <H2>Inheritance — the maker movement</H2>

      <P>
        The cultural inheritance of Homebrew did not pass cleanly
        into the commercial computer industry it founded. By the
        late 1980s the personal-computer business was a closed-case
        consumer market and the practice of soldering your own
        machine had become a hobby of nostalgia rather than
        necessity. The inheritance reappeared in <Em>2005</Em> with
        the publication of the first issue of <Em>Make Magazine</Em>,
        edited by Dale Dougherty for O&apos;Reilly Media, and with
        the release of the first <Em>Arduino</Em> board out of the
        Interaction Design Institute Ivrea in Italy the same year.
        The Arduino was the Altair of the 2000s: cheap, hackable,
        accompanied by a permissive licence, and supported by a
        community that exchanged schematics freely. The{" "}
        <Em>Raspberry Pi</Em>, released in 2012 by the Raspberry Pi
        Foundation in Cambridge, carried the same posture into a
        full general-purpose Linux machine at the price point of a
        textbook. The chain runs unbroken, with one thirty-year
        interruption, from French&apos;s garage to the maker faire.
      </P>

      <H2>Audit lens</H2>

      <P>
        The Homebrew Computer Club met for the last time as a formal
        organisation in <Em>December 1986</Em>. The minutes of the
        thirty-two meetings between March 1975 and the dissolution
        were preserved in mimeograph by club secretary{" "}
        <Em>Robert Reiling</Em> and are now digitised and hosted in
        full at the Computer History Museum in Mountain View, a few
        miles from the original garage. The Open Letter to
        Hobbyists, the Apple I schematic, the Community Memory
        terminal logs, the People&apos;s Computer Company back
        issues, and the Sol-20 documentation are all primary
        documents available without paywall. The reader who wants to
        check the dates above against the archive can do so without
        intermediaries. The garage on Buena Vista Avenue is still
        standing. A bronze plaque was added to the property in 2014.
        It records the date and the names and nothing else.
      </P>

      <P>
        The next entry in this track follows the argument the Open
        Letter started into its second act: the formation of the{" "}
        <Em>free-software movement</Em> under Richard Stallman at the
        MIT AI Lab in 1983, the writing of the GNU General Public
        License, and the long dispute over whether software is
        property or speech. The act after that is the{" "}
        <Em>cypherpunks</Em>, who took the same argument into
        cryptography and routed it through the mailing list that
        eventually carried the Bitcoin paper. The garage in Menlo
        Park is the room those two later movements walk out of. The
        curriculum traces both walks.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          Levy, S. (1984). <Em>Hackers: Heroes of the Computer
          Revolution</Em>. Anchor/Doubleday. Part Two — the Homebrew
          chapters — is the canonical chronicle of the period.
        </Li>
        <Li>
          Roberts, H. E. &amp; Yates, W. (January 1975).{" "}
          <Em>&ldquo;Altair 8800: The Most Powerful Minicomputer
          Project Ever Presented&rdquo;</Em>. Popular Electronics
          cover article.
        </Li>
        <Li>
          Gates, W. (3 February 1976). <Em>An Open Letter to
          Hobbyists</Em>. Homebrew Computer Club Newsletter, vol. 2,
          issue 1. Reprinted in numerous hobbyist publications the
          same month.
        </Li>
        <Li>
          Wozniak, S. with Smith, G. (2006). <Em>iWoz: From
          Computer Geek to Cult Icon</Em>. W. W. Norton.
        </Li>
        <Li>
          Felsenstein, L. Personal archive and oral history,
          Computer History Museum, Mountain View, California.
        </Li>
        <Li>
          Reiling, R. (ed.). <Em>Homebrew Computer Club
          Newsletter</Em>, issues 1&ndash;21 (1975&ndash;1977).
          Digitised collection at the Computer History Museum.
        </Li>
        <Li>
          Albrecht, R. (ed.). <Em>People&apos;s Computer Company</Em>{" "}
          newsletter (1972&ndash;1981). Menlo Park, California.
        </Li>
        <Li>
          Dougherty, D. (ed.). <Em>Make Magazine</Em>, issue 1
          (January 2005). O&apos;Reilly Media. Reopening of the
          tradition in print.
        </Li>
      </UList>
    </>
  );
}

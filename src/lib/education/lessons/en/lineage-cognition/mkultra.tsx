import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function MKUltra() {
  return (
    <>
      <Lead>
        On 13 April 1953, Director of Central Intelligence Allen Dulles
        authorised <Em>Project MKULTRA</Em>, a behavioural-modification
        research program directed for most of its life by the chemist
        Sidney Gottlieb and run for two decades through roughly 150
        subprojects at universities, hospitals, prisons, and Agency
        safehouses. The program is not contested history. The Church
        Committee (1975), the Rockefeller Commission (1975), and the
        1977 Senate Select Committee on Intelligence joint hearing
        worked from the surviving record — approximately twenty
        thousand documents that escaped the 1973 destruction order
        because they had been misfiled in a financial-records archive.
        What follows is what the declassified record actually says.
      </Lead>

      <H2>The lineage</H2>

      <Diagram
        cols={7}
        rows={1}
        nodes={[
          { id: "chatter", text: "CHATTER", col: 0, row: 0, sub: "Navy 1947" },
          { id: "bluebird", text: "BLUEBIRD", col: 1, row: 0, sub: "CIA 1950" },
          { id: "artichoke", text: "ARTICHOKE", col: 2, row: 0, sub: "CIA 1951" },
          { id: "mkultra", text: "MKULTRA", col: 3, row: 0, accent: true, sub: "1953 Dulles" },
          { id: "mksearch", text: "MKSEARCH", col: 4, row: 0, sub: "1964-72" },
          { id: "mkoften", text: "MKOFTEN", col: 5, row: 0, sub: "drug data" },
          { id: "stargate", text: "STARGATE", col: 6, row: 0, sub: "decl. 1995" },
        ]}
        edges={[
          { from: "chatter", to: "bluebird" },
          { from: "bluebird", to: "artichoke" },
          { from: "artichoke", to: "mkultra", accent: true },
          { from: "mkultra", to: "mksearch", accent: true },
          { from: "mksearch", to: "mkoften" },
          { from: "mkoften", to: "stargate", dashed: true },
        ]}
        caption="STATE-FUNDED COGNITION RESEARCH — CONTINUOUS LINEAGE 1947-1995."
      />

      <P>
        MKULTRA is one stage in a continuous sequence. <Em>Project
        CHATTER</Em> (Navy, 1947) tested drugs for interrogation. <Em>
        Project BLUEBIRD</Em> (CIA, 1950) and <Em>Project ARTICHOKE</Em>{" "}
        (CIA, 1951) added hypnosis, memory manipulation, and the
        creation of operatives whose actions could be disowned by their
        conscious personality. MKULTRA, authorised by Dulles on 13
        April 1953, consolidated this work under a single program
        office. At its peak it operated through about 150 subprojects,
        funded through cut-out foundations and carried out at
        universities, hospitals, prisons, and CIA safehouses in San
        Francisco and New York. <Em>MKSEARCH</Em> continued the core
        research from 1964 to 1972; <Em>MKOFTEN</Em> and{" "}
        <Em>MKCHICKWIT</Em> collected data on hallucinogenic and
        behavioural drugs for defensive and offensive use.
      </P>

      <H2>The methods</H2>

      <P>
        Subproject 3, known as <Em>Operation Midnight Climax</Em>, ran
        from 1953 to 1965. CIA operatives, working with the Federal
        Bureau of Narcotics, administered LSD to unwitting subjects
        procured by prostitutes paid by the Agency, in San Francisco
        and New York safehouses equipped with one-way mirrors, for the
        purpose of observing behavioural response. The operation&apos;s
        lead, George Hunter White, wrote to Gottlieb on his retirement:{" "}
        <Em>&ldquo;I was a very minor missionary, actually a heretic,
        but I toiled wholeheartedly in the vineyards because it was
        fun, fun, fun. Where else could a red-blooded American boy lie,
        kill, cheat, steal, rape and pillage with the sanction and
        blessing of the All-Highest?&rdquo;</Em> The letter is in the
        declassified file.
      </P>

      <P>
        Subproject 68 funded Dr. Donald Ewen Cameron at the Allan
        Memorial Institute in Montreal, whose <Em>psychic driving</Em>{" "}
        protocol — combining barbiturate-induced sleep, repeated taped
        messages, massive electroconvulsive repetition, and chemical
        depatterning — was carried out on involuntary psychiatric
        patients and produced the subsequent class-action suit{" "}
        <Em>Orlikow et al. v. United States</Em>, settled in 1988.
        Other subprojects funded sensory deprivation, hypnotic
        programming of couriers, and the testing of biological and
        chemical agents on military personnel at Edgewood Arsenal. The
        complete subproject list and the surviving documents are
        catalogued in the John Marks FOIA release and the supplementary
        2001 release held at the Black Vault.
      </P>

      <H2>The dead</H2>

      <P>
        Frank Olson, an Army biochemist at Fort Detrick and a CIA
        contractor, was dosed with LSD without consent on 19 November
        1953 at a retreat at Deep Creek Lake, Maryland, run by Gottlieb.
        On 28 November 1953 Olson went through a tenth-storey window of
        the Statler Hotel in Manhattan; his death was ruled a suicide.
        The Olson family received a presidential apology from Gerald
        Ford and a settlement from the U.S. government in 1975 after
        MKULTRA became public. In 1994 the family exhumed the body; the
        forensic pathologist James Starrs concluded the injuries were
        consistent with blunt-force trauma prior to the fall. The
        Southern District of New York opened a homicide inquiry in 1996
        that was later closed without prosecution. Harold Blauer, a
        tennis professional, died on 8 January 1953 during a
        mescaline-derivative trial at the New York State Psychiatric
        Institute conducted under Army Chemical Corps contract. The
        record runs longer than either of these names.
      </P>

      <H2>The destruction order</H2>

      <P>
        In early 1973, on direction from Director of Central
        Intelligence Richard Helms, substantially all MKULTRA files
        were destroyed ahead of congressional scrutiny. The files that
        survived — the roughly twenty thousand documents that formed
        the basis of the 1977 Senate hearings — did so because they
        had been misfiled in a financial-records archive and missed
        the purge. What is in the public record is therefore the
        residue of what the program was. What the program was, in full,
        is not recoverable from the surviving documents alone.
      </P>

      <H2>Audit lens</H2>

      <P>
        The audit a reader can perform here is the one the Church
        Committee and the 1977 Senate hearings already performed in
        public: take the surviving documents, name the directors who
        signed them, name the subprojects, name the dead, and refuse
        either the sensational reading or the dismissive one. Dulles
        authorised it. Gottlieb ran it. Helms destroyed the files.
        Cameron, White, and the Edgewood contractors carried it out.
        Olson and Blauer died inside it. Twenty thousand pages
        survived a deliberate purge. That is the record. The reader who
        wants more than the record has to acknowledge they are working
        past the point where the documents can carry them.
      </P>

      <P>
        MKULTRA does not stand alone in the cognition track. It sits
        between <Em>Operation Paperclip</Em> — the post-war import of
        Nazi scientists whose work on coercive interrogation seeded the
        ARTICHOKE and BLUEBIRD briefs — and the later state-funded
        consciousness research of the 1970s and 1980s: the{" "}
        <Em>Monroe Institute</Em>&apos;s Hemi-Sync work contracted by
        the Army, and <Em>Project Stargate</Em>, the remote-viewing
        program run jointly by the CIA and DIA at SRI International
        until its 1995 declassification. The lineage is one continuous
        thread of state-funded research into the modification, control,
        and remote action of human cognition. The entries that follow
        read each link in that chain on its own surviving documents.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          U.S. Senate, Select Committee on Intelligence (1977).{" "}
          <Em>
            Project MKULTRA: The CIA&apos;s Program of Research in
            Behavioral Modification
          </Em>
          . 95th Congress, joint hearing, 3 August 1977. Public
          document.
        </Li>
        <Li>
          Marks, J. (1979).{" "}
          <Em>
            The Search for the &ldquo;Manchurian Candidate&rdquo;: The
            CIA and Mind Control
          </Em>
          . Times Books. (The definitive reconstruction, based on
          Marks&apos;s own FOIA litigation.)
        </Li>
        <Li>
          Kinzer, S. (2019).{" "}
          <Em>Poisoner in Chief: Sidney Gottlieb and the CIA Search for
          Mind Control</Em>. Henry Holt.
        </Li>
        <Li>
          Church Committee (1976).{" "}
          <Em>
            Final Report of the Select Committee to Study Governmental
            Operations with Respect to Intelligence Activities
          </Em>
          , Book I.
        </Li>
        <Li>
          <Em>Orlikow et al. v. United States</Em>, D.D.C. settled
          1988 (Ewen Cameron patients).
        </Li>
        <Li>
          The Black Vault. CIA MKULTRA document collection.{" "}
          <a
            href="https://www.theblackvault.com/documentarchive/mkultra/"
            style={{ color: "#ffff00" }}
            target="_blank"
            rel="noreferrer"
          >
            theblackvault.com
          </a>
        </Li>
      </UList>
    </>
  );
}

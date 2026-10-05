import type { LessonQuiz } from "./types";

/**
 * Multiple-choice checkouts. Answers are scored client-side; progress is local only.
 * passRatio: fraction correct required (default 1 = all correct).
 */
export const LESSON_QUIZZES: Record<string, LessonQuiz> = {
  "sovereignty/01": {
    lessonId: "sovereignty/01",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "On contested topics, K-OS defaults present:",
        choices: [
          { id: "a", text: "Only the official government account" },
          { id: "b", text: "Mainstream and credible dissenting accounts, sourced, with the reader deciding" },
          { id: "c", text: "Whatever is trending on social media" },
          { id: "d", text: "No sources — only opinions" },
        ],
        correctId: "b",
        explain: "See EPISTEMIC_STANCE.md and the introduction lesson.",
      },
      {
        id: "q2",
        prompt: "The primary-source habit starts with:",
        choices: [
          { id: "a", text: "A viral video summary" },
          { id: "b", text: "Reading the primary text or declassified file when available" },
          { id: "c", text: "Picking a side first" },
          { id: "d", text: "Ignoring mainstream histories entirely" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "This track treats single-villain stories (one ethnicity/religion as sole cause) as:",
        choices: [
          { id: "a", text: "Required doctrine" },
          { id: "b", text: "Weaker than multi-actor institutional models" },
          { id: "c", text: "The only valid analysis" },
          { id: "d", text: "Irrelevant to history" },
        ],
        correctId: "b",
      },
    ],
  },
  "sovereignty/02": {
    lessonId: "sovereignty/02",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "The lesson's approach to Jesus's teachings is to:",
        choices: [
          { id: "a", text: "Replace all other lessons with one denomination's catechism" },
          { id: "b", text: "Start from public-domain Gospel texts as a simple spiritual baseline" },
          { id: "c", text: "Argue that no text can be read without a secret society" },
          { id: "d", text: "Ignore the Bible entirely" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Recommended public-domain translations mentioned include:",
        choices: [
          { id: "a", text: "Only modern paraphrases under copyright" },
          { id: "b", text: "KJV, ASV, WEB and similar public-domain texts" },
          { id: "c", text: "Only Greek manuscripts with no English" },
          { id: "d", text: "No specific translations" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "1 Thessalonians 5:21 is used in the project as:",
        choices: [
          { id: "a", text: "A call to prove all things and hold fast what is good" },
          { id: "b", text: "A rejection of all testing of claims" },
          { id: "c", text: "A banking regulation" },
          { id: "d", text: "An MKUltra code name" },
        ],
        correctId: "a",
      },
    ],
  },
  "sovereignty/03": {
    lessonId: "sovereignty/03",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Monroe's first major book on the experiences is:",
        choices: [
          { id: "a", text: "The Creature from Jekyll Island" },
          { id: "b", text: "Journeys Out of the Body (1971)" },
          { id: "c", text: "Poisoner in Chief" },
          { id: "d", text: "The Secret of Light" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "The 1983 Gateway Process document is best described as:",
        choices: [
          { id: "a", text: "A controlled multi-year clinical trial proving OBE" },
          { id: "b", text: "One officer's analysis/assessment of Monroe Institute techniques" },
          { id: "c", text: "A novel by Robert Monroe" },
          { id: "d", text: "A Federal Reserve white paper" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Hemi-Sync is primarily:",
        choices: [
          { id: "a", text: "A crypto token" },
          { id: "b", text: "Audio / hemisphere-synchronization technique associated with Monroe Institute" },
          { id: "c", text: "A CIA cryptonym for MKUltra" },
          { id: "d", text: "A Jekyll Island code word" },
        ],
        correctId: "b",
      },
    ],
  },
  "sovereignty/04": {
    lessonId: "sovereignty/04",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "MKUltra is documented primarily through:",
        choices: [
          { id: "a", text: "Only anonymous internet posts" },
          { id: "b", text: "Church Committee materials, IG reports, FOIA / National Security Archive collections" },
          { id: "c", text: "A single 2020 TikTok" },
          { id: "d", text: "Monroe's Ultimate Journey" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "The 1995 AIR evaluation of remote viewing concluded operationally that:",
        choices: [
          { id: "a", text: "Remote viewing should guide all intelligence operations" },
          { id: "b", text: "Product was too vague for actionable intelligence; continuation not warranted" },
          { id: "c", text: "Stargate never existed" },
          { id: "d", text: "Only Jessica Utts's view was published" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Large MKUltra files were destroyed in 1973 under orders associated with:",
        choices: [
          { id: "a", text: "Robert Monroe" },
          { id: "b", text: "Then-DCI Richard Helms / OTS destruction of behavioral files" },
          { id: "c", text: "Paul Warburg" },
          { id: "d", text: "J.P. Morgan personally" },
        ],
        correctId: "b",
      },
    ],
  },
  "sovereignty/05": {
    lessonId: "sovereignty/05",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Wardenclyffe's documented funding problem was primarily:",
        choices: [
          { id: "a", text: "A completed free-energy machine seized by the FBI" },
          { id: "b", text: "Capital ran out; Morgan declined further advances after scope expansion" },
          { id: "c", text: "Tesla never filed any patents" },
          { id: "d", text: "The tower was never designed" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Walter Russell's work is best labeled in this track as:",
        choices: [
          { id: "a", text: "Peer-reviewed replacement for all laboratory physics" },
          { id: "b", text: "Coherent personal philosophy/cosmology, not adopted as standard physics" },
          { id: "c", text: "A Federal Reserve white paper" },
          { id: "d", text: "A CIA remote-viewing manual" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Wireless-power patents (e.g. 645,576) prove by themselves:",
        choices: [
          { id: "a", text: "Unlimited free energy for everyone with no generation cost" },
          { id: "b", text: "Systems for transmitting electrical energy — not automatically over-unity free energy" },
          { id: "c", text: "That Wardenclyffe delivered power globally" },
          { id: "d", text: "That Russell wrote Tesla's patents" },
        ],
        correctId: "b",
      },
    ],
  },
  "sovereignty/06": {
    lessonId: "sovereignty/06",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "The Jekyll Island meeting (Nov 1910) is:",
        choices: [
          { id: "a", text: "A fictional novel only" },
          { id: "b", text: "Historical fact involving Aldrich and bankers drafting a reserve plan" },
          { id: "c", text: "Where MKUltra was founded" },
          { id: "d", text: "Where Monroe founded Hemi-Sync" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Griffin's The Creature from Jekyll Island is treated here as:",
        choices: [
          { id: "a", text: "The sole primary legal text of the Fed" },
          { id: "b", text: "A named dissenting synthesis to read alongside the Act and mainstream histories" },
          { id: "c", text: "A peer-reviewed physics textbook" },
          { id: "d", text: "A CIA FOIA dump" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Kokinda and Boyd appear in the lesson as:",
        choices: [
          { id: "a", text: "Sole authorities who must be obeyed" },
          { id: "b", text: "Contemporary voices in an American System interpretive tradition" },
          { id: "c", text: "Federal Reserve governors in 1913" },
          { id: "d", text: "Authors of MindWar" },
        ],
        correctId: "b",
      },
    ],
  },
  "culture-machines/01": {
    lessonId: "culture-machines/01",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Injection vs proliferation means:",
        choices: [
          { id: "a", text: "Only governments create culture" },
          { id: "b", text: "Institutional funding/platforming and bottom-up scene invention usually co-exist" },
          { id: "c", text: "Culture never scales through markets" },
          { id: "d", text: "Computers have no role in culture" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Treating every subculture as a pure psyop is:",
        choices: [
          { id: "a", text: "Always accurate" },
          { id: "b", text: "A flattening of history; symbiosis is the normal pattern" },
          { id: "c", text: "Required by EPISTEMIC_STANCE" },
          { id: "d", text: "The same as reading primary sources" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "The method question set includes:",
        choices: [
          { id: "a", text: "Who funded, invented, scaled, profits, and what is primary" },
          { id: "b", text: "Only which celebrity endorsed it" },
          { id: "c", text: "Whether it has a cool logo" },
          { id: "d", text: "Whether it was banned on one platform" },
        ],
        correctId: "a",
      },
    ],
  },
  "culture-machines/02": {
    lessonId: "culture-machines/02",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "SantaCon originated as:",
        choices: [
          { id: "a", text: "A 1910 Federal Reserve event" },
          { id: "b", text: "A 1994 Cacophony Society event in San Francisco" },
          { id: "c", text: "A CIA MKUltra subproject" },
          { id: "d", text: "A Roman Senate decree still in force" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Cacophony Society's relationship to early Burning Man is:",
        choices: [
          { id: "a", text: "Documented publicity, staffing, and shared prank culture" },
          { id: "b", text: "Completely unrelated" },
          { id: "c", text: "They founded the Federal Reserve" },
          { id: "d", text: "They wrote MindWar" },
        ],
        correctId: "a",
      },
      {
        id: "q3",
        prompt: "Saturnalia in this track is:",
        choices: [
          { id: "a", text: "A continuous secret program running SantaCon" },
          { id: "b", text: "A historical Roman festival sometimes invoked symbolically" },
          { id: "c", text: "A Stargate remote-viewing protocol" },
          { id: "d", text: "An NFT collection from 2021" },
        ],
        correctId: "b",
      },
    ],
  },
  "culture-machines/03": {
    lessonId: "culture-machines/03",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Kesey's early LSD access is historically linked to:",
        choices: [
          { id: "a", text: "Only black-market chemists with no research history" },
          { id: "b", text: "Academic / federally connected research volunteer settings before the Acid Tests" },
          { id: "c", text: "Jekyll Island bankers" },
          { id: "d", text: "The Monroe Institute Gateway tapes only" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "The Grateful Dead's role at the Acid Tests was primarily:",
        choices: [
          { id: "a", text: "House band / sonic backdrop for the multimedia events" },
          { id: "b", text: "Secret Federal Reserve auditors" },
          { id: "c", text: "Authors of the AIR Stargate report" },
          { id: "d", text: "Founders of Alcor" },
        ],
        correctId: "a",
      },
      {
        id: "q3",
        prompt: "Large EDM festivals later are best described as:",
        choices: [
          { id: "a", text: "Proof MI-6 still runs every party" },
          { id: "b", text: "Mostly commercialization and professionalization of underground forms" },
          { id: "c", text: "Identical to 1965 Acid Tests in every way" },
          { id: "d", text: "Illegal by definition everywhere" },
        ],
        correctId: "b",
      },
    ],
  },
  "culture-machines/04": {
    lessonId: "culture-machines/04",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "CCRU is associated with:",
        choices: [
          { id: "a", text: "Warwick theory-fiction including Plant, Land, Fisher" },
          { id: "b", text: "The 1913 Federal Reserve Act" },
          { id: "c", text: "Alcor's first cryopreservation" },
          { id: "d", text: "SantaCon 1994 only" },
        ],
        correctId: "a",
      },
      {
        id: "q2",
        prompt: "Jungle music's relationship to CCRU writing was:",
        choices: [
          { id: "a", text: "CCRU invented jungle before any DJs" },
          { id: "b", text: "Scene-driven music that CCRU engaged as a sonic/theoretical model" },
          { id: "c", text: "Banned by Nick Land" },
          { id: "d", text: "A Fed open-market operation" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Hyperstition roughly means:",
        choices: [
          { id: "a", text: "Fictions that make themselves real through cultural feedback" },
          { id: "b", text: "A type of LSD molecule" },
          { id: "c", text: "A Jekyll Island participant" },
          { id: "d", text: "A cryonics protocol" },
        ],
        correctId: "a",
      },
    ],
  },
  "culture-machines/05": {
    lessonId: "culture-machines/05",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "From PSYOP to MindWar (1980) is:",
        choices: [
          { id: "a", text: "A documented open staff study on PSYOP doctrine, not proven as MKUltra 'Operation Mind War'" },
          { id: "b", text: "A criminal conviction of Aquino" },
          { id: "c", text: "A Federal Reserve charter" },
          { id: "d", text: "Monroe's third book" },
        ],
        correctId: "a",
      },
      {
        id: "q2",
        prompt: "Regarding Presidio daycare allegations against Aquino, the public record shows:",
        choices: [
          { id: "a", text: "He was paid by the FBI to rape as policy" },
          { id: "b", text: "Investigation occurred; SFPD closed without charges; no criminal conviction" },
          { id: "c", text: "He was never investigated at all" },
          { id: "d", text: "He founded the Cacophony Society" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "FBI involvement in the Presidio case is best described as:",
        choices: [
          { id: "a", text: "Investigative participation — not proof of employing Aquino to commit crimes" },
          { id: "b", text: "A payroll for torture data collection proven in court" },
          { id: "c", text: "No files exist anywhere" },
          { id: "d", text: "Identical to funding Burning Man" },
        ],
        correctId: "a",
      },
      {
        id: "q4",
        prompt: "Army CID 'titling' Aquino means:",
        choices: [
          { id: "a", text: "A criminal conviction in federal court" },
          { id: "b", text: "His name appeared in the titling database without charges being filed" },
          { id: "c", text: "A promotion to colonel" },
          { id: "d", text: "A Medal of Honor citation" },
        ],
        correctId: "b",
      },
    ],
  },
  "culture-machines/06": {
    lessonId: "culture-machines/06",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Festival scale in this track is best described as:",
        choices: [
          { id: "a", text: "Proof that every large gathering is a psyop" },
          { id: "b", text: "A mix of genuine bottom-up scenes and commercial/institutional scaling" },
          { id: "c", text: "Always identical to 1965 Acid Tests" },
          { id: "d", text: "Irrelevant to culture-machine analysis" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Myth filters in this track require:",
        choices: [
          { id: "a", text: "Accepting the most dramatic version of events" },
          { id: "b", text: "Checking claims against primary sources and documented records" },
          { id: "c", text: "Ignoring mainstream accounts entirely" },
          { id: "d", text: "Only counting celebrity endorsements" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "The track's method on contested cultural history is:",
        choices: [
          { id: "a", text: "Pick the side with the best story" },
          { id: "b", text: "Present documented record vs internet narrative, cite sources, leave contradictions visible" },
          { id: "c", text: "Ban all discussion of occult topics" },
          { id: "d", text: "Treat every claim as equally true" },
        ],
        correctId: "b",
      },
    ],
  },
  "culture-machines/07": {
    lessonId: "culture-machines/07",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "The timeless part of the C64, the Amiga, and the Fairlight, in this lesson, is:",
        choices: [
          { id: "a", text: "The beige case as a souvenir" },
          { id: "b", text: "The control grammar: frame-rate registers, the effect column, Page R, the sequencer" },
          { id: "c", text: "The retail price alone" },
          { id: "d", text: "A startup chime in a nostalgia video" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Jazz from Hell (1986) and its Grammy are recorded here as:",
        choices: [
          { id: "a", text: "A live band album that won Best Instrumental Composition for the title track" },
          { id: "b", text: "Synclavier pieces by Zappa except the live solo St. Etienne; the album won Best Rock Instrumental Performance in 1988" },
          { id: "c", text: "A Fairlight record made by Herbie Hancock" },
          { id: "d", text: "An LSDJ cartridge" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Juan Larrazabal's account that institutions pushed mainstream hip hop to incite violence is:",
        choices: [
          { id: "a", text: "Adopted as the lesson's finding" },
          { id: "b", text: "Filed as his account; he calls the connections mostly anecdotal; a contract, grant, memo, or named program would be the next evidence" },
          { id: "c", text: "Disproved by the existence of trackers" },
          { id: "d", text: "The same document as Prince's 1993 Warner protest" },
        ],
        correctId: "b",
      },
      {
        id: "q4",
        prompt: "The design rule this lesson states for K-OS is:",
        choices: [
          { id: "a", text: "The interface bends until it feels familiar" },
          { id: "b", text: "The user adjusts to a small, dense grammar so decisions stay fast" },
          { id: "c", text: "Nostalgia for the case is the specification" },
          { id: "d", text: "Final Cut Pro is the model for musical speed" },
        ],
        correctId: "b",
      },
      {
        id: "q5",
        prompt: "In this lesson, 8-Bit and 8-bit name:",
        choices: [
          { id: "a", text: "The same Highland Park band McLaren managed" },
          { id: "b", text: "A Highland Park band that built the Beck tracks in 2004–2005, and separately the international chip-music practice" },
          { id: "c", text: "Only a Wired magazine photoshoot" },
          { id: "d", text: "Only 8 Bit Weapon" },
        ],
        correctId: "b",
      },
      {
        id: "q6",
        prompt: "Larrazabal's stated split from McLaren's \"8-Bit Punk\" is:",
        choices: [
          { id: "a", text: "They agreed the point of the machines was the look a crowd would adore" },
          { id: "b", text: "Gratitude: new work in undiscovered territory, offered because God gave the gift. Gratification: an aesthetic arranged so an audience will pay and adore" },
          { id: "c", text: "The essay is the manual for the phrase screen" },
          { id: "d", text: "The essay never mentions fashion" },
        ],
        correctId: "b",
      },
      {
        id: "q7",
        prompt: "Who wrote Little Sound Dj, and where is it published?",
        choices: [
          { id: "a", text: "Malcolm McLaren, in Wired, November 2003" },
          { id: "b", text: "Johan Kotlinski. The program is at littlesounddj.com. His repositories are at github.com/jkotlinski" },
          { id: "c", text: "Andy Bollas, as the Highland Park band 8-Bit" },
          { id: "d", text: "Karsten Obarski, as Ultimate Soundtracker" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/01": {
    lessonId: "antediluvian/01",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "This track's primary job is to:",
        choices: [
          { id: "a", text: "Convert the reader to one antediluvian theory" },
          { id: "b", text: "Observe and map alternative theories with sources and visible contradictions" },
          { id: "c", text: "Replace all archaeology with YouTube alone" },
          { id: "d", text: "Prove every institution is always lying" },
        ],
        correctId: "b",
        explain: "Observe, don't convert — EPISTEMIC_STANCE and lesson 01.",
      },
      {
        id: "q2",
        prompt: "Which research cluster is central to this track's denser material?",
        choices: [
          { id: "a", text: "Only modern stock-market charts" },
          { id: "b", text: "Old-map occultism, cross-continental similarities, and 'founded' megalith problems" },
          { id: "c", text: "Only Federal Reserve minutes" },
          { id: "d", text: "Only NFT whitepapers" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "When four theories use different clocks, this track treats that as:",
        choices: [
          { id: "a", text: "A bug to hide" },
          { id: "b", text: "Data — contradiction left visible" },
          { id: "c", text: "Proof one ethnicity is responsible" },
          { id: "d", text: "Irrelevant" },
        ],
        correctId: "b",
      },
      {
        id: "q4",
        prompt: "A longform alternative-history video is usually:",
        choices: [
          { id: "a", text: "A primary excavation report" },
          { id: "b", text: "Secondary entertainment-scholarship — good for questions, weak as final dating authority" },
          { id: "c", text: "The same as an ice core" },
          { id: "d", text: "Illegal to watch" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/02": {
    lessonId: "antediluvian/02",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "The Younger Dryas is:",
        choices: [
          { id: "a", text: "A fictional YouTube invention only" },
          { id: "b", text: "A real late-Pleistocene cold interval, with debated mechanisms" },
          { id: "c", text: "The same as Tartaria world fairs" },
          { id: "d", text: "Only mentioned in Genesis" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "YDIH (Younger Dryas Impact Hypothesis) is best labeled as:",
        choices: [
          { id: "a", text: "Uncontested textbook consensus with no critics" },
          { id: "b", text: "A contested research program with published proponents and critics" },
          { id: "c", text: "A Federal Reserve policy" },
          { id: "d", text: "Proof Plato invented ice cores" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Merging YD proxies with Plato's 9,000 years without conversion is:",
        choices: [
          { id: "a", text: "Automatic good chronology" },
          { id: "b", text: "Clock-merging that needs explicit calendar work" },
          { id: "c", text: "Required by EPISTEMIC_STANCE" },
          { id: "d", text: "The same as reading an ice core" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/03": {
    lessonId: "antediluvian/03",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Göbekli Tepe is:",
        choices: [
          { id: "a", text: "A CGI-only internet myth" },
          { id: "b", text: "A real Pre-Pottery Neolithic site with monumental T-pillars" },
          { id: "c", text: "A 19th-century world fair building" },
          { id: "d", text: "Plato's personal estate" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "The 'founded' buildings problem in this lesson means:",
        choices: [
          { id: "a", text: "Every stone building is fake" },
          { id: "b", text: "Sites where conventional founding/attribution sits awkwardly beside scale or technique — studied site by site" },
          { id: "c", text: "Only underwater hotels" },
          { id: "d", text: "A Federal Reserve construction program" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Baalbek, Giza, and Andean polygonal walls are treated here as:",
        choices: [
          { id: "a", text: "Automatic proof of one global antediluvian guild" },
          { id: "b", text: "Claim clusters where alternative pressure meets mainstream phase dating — not interchangeable clocks" },
          { id: "c", text: "Irrelevant to alternative history" },
          { id: "d", text: "Only Roman tourist props with no stone mass" },
        ],
        correctId: "b",
      },
      {
        id: "q4",
        prompt: "Zodiac/comet readings of Göbekli pillars should be:",
        choices: [
          { id: "a", text: "Accepted without publication" },
          { id: "b", text: "Treated as hypotheses needing enclosure numbers, sources, and testability" },
          { id: "c", text: "Banned from discussion" },
          { id: "d", text: "Identical to radiocarbon dates" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/04": {
    lessonId: "antediluvian/04",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Plato's Atlantis appears primarily in:",
        choices: [
          { id: "a", text: "A NOAA ice-core table" },
          { id: "b", text: "The dialogues Timaeus and Critias" },
          { id: "c", text: "The Federal Reserve Act" },
          { id: "d", text: "A 2020 NFT whitepaper only" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Cross-continental similarities in myths and stone forms are best handled as:",
        choices: [
          { id: "a", text: "Automatic proof of one parent empire" },
          { id: "b", text: "Patterns that may reflect contact, convergence, or both — without forcing one rule on every case" },
          { id: "c", text: "Illegal to compare" },
          { id: "d", text: "Only explainable by modern social media" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Post-glacial sea-level rise drowning shelves is:",
        choices: [
          { id: "a", text: "Fringe-only and unevidenced" },
          { id: "b", text: "Strongly evidenced geology — not automatically identical to Plato's moral island" },
          { id: "c", text: "Disproven by every textbook" },
          { id: "d", text: "The same as mud-flood basement windows" },
        ],
        correctId: "b",
      },
      {
        id: "q4",
        prompt: "Diffusionism vs independent invention in this track means:",
        choices: [
          { id: "a", text: "Only one is ever allowed" },
          { id: "b", text: "Both can be true in different cases; forcing one rule on every site is the error" },
          { id: "c", text: "Neither exists in anthropology" },
          { id: "d", text: "They are banking terms" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/05": {
    lessonId: "antediluvian/05",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "When a video claims a map 'knows too much,' first step is:",
        choices: [
          { id: "a", text: "Accept the overlay as primary" },
          { id: "b", text: "Inspect an archival image of the actual sheet and its legends" },
          { id: "c", text: "Ignore all maps forever" },
          { id: "d", text: "Assume Antarctica is always correct" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "The occult / alternative map worldview typically holds that early modern charts are:",
        choices: [
          { id: "a", text: "Only tourist posters" },
          { id: "b", text: "Palimpsests that may preserve fragments of older hydrographic knowledge after catastrophe" },
          { id: "c", text: "Proof the Federal Reserve surveyed Antarctica in 1913" },
          { id: "d", text: "Identical to ice cores" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Piri Reis (1513) in this lesson is framed as:",
        choices: [
          { id: "a", text: "A modern CGI fake only" },
          { id: "b", text: "An Ottoman compilation whose alternative readings claim older source knowledge; mainstream reads it within discovery-era cartography" },
          { id: "c", text: "Plato's personal sketchbook" },
          { id: "d", text: "A Tartaria world-fair blueprint" },
        ],
        correctId: "b",
      },
      {
        id: "q4",
        prompt: "Underwater linear rocks on video are:",
        choices: [
          { id: "a", text: "Always temples" },
          { id: "b", text: "Candidates that may be natural, modern, or archaeological — provenance and survey required" },
          { id: "c", text: "Never interesting" },
          { id: "d", text: "Proof of Tartaria alone" },
        ],
        correctId: "b",
      },
      {
        id: "q5",
        prompt: "Hapgood-style source-map arguments should separate:",
        choices: [
          { id: "a", text: "Nothing — accept the whole package" },
          { id: "b", text: "Sheet inspection / compilation claims from larger pole-shift or cosmology claims" },
          { id: "c", text: "Only subscriber counts" },
          { id: "d", text: "Maps from legends forever" },
        ],
        correctId: "b",
      },
    ],
  },

  "antediluvian/06": {
    lessonId: "antediluvian/06",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "1 Enoch's Book of the Watchers is best treated on this track as:",
        choices: [
          { id: "a", text: "A radiocarbon-dated dig report" },
          { id: "b", text: "Second Temple–era literature with a descent narrative — sacred/mythic clock, not ice-core chronology by default" },
          { id: "c", text: "A Federal Reserve white paper" },
          { id: "d", text: "Proof Tartaria built Göbekli Tepe" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "When a video glues Enoch to megaliths without a bridge argument, the failure mode is:",
        choices: [
          { id: "a", text: "Correct scientific method" },
          { id: "b", text: "Collage — text-world beings treated as dig-layer bones without evidence chain" },
          { id: "c", text: "Required by Genesis alone" },
          { id: "d", text: "The only valid EPISTEMIC_STANCE conclusion" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "A primary door for Enochic text work is:",
        choices: [
          { id: "a", text: "Only TikTok summaries" },
          { id: "b", text: "Public-domain translations (e.g. R.H. Charles) plus manuscript/DSS scholarship entry points" },
          { id: "c", text: "NOAA sea-level charts only" },
          { id: "d", text: "World's Fair souvenir books only" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/07": {
    lessonId: "antediluvian/07",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "The Watchers' 'forbidden arts' catalog should first be handled as:",
        choices: [
          { id: "a", text: "A verified global engineering syllabus" },
          { id: "b", text: "A literary list in Enochic tradition — check chapters/names before upgrading to civilization theory" },
          { id: "c", text: "Identical to every patent office filing" },
          { id: "d", text: "Proof cosmetics invented agriculture" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Upgrading the teaching list into one antediluvian tech guild is:",
        choices: [
          { id: "a", text: "Automatic once an angel is named" },
          { id: "b", text: "An extraordinary cultural hypothesis that must be tested site-by-site against material records" },
          { id: "c", text: "Forbidden to discuss" },
          { id: "d", text: "The same as reading ice cores" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Culture-hero myths (Prometheus-style civilizers) are useful as:",
        choices: [
          { id: "a", text: "Identical passports for one dated empire" },
          { id: "b", text: "Comparative literature — not automatic proof of one descent event" },
          { id: "c", text: "Banking regulations" },
          { id: "d", text: "Proof no crafts have real gradual histories" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/08": {
    lessonId: "antediluvian/08",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Giant claims should separate at minimum:",
        choices: [
          { id: "a", text: "Nothing — all giants are one species" },
          { id: "b", text: "Biblical/Enochic text, folklore, and newspaper/osteology claims with provenience" },
          { id: "c", text: "Only AI art" },
          { id: "d", text: "Only star-fort plans" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "A 19th-century newspaper giant skeleton story is:",
        choices: [
          { id: "a", text: "Automatically a museum catalog fact" },
          { id: "b", text: "A clipping that may be sensational, erroneous, fraudulent, or occasionally mundane tall burial — needs provenience" },
          { id: "c", text: "Illegal to read" },
          { id: "d", text: "Identical to 1 Enoch chapter and verse" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Race-mystical 'prior race' giant stories are treated on this track as:",
        choices: [
          { id: "a", text: "Required doctrine" },
          { id: "b", text: "Ethically and evidentially weak — colonial abuse patterns to notice, not entertain as hierarchy" },
          { id: "c", text: "The only valid anthropology" },
          { id: "d", text: "Proof of Tartaria alone" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/09": {
    lessonId: "antediluvian/09",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Hyperdiffusionism claims that:",
        choices: [
          { id: "a", text: "No culture ever contacts another" },
          { id: "b", text: "Most major 'high' culture radiates from one (or few) mother sources rather than repeated independent invention" },
          { id: "c", text: "Only ice cores invent myths" },
          { id: "d", text: "Maps are illegal" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Mainstream archaeology's usual stance is:",
        choices: [
          { id: "a", text: "Zero diffusion ever happens" },
          { id: "b", text: "Lots of diffusion is real; hyperdiffusion as a universal rule is rejected because multiple centers and local sequences exist" },
          { id: "c", text: "Atlantis is required curriculum" },
          { id: "d", text: "Only YouTube counts" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "When evaluating a mother-culture claim, first:",
        choices: [
          { id: "a", text: "Accept the montage music as proof" },
          { id: "b", text: "Define the trait precisely, date both ends, propose a vector, and check what should also have transferred" },
          { id: "c", text: "Rank living peoples by 'advancement'" },
          { id: "d", text: "Ignore local developmental sequences" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/10": {
    lessonId: "antediluvian/10",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Rh blood groups in medicine are:",
        choices: [
          { id: "a", text: "A YouTube invention only" },
          { id: "b", text: "Real genetics with clinical importance (e.g. pregnancy incompatibility) — not automatically antediluvian hybrid proof" },
          { id: "c", text: "Proof of Agartha" },
          { id: "d", text: "Identical to star-fort plans" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Upgrading Rh-negative status into a divine/non-human caste is treated here as:",
        choices: [
          { id: "a", text: "Required OS doctrine" },
          { id: "b", text: "Extraordinary metaphysical claim that often smuggles hierarchy — refuse master-race framing" },
          { id: "c", text: "The same as reading a peer-reviewed allele frequency table" },
          { id: "d", text: "Proof Plato invented blood banks" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "If a channel cites genetics, the habit is:",
        choices: [
          { id: "a", text: "Trust the B-roll helix animation" },
          { id: "b", text: "Open the paper / primary genetics source and separate Tier A science from Tier C myth" },
          { id: "c", text: "Only trust another video" },
          { id: "d", text: "Ignore all labs forever" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/11": {
    lessonId: "antediluvian/11",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "'Tartary' on early modern maps is:",
        choices: [
          { id: "a", text: "CGI only" },
          { id: "b", text: "A real cartographic label for poorly known Eurasian interiors — not auto-proof of one free-energy world empire" },
          { id: "c", text: "Plato's personal estate name" },
          { id: "d", text: "A NOAA ice-core code" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Windows half-below modern grade often reflect:",
        choices: [
          { id: "a", text: "Only a single global mud day with no other explanations" },
          { id: "b", text: "Street raising, basements, renovations — check local municipal history before global slurry" },
          { id: "c", text: "Proof of Nephilim plumbing" },
          { id: "d", text: "That maps are fake" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "A global mud-flood reset is:",
        choices: [
          { id: "a", text: "Trivial and already proven by one photo" },
          { id: "b", text: "An extraordinary claim needing stratigraphy and synchronized evidence, not only montage" },
          { id: "c", text: "Identical to Younger Dryas by default" },
          { id: "d", text: "Forbidden to question" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/12": {
    lessonId: "antediluvian/12",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Many World's Fair landmark buildings were:",
        choices: [
          { id: "a", text: "Solid granite meant to last forever by contract" },
          { id: "b", text: "Temporary staff/plaster spectacles designed for a season — demolition was often planned" },
          { id: "c", text: "Built by Plato in 9600 BCE" },
          { id: "d", text: "Only CGI in 2020" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Alternative media often reads fairs as:",
        choices: [
          { id: "a", text: "Boring trade shows with no photos" },
          { id: "b", text: "Last public faces of a suppressed capital civilization — a claim that must beat temporary-construction evidence" },
          { id: "c", text: "Federal Reserve board meetings only" },
          { id: "d", text: "Identical to Göbekli enclosures" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "First step for a fair building claim is:",
        choices: [
          { id: "a", text: "Accept the drone music" },
          { id: "b", text: "Identify year/city, materials, and planned duration from contemporary guides/engineering sources" },
          { id: "c", text: "Assume mud flood" },
          { id: "d", text: "Ignore all archives" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/13": {
    lessonId: "antediluvian/13",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Mainstream military history explains star forts primarily as:",
        choices: [
          { id: "a", text: "Aether antennas only" },
          { id: "b", text: "Gunpowder-era geometry against cannon (low walls, angled bastions, flanking fire)" },
          { id: "c", text: "Neolithic farming plots" },
          { id: "d", text: "World's Fair souvenir pins" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "EMF / free-energy readings of forts and domes must eventually provide:",
        choices: [
          { id: "a", text: "Only aesthetic resemblance" },
          { id: "b", text: "Mechanism, units, and tests — not only sacred-geometry vibe" },
          { id: "c", text: "A better soundtrack" },
          { id: "d", text: "Proof military history never existed" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Formal resemblance between plans is:",
        choices: [
          { id: "a", text: "Automatic proof of identical function" },
          { id: "b", text: "A hypothesis generator — function still needs evidence" },
          { id: "c", text: "Illegal to notice" },
          { id: "d", text: "The same as radiocarbon" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/14": {
    lessonId: "antediluvian/14",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Classical Hyperborea is primarily:",
        choices: [
          { id: "a", text: "A NOAA sediment core" },
          { id: "b", text: "A Greek literary/mythic far-north people/place later reused by esoteric writers" },
          { id: "c", text: "A 1893 fair pavilion only" },
          { id: "d", text: "A star-fort manual" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Agartha / hollow-earth kingdoms in modern alt media usually descend from:",
        choices: [
          { id: "a", text: "Peer-reviewed mantle tomography alone" },
          { id: "b", text: "Occult/Theosophical and speculative traditions — cultural history first, extraordinary geophysics if claimed" },
          { id: "c", text: "Only municipal street-raising records" },
          { id: "d", text: "The Federal Reserve Act" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Polar origin myths that rank living peoples are:",
        choices: [
          { id: "a", text: "Encouraged as OS doctrine" },
          { id: "b", text: "Rejected as hierarchy smuggling — study texts without race-mysticism upgrades" },
          { id: "c", text: "Required for map reading" },
          { id: "d", text: "Identical to plate tectonics" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/15": {
    lessonId: "antediluvian/15",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "'Found not founded' in the strong sense means:",
        choices: [
          { id: "a", text: "Every plaque is perfect" },
          { id: "b", text: "Official founders only rebranded older monumental infrastructure built by a lost culture — needs positive evidence, not only disbelief" },
          { id: "c", text: "No building is multi-phase" },
          { id: "d", text: "Only fair plaster exists" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Multi-phase rebuilding and spoliation are:",
        choices: [
          { id: "a", text: "Impossible in archaeology" },
          { id: "b", text: "Normal — weak 'found' can mean reuse; strong antediluvian contractor claims need more" },
          { id: "c", text: "Proof of one global year" },
          { id: "d", text: "Only a YouTube filter" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Site-by-site method includes:",
        choices: [
          { id: "a", text: "Only drone music" },
          { id: "b", text: "Phases, inscriptions/archives, quarries/logistics, tool-mark studies, and falsifiers" },
          { id: "c", text: "Merging Baalbek and Chicago 1893 as one date" },
          { id: "d", text: "Ignoring local sequences" },
        ],
        correctId: "b",
      },
    ],
  },
  "antediluvian/16": {
    lessonId: "antediluvian/16",
    passRatio: 1,
    questions: [
      {
        id: "q1",
        prompt: "Treating Nephilim, Atlantis, YD, Piri Reis, Agartha, and Tartarian fairs as one empire without calendar conversion is:",
        choices: [
          { id: "a", text: "Strict chronology" },
          { id: "b", text: "Mythic collage — seams should stay visible" },
          { id: "c", text: "Required dig method" },
          { id: "d", text: "The only EPISTEMIC_STANCE conclusion" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Tartaria/mud-flood photo arguments often emphasize which clock?",
        choices: [
          { id: "a", text: "Pre-Pottery Neolithic only" },
          { id: "b", text: "Early modern maps of Tartary and 18th–19th-century architecture/photos" },
          { id: "c", text: "Plato's exact Greek meter only" },
          { id: "d", text: "Greenland ice annual layers only" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "A healthy checkout habit for combined conclusions is to:",
        choices: [
          { id: "a", text: "Accept every glue word as proof" },
          { id: "b", text: "Keep, split, or drop claims based on whether evidence chains match the date and mechanism" },
          { id: "c", text: "Ignore all mainstream sources" },
          { id: "d", text: "Only trust music under the video" },
        ],
        correctId: "b",
      },
      {
        id: "q4",
        prompt: "When blood/ethnicity enters an antediluvian essay, this track says:",
        choices: [
          { id: "a", text: "Rank peoples immediately" },
          { id: "b", text: "Apply lesson 10's ethics filter — no master-race or single-villain ethnic frames" },
          { id: "c", text: "Skip all genetics papers" },
          { id: "d", text: "Treat Rh as proof of Agartha" },
        ],
        correctId: "b",
      },
    ],
  },

};

export function getQuiz(lessonId: string): LessonQuiz | null {
  return LESSON_QUIZZES[lessonId] ?? null;
}

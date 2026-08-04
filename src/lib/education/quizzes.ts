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
        prompt: "The lesson’s approach to Jesus’s teachings is to:",
        choices: [
          { id: "a", text: "Replace all other lessons with one denomination’s catechism" },
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
        prompt: "Monroe’s first major book on the experiences is:",
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
          { id: "b", text: "One officer’s analysis/assessment of Monroe Institute techniques" },
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
          { id: "d", text: "Monroe’s Ultimate Journey" },
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
          { id: "d", text: "Only Jessica Utts’s view was published" },
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
        prompt: "Wardenclyffe’s documented funding problem was primarily:",
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
        prompt: "Walter Russell’s work is best labeled in this track as:",
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
          { id: "d", text: "That Russell wrote Tesla’s patents" },
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
        prompt: "Griffin’s The Creature from Jekyll Island is treated here as:",
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
        prompt: "Cacophony Society’s relationship to early Burning Man is:",
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
        prompt: "Kesey’s early LSD access is historically linked to:",
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
        prompt: "The Grateful Dead’s role at the Acid Tests was primarily:",
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
          { id: "c", text: "Alcor’s first cryopreservation" },
          { id: "d", text: "SantaCon 1994 only" },
        ],
        correctId: "a",
      },
      {
        id: "q2",
        prompt: "Jungle music’s relationship to CCRU writing was:",
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
          { id: "a", text: "A documented open staff study on PSYOP doctrine, not proven as MKUltra ‘Operation Mind War’" },
          { id: "b", text: "A criminal conviction of Aquino" },
          { id: "c", text: "A Federal Reserve charter" },
          { id: "d", text: "Monroe’s third book" },
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
        prompt: "Army CID ‘titling’ Aquino means:",
        choices: [
          { id: "a", text: "A criminal conviction in federal court" },
          { id: "b", text: "His name appeared in the title block of an investigation report (litigated; not the same as a conviction)" },
          { id: "c", text: "He was elected to the Senate" },
          { id: "d", text: "He passed the AIR remote-viewing test" },
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
        prompt: "Viral Island Boys / Epstein kid photos have been:",
        choices: [
          { id: "a", text: "Proven authentic court exhibits" },
          { id: "b", text: "Fact-checked as AI-generated / fabricated in major fact checks" },
          { id: "c", text: "Alcor membership cards" },
          { id: "d", text: "CCRU seminar flyers" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Milady Maker is documented as:",
        choices: [
          { id: "a", text: "A proven government Q+++ psyop" },
          { id: "b", text: "A 2021 Ethereum NFT project from Remilia Collective" },
          { id: "c", text: "An Army PSYOP field manual" },
          { id: "d", text: "A Monroe Focus level" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Alcor is:",
        choices: [
          { id: "a", text: "A proven secret lab freezing missing ravers without consent as policy" },
          { id: "b", text: "A real nonprofit cryonics org; members arrange cryopreservation after legal death" },
          { id: "c", text: "The 1910 Jekyll Island clubhouse" },
          { id: "d", text: "A jungle pirate radio station" },
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
        prompt: "Watchers/Nephilim material is primarily anchored in:",
        choices: [
          { id: "a", text: "Ice cores only" },
          { id: "b", text: "Biblical and Enochic textual traditions" },
          { id: "c", text: "19th-century expo blueprints alone" },
          { id: "d", text: "NOAA sea-level charts only" },
        ],
        correctId: "b",
      },
      {
        id: "q2",
        prompt: "Tartaria / mud-flood claims often emphasize:",
        choices: [
          { id: "a", text: "Pre-Pottery Neolithic pillars exclusively" },
          { id: "b", text: "Early modern maps of Tartary and 18th–19th-century architecture/photos" },
          { id: "c", text: "Plato's exact Greek meter" },
          { id: "d", text: "Greenland ice annual layers only" },
        ],
        correctId: "b",
      },
      {
        id: "q3",
        prompt: "Treating Nephilim, Atlantis, YD, Piri Reis, and Tartarian fairs as one empire without calendar conversion is:",
        choices: [
          { id: "a", text: "Strict chronology" },
          { id: "b", text: "Mythic collage — seams should stay visible" },
          { id: "c", text: "Required dig method" },
          { id: "d", text: "The same as EPISTEMIC_STANCE's only allowed conclusion" },
        ],
        correctId: "b",
      },
      {
        id: "q4",
        prompt: "A healthy checkout habit for combined conclusions is to:",
        choices: [
          { id: "a", text: "Accept every glue word as proof" },
          { id: "b", text: "Keep, split, or drop claims based on whether evidence chains match the date and mechanism" },
          { id: "c", text: "Ignore all mainstream sources" },
          { id: "d", text: "Only trust music under the video" },
        ],
        correctId: "b",
      },
    ],
  },

};

export function getQuiz(lessonId: string): LessonQuiz | null {
  return LESSON_QUIZZES[lessonId] ?? null;
}

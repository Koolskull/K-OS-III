/*
 * Backstage Wiki — history and intended significance
 * Data source for the in-OS Backstage app, read beside the Stardrain Wiki.
 *
 * In-universe facts stay in stardrain-lore.ts.
 * This file holds where a thing came from and what it is for.
 * loreIds point at Stardrain entry ids. Leave them off until the tie is said.
 */

export interface BackstageEntry {
  id: string;
  title: string;
  body: string;
  category: "orientation" | "childhood" | "productions" | "innovations" | "practice";
  loreIds?: string[];
}

export const BACKSTAGE_ENTRIES: BackstageEntry[] = [
  {
    id: "how-to-read",
    title: "How To Read This Wiki",
    category: "orientation",
    body: "BACKSTAGE is the other K-OS app beside STARDRAIN. STARDRAIN holds the story as the story. BACKSTAGE holds the history and the intended significance: childhood, the productions, the tools, and the way the work is actually practiced.\n\nThe voice is third person. The record states what happened, what it was for, and which Stardrain entry it belongs to. A tie that has not been decided is marked open. Nothing is invented ahead of the telling.\n\nThe household, the 2004 removal to Hollywood, and the Pasadena transmission are filed. The Stardrain entries are still waiting on a telling:\n\nHollywood Cowboy. Mediocricity and Smiley Teeth Records. The sacrifice mechanism. Stardrain Island, the crack, the north side, the south side. The Star Drain sign. The hotel, the market, the two venues. Modular plants. The multi-dimensional internet. The Thrash Dimension and the outer waters. Toroidal patterns and the reality hierarchy.",
  },
  {
    id: "larrazabal-household",
    title: "The Larrazabal Household",
    category: "childhood",
    body: "Juan Larrazabal was born on 15 March 1992, at 5:55 in the afternoon, in room 101 of Huntington Memorial Hospital in Pasadena, California. The parents were John and Rosemary Larrazabal. Both were young. Both attended LIFE Bible College in San Dimas, the Foursquare school later called Life Pacific College and, from 2019, Life Pacific University. Neither had been trained, by any technical standard, for parenthood. Both were emotionally traumatized. The marriage was extremely turbulent.\n\nLarrazabal locates the one steady force in the house, as he witnessed it, in Christ. The periods when the parents were least prepared to care for him and his three younger brothers were, on his account, the periods of their greatest honesty.\n\nJohn Larrazabal kept a daily discipline inside that disorder. He wrote poetry every day. He painted in oils constantly. He filled sketchbooks. He required the sons to think for themselves and to test any data they read or were told. Sincere individuality, held under the leadership of Christ, was the instrument he transmitted. A flaw was not a model. A flaw was a lesson to pass on, so that another person might avoid it.\n\nThe household stayed financially unstable, and unstable in every other way, for the whole of the childhood. The son's response was constant and obsessive. He read library books on filmmaking. He drew from the point at which a pencil could be held, which he places before the first year. He listened to records. In the father's car those records were compact discs. He read the father's magazines: Artforum, Mojo, Rolling Stone, Mad.\n\nThat stack was the musical underworld as it reached a child without money. Criticism, cartooning, and the pop archive moved through a car and a pile of magazines, and the effect did not stop at taste. Music returned the father to himself. A bad job, and cruel treatment at home, removed him.\n\nWhile the son was very small, John Larrazabal was a cartoonist. The paper is remembered as the Snoqualmie Valley Times. No newspaper of that title is in the record. Two weeklies served the valley. The Snoqualmie Valley Record has published under that name since 1924 and still prints, at valleyrecord.com, with a running cartoon tradition. The Snoqualmie Valley Reporter was a rival weekly, first issued on 5 December 1990 by Northwest Media, the local arm of Persis Corp., owner of the Journal American. Publisher Susan Bond put roughly 10,000 free copies into North Bend, Snoqualmie, Duvall, Preston, Carnation, and Fall City. Horvitz Newspapers acquired it in 1994 and closed it in January 1998 for financial reasons. The Library of Congress record still says the Reporter is current, because the last issue the library examined was 16 September 1992. The paper occupied Juan Larrazabal's early childhood and then vanished, which is why a search under the remembered title finds nothing. Which of the two papers printed the cartoons is not established. No public credit to John Larrazabal has been found.\n\nWhen the work was not an art job, it was an odd job. The hatred of that work was plain on the face. Music made John Larrazabal upbeat. A terrible job, or horrible treatment by Rosemary Larrazabal, whom the son describes as violently abusive, sent him into sadness and hopelessness. The difference was daily, and it was visible. Making was the condition under which the man remained present.\n\nStardrain tie: open.",
  },
  {
    id: "removal-to-hollywood-2004",
    title: "Removal to Hollywood, 2004",
    category: "childhood",
    body: "By the age of ten the family had already moved up and down the West Coast, to Seattle and back to Elk Grove in Northern California. The decade held a run of severe family dramas. The mother's father passed through a near-death that resolved. He lived another twenty years.\n\nRosemary Larrazabal went to Los Angeles to see family and, on that trip, took a job at the El Capitan Theatre in Hollywood. The move was her decision. John Larrazabal was working a call-center job at Wells Fargo. She had worked for a time as a bank teller. The son marks the bank job as recollection, not a confirmed record.\n\nIn Los Angeles both parents quit. The immediate pressure was a single house already holding cousins, aunts, and the rest of the family. The decision they made was stricter than leaving. The children would learn to be artists. The family would stay together. Massive hardship would be fought until the household came out on top.\n\nAround the summer of 2004 they moved to Hollywood in a Ford Aerostar.\n\nThe arrival is an ordinary event inside the musical underworld of the coast: a working family with no capital enters the industry city through a theatre job and a cartoonist's standard, and treats the training of the children as the family's actual strategy. The Interceptors, in 2007, begin from this arrival. See Maximalistic Minimalism.\n\nStardrain tie: open.",
  },
  {
    id: "pasadena-transmission",
    title: "The Pasadena Transmission",
    category: "innovations",
    body: "On a visit in Pasadena, a friend of the father showed Juan Larrazabal Linux. The friend is remembered as Mark Escheveri. The spelling is the son's and is not confirmed. The two men had attended Bible college together and shared a taste in music. Escheveri had worked at NASA, left the job, and started a company. The child heard the resignation as a verdict. A good job, in the ordinary sense, was a false good.\n\nThe man was an early and uncompromising partisan of open source. He had no spare copies, so he burned three discs and gave them over: Red Hat Linux, Ubuntu, and Doom Builder. Larrazabal had no laptop. The install was demonstrated on a test machine. He understood that the same discs would run on any computer he could reach.\n\nThe conclusion drawn then has not been revised. Proprietary software was the structure keeping a child without money out of computing. Adobe's price was the proof at hand. Edgar Larrazabal, the uncle, taught John Larrazabal Illustrator. The installation disc was the event, because the father could not have afforded it. Blender and GIMP were the counter-instruments that held the son's attention.\n\nK-OS is that position continued, not a later idea laid over it. The aim was always a distribution of his own. The aim has moved toward building the stack from scratch: new graphics engines, new interactive workflows, software a working artist can read, fast enough that the vision arrives before the tool interrupts it. Quality is required. The comfort of the casual user is refused. The system is built to arm the power user.\n\nThe discs belong to the same circulation as the magazines in the car. A tool passed hand to hand, because the priced channel excluded the household, keeps sounding in the work.\n\nStardrain tie: open. The stated continuation is K-OS.",
  },
  {
    id: "maximalistic-minimalism",
    title: "Maximalistic Minimalism",
    category: "innovations",
    body: "Filed from the K-OS UI notes. The voice here is brought into the third person.\n\nIn 2007 Juan Larrazabal and his younger brother Emilio played in a band called the Interceptors. They played many shows in Los Angeles as children. The live setup was extremely minimal. The work was to take the most from that setup.\n\nHe then made music on Game Boys and PSPs. Tracker code could conduct a performance without the interruption of other players. The process accelerated. Each keystroke, click, shortcut, and layer of interface between the idea and the sound was counted as latency. The standard was the image in the mind, reached as fast as the tool allowed.\n\nThe keyboard mattered. The LSDJ firmware mattered. The newest build was not the criterion. Speed was. The stack was chosen because it could execute the goal, not because it was the most powerful system available.\n\nClients required finished work at a high standard, and quickly. An iPad mini, with no stylus, in the years before the Apple Pencil, was sufficient when the work arrived on time.\n\nThe name of the practice is Maximalistic Minimalism. Pixels, shaders, and controls are used to the limit, so the instrument stays alive. Friction is cut, so skill can form inside the tool. The K-OS interface, BeetleGame, and the VMI system are built on that rule. The rule follows the 2004 arrival in Hollywood and the Pasadena transmission.\n\nStardrain tie: open.",
  },
  {
    id: "foot-sequenced-music",
    title: "Foot-Sequenced Music",
    category: "practice",
    body: "Filed from the K-OS UI notes, the 2kool Productions plan.\n\nDatamoshpit is built around directional inputs and very few buttons. The same model maps onto a DDR cabinet and a StepMania setup. A player at a high level has the timing to perform breakcore on a foot sequencer. Four arrows on one pad. Eight on doubles. The density reference is nanoloop Q: sixteen red lights, a complete musical instrument.\n\nPhase 1. Datamoshpit in the browser on a StepMania cabinet, with a DDR Mode input profile. Larger targets, less menu diving, feedback readable from standing distance.\n\nPhase 2. Used cabinets converted into dedicated music stations. A KOOLSKULL OS boot, custom art, cabinet sound.\n\nPhase 3. Purpose-built cabinets. A 16-pad foot grid. Doubles as two grids, thirty-two steps. Speakers, a headphone jack, a screen at standing height. The same box runs as a dance game or as a tracker.\n\nPhase 4. A conversation with Konami. A music-creation mode inside DDR, in which a track made with the feet becomes a chart that can be danced, and shared.\n\nPhase 5. Fitness and music in one system. Gyms, schools, music therapy. Live foot-sequencing battles. Boards for the dancing and for the music.\n\nThe technical bar already stated: readable at three to six feet, input under ten milliseconds, high contrast, the 4x desktop scale, cabinet speakers. The screen map is already small enough for four directions.\n\nStardrain tie: open.",
  },
];

export const BACKSTAGE_CATEGORY_ORDER: BackstageEntry["category"][] = [
  "orientation",
  "childhood",
  "productions",
  "innovations",
  "practice",
];

export const BACKSTAGE_CATEGORY_LABELS: Record<BackstageEntry["category"], string> = {
  orientation: "Orientation",
  childhood: "Childhood",
  productions: "Productions",
  innovations: "Innovations",
  practice: "Practice",
};

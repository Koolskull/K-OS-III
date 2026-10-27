/*
 * Stardrain Wiki — lore entries
 * Simple data source for the in-OS Stardrain Wiki app.
 * Updated with Garbagina Hypertrash, Alluminumb, Mr Handsome (expanded), Mr. Wormwood, Blaster Beasts, and expansions.
 */

export interface LoreEntry {
  id: string;
  title: string;
  body: string;
  category: "cosmology" | "locations" | "characters" | "systems" | "culture";
}

export const LORE_ENTRIES: LoreEntry[] = [
  {
    id: "toroidal-patterns",
    title: "Toroidal Patterns",
    category: "cosmology",
    body: "From Walter Russell's wave cosmology in The Secret of Light—twin spiral vortices forming figure-eight or toroidal shapes at every scale. These patterns define the structure of the firmament orbs that float in the infinite ocean.",
  },
  {
    id: "core-premise",
    title: "Core Premise: Reality Hierarchy",
    category: "cosmology",
    body: "Round Earth is a programmed projection that beings perceive. The astral plane is an even more illusory layer of thought-forms and emotion-made-tangible. Outside both sits base reality—the actual planes beyond the simulation. Hierarchy: 3D physical > astral illusion > base reality outside both.",
  },
  {
    id: "outer-waters",
    title: "Outer Waters Between Orbs",
    category: "cosmology",
    body: "The infinite ocean between firmament orbs is populated by extremely abstract creatures akin to deep-sea anglerfish and other strange liquid-dwellers. These beings float in the ether where creative dynamic possibility exists as pure energy flow. This dimension is the visual source of the paintings.\n\nThis is the Thrash Dimension.",
  },
  {
    id: "thrash-dimension",
    title: "Thrash Dimension",
    category: "cosmology",
    body: "A surrealist realm of floating fish, mutants, and never-ending loops of monsters emerging from the mouths of other monsters. It is not evil or darkness—it symbolizes the infinite possibility of God. The Thrash Dimension sits closer to base reality than the lower hologram layers.",
  },
  {
    id: "mediocricity",
    title: "Mediocricity",
    category: "locations",
    body: "The city of Mediocricity sits inside a protective glass-and-steel orb on the island of Stardrain. It is run by the record label Smiley Teeth Records, which holds extreme power across many different planets in the lower hologram dimensions. At its center stands the Smiley Teeth Records skyscraper, whose deep basement contains the Wall of Teeth.",
  },
  {
    id: "smiley-teeth-records",
    title: "Smiley Teeth Records",
    category: "systems",
    body: "An extremely powerful record label operating in the dimension of darkness. It owns large portions of colonized planets' governments and corporate structures in the lower hologram reality (Star Trek-like black space with planets and stars). Because it exists in darkness, it constantly requires sacrifices to operate and maintain power.\n\nMr Handsome is the bread and butter of the label, its most popular face. Mr. Wormwood manages him and keeps the darker, more gruesome operations hidden from his view. The label fabricates public narratives—such as artist signings—to conceal the true fate of the originals.",
  },
  {
    id: "sacrifice-mechanism",
    title: "Sacrifice Mechanism",
    category: "systems",
    body: "Smiley Teeth Records kills its pop stars and replaces them with clones—not merely for efficiency and profit maximization, but to fuel the black magic that sustains the label. This truth is only suggested early in the story and is discovered late.\n\nThe real artists are fed to the Wall of Teeth: a large demon mouth in the deep basement of the Smiley Teeth Records skyscraper in Mediocricity. The public sees only the clone, which continues to tour and release music indefinitely. Garbagina Hypertrash was processed this way after an apparent signing; her clone still performs while the original was sacrificed. Mr. Wormwood ensures figures like Mr Handsome remain insulated from these details.",
  },
  {
    id: "stardrain-island",
    title: "Stardrain Island",
    category: "locations",
    body: "A cracked, broken fragment of land that split from a larger body thousands of years ago. The island contains the city of Mediocricity (enclosed in its glass-and-steel orb) and is the primary setting of the story. North side: mountains, beach, garden, temple to the green slime. South side: abandoned buildings and the Stardrain Hotel.\n\nHollywood Cowboy retreated here after the dissolution of Alluminumb, building a self-sustaining sanctuary for his family, children, and friends—away from authoritarian interference and the grid of Mediocricity.",
  },
  {
    id: "hollywood-cowboy",
    title: "Hollywood Cowboy",
    category: "characters",
    body: "Protagonist who runs the Stardrain Hotel. He draws infinite energy directly from the heavenly realms and is therefore independent of the Mediocricity power grid. He lives with his family at the very top of the hotel.\n\nFormerly one half of the historic duo Alluminumb with Mr Handsome. Their completely alternate worldviews caused them to break up before the first show of their farewell tour. After the split he went the long way around, investing his rock-star earnings into botanical technology and Blaster Beasts on the remote island of Stardrain. Managing a beautiful hotel and encouraging his tenants’ businesses in the first-floor marketplace is the life he always dreamed of but could never afford when he was younger.\n\nPublicly he is seen as more crazy, rude, blunt, aggressive, and maniacal than Mr Handsome. He will risk everything to say what he believes. He has spent centuries proving his worthiness to his immediate community and family, but to no one else.",
  },
  {
    id: "south-side",
    title: "South Side of Stardrain Island",
    category: "locations",
    body: "Filled with abandoned and broken buildings that Hollywood Cowboy has not yet refurbished because he prioritized building the Stardrain Hotel. He wants hotel residents to start their own businesses so the south side can be restored and developed. The first floor of the hotel itself already functions as a large market mall with two music venues, fulfilling the vision he held since before his fame.",
  },
  {
    id: "north-side",
    title: "North Side of Stardrain Island",
    category: "locations",
    body: "Mountains, beach, and a large garden containing Hollywood Cowboy's temple to the green slime (the power source for his plants). The Stardrain Hotel sits in the lower middle-right center of the island, facing south. First floor: large market mall + two music venues. Upper floors: apartments. Hollywood and family live at the top.\n\nAbove the hotel rises a mountain that symbolizes the Hollywood Hills, complete with a “Star Drain” sign styled after the Hollywood sign, a radio station, unique caves, and beaches on the northernmost edge.",
  },
  {
    id: "modular-plants",
    title: "Modular Plants",
    category: "culture",
    body: "Genetically mutated botany created by Hollywood Cowboy. The fruit and vegetables function as modular audio and video units that can be arranged exactly like Eurorack modules and modular synthesizers. These become the VSTs available in the Stardrain game and can be used in other DAWs at will.\n\nThe plants also save data onto their cells, functioning as a decentralized biological cloud storage system and always-available biological internet wifi. Residents of the island build music, video, and art from these plants and sell the work commercially across planets.",
  },
  {
    id: "multi-dimensional-internet",
    title: "Multi-Dimensional Internet",
    category: "systems",
    body: "The island's internet is multi-dimensional. Artists push their music and art not only across different planets but also across different timelines and dimensions by tapping into the weird layers of reality available from the Thrash Dimension. The modular plants themselves form the biological layer of this network.",
  },
  {
    id: "alluminumb",
    title: "Alluminumb",
    category: "culture",
    body: "A very popular and historic musical duo consisting of Hollywood Cowboy and Mr Handsome. They possessed completely alternate worldviews. They broke up before the first show of their farewell tour. On that final date Garbagina Hypertrash opened to an enthusiastic crowd; the audience nearly rioted when they discovered Alluminumb would not take the stage.\n\nDuring this era Mr Handsome still appeared as the purple slime mutant creature he actually is; the silver robotic skin armor came later.",
  },
  {
    id: "garbagina-hypertrash",
    title: "Garbagina Hypertrash",
    category: "characters",
    body: "A musical artist who opened for Alluminumb on their last tour while she was young and still making a name for herself. She delivered a great set to an enthusiastic crowd. Later she built her own label and publishing company as well as her own chain of hotels and restaurants across multiple solar systems.\n\nSmiley Teeth Records manufactured the appearance that she had signed with them. In reality the original was sacrificed to the Wall of Teeth in the basement of their Mediocricity skyscraper; a clone continues to tour forever under her name.",
  },
  {
    id: "mr-handsome",
    title: "Mr Handsome",
    category: "characters",
    body: "A very popular musician and the bread and butter of Smiley Teeth Records. He behaves very superficially in order to maintain his position at the top of the proverbial food chain. Some of the darker things the label is up to are deliberately hidden from him.\n\nHe is actually a silver robotic cyborg whose interior is a purple slime mutant monster. When he was in Alluminumb he still appeared as the purple creature; he acquired the robotic skin armor later to look handsome while building his solo career. “Mr Handsome” began as a joke nickname and has since become his actualized ego.\n\nHe always travels with a posse of cyborg babes. He prefers creature comforts and allows sadness and despondency to overwhelm him, which is why he smokes and drinks too much. He is emotionally weak because he believes optimistic outcomes are unlikely, impossible, or likely to be a negative thing in disguise—even though the public holds him in high regard. He lives blindly and appreciates not knowing the details, yet he remains depressed and unhappy. His own laziness and disinterest in procuring those details make the insulation possible.\n\nHe is managed by the evil Mr. Wormwood, who keeps the most gruesome operations of Smiley Teeth Records away from him.",
  },
  {
    id: "mr-wormwood",
    title: "Mr. Wormwood",
    category: "characters",
    body: "Evil manager who handles Mr Handsome at Smiley Teeth Records. He deliberately keeps the darker and more gruesome details of the label’s operations hidden from his client, maintaining the superficial distance Mr Handsome prefers.",
  },
  {
    id: "blaster-beasts",
    title: "Blaster Beasts",
    category: "culture",
    body: "Musical creatures cultivated by Hollywood Cowboy on Stardrain Island. They appear as lizards, insectoids, or other strange mutants that resonate audio frequencies at a dangerous resonance capable of blasting like a laser cannon. They serve as living amplification systems that can be paired with the modular plant audio units.",
  },
];

export const CATEGORY_LABELS: Record<LoreEntry["category"], string> = {
  cosmology: "Cosmology",
  locations: "Locations",
  characters: "Characters",
  systems: "Systems & Power",
  culture: "Culture & Creation",
};

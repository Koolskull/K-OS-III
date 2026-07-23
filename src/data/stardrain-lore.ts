/*
 * Stardrain Wiki — lore entries
 * Simple data source for the in-OS Stardrain Wiki app.
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
    body: "From Walter Russell's wave cosmology in The Secret of Light\u2014twin spiral vortices forming figure-eight or toroidal shapes at every scale. These patterns define the structure of the firmament orbs that float in the infinite ocean.",
  },
  {
    id: "core-premise",
    title: "Core Premise: Reality Hierarchy",
    category: "cosmology",
    body: "Round Earth is a programmed projection that beings perceive. The astral plane is an even more illusory layer of thought-forms and emotion-made-tangible. Outside both sits base reality\u2014the actual planes beyond the simulation. Hierarchy: 3D physical > astral illusion > base reality outside both.",
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
    body: "A surrealist realm of floating fish, mutants, and never-ending loops of monsters emerging from the mouths of other monsters. It is not evil or darkness\u2014it symbolizes the infinite possibility of God. The Thrash Dimension sits closer to base reality than the lower hologram layers.",
  },
  {
    id: "mediocricity",
    title: "Mediocricity",
    category: "locations",
    body: "The city of Mediocricity sits inside a protective glass-and-steel orb on the island of Stardrain. It is run by the record label Smiley Teeth Records, which holds extreme power across many different planets in the lower hologram dimensions.",
  },
  {
    id: "smiley-teeth-records",
    title: "Smiley Teeth Records",
    category: "systems",
    body: "An extremely powerful record label operating in the dimension of darkness. It owns large portions of colonized planets' governments and corporate structures in the lower hologram reality (Star Trek-like black space with planets and stars). Because it exists in darkness, it constantly requires sacrifices to operate and maintain power.",
  },
  {
    id: "sacrifice-mechanism",
    title: "Sacrifice Mechanism",
    category: "systems",
    body: "Smiley Teeth Records kills its pop stars and replaces them with clones\u2014not merely for efficiency and profit maximization, but to fuel the black magic that sustains the label. This truth is only suggested early in the story and is discovered late.",
  },
  {
    id: "stardrain-island",
    title: "Stardrain Island",
    category: "locations",
    body: "A cracked, broken fragment of land that split from a larger body thousands of years ago. The island contains the city of Mediocricity (enclosed in its glass-and-steel orb) and is the primary setting of the story. North side: mountains, beach, garden, temple to the green slime. South side: abandoned buildings and the Stardrain Hotel.",
  },
  {
    id: "hollywood-cowboy",
    title: "Hollywood Cowboy",
    category: "characters",
    body: "Protagonist who runs the Stardrain Hotel. He draws infinite energy directly from the heavenly realms and is therefore independent of the Mediocricity power grid. He lives with his family at the very top of the hotel.",
  },
  {
    id: "south-side",
    title: "South Side of Stardrain Island",
    category: "locations",
    body: "Filled with abandoned and broken buildings that Hollywood Cowboy has not yet refurbished because he prioritized building the Stardrain Hotel. He wants hotel residents to start their own businesses so the south side can be restored and developed.",
  },
  {
    id: "north-side",
    title: "North Side of Stardrain Island",
    category: "locations",
    body: "Mountains, beach, and a large garden containing Hollywood Cowboy's temple to the green slime (the power source for his plants). The Stardrain Hotel sits in the lower middle-right center of the island, facing south. First floor: large market mall + two music venues. Upper floors: apartments. Hollywood and family live at the top.\n\nAbove the hotel rises a mountain that symbolizes the Hollywood Hills, complete with a \u201cStar Drain\u201d sign styled after the Hollywood sign, a radio station, unique caves, and beaches on the northernmost edge.",
  },
  {
    id: "modular-plants",
    title: "Modular Plants",
    category: "culture",
    body: "Genetically mutated botany created by Hollywood Cowboy. The fruit and vegetables function as modular audio and video units that can be arranged exactly like Eurorack modules and modular synthesizers. Residents of the island build music, video, and art from these plants and sell the work commercially across planets.",
  },
  {
    id: "multi-dimensional-internet",
    title: "Multi-Dimensional Internet",
    category: "systems",
    body: "The island's internet is multi-dimensional. Artists push their music and art not only across different planets but also across different timelines and dimensions by tapping into the weird layers of reality available from the Thrash Dimension.",
  },
];

export const CATEGORY_LABELS: Record<LoreEntry["category"], string> = {
  cosmology: "Cosmology",
  locations: "Locations",
  characters: "Characters",
  systems: "Systems & Power",
  culture: "Culture & Creation",
};

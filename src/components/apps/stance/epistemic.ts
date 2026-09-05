/** Epistemic stance — standalone K-OS III app content. Contested topics: method over verdict. */
export const EPISTEMIC_STANCE = {
  title: "EPISTEMIC STANCE",
  subtitle: "How K-OS III treats knowledge, claims, and research maps",
  sections: [
    {
      heading: "Purpose",
      body: [
        "This app states the method for organizing contested knowledge inside K-OS III — including NODEMAP and research workflows.",
        "It is built so you can arrange claims and relationships yourself — not so a platform can decide what counts as true for you.",
      ],
    },
    {
      heading: "Primary sources first",
      body: [
        "Prefer documents, data, and original statements over secondary summaries when you map a contested topic.",
        "When a node or note is a summary or paraphrase, label it as such. Keep a link or wire pointing back to the source.",
      ],
    },
    {
      heading: "Separate layers of certainty",
      body: [
        "Mark at least three layers: FACT (directly evidenced), INFERENCE (reasoned from facts), and SPECULATION (hypothesis or rumor).",
        "Do not collapse those layers into a single confident-looking diagram without labels. Dense maps can look authoritative even when they mix guesswork with evidence.",
      ],
    },
    {
      heading: "Name the debate",
      body: [
        "On contested topics, present the debate rather than a single verdict. Include mainstream and dissenting accounts when they are relevant — and mark which is which.",
        "Unsupported claims should be labeled unsupported. Absence of evidence is not automatically evidence of absence, but it is not proof either.",
      ],
    },
    {
      heading: "Maps are tools, not oracles",
      body: [
        "A node graph can organize thought and expose missing links. It cannot, by itself, prove a conspiracy, doctrine, or theory.",
        "If a layout feels emotionally charged, slow down: re-check sources, re-label layers, and ask what would falsify a claim.",
      ],
    },
    {
      heading: "Your install, your corpus",
      body: [
        "Progress and maps stay local by default (browser storage). There is no account and no remote ranking of your research.",
        "You own the structure. Edit, discard, export, or replace any starter content.",
      ],
    },
    {
      heading: "Influence & original work",
      body: [
        "NODEMAP’s dense visual-research form is influenced by the mapping practice of Dylan Louis Monroe (Deep State Mapping Project).",
        "We thank him for that influence. Further research: https://dsmp.io — including free PDF downloads under product downloads.",
        "K-OS III does not copy, embed, or redistribute his maps or commercial assets. All starter NODEMAP content is original.",
      ],
    },
  ],
  footer: "Prove all things. Hold fast that which is good. — method before hype.",
} as const;

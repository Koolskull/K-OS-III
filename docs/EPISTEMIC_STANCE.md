# Epistemic Stance

This is the canonical statement of how K-OS handles disagreement, contested topics, and competing accounts in its educational and documentary surfaces. It is a load-bearing principle of the project, not a footnote.

---

## Why this matters for a creative OS

Creative work dies under received opinion. The people most harmed by flattened narratives — single official accounts presented without the surrounding debate — are artists, researchers, students, and children. People making things need to be trusted with the question of what's true, not handed verdicts.

A creative OS that ships an embedded reference and a curriculum is doing something a stock photo library or a music library is not: it is teaching. Teaching carries a duty. The duty K-OS commits to is not "teach the right answer." It is "teach the debate honestly enough that the reader can keep thinking."

## The stance

On contested topics — history, architecture, technology's origins, health, theology, economics, anything where serious people genuinely disagree — K-OS's documentation, Reference (`public/reference/`), Reader Notes (`docs/READER_NOTES/`), and education tracks (`public/education/`) present:

1. The **mainstream account**, sourced and attributed.
2. The **credible dissenting accounts**, also sourced and attributed by name.
3. **Where the evidence each side cites can actually be found** — primary sources, not just commentary.
4. **The reader's role**, restored: the conclusion is theirs to draw.

## What this is not

- It is **not** "all views are equal." Some claims have more evidence than others, and we say so.
- It is **not** a mandate to teach every fringe claim, every conspiracy, every position with a YouTube channel behind it. Inclusion is editorial.
- It is **not** an endorsement of any specific dissenting position. Presenting an argument is not the same as agreeing with it.
- It is **not** false balance for its own sake. We do not invent a controversy where none exists. We do not present a debate as 50/50 when it isn't. We say what the weight of evidence is, *and* we still show what the dissenting researchers argue and why.

## Editorial guardrails

When writing about a contested topic in K-OS:

- **Attribute claims to their proponents by name.** Not "researchers say" — "[name] argues, in [source], that..."
- **Label mainstream and dissenting positions as such.** The reader deserves to know which is which, even if they disagree with the labels.
- **Point readers to primary sources**, not just to commentary. Where the original document, the original measurement, the original photograph exists, link to it.
- **Avoid ad hominem and conspiracy-as-identity framing in either direction.** "The official narrative" is not an argument; "the conspiracy theorists" is not an argument either. Engage what each side actually claims.
- **State plainly when a claim is fringe with little evidence.** Then *still* present what its proponents argue and why. Readers can tell when they're being condescended to, and the condescension undermines everything else the project says.
- **Where you genuinely don't know which side is right, say that too.** Editorial humility is part of the contract.

## Where this stance applies in practice

The Reader Notes folder (`docs/READER_NOTES/`) hosts companion documents that present the competing accounts in more depth whenever a K-OS document touches a contested topic. Initial seed topics include:

- **Architectural history and the "Tartaria" discourse** — the academic architectural-history account of 19th-century monumental construction vs. the independent-researcher account associated with Jon Levi and peers. (See `READER_NOTES/architectural-history.md` for the starter note.)
- **High-frame-rate perception and screen health** — Showscan/Trumbull, the reception of Peter Jackson's 48fps films, contemporary HFR research, and the popular claim that screen refresh rates cause broad psychological harm.
- **History of wireless power and "free energy" claims** — Tesla's documented work, the historical record of Wardenclyffe, modern academic assessment, and the popular-independent-research account.
- **Monetary history** — competing accounts of the gold standard, fiat, and the design choices made in 20th-century monetary policy.
- **Competing accounts of early computing history** — what was rediscovered vs. what was invented, where credit landed vs. where it should have.

Each is added when a contributor takes the time to write it well. Each is reviewed against the editorial guardrails above before merging.

## Where this stance does *not* apply

Technical specifications. A function either returns the right value or it doesn't. The K-Wallet spec describes how signing works; there is not a "dissenting account" of how an ECDSA signature is computed. The Datamoshpit data model is what it is. Code is judged by whether it works, not by editorial pluralism.

## Why we do this

Because the alternative — picking a verdict and presenting it as settled — is what most software, most platforms, most curricula, and most encyclopedias already do. The world has enough of that. K-OS is small enough to do something different.

A reader who finishes a K-OS document on a contested topic should be able to say: *I now know what the mainstream view holds, what the strongest dissenting view holds, what evidence each side relies on, and where to keep reading on my own.* That is the contract.

---

```
              ☦
   "Prove all things; hold fast that which is good."
        — 1 Thessalonians 5:21
```

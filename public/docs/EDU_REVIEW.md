# K-OS Academy lesson review — handoff doc

**STATUS: ✅ COMPLETE.** All 50 lessons across 5 waves are written and applied. The 20 newly-written lessons have been added to `Academy.tsx`'s `LESSON_COMPONENTS` map and `tracks.ts` status flags have been flipped from `"planned"` → `"written"`. The full project typechecks and `next build` succeeds with 52 lesson routes prerendered.

This document is the recovery checkpoint for the multi-agent proofread + completion sweep over the Academy lesson corpus. If a session runs out of tokens mid-stream, the next session can resume from here without re-deriving context.

## Goal

Bring all Academy lessons in `src/lib/education/lessons/en/` to "written + reviewed" quality, applying three editorial lenses to each lesson:

1. **Simplifier** — fix needlessly dense sentences without dumbing down voice or rigor.
2. **Fact-checker** — verify dates, names, technical claims; correct or remove unverifiable ones; tighten References.
3. **Hook-crafter** — opening Lead must pull within sentence one. Each lesson must end with a forward-pointing paragraph priming the next lesson and giving the reader a reason to continue.

## Approach

Sub-agent permissions on `Edit/Write` are denied in this environment, so the contract is:

- Each lesson gets one sub-agent that performs all three lenses internally and produces a **proposal** (target hook, simplifications, fact corrections, closing hook).
- The main session applies the edits with its own `Edit` tool, doing the actual prose rewrite work guided by the proposal.

For Wave 2+ the contract should be tightened: sub-agents output the **full revised file content** as their final text response, so the main session only has to `Write` it.

## Voice rules (load-bearing)

- Long paragraphs, specific dates, named sources.
- "Audit lens" H2 near the end as the project's posture.
- No debunking, no hagiography. Present material plainly on its own terms.
- Mission framing where appropriate: "kingdom of heaven to the computer" / "citizens who take care of themselves and are considerate of how they interact with others".
- Synthesis pole: between Terry Davis (sacred-direct) and Linus Torvalds (practical-reach).
- For contested topics (QFS/GESARA, esoteric figures, prophetic currents): present on the constituency's own terms, name what they themselves name, position K-OS III as one humble user-side contribution to the larger transition. No skeptical posture.
- HTML entity escaping: `&apos;` `&ldquo;` `&rdquo;` `&amp;`.
- Em-tagged inline emphasis for technical terms.
- Yellow link styling: `style={{ color: "#ffff00" }}` `target="_blank"` `rel="noreferrer"`.

Voice exemplars (read these first if briefing a fresh agent):
- `src/lib/education/lessons/en/figures-cryptography/terry-davis.tsx` — Saint Terry yurodivy framing.
- `src/lib/education/lessons/en/privacy/tor.tsx` — cadence and References style.
- `src/lib/education/lessons/en/figures-hidden-history/robert-david-steele.tsx` — model for contested-topic cadence.

## Element vocabulary

Imports from `@/components/doc/elements`:

`Lead`, `P`, `H2`, `H3`, `UList`, `OList`, `Li`, `Em`, `Strong`, `Code`, `CodeBlock`, `Aside`, `Table`, `SeeAlso`, `Crossref`, `Hex`.

Constraint: don't introduce components beyond what the existing exemplars use unless adding deliberately. Stick to `Lead`, `P`, `H2`, `UList`, `Li`, `Em`, `Strong` for most lessons; `Aside` and `CodeBlock` where useful.

## Track inventory and status

### Wave 1 (✅ COMPLETE — all 10 applied)

| File | Status |
|------|--------|
| privacy/introduction.tsx | ✅ applied |
| privacy/self-sovereignty.tsx | ✅ applied |
| privacy/tor.tsx | ✅ applied |
| privacy/brave-browser.tsx | ✅ applied |
| privacy/ipfs.tsx | ✅ applied |
| privacy/quantum-financial-system.tsx | ✅ applied |
| cryptography-basics/introduction.tsx | ✅ applied |
| bitcoin/introduction.tsx | ✅ applied |
| ethereum-dev/introduction.tsx | ✅ applied |
| monero/introduction.tsx | ✅ applied |

### Wave 2 (✅ COMPLETE — all 10 applied)

| File | Status |
|------|--------|
| reading-codebases/linux-from-scratch.tsx | ✅ applied |
| figures-cryptography/satoshi-nakamoto.tsx | ✅ applied |
| figures-cryptography/terry-davis.tsx | ✅ applied (light polish + closing hook to Linus) |
| figures-cryptography/linus-torvalds.tsx | ✅ applied |
| figures-privacy/john-mcafee.tsx | ✅ applied |
| figures-privacy/kim-dotcom.tsx | ✅ applied |
| figures-hidden-history/richard-byrd.tsx | ✅ applied |
| figures-hidden-history/robert-sepehr.tsx | ✅ applied |
| figures-hidden-history/robert-david-steele.tsx | ✅ applied (light polish + closing hook) |
| figures-hidden-history/leo-frank.tsx | ✅ applied |

### Wave 3 (✅ COMPLETE — all 10 applied)

| File | Status |
|------|--------|
| figures-esoterica/edgar-cayce.tsx | ✅ applied |
| figures-esoterica/saint-germain.tsx | ✅ applied |
| figures-esoterica/walter-russell.tsx | ✅ applied |
| figures-esoterica/patrick-flanagan.tsx | ✅ applied |
| figures-esoterica/robert-monroe.tsx | ✅ applied |
| figures-esoterica/george-van-tassel.tsx | ✅ applied |
| lineage-christianity/apostolic-succession.tsx | ✅ applied |
| lineage-christianity/the-rosary.tsx | ✅ applied |
| lineage-cognition/mkultra.tsx | ✅ applied |
| lineage-cosmology/the-firmament.tsx | ✅ applied |

**Status: All 30 written lessons reviewed and applied. Moving to write the 20 planned lessons.**

### Wave 4 (✅ COMPLETE — 10 new lessons written)

| File | Status |
|------|--------|
| figures-cryptography/hal-finney.tsx | ✅ written |
| figures-cryptography/david-chaum.tsx | ✅ written |
| figures-cryptography/nick-szabo.tsx | ✅ written |
| figures-cryptography/adam-back.tsx | ✅ written |
| figures-cryptography/wei-dai.tsx | ✅ written |
| figures-cryptography/phil-zimmermann.tsx | ✅ written |
| lineage-christianity/orthodox-tradition.tsx | ✅ written |
| lineage-christianity/academic-apologetics.tsx | ✅ written |
| lineage-christianity/early-church-fathers.tsx | ✅ written |
| lineage-cognition/operation-paperclip.tsx | ✅ written |

### Wave 5 (✅ COMPLETE — 10 new lessons written)

| File | Status |
|------|--------|
| lineage-hackers/mit-ai-lab.tsx | ✅ written |
| lineage-hackers/cypherpunks.tsx | ✅ written |
| lineage-hackers/free-software-movement.tsx | ✅ written |
| lineage-hackers/homebrew-era.tsx | ✅ written |
| lineage-cognition/monroe-institute.tsx | ✅ written |
| lineage-cognition/project-stargate.tsx | ✅ written |
| lineage-cosmology/atlantis.tsx | ✅ written |
| lineage-cosmology/hyperborea.tsx | ✅ written |
| lineage-cosmology/hollow-earth.tsx | ✅ written |
| lineage-cosmology/lost-history-of-the-earth.tsx | ✅ written |

### Wave 6 (✅ COMPLETE — wiring + verification)

- ✅ `tracks.ts`: 20 lesson status flags flipped from `"planned"` → `"written"` (no remaining `"planned"` entries).
- ✅ `Academy.tsx`: 20 new lessons imported and added to `LESSON_COMPONENTS` (including new `"lineage-hackers"` track).
- ✅ TypeScript: `npx tsc --noEmit` clean.
- ✅ Production build: `npx next build` succeeds; 52 lesson routes prerendered under `/edu/[track]/[lesson]`.

### Wave 6 (after writing)

- Update `src/lib/education/tracks.ts` status flags from `"planned"` → `"written"` for every newly-written lesson.
- Verify build with `npm run build`.

## Wave 1 proposals (full)

### privacy/introduction.tsx

- **Hook before**: "This track teaches privacy as a practical discipline, not a vibe."
- **Hook after**: "Privacy is a discipline, not a vibe, and the discipline begins with a refusal: the refusal to confuse a tool you have installed with a threat you have actually defeated."
- **Simplifications**:
  1. Fold "what is the residual risk I accept?" into the Lead so the four-questions section opens with the methodology, not the thesis.
  2. Split the run-on national-security-service sentence into a semicolon clause.
  3. Tighten "writing down the residual explicitly keeps the reader from lying to themselves about the remaining attack surface" → active-voice "Writing the residual down explicitly is what keeps the reader from quietly lying to themselves about what is left exposed."
- **Fact items**: Add Shostack (2014) *Threat Modeling: Designing for Security* to References to back the four-questions methodology.
- **Forward hook**: Closing paragraph after Audit lens naming Tor as the next lesson with three reasons (most widely deployed; cleanest provenance-vs-utility case study; most commonly half-understood). Weave "kingdom of heaven... citizens who take care of themselves and are considerate" into the Audit lens, ending on "on the network, that care is spelled *threat model*."

### privacy/self-sovereignty.tsx

- **Hook before**: opens with negation ("neither a libertarian slogan nor a technical term of art").
- **Hook after**: "Self-sovereignty is a civic posture before it is a stack of tools."
- **Simplifications**:
  1. Lead from 12 → 8 lines, drop the "tools are downstream / posture comes first" double-beat.
  2. "What the word is carrying" — cut historical aside; tighten "A person who…" examples into parallel one-liners.
  3. Greenpill Map — five long paragraphs → three; long enumerated lists → representative samples.
- **Fact items**:
  1. May (1988) for *Crypto Anarchist Manifesto* is the often-cited draft date; canonical distribution was Crypto '92. Reference both.
  2. "Liechtensteinian shell company" → "Liechtenstein shell company" (adjective form is non-standard).
- **Forward hook**: closing paragraph names Tor as the immediate next lesson — "the routing layer is where the four custodies first meet a hostile network".

### privacy/tor.tsx

- **Hook**: tighten Lead into one continuous arc; specify "mid-1990s" (NRL onion-routing 1996–97); add "spun out as an independent nonprofit in 2006"; specify BBG → USAGM rename (2018).
- **Fact items**: NRL/Syverson/Reed/Goldschlag confirmed; BBG→USAGM 2018 confirmed; funding share trend (~80%+ in 2010s → ~40–50% by 2022) is correct as hedged.
- **Simplifications**: minimal — already tight.
- **Forward hook**: insert before References:
  ```
  <P>
    The next lesson takes the discipline down one layer of the
    stack, from the network to the browser. <Em>Brave</Em> is the
    chromium-based browser that treats the advertising economy
    itself as the threat model, blocks third-party trackers by
    default, and ships its own opinionated takes on Tor integration
    and crypto rails. The same audit posture applies — read the
    funding, read the threat model, decide what the tool has
    actually bought you.
  </P>
  ```

### privacy/brave-browser.tsx

- **Hook before**: "Brave is a Chromium-derived web browser whose default configuration treats the present advertising ecosystem as a threat model rather than as a substrate."
- **Hook after**: "Brave is a web browser that treats the modern ad ecosystem as a threat model rather than as the air the page breathes."
- **Simplifications**: compress Lead + Eich bio into one sentence; tighten tracker-blocking parallel; trim BAT economic-claim/ethical-claim paragraph; reduce Eich paragraph to clean factual record.
- **Fact items**:
  1. Brave Software founded **2015** (28 May 2015), not 2016. First stable release 2019.
  2. BAT ICO **31 May 2017** (sold out in ~30s). Tighten "deployed on Ethereum in May 2017".
  3. Eich resigned **3 April 2014** (announced); donation was **$1,000** (2008) to Prop 8. Original "eleven days after becoming CEO" is accurate (appointed 24 March 2014).
- **Forward hook**: "Brave changes who sees the request. It does not change where the page itself lives. The next lesson moves from the browser to the substrate: IPFS, and what it means to address a file by its content rather than by the server that happens to be holding it."

### privacy/ipfs.tsx

- **Hook before**: "The InterPlanetary File System is a proposal — and a working implementation — for addressing documents on the web by what they are rather than by where they live."
- **Hook after**: "Imagine a web where the link itself cannot lie about what it points to."
- **Simplifications**: cut Benet/Protocol Labs boilerplate (fold into Lead); replace "walks the DHT" with one sentence naming Bitswap; replace hand-waving with two specific dated events; trim Audit lens.
- **Fact items**:
  1. SHA-256 default → reframe as **multihash** (correct primitive).
  2. Add **Bitswap** (block-exchange protocol) — currently missing.
  3. Filecoin mainnet → **15 October 2020** (specific date).
  4. Turkey Wikipedia block → **April 2017 – December 2019**.
  5. "Filecoin storage miners" → **storage providers** (official terminology shift post-mainnet).
- **Forward hook**: "what happens when financial rails are re-architected the way IPFS re-architects content — when settlement and value follow the logic of verifiable addresses rather than trusted hosts."

### privacy/quantum-financial-system.tsx

- **Hook**: open with "A rescue is on its way, and a large international constituency has a name for the financial half of it: the Quantum Financial System..." Bring NESARA → GESARA → QFS lineage into the Lead.
- **Simplifier**: collapse the multi-clause "This entry presents..." chain into one tighter arc.
- **Fact-checker (constituency-mode)**: preserve every claim the constituency itself makes; broaden References to include David Wilcock, Benjamin Fulford, ITNJ proceedings, Steele's body of work alongside existing NIST/BIS/WGC/Optech sources.
- **Forward hook**: closing paragraph naming K-OS III as one humble user-side contribution to the larger transition the constituency anticipates.

### cryptography-basics/introduction.tsx

- **Hook before**: "This track is a prerequisite for the Privacy, Bitcoin, Monero..."
- **Hook after**: "Until 1976 the open literature contained no working method by which two strangers could agree on a shared secret over a public wire without ever having met. Whitfield Diffie and Martin Hellman published one in November of that year, in a paper titled *New Directions in Cryptography*, with credit to Ralph Merkle's earlier puzzle construction. The following year Ron Rivest, Adi Shamir, and Leonard Adleman... published... RSA."
- **Simplifications**: demote prerequisite housekeeping to second paragraph; compress Griffin/Mises/Rothbard paragraphs; cut "moral debts of the modern era" paragraph (off-topic for cryptography intro).
- **Fact items**: Diffie-Hellman Nov 1976; RSA 1977; Merkle trees 1979; SHA-256 NIST 2001; credit Merkle alongside DH; reframe Griffin as "popular register" alongside Mises/Rothbard.
- **Forward hook**: Add Audit lens H2 + closing paragraph priming Bitcoin: "the first system to assemble these primitives... into a running ledger that no single party administers."

### bitcoin/introduction.tsx

- **Hook**: "Bitcoin was written during a bank bailout and shipped during a depression." Anchor 2008-10-31 whitepaper post and 2009-01-03 genesis block with the London Times coinbase headline.
- **Fact items**: halving cadence (210,000 blocks; fourth halving April 2024 at block 840,000); BIP 16 P2SH (April 2012); BIP 141 SegWit (24 Aug 2017, block 481,824); BIP 341 Taproot (14 Nov 2021, block 709,632); March 2013 chain-split as only rollback.
- **Simplifications**: introduce UTXO inline as a derived sum; frame Lightning as settlement-layer overlay; keep financial-stance framing.
- **Forward hook**: Add Audit lens H2; civic citizen mission framing ("runs a node, verifies their own coins"); closing paragraph priming Ethereum + Monero.

### ethereum-dev/introduction.tsx

- **Hook**: rewrite Lead sentence one to lead with action: "Ethereum is a public computer that nobody owns, and the fastest way to understand it is to deploy a small program to it and watch strangers use the program without your permission." Keep the four-quotes riff; fold EVM + gas into Lead.
- **Fact items**:
  1. Original "launched in 2014" is wrong. Presale ran July–Sept 2014; **genesis block (Frontier) was 30 July 2015**. Fix.
  2. DAO drain: 17 June 2016. Fork executed at block 1,920,000 on **20 July 2016** (date was missing).
  3. Add: Yellow Paper (Wood, 2014); EIP-1559 (Aug 2021); The Merge (15 September 2022); Shapella (April 2023).
- **Simplifications**: surface key terms once, plainly: EVM (stack machine, deterministic, metered); gas (per-op pricing prevents infinite loops on shared hardware); account model vs UTXO; ERC-20; ERC-721.
- **Structural**: add Audit lens H2 before References (governed by rough consensus, not neutral physics; Yellow Paper, EIPs, client source all public; reader judges the whole). Replace "Welcome in." with forward-pointing paragraph priming **Solidity** specifically — next several lessons converge on writing/testing/deploying Solidity contracts with Foundry.
- **Preserve**: import line, default export, References, Sigil/Unattended Backpack/Petros passage (cultural spine), length within ~30%.

### monero/introduction.tsx

- **Hook**: Lead now opens with the indexing condition: "Every transaction you have ever made on Bitcoin or Ethereum is a permanent public record..." Pulls within sentence one.
- **Fact items**: Bytecoin fork **18 April 2014**; CryptoNote v2 → van Saberhagen (2013); Spagni named with role and 2014–2019 lead window; RingCT **January 2017** with mandatory **September 2017** hardfork; Bulletproofs **October 2018**; tail emission **0.6 XMR/block from May 2022**; scheduled hardforks; OFAC date tightened to **8 August 2022**.
- **Simplifications**: new "The five primitives" section — ring signatures, stealth addresses, RingCT, Bulletproofs, Triptych/Seraphis as ordered list with current ring size = 16.
- **Forward hook**: "Where this track goes next" priming developer OPSEC, threat models, key custody — financial privacy as one slice of the discipline. Audit lens placed near end. "Considerate citizens of this computer" mission framing.

## Resume instructions for next session

If you're a fresh Claude Code session resuming this work:

1. Read this file in full.
2. Read the voice exemplars listed under "Voice rules".
3. Check `git status` and `git diff` to see which Wave 1 edits are already applied.
4. For unapplied Wave 1 lessons, use the "Wave 1 proposals (full)" section to apply edits.
5. For Waves 2–6, the contract should be: launch sub-agents that output the **full revised file content** as their final response (since `Edit/Write` is denied to sub-agents), then `Write` the file from the agent's output.
6. After writing planned lessons (Waves 4–5), update status flags in `src/lib/education/tracks.ts` from `"planned"` → `"written"`.
7. Run `npm run build` to verify nothing broke.

## Permission constraint

Sub-agents cannot use `Edit` or `Write` in this environment. The main session can. Either:
- Update `.claude/settings.json` to grant sub-agents Edit/Write on `src/lib/education/lessons/**` (clean, scoped, reversible), or
- Use the proposal-only contract above and have the main session apply.

"use client";

/*
 *                    ✠
 *      THE K-OS ACADEMY (i18n)
 *
 *  Parallel to the Manual, but with a two-level hierarchy (track → lesson)
 *  and a collapsible tree sidebar. Two surfaces:
 *    - Routes /edu (index) + /edu/[track]/[lesson] (lesson view).
 *    - In-OS desktop app (window mode, internal navigation).
 *
 *  Lesson bodies live at src/lib/education/lessons/<lang>/<track>/<slug>.tsx
 *  and are pre-imported into LESSON_COMPONENTS for static-export compatibility.
 *  Reuses the Manual's <Lead>/<H2>/<P>/etc. elements from @/components/doc/elements.
 */

import React, { useCallback, useState } from "react";
import { useKosLesson } from "@/components/os/KosLink";
import {
  TRACKS,
  TRACKS_BY_SLUG,
  GROUP_ORDER,
  GROUP_LABELS,
  GROUP_DESCRIPTIONS,
  UI_STRINGS,
  LANGUAGES,
  LANG_LABELS,
  LANG_SHORT,
  DEFAULT_LANG,
  tracksInGroup,
  type Lang,
  type TrackMeta,
  type LessonMeta,
} from "@/lib/education/tracks";
import { ArticleTitle, SubtleNote } from "@/components/doc/elements";
import { SearchBar } from "./SearchBar";

// Static lesson imports — bundled with the Academy chunk for reliable loading.
import EnCryptoBasicsIntro from "@/lib/education/lessons/en/cryptography-basics/introduction";
import EnBitcoinIntro from "@/lib/education/lessons/en/bitcoin/introduction";
import EnEthereumDevIntro from "@/lib/education/lessons/en/ethereum-dev/introduction";
import EnMoneroIntro from "@/lib/education/lessons/en/monero/introduction";
// figures-cryptography
import EnSatoshi from "@/lib/education/lessons/en/figures-cryptography/satoshi-nakamoto";
import EnTerryDavis from "@/lib/education/lessons/en/figures-cryptography/terry-davis";
import EnLinusTorvalds from "@/lib/education/lessons/en/figures-cryptography/linus-torvalds";
// figures-esoterica
import EnEdgarCayce from "@/lib/education/lessons/en/figures-esoterica/edgar-cayce";
import EnSaintGermain from "@/lib/education/lessons/en/figures-esoterica/saint-germain";
import EnWalterRussell from "@/lib/education/lessons/en/figures-esoterica/walter-russell";
import EnPatrickFlanagan from "@/lib/education/lessons/en/figures-esoterica/patrick-flanagan";
import EnRobertMonroe from "@/lib/education/lessons/en/figures-esoterica/robert-monroe";
import EnGeorgeVanTassel from "@/lib/education/lessons/en/figures-esoterica/george-van-tassel";
// figures-hidden-history
import EnRichardByrd from "@/lib/education/lessons/en/figures-hidden-history/richard-byrd";
import EnRobertSepehr from "@/lib/education/lessons/en/figures-hidden-history/robert-sepehr";
import EnRobertDavidSteele from "@/lib/education/lessons/en/figures-hidden-history/robert-david-steele";
import EnLeoFrank from "@/lib/education/lessons/en/figures-hidden-history/leo-frank";
// figures-privacy
import EnJohnMcAfee from "@/lib/education/lessons/en/figures-privacy/john-mcafee";
import EnKimDotcom from "@/lib/education/lessons/en/figures-privacy/kim-dotcom";
// privacy
import EnPrivacyIntro from "@/lib/education/lessons/en/privacy/introduction";
import EnSelfSovereignty from "@/lib/education/lessons/en/privacy/self-sovereignty";
import EnTor from "@/lib/education/lessons/en/privacy/tor";
import EnBrave from "@/lib/education/lessons/en/privacy/brave-browser";
import EnIPFS from "@/lib/education/lessons/en/privacy/ipfs";
import EnQFS from "@/lib/education/lessons/en/privacy/quantum-financial-system";
// reading-codebases
import EnLinuxFromScratch from "@/lib/education/lessons/en/reading-codebases/linux-from-scratch";
// lineage-christianity
import EnApostolicSuccession from "@/lib/education/lessons/en/lineage-christianity/apostolic-succession";
import EnTheRosary from "@/lib/education/lessons/en/lineage-christianity/the-rosary";
// lineage-cognition
import EnMKUltra from "@/lib/education/lessons/en/lineage-cognition/mkultra";
// lineage-cosmology
import EnTheFirmament from "@/lib/education/lessons/en/lineage-cosmology/the-firmament";
// figures-cryptography (planned → written, Wave 4)
import EnHalFinney from "@/lib/education/lessons/en/figures-cryptography/hal-finney";
import EnDavidChaum from "@/lib/education/lessons/en/figures-cryptography/david-chaum";
import EnNickSzabo from "@/lib/education/lessons/en/figures-cryptography/nick-szabo";
import EnAdamBack from "@/lib/education/lessons/en/figures-cryptography/adam-back";
import EnWeiDai from "@/lib/education/lessons/en/figures-cryptography/wei-dai";
import EnPhilZimmermann from "@/lib/education/lessons/en/figures-cryptography/phil-zimmermann";
// lineage-christianity (planned → written)
import EnOrthodoxTradition from "@/lib/education/lessons/en/lineage-christianity/orthodox-tradition";
import EnAcademicApologetics from "@/lib/education/lessons/en/lineage-christianity/academic-apologetics";
import EnEarlyChurchFathers from "@/lib/education/lessons/en/lineage-christianity/early-church-fathers";
// lineage-cognition (planned → written)
import EnOperationPaperclip from "@/lib/education/lessons/en/lineage-cognition/operation-paperclip";
import EnMonroeInstitute from "@/lib/education/lessons/en/lineage-cognition/monroe-institute";
import EnProjectStargate from "@/lib/education/lessons/en/lineage-cognition/project-stargate";
// lineage-cosmology (planned → written)
import EnAtlantis from "@/lib/education/lessons/en/lineage-cosmology/atlantis";
import EnHyperborea from "@/lib/education/lessons/en/lineage-cosmology/hyperborea";
import EnHollowEarth from "@/lib/education/lessons/en/lineage-cosmology/hollow-earth";
import EnLostHistoryOfTheEarth from "@/lib/education/lessons/en/lineage-cosmology/lost-history-of-the-earth";
// lineage-hackers (whole track newly written)
import EnMitAiLab from "@/lib/education/lessons/en/lineage-hackers/mit-ai-lab";
import EnCypherpunks from "@/lib/education/lessons/en/lineage-hackers/cypherpunks";
import EnFreeSoftwareMovement from "@/lib/education/lessons/en/lineage-hackers/free-software-movement";
import EnHomebrewEra from "@/lib/education/lessons/en/lineage-hackers/homebrew-era";
// figures-culture
import EnMalcolmMclaren from "@/lib/education/lessons/en/figures-culture/malcolm-mclaren";
import EnJohnLydon from "@/lib/education/lessons/en/figures-culture/john-lydon";
import EnDonaldTrump from "@/lib/education/lessons/en/figures-culture/donald-trump";
import EnCowellRamsay from "@/lib/education/lessons/en/figures-culture/simon-cowell-and-gordon-ramsay";
import EnStanLee from "@/lib/education/lessons/en/figures-culture/stan-lee";
import EnToddMcFarlane from "@/lib/education/lessons/en/figures-culture/todd-mcfarlane";
import EnMStrange from "@/lib/education/lessons/en/figures-culture/m-strange";

export interface LessonRef {
  track: string;
  lesson: string;
}

export interface AcademyProps {
  initialRef?: LessonRef | null;
  lang?: Lang;
  mode: "route" | "window";
  onRefChange?: (ref: LessonRef | null, lang: Lang) => void;
  onLangChange?: (lang: Lang, ref: LessonRef | null) => void;
}

type LessonBundle = Record<Lang, Record<string, Record<string, React.ComponentType>>>;

const LESSON_COMPONENTS: LessonBundle = {
  en: {
    "cryptography-basics": { introduction: EnCryptoBasicsIntro },
    bitcoin: { introduction: EnBitcoinIntro },
    "ethereum-dev": { introduction: EnEthereumDevIntro },
    monero: { introduction: EnMoneroIntro },
    "figures-cryptography": {
      "satoshi-nakamoto": EnSatoshi,
      "terry-davis": EnTerryDavis,
      "linus-torvalds": EnLinusTorvalds,
      "hal-finney": EnHalFinney,
      "david-chaum": EnDavidChaum,
      "nick-szabo": EnNickSzabo,
      "adam-back": EnAdamBack,
      "wei-dai": EnWeiDai,
      "phil-zimmermann": EnPhilZimmermann,
    },
    "figures-esoterica": {
      "edgar-cayce": EnEdgarCayce,
      "saint-germain": EnSaintGermain,
      "walter-russell": EnWalterRussell,
      "patrick-flanagan": EnPatrickFlanagan,
      "robert-monroe": EnRobertMonroe,
      "george-van-tassel": EnGeorgeVanTassel,
    },
    "figures-hidden-history": {
      "richard-byrd": EnRichardByrd,
      "robert-sepehr": EnRobertSepehr,
      "robert-david-steele": EnRobertDavidSteele,
      "leo-frank": EnLeoFrank,
      "john-mcafee": EnJohnMcAfee,
      "kim-dotcom": EnKimDotcom,
    },
    "figures-privacy": {
      "john-mcafee": EnJohnMcAfee,
      "kim-dotcom": EnKimDotcom,
    },
    privacy: {
      introduction: EnPrivacyIntro,
      "self-sovereignty": EnSelfSovereignty,
      tor: EnTor,
      "brave-browser": EnBrave,
      ipfs: EnIPFS,
      "quantum-financial-system": EnQFS,
    },
    "reading-codebases": {
      "linux-from-scratch": EnLinuxFromScratch,
    },
    "lineage-christianity": {
      "apostolic-succession": EnApostolicSuccession,
      "the-rosary": EnTheRosary,
      "orthodox-tradition": EnOrthodoxTradition,
      "academic-apologetics": EnAcademicApologetics,
      "early-church-fathers": EnEarlyChurchFathers,
    },
    "lineage-cognition": {
      mkultra: EnMKUltra,
      "operation-paperclip": EnOperationPaperclip,
      "monroe-institute": EnMonroeInstitute,
      "project-stargate": EnProjectStargate,
    },
    "lineage-cosmology": {
      "the-firmament": EnTheFirmament,
      atlantis: EnAtlantis,
      hyperborea: EnHyperborea,
      "hollow-earth": EnHollowEarth,
      "lost-history-of-the-earth": EnLostHistoryOfTheEarth,
    },
    "lineage-hackers": {
      "mit-ai-lab": EnMitAiLab,
      cypherpunks: EnCypherpunks,
      "free-software-movement": EnFreeSoftwareMovement,
      "homebrew-era": EnHomebrewEra,
    },
    "figures-culture": {
      "malcolm-mclaren": EnMalcolmMclaren,
      "john-lydon": EnJohnLydon,
      "donald-trump": EnDonaldTrump,
      "simon-cowell-and-gordon-ramsay": EnCowellRamsay,
      "stan-lee": EnStanLee,
      "todd-mcfarlane": EnToddMcFarlane,
      "m-strange": EnMStrange,
    },
  },
  es: {},
  ja: {},
  zh: {},
};

export function Academy({
  initialRef,
  lang: initialLang = DEFAULT_LANG,
  mode,
  onRefChange,
  onLangChange,
}: AcademyProps) {
  const [currentRef, setCurrentRef] = useState<LessonRef | null>(initialRef ?? null);
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialRef ? [initialRef.track] : []),
  );

  React.useEffect(() => {
    if (initialRef !== undefined) setCurrentRef(initialRef ?? null);
  }, [initialRef]);
  React.useEffect(() => {
    setLangState(initialLang);
  }, [initialLang]);

  const navigate = useCallback(
    (target: LessonRef | null) => {
      setCurrentRef(target);
      if (target) {
        setExpanded((prev) => {
          if (prev.has(target.track)) return prev;
          const next = new Set(prev);
          next.add(target.track);
          return next;
        });
      }
      if (mode === "route") onRefChange?.(target, lang);
      requestAnimationFrame(() => {
        const el = document.getElementById("academy-scroll");
        if (el) el.scrollTop = 0;
        else window.scrollTo({ top: 0 });
      });
    },
    [mode, onRefChange, lang],
  );

  const openLinkedLesson = useCallback(
    (trackSlug: string, lessonSlug: string) => {
      navigate({ track: trackSlug, lesson: lessonSlug });
    },
    [navigate],
  );
  useKosLesson(openLinkedLesson);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      if (mode === "route") onLangChange?.(next, currentRef);
    },
    [mode, onLangChange, currentRef],
  );

  const toggleExpanded = useCallback((track: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(track)) next.delete(track);
      else next.add(track);
      return next;
    });
  }, []);

  const track = currentRef ? TRACKS_BY_SLUG[currentRef.track] : null;
  const lesson = track && currentRef
    ? track.lessons.find((l) => l.slug === currentRef.lesson) ?? null
    : null;
  const ui = UI_STRINGS[lang];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
        color: "#ffffff",
        fontFamily: "var(--dm-font-primary), monospace",
        imageRendering: "pixelated",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Header
        currentRef={currentRef}
        lang={lang}
        navigate={navigate}
        setLang={setLang}
        ui={ui}
        bundle={
          Object.keys(LESSON_COMPONENTS[lang]).length > 0
            ? LESSON_COMPONENTS[lang]
            : LESSON_COMPONENTS.en
        }
      />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar
          currentRef={currentRef}
          expanded={expanded}
          toggleExpanded={toggleExpanded}
          lang={lang}
          navigate={navigate}
          ui={ui}
        />
        <main
          id="academy-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "20px 28px 60px",
            maxWidth: 760,
            userSelect: "text",
            WebkitUserSelect: "text",
          }}
        >
          {track && lesson ? (
            <LessonView track={track} lesson={lesson} lang={lang} ui={ui} />
          ) : (
            <Index lang={lang} navigate={navigate} ui={ui} />
          )}
        </main>
      </div>
    </div>
  );
}

function Header({
  currentRef,
  lang,
  navigate,
  setLang,
  ui,
  bundle,
}: {
  currentRef: LessonRef | null;
  lang: Lang;
  navigate: (target: LessonRef | null) => void;
  setLang: (l: Lang) => void;
  ui: Record<string, string>;
  bundle: Record<string, Record<string, React.ComponentType>>;
}) {
  const track = currentRef ? TRACKS_BY_SLUG[currentRef.track] : null;
  const lesson = track && currentRef
    ? track.lessons.find((l) => l.slug === currentRef.lesson) ?? null
    : null;
  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#fff",
        padding: "4px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2px solid #fff",
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 11,
        letterSpacing: 2,
        flexShrink: 0,
        gap: 12,
      }}
    >
      <div
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track && lesson ? (
          <>
            <button
              onClick={() => navigate(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontFamily: "inherit",
                fontSize: "inherit",
                letterSpacing: "inherit",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              ← {ui.backToIndex}
            </button>
            <span style={{ marginLeft: 8, color: "#aaa" }}>
              / {track.i18n[lang].title.toUpperCase()}
              {" / "}
              {lesson.i18n[lang].title.toUpperCase()}
            </span>
          </>
        ) : (
          <span style={{ color: "#aaa" }}>✠ {ui.indexTitle.toUpperCase()}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <SearchBar bundle={bundle} lang={lang} navigate={navigate} ui={ui} />
        <span style={{ fontSize: 9, color: "#aaa" }}>{ui.languageLabel}:</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          style={{
            background: "#000",
            color: "#fff",
            border: "1px solid #fff",
            fontFamily: "inherit",
            fontSize: 10,
            padding: "1px 4px",
            letterSpacing: 1,
            cursor: "pointer",
            imageRendering: "pixelated",
          }}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {LANG_LABELS[l]}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 9, color: "#666" }}>0.1.0</span>
      </div>
    </div>
  );
}

function Sidebar({
  currentRef,
  expanded,
  toggleExpanded,
  lang,
  navigate,
  ui,
}: {
  currentRef: LessonRef | null;
  expanded: Set<string>;
  toggleExpanded: (track: string) => void;
  lang: Lang;
  navigate: (target: LessonRef | null) => void;
  ui: Record<string, string>;
}) {
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: "2px solid #222",
        padding: "16px 12px",
        fontSize: 10,
        letterSpacing: 1,
        backgroundColor: "#0a0a0a",
        overflowY: "auto",
      }}
    >
      <button
        onClick={() => navigate(null)}
        style={{
          background: "transparent",
          border: "none",
          color: currentRef === null ? "#ffff00" : "#aaaaaa",
          fontFamily: "inherit",
          fontSize: "inherit",
          letterSpacing: "inherit",
          cursor: "pointer",
          padding: "2px 4px",
          marginBottom: 12,
          display: "block",
          width: "100%",
          textAlign: "left",
        }}
      >
        ✠ {ui.backToIndex}
      </button>
      {GROUP_ORDER.map((group) => {
        const tracksHere = tracksInGroup(group);
        if (tracksHere.length === 0) return null;
        return (
          <div key={group} style={{ marginBottom: 14 }}>
            <div
              style={{
                color: "#888",
                marginBottom: 4,
                paddingBottom: 2,
                borderBottom: "1px solid #222",
              }}
            >
              {GROUP_LABELS[lang][group]}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {tracksHere.map((t) => {
                const isOpen = expanded.has(t.slug);
                const hasLessons = t.lessons.length > 0;
                const trackActive = currentRef?.track === t.slug;
                return (
                  <li key={t.slug} style={{ marginBottom: 2 }}>
                    <button
                      onClick={() => toggleExpanded(t.slug)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: trackActive ? "#ffff00" : "#cccccc",
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        letterSpacing: "inherit",
                        cursor: "pointer",
                        padding: "2px 4px",
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      {isOpen ? "▼ " : "▶ "}
                      {t.glyph} {t.i18n[lang].title}
                    </button>
                    {isOpen && hasLessons ? (
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: "2px 0 4px 12px",
                          borderLeft: "1px solid #222",
                        }}
                      >
                        {t.lessons.map((l) => {
                          const active =
                            currentRef?.track === t.slug &&
                            currentRef?.lesson === l.slug;
                          return (
                            <li key={l.slug} style={{ marginBottom: 2 }}>
                              <button
                                onClick={() =>
                                  navigate({ track: t.slug, lesson: l.slug })
                                }
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: active ? "#ffff00" : "#aaaaaa",
                                  fontFamily: "inherit",
                                  fontSize: 9,
                                  letterSpacing: 1,
                                  cursor: "pointer",
                                  padding: "1px 4px 1px 10px",
                                  display: "block",
                                  width: "100%",
                                  textAlign: "left",
                                }}
                              >
                                {active ? "· " : "  "}
                                {String(l.order).padStart(2, "0")}{" "}
                                {l.i18n[lang].title}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    {isOpen && !hasLessons ? (
                      <div
                        style={{
                          color: "#666",
                          fontSize: 9,
                          padding: "2px 4px 4px 20px",
                          letterSpacing: 1,
                        }}
                      >
                        {ui.noLessonsYet}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}

function Index({
  lang,
  navigate,
  ui,
}: {
  lang: Lang;
  navigate: (target: LessonRef | null) => void;
  ui: Record<string, string>;
}) {
  return (
    <>
      <ArticleTitle>{ui.indexTitle}</ArticleTitle>
      <SubtleNote>
        {ui.versionLine.replace("{{count}}", String(TRACKS.length))}
      </SubtleNote>

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "#ddd",
          marginBottom: 24,
        }}
      >
        {ui.indexBlurb}
      </p>

      {GROUP_ORDER.map((group) => {
        const tracksHere = tracksInGroup(group);
        if (tracksHere.length === 0) return null;
        return (
          <section key={group} style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontFamily: "var(--dm-font-primary), monospace",
                fontSize: 16,
                letterSpacing: 2,
                color: "#ffff00",
                marginBottom: 6,
                paddingBottom: 4,
                borderBottom: "1px solid #444",
              }}
            >
              {GROUP_LABELS[lang][group]}
            </h2>
            <p
              style={{
                fontSize: 11,
                color: "#888",
                marginBottom: 12,
                letterSpacing: 1,
              }}
            >
              {GROUP_DESCRIPTIONS[lang][group].toUpperCase()}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {tracksHere.map((t) => (
                <TrackListItem
                  key={t.slug}
                  track={t}
                  lang={lang}
                  navigate={navigate}
                  ui={ui}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <div
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: "2px solid #444",
          fontSize: 11,
          color: "#888",
          letterSpacing: 1,
        }}
      >
        ✠ K-OS III · 2KOOL PRODUCTIONS
        <br />
        {ui.epistemicNote}{" "}
        <a
          href="https://github.com/Koolskull/K-OS-III/blob/master/docs/EPISTEMIC_STANCE.md"
          style={{ color: "#ffff00" }}
        >
          docs/EPISTEMIC_STANCE.md
        </a>
        .
      </div>
    </>
  );
}

function TrackListItem({
  track,
  lang,
  navigate,
  ui,
}: {
  track: TrackMeta;
  lang: Lang;
  navigate: (target: LessonRef | null) => void;
  ui: Record<string, string>;
}) {
  const hasLessons = track.lessons.length > 0;
  return (
    <li style={{ marginBottom: 14, paddingLeft: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ color: "#ffffff", fontSize: 14 }}>{track.glyph}</span>
        <span
          style={{
            color: "#ffff00",
            fontSize: 13,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {track.i18n[lang].title}
        </span>
        <span
          style={{
            marginLeft: 4,
            fontSize: 9,
            padding: "1px 4px",
            color: hasLessons ? "#00ff88" : "#888",
            border: `1px solid ${hasLessons ? "#00ff88" : "#888"}`,
            letterSpacing: 1,
          }}
        >
          {hasLessons
            ? `${track.lessons.length} ${ui.lessonsLabel}`
            : ui.statusPlanned}
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#aaaaaa",
          marginTop: 2,
          marginBottom: 4,
        }}
      >
        {track.i18n[lang].oneLiner}
      </div>
      {hasLessons ? (
        <ul
          style={{
            listStyle: "square",
            padding: 0,
            margin: "4px 0 0 20px",
            color: "#cccccc",
            fontSize: 12,
          }}
        >
          {track.lessons.map((l) => (
            <li key={l.slug} style={{ marginBottom: 2 }}>
              <button
                onClick={() =>
                  navigate({ track: track.slug, lesson: l.slug })
                }
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffff00",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  letterSpacing: 1,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textAlign: "left",
                }}
              >
                {String(l.order).padStart(2, "0")} · {l.i18n[lang].title}
              </button>
              <span style={{ color: "#888", marginLeft: 8 }}>
                — {l.i18n[lang].oneLiner}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function LessonView({
  track,
  lesson,
  lang,
  ui,
}: {
  track: TrackMeta;
  lesson: LessonMeta;
  lang: Lang;
  ui: Record<string, string>;
}) {
  const Body = LESSON_COMPONENTS[lang]?.[track.slug]?.[lesson.slug];
  const levelLabel =
    lesson.level === "beginner"
      ? ui.levelBeginner
      : lesson.level === "intermediate"
        ? ui.levelIntermediate
        : ui.levelAdvanced;
  return (
    <>
      <ArticleTitle>{lesson.i18n[lang].title}</ArticleTitle>
      <SubtleNote>
        {track.glyph} {track.i18n[lang].title.toUpperCase()}
        {" · "}
        {String(lesson.order).padStart(2, "0")}
        {" · "}
        {levelLabel}
        {" · "}
        <span style={{ color: "#ffff00" }}>{LANG_SHORT[lang]}</span>
      </SubtleNote>
      {Body ? (
        <Body />
      ) : (
        <div
          style={{
            color: "#ff5555",
            border: "1px solid #ff5555",
            padding: 12,
            marginTop: 12,
          }}
        >
          {lesson.status === "written" ? ui.notFound : ui.notWritten}
        </div>
      )}
    </>
  );
}

export default Academy;

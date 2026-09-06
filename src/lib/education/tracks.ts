/*
 *                    ✠
 *      K-OS ACADEMY — TRACK + LESSON REGISTRY
 *
 *  Parallel to src/lib/doc/articles.ts but with a two-level hierarchy
 *  (track → lesson). Lesson bodies live at
 *  src/lib/education/lessons/<lang>/<track>/<lesson>.tsx and are
 *  pre-imported by the Academy component for static-export compatibility.
 *
 *  ES/JA/ZH entries are English placeholders for now — real translations
 *  ship in a follow-up. The shape is already i18n-complete so adding a
 *  language is a pure data change.
 */

export const LANGUAGES = ["en", "es", "ja", "zh"] as const;
export type Lang = typeof LANGUAGES[number];

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN — English",
  es: "ES — Español",
  ja: "JA — 日本語",
  zh: "ZH — 中文",
};

export const LANG_SHORT: Record<Lang, string> = {
  en: "EN",
  es: "ES",
  ja: "JA",
  zh: "ZH",
};

export type TrackGroup = "foundations" | "chains" | "practice" | "lineages";
export type Level = "beginner" | "intermediate" | "advanced";
export type LessonStatus = "written" | "stub" | "planned";

export interface I18nText {
  title: string;
  oneLiner: string;
}

export interface LessonMeta {
  slug: string;
  order: number;
  level: Level;
  status: LessonStatus;
  i18n: Record<Lang, I18nText>;
}

export interface TrackMeta {
  slug: string;
  group: TrackGroup;
  glyph: string;
  lessons: LessonMeta[];
  i18n: Record<Lang, I18nText>;
}

export const GROUP_ORDER: TrackGroup[] = ["foundations", "chains", "practice", "lineages"];

export const GROUP_LABELS: Record<Lang, Record<TrackGroup, string>> = {
  en: {
    foundations: "FOUNDATIONS",
    chains: "CHAINS",
    practice: "PRACTICE",
    lineages: "LINEAGES",
  },
  es: {
    foundations: "FUNDAMENTOS",
    chains: "CADENAS",
    practice: "PRÁCTICA",
    lineages: "LINAJES",
  },
  ja: {
    foundations: "基礎",
    chains: "チェーン",
    practice: "実践",
    lineages: "系譜",
  },
  zh: {
    foundations: "基础",
    chains: "链",
    practice: "实践",
    lineages: "传承",
  },
};

export const GROUP_DESCRIPTIONS: Record<Lang, Record<TrackGroup, string>> = {
  en: {
    foundations: "Start here. Civic context and the cryptographic primitives every later track assumes you know.",
    chains: "The three chains K-OS treats as first-class: Bitcoin, Ethereum, Monero.",
    practice: "Applied tracks — operational privacy, Solidity, and reading the code other people wrote.",
    lineages: "Figures and currents the curriculum treats seriously — cryptographers and mystics, sacred cosmologies, hidden history, and the long wars over human cognition.",
  },
  es: {
    foundations: "Empieza aquí. Contexto cívico y las primitivas criptográficas que asumen las pistas posteriores.",
    chains: "Las tres cadenas que K-OS trata como primer nivel: Bitcoin, Ethereum, Monero.",
    practice: "Pistas aplicadas — privacidad operacional, Solidity y leer el código que otros escribieron.",
    lineages: "Figuras y corrientes que el currículo toma en serio — criptógrafos y místicos, cosmologías sagradas, historia oculta y las largas guerras por la cognición humana.",
  },
  ja: {
    foundations: "ここから始めよう。市民的文脈と、後続の全トラックが前提とする暗号プリミティブ。",
    chains: "K-OSが一級扱いする三つのチェーン：Bitcoin、Ethereum、Monero。",
    practice: "応用トラック — 運用プライバシー、Solidity、他人が書いたコードを読む。",
    lineages: "カリキュラムが真剣に扱う人物と潮流 — 暗号学者と神秘家、聖なる宇宙論、隠された歴史、そして人間の認知を巡る長き戦争。",
  },
  zh: {
    foundations: "从这里开始。公民语境，以及后续所有轨道都假定你已掌握的密码学原语。",
    chains: "K-OS 作为一等公民对待的三条链：Bitcoin、Ethereum、Monero。",
    practice: "应用轨道 —— 操作隐私、Solidity，以及阅读他人所写的代码。",
    lineages: "课程严肃对待的人物与潮流 —— 密码学家与神秘主义者、神圣宇宙论、被隐去的历史，以及围绕人类认知的漫长战争。",
  },
};

export const UI_STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    indexTitle: "K-OS Academy",
    indexBlurb:
      "Tracks for the technical and civic knowledge K-OS assumes you care about. Each track moves at its own pace. Read a lesson, skip a whole track, come back later — the Academy is built to be used in any order.",
    seeAlso: "SEE ALSO",
    backToIndex: "INDEX",
    languageLabel: "LANG",
    levelBeginner: "BEGINNER",
    levelIntermediate: "INTERMEDIATE",
    levelAdvanced: "ADVANCED",
    notFound: "Lesson not found.",
    notWritten: "This lesson is planned but not yet written. The outline is in public/education/ as markdown.",
    loading: "Loading…",
    versionLine: "VERSION 0.1.0 · {{count}} TRACKS",
    statusWritten: "WRITTEN",
    statusStub: "STUB",
    statusPlanned: "PLANNED",
    epistemicNote:
      "The Academy has a point of view. On contested topics it presents the debate and names its own side. See",
    lessonsLabel: "LESSONS",
    noLessonsYet: "No lessons published yet. Outlines live in public/education/.",
    searchPlaceholder: "SEARCH",
    searchNoResults: "NO RESULTS",
    searchResults: "{{count}} RESULTS",
  },
  es: {
    indexTitle: "Academia K-OS",
    indexBlurb:
      "Pistas para el conocimiento técnico y cívico que K-OS supone que te importa. Cada pista avanza a su propio ritmo. Lee una lección, sáltate una pista entera, vuelve más tarde — la Academia está pensada para usarse en cualquier orden.",
    seeAlso: "VER TAMBIÉN",
    backToIndex: "ÍNDICE",
    languageLabel: "IDIOMA",
    levelBeginner: "PRINCIPIANTE",
    levelIntermediate: "INTERMEDIO",
    levelAdvanced: "AVANZADO",
    notFound: "Lección no encontrada.",
    notWritten: "Esta lección está planificada pero aún no escrita. El esquema está en public/education/ como markdown.",
    loading: "Cargando…",
    versionLine: "VERSIÓN 0.1.0 · {{count}} PISTAS",
    statusWritten: "ESCRITO",
    statusStub: "ESBOZO",
    statusPlanned: "PLANIFICADO",
    epistemicNote:
      "La Academia tiene un punto de vista. En temas controvertidos presenta el debate y nombra su propio bando. Ver",
    lessonsLabel: "LECCIONES",
    noLessonsYet: "Aún no hay lecciones publicadas. Los esquemas viven en public/education/.",
    searchPlaceholder: "BUSCAR",
    searchNoResults: "SIN RESULTADOS",
    searchResults: "{{count}} RESULTADOS",
  },
  ja: {
    indexTitle: "K-OS アカデミー",
    indexBlurb:
      "K-OSがあなたに関心を持ってほしい技術的・市民的知識のためのトラック。各トラックは独自のペースで進む。どの順番でもよいので、気になるレッスンから読んでほしい。",
    seeAlso: "関連項目",
    backToIndex: "目次",
    languageLabel: "言語",
    levelBeginner: "初級",
    levelIntermediate: "中級",
    levelAdvanced: "上級",
    notFound: "レッスンが見つかりません。",
    notWritten: "このレッスンは計画されていますが、まだ書かれていません。下書きは public/education/ にマークダウンとしてあります。",
    loading: "読み込み中…",
    versionLine: "バージョン 0.1.0 · {{count}} トラック",
    statusWritten: "完成",
    statusStub: "下書き",
    statusPlanned: "予定",
    epistemicNote:
      "アカデミーには立場がある。議論のある話題については、議論そのものを提示し、自分の側を名指しする。詳しくは",
    lessonsLabel: "レッスン",
    noLessonsYet: "まだ公開レッスンはありません。下書きは public/education/ にあります。",
    searchPlaceholder: "検索",
    searchNoResults: "結果なし",
    searchResults: "{{count}} 件の結果",
  },
  zh: {
    indexTitle: "K-OS 学院",
    indexBlurb:
      "为 K-OS 假定你关心的技术与公民知识而设的轨道。每条轨道按自己的节奏前进。读一课，跳过整条轨道，稍后再回来 —— 学院可以按任意顺序使用。",
    seeAlso: "另见",
    backToIndex: "目录",
    languageLabel: "语言",
    levelBeginner: "初级",
    levelIntermediate: "中级",
    levelAdvanced: "高级",
    notFound: "未找到课程。",
    notWritten: "此课程已规划但尚未撰写。大纲以 markdown 形式存放于 public/education/。",
    loading: "加载中…",
    versionLine: "版本 0.1.0 · {{count}} 条轨道",
    statusWritten: "已完成",
    statusStub: "草稿",
    statusPlanned: "已规划",
    epistemicNote:
      "学院是有立场的。对有争议的话题，它呈现辩论并点明自己所站的一边。详见",
    lessonsLabel: "课程",
    noLessonsYet: "尚未发布任何课程。大纲存放于 public/education/。",
    searchPlaceholder: "搜索",
    searchNoResults: "无结果",
    searchResults: "{{count}} 条结果",
  },
};

/*
 *  Tracks.
 *
 *  i18n.en is the source of truth; es/ja/zh are placeholders duplicating the
 *  English string until proper translations are written. The Lang dropdown
 *  still works; the copy is just English-equivalent everywhere until then.
 */
export const TRACKS: TrackMeta[] = [
  {
    slug: "cryptography-basics",
    group: "foundations",
    glyph: "†",
    i18n: {
      en: {
        title: "Cryptography Basics",
        oneLiner: "The primitives every later track assumes you know.",
      },
      es: {
        title: "Fundamentos de Criptografía",
        oneLiner: "Las primitivas que asumen las pistas posteriores.",
      },
      ja: {
        title: "暗号の基礎",
        oneLiner: "後続の全トラックが前提とするプリミティブ。",
      },
      zh: {
        title: "密码学基础",
        oneLiner: "后续每条轨道都假定你已掌握的原语。",
      },
    },
    lessons: [
      {
        slug: "introduction",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: {
            title: "Why cryptography matters before you touch a wallet",
            oneLiner: "Hashes, signatures, KDFs — framed as civic primitives.",
          },
          es: {
            title: "Por qué importa la criptografía antes de tocar una wallet",
            oneLiner: "Hashes, firmas, KDFs — planteados como primitivas cívicas.",
          },
          ja: {
            title: "ウォレットに触れる前に、なぜ暗号が重要なのか",
            oneLiner: "ハッシュ、署名、KDF — 市民的プリミティブとして。",
          },
          zh: {
            title: "在你打开钱包之前，为什么密码学很重要",
            oneLiner: "哈希、签名、KDF — 作为公民级原语来阐述。",
          },
        },
      },
    ],
  },
  {
    slug: "bitcoin",
    group: "chains",
    glyph: "₿",
    i18n: {
      en: {
        title: "Bitcoin",
        oneLiner: "The older, smaller-scope chain — and why its model matters.",
      },
      es: {
        title: "Bitcoin",
        oneLiner: "La cadena más antigua y de menor alcance — y por qué su modelo importa.",
      },
      ja: {
        title: "Bitcoin",
        oneLiner: "より古く、より範囲の狭いチェーン — そしてそのモデルが重要な理由。",
      },
      zh: {
        title: "Bitcoin",
        oneLiner: "更古老、范围更窄的链 —— 以及它的模型为何重要。",
      },
    },
    lessons: [
      {
        slug: "introduction",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: {
            title: "How Bitcoin thinks about money",
            oneLiner: "UTXO, fixed supply, and what the whitepaper was written against.",
          },
          es: {
            title: "Cómo piensa Bitcoin sobre el dinero",
            oneLiner: "UTXO, suministro fijo, y contra qué se escribió el whitepaper.",
          },
          ja: {
            title: "Bitcoinが貨幣をどう考えているか",
            oneLiner: "UTXO、固定供給、そしてホワイトペーパーが何に対して書かれたか。",
          },
          zh: {
            title: "Bitcoin 如何看待货币",
            oneLiner: "UTXO、固定供应、以及白皮书是针对什么而写的。",
          },
        },
      },
    ],
  },
  {
    slug: "ethereum-dev",
    group: "chains",
    glyph: "Ξ",
    i18n: {
      en: {
        title: "Ethereum Developer",
        oneLiner: "The flagship track — from 'what is Ethereum' to reading mainnet contracts.",
      },
      es: {
        title: "Desarrollador Ethereum",
        oneLiner: "La pista insignia — de 'qué es Ethereum' a leer contratos de mainnet.",
      },
      ja: {
        title: "Ethereum 開発者",
        oneLiner: "旗艦トラック — 「Ethereumとは何か」からmainnetコントラクトの読解まで。",
      },
      zh: {
        title: "Ethereum 开发者",
        oneLiner: "旗舰轨道 —— 从「Ethereum 是什么」到能读懂主网合约。",
      },
    },
    lessons: [
      {
        slug: "introduction",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: {
            title: "What this track is, and what you'll be able to do",
            oneLiner: "Framing the curriculum — including its legitimate critics.",
          },
          es: {
            title: "Qué es esta pista y qué podrás hacer",
            oneLiner: "Enmarcando el currículo — incluyendo a sus críticos legítimos.",
          },
          ja: {
            title: "このトラックとは何か、そして何ができるようになるか",
            oneLiner: "カリキュラムの枠組み — 正当な批判者を含めて。",
          },
          zh: {
            title: "这条轨道是什么，以及你将能做什么",
            oneLiner: "给课程做定位 —— 连同它正当的批评者一起。",
          },
        },
      },
    ],
  },
  {
    slug: "monero",
    group: "chains",
    glyph: "ɱ",
    i18n: {
      en: {
        title: "Monero",
        oneLiner: "Privacy-by-default — and why that matters legally.",
      },
      es: {
        title: "Monero",
        oneLiner: "Privacidad por defecto — y por qué eso importa legalmente.",
      },
      ja: {
        title: "Monero",
        oneLiner: "既定でプライバシー — そしてそれが法的に重要な理由。",
      },
      zh: {
        title: "Monero",
        oneLiner: "隐私为默认 —— 以及这在法律上为何重要。",
      },
    },
    lessons: [
      {
        slug: "introduction",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: {
            title: "Why Monero exists, and what it actually provides",
            oneLiner: "Ring signatures, stealth addresses, RingCT — and the Tornado Cash precedent.",
          },
          es: {
            title: "Por qué existe Monero y qué ofrece realmente",
            oneLiner: "Firmas en anillo, direcciones furtivas, RingCT — y el precedente de Tornado Cash.",
          },
          ja: {
            title: "なぜMoneroは存在するのか、そして実際に何を提供するのか",
            oneLiner: "リング署名、ステルスアドレス、RingCT — そしてTornado Cash判例。",
          },
          zh: {
            title: "Monero 为什么存在，它实际上提供了什么",
            oneLiner: "环签名、隐身地址、RingCT —— 以及 Tornado Cash 判例。",
          },
        },
      },
    ],
  },
  {
    slug: "privacy",
    group: "practice",
    glyph: "◉",
    i18n: {
      en: {
        title: "Privacy",
        oneLiner: "Operational privacy — threat modeling, Tor, Brave, IPFS.",
      },
      es: {
        title: "Privacidad",
        oneLiner: "Privacidad operacional — modelado de amenazas, Tor, Brave, IPFS.",
      },
      ja: {
        title: "プライバシー",
        oneLiner: "運用プライバシー — 脅威モデリング、Tor、Brave、IPFS。",
      },
      zh: {
        title: "隐私",
        oneLiner: "操作隐私 —— 威胁建模、Tor、Brave、IPFS。",
      },
    },
    lessons: [
      {
        slug: "introduction",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Threat Modeling — Who, What, Why", oneLiner: "Privacy as practical discipline, not vibe — the four questions." },
          es: { title: "Modelado de Amenazas — Quién, Qué, Por Qué", oneLiner: "La privacidad como disciplina práctica — las cuatro preguntas." },
          ja: { title: "脅威モデリング — 誰から、何を、なぜ", oneLiner: "雰囲気ではなく実践的な規律としてのプライバシー — 四つの問い。" },
          zh: { title: "威胁建模 —— 谁、什么、为何", oneLiner: "作为实践纪律而非氛围的隐私 —— 四个问题。" },
        },
      },
      {
        slug: "self-sovereignty",
        order: 2,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Self-sovereignty — the civic posture behind the tools", oneLiner: "Citizens who take care of themselves and are considerate of others." },
          es: { title: "Autosoberanía — la postura cívica detrás de las herramientas", oneLiner: "Ciudadanos que se cuidan a sí mismos y son considerados con los demás." },
          ja: { title: "自己主権 — 道具の背後にある市民的姿勢", oneLiner: "自分自身を世話し、他者への配慮を持つ市民。" },
          zh: { title: "自主权 —— 工具背后的公民姿态", oneLiner: "照顾自己、体恤他人的公民。" },
        },
      },
      {
        slug: "tor",
        order: 3,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Tor and the Onion-Routing Tradition", oneLiner: "Naval Research Lab origins, the threat model, and the funding question." },
          es: { title: "Tor y la Tradición del Enrutamiento Cebolla", oneLiner: "Orígenes en el NRL, modelo de amenazas y la cuestión del financiamiento." },
          ja: { title: "Torとオニオンルーティングの伝統", oneLiner: "海軍研究所の起源、脅威モデル、資金の問題。" },
          zh: { title: "Tor 与洋葱路由传统", oneLiner: "海军研究实验室的起源、威胁模型，以及资金来源问题。" },
        },
      },
      {
        slug: "brave-browser",
        order: 4,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Brave, BAT, and the Attention Economy", oneLiner: "Tracking defaults inverted — Brendan Eich's browser and its token." },
          es: { title: "Brave, BAT y la Economía de la Atención", oneLiner: "Los valores predeterminados del rastreo invertidos — el navegador de Brendan Eich y su token." },
          ja: { title: "Brave、BAT、注意経済", oneLiner: "トラッキングの既定を反転させた — ブレンダン・アイクのブラウザとトークン。" },
          zh: { title: "Brave、BAT 与注意力经济", oneLiner: "追踪默认被反转 —— 布伦丹·艾奇的浏览器与它的代币。" },
        },
      },
      {
        slug: "ipfs",
        order: 5,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "IPFS and Content-Addressed Storage", oneLiner: "From HTTP location to Merkle-DAG content — and what that changes." },
          es: { title: "IPFS y el Almacenamiento Direccionado por Contenido", oneLiner: "De la ubicación HTTP al contenido Merkle-DAG — y qué cambia eso." },
          ja: { title: "IPFSとコンテンツアドレッシング", oneLiner: "HTTPのロケーションからMerkle-DAGのコンテンツへ — そしてそれが何を変えるか。" },
          zh: { title: "IPFS 与内容寻址存储", oneLiner: "从 HTTP 位置到 Merkle-DAG 内容 —— 以及这改变了什么。" },
        },
      },
      {
        slug: "quantum-financial-system",
        order: 6,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "The Quantum Financial System", oneLiner: "The constituency's name for the post-fiat settlement architecture being stood up — and where K-OS III sits within it." },
          es: { title: "El Sistema Financiero Cuántico", oneLiner: "El nombre que la comunidad da a la arquitectura de liquidación post-fiat que se está erigiendo — y el lugar de K-OS III dentro de ella." },
          ja: { title: "量子金融システム", oneLiner: "立ち上がりつつあるポスト法定通貨の決済アーキテクチャに対するコミュニティの名 — その中でK-OS IIIが立つ位置。" },
          zh: { title: "量子金融系统", oneLiner: "这一群体对正在搭建的后法币结算架构的命名 —— 以及 K-OS III 在其中所处的位置。" },
        },
      },
    ],
  },
  {
    slug: "solidity",
    group: "practice",
    glyph: "§",
    i18n: {
      en: {
        title: "Solidity",
        oneLiner: "The language. Assumes Ethereum-dev.",
      },
      es: {
        title: "Solidity",
        oneLiner: "El lenguaje. Asume Ethereum-dev.",
      },
      ja: {
        title: "Solidity",
        oneLiner: "言語。Ethereum-devが前提。",
      },
      zh: {
        title: "Solidity",
        oneLiner: "编程语言。假定已学 Ethereum-dev。",
      },
    },
    lessons: [],
  },
  {
    slug: "reading-codebases",
    group: "practice",
    glyph: "☍",
    i18n: {
      en: {
        title: "Reading Codebases",
        oneLiner: "How to navigate unfamiliar code quickly and correctly.",
      },
      es: {
        title: "Leer Bases de Código",
        oneLiner: "Cómo navegar código desconocido con rapidez y exactitud.",
      },
      ja: {
        title: "コードベースを読む",
        oneLiner: "未知のコードを素早く正確に読み解く方法。",
      },
      zh: {
        title: "阅读代码库",
        oneLiner: "如何快速且准确地浏览陌生代码。",
      },
    },
    lessons: [
      {
        slug: "linux-from-scratch",
        order: 1,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Linux From Scratch", oneLiner: "Read a kernel by building one. The foundational exercise behind the K-OS III distro." },
          es: { title: "Linux From Scratch", oneLiner: "Leer un kernel construyéndolo. El ejercicio fundacional detrás de la distro K-OS III." },
          ja: { title: "Linux From Scratch", oneLiner: "一つ組み立ててカーネルを読む。K-OS IIIディストロの背後にある基礎演習。" },
          zh: { title: "Linux From Scratch", oneLiner: "通过亲手构建来读懂内核。K-OS III 发行版背后的基础练习。" },
        },
      },
    ],
  },

  /* ---- LINEAGES ---- */

  {
    slug: "figures-cryptography",
    group: "lineages",
    glyph: "Ϟ",
    i18n: {
      en: {
        title: "Figures — Cryptography",
        oneLiner: "The people who built the tools — named, pseudonymous, and mythic.",
      },
      es: {
        title: "Figuras — Criptografía",
        oneLiner: "Las personas que construyeron las herramientas — nombradas, seudónimas y míticas.",
      },
      ja: {
        title: "人物 — 暗号学",
        oneLiner: "道具を作った人々 — 実名、仮名、そして神話的存在。",
      },
      zh: {
        title: "人物 —— 密码学",
        oneLiner: "打造这些工具的人 —— 实名的、化名的、神话化的。",
      },
    },
    lessons: [
      {
        slug: "satoshi-nakamoto",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Satoshi Nakamoto", oneLiner: "The pseudonymous author who appeared, delivered, and left." },
          es: { title: "Satoshi Nakamoto", oneLiner: "El autor seudónimo que apareció, entregó y se fue." },
          ja: { title: "サトシ・ナカモト", oneLiner: "現れ、仕事を成し、去った匿名の著者。" },
          zh: { title: "中本聪", oneLiner: "出现、交付、然后离去的化名作者。" },
        },
      },
      {
        slug: "terry-davis",
        order: 2,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Terry Davis", oneLiner: "TempleOS and the yurodivy lineage in the modern computing age." },
          es: { title: "Terry Davis", oneLiner: "TempleOS y el linaje yurodivy en la era de la computación moderna." },
          ja: { title: "テリー・デイヴィス", oneLiner: "TempleOSと、現代コンピューティングにおける聖愚者の系譜。" },
          zh: { title: "特里·戴维斯", oneLiner: "TempleOS 与现代计算时代中的圣愚传承。" },
        },
      },
      {
        slug: "linus-torvalds",
        order: 3,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Linus Torvalds", oneLiner: "The kernel, Git, and the synthesis K-OS III is built between." },
          es: { title: "Linus Torvalds", oneLiner: "El kernel, Git y la síntesis sobre la que K-OS III está construido." },
          ja: { title: "リーナス・トーバルズ", oneLiner: "カーネル、Git、そしてK-OS IIIが築かれる統合。" },
          zh: { title: "林纳斯·托瓦兹", oneLiner: "内核、Git，以及 K-OS III 所依凭的综合。" },
        },
      },
      {
        slug: "hal-finney",
        order: 4,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Hal Finney", oneLiner: "The first recipient of a Bitcoin transaction; cryonically preserved 2014." },
          es: { title: "Hal Finney", oneLiner: "El primer receptor de una transacción de Bitcoin; preservado criogénicamente en 2014." },
          ja: { title: "ハル・フィニー", oneLiner: "Bitcoin取引の最初の受信者。2014年に冷凍保存。" },
          zh: { title: "哈尔·芬尼", oneLiner: "第一笔 Bitcoin 交易的接收者；2014 年冷冻保存。" },
        },
      },
      {
        slug: "david-chaum",
        order: 5,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "David Chaum", oneLiner: "DigiCash, blind signatures, and the cryptographic prehistory of Bitcoin." },
          es: { title: "David Chaum", oneLiner: "DigiCash, firmas ciegas y la prehistoria criptográfica de Bitcoin." },
          ja: { title: "デイヴィッド・チャウム", oneLiner: "DigiCash、ブラインド署名、Bitcoinの暗号学的前史。" },
          zh: { title: "戴维·乔姆", oneLiner: "DigiCash、盲签名，以及 Bitcoin 的密码学前史。" },
        },
      },
      {
        slug: "nick-szabo",
        order: 6,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Nick Szabo", oneLiner: "Bit Gold, smart contracts, and the ongoing question." },
          es: { title: "Nick Szabo", oneLiner: "Bit Gold, contratos inteligentes y la pregunta persistente." },
          ja: { title: "ニック・サボ", oneLiner: "Bit Gold、スマートコントラクト、そして残された問い。" },
          zh: { title: "尼克·萨博", oneLiner: "Bit Gold、智能合约，以及那个未解的问题。" },
        },
      },
      {
        slug: "adam-back",
        order: 7,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Adam Back", oneLiner: "Hashcash and proof-of-work before Bitcoin." },
          es: { title: "Adam Back", oneLiner: "Hashcash y la prueba de trabajo antes de Bitcoin." },
          ja: { title: "アダム・バック", oneLiner: "Bitcoin以前のHashcashとプルーフ・オブ・ワーク。" },
          zh: { title: "亚当·贝克", oneLiner: "Bitcoin 之前的 Hashcash 与工作量证明。" },
        },
      },
      {
        slug: "wei-dai",
        order: 8,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Wei Dai", oneLiner: "b-money and the cypherpunk bridge to cryptocurrency." },
          es: { title: "Wei Dai", oneLiner: "b-money y el puente cypherpunk a la criptomoneda." },
          ja: { title: "ウェイ・ダイ", oneLiner: "b-moneyと、暗号通貨へのサイファーパンクの橋。" },
          zh: { title: "戴维", oneLiner: "b-money 与密码朋克通向加密货币的桥梁。" },
        },
      },
      {
        slug: "phil-zimmermann",
        order: 9,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Phil Zimmermann", oneLiner: "PGP, the munitions-list prosecution, and the fight for personal crypto." },
          es: { title: "Phil Zimmermann", oneLiner: "PGP, el proceso por la lista de municiones y la lucha por la criptografía personal." },
          ja: { title: "フィル・ジマーマン", oneLiner: "PGP、武器輸出規制の訴追、そして個人の暗号のための戦い。" },
          zh: { title: "菲尔·齐默曼", oneLiner: "PGP、军火清单诉讼，以及为个人密码学而战。" },
        },
      },
    ],
  },

  {
    slug: "figures-esoterica",
    group: "lineages",
    glyph: "☥",
    i18n: {
      en: {
        title: "Figures — Esoterica",
        oneLiner: "The sages, mystics, and seers whose findings challenge the materialist default.",
      },
      es: {
        title: "Figuras — Esoterismo",
        oneLiner: "Los sabios, místicos y videntes cuyos hallazgos desafían el predeterminado materialista.",
      },
      ja: {
        title: "人物 — 秘教",
        oneLiner: "その発見が物質主義的な既定を揺るがす、賢者、神秘家、予言者たち。",
      },
      zh: {
        title: "人物 —— 秘传",
        oneLiner: "其发现挑战物质主义默认立场的贤者、神秘家与先知。",
      },
    },
    lessons: [
      {
        slug: "edgar-cayce",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Edgar Cayce", oneLiner: "The sleeping prophet and the 14,000 readings." },
          es: { title: "Edgar Cayce", oneLiner: "El profeta dormido y las 14.000 lecturas." },
          ja: { title: "エドガー・ケイシー", oneLiner: "眠れる預言者と一万四千のリーディング。" },
          zh: { title: "爱德加·凯西", oneLiner: "沉睡的先知与一万四千次解读。" },
        },
      },
      {
        slug: "saint-germain",
        order: 2,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "The Comte de Saint Germain", oneLiner: "The 18th-century alchemist who would not die." },
          es: { title: "El Conde de Saint Germain", oneLiner: "El alquimista del siglo XVIII que no quiso morir." },
          ja: { title: "サン・ジェルマン伯爵", oneLiner: "死を拒んだ十八世紀の錬金術師。" },
          zh: { title: "圣日耳曼伯爵", oneLiner: "不肯死去的十八世纪炼金术士。" },
        },
      },
      {
        slug: "walter-russell",
        order: 3,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Walter Russell", oneLiner: "The cosmogony of the polymath — light, rhythm, and the one substance." },
          es: { title: "Walter Russell", oneLiner: "La cosmogonía del polímata — luz, ritmo y la única sustancia." },
          ja: { title: "ウォルター・ラッセル", oneLiner: "博学者の宇宙生成論 — 光、リズム、一なる実体。" },
          zh: { title: "沃尔特·拉塞尔", oneLiner: "博学者的宇宙生成论 —— 光、韵律与唯一实体。" },
        },
      },
      {
        slug: "patrick-flanagan",
        order: 4,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Patrick Flanagan", oneLiner: "The Neurophone, the pyramid research, and a boy Pentagon consultant." },
          es: { title: "Patrick Flanagan", oneLiner: "El Neurófono, la investigación piramidal y un consultor del Pentágono siendo niño." },
          ja: { title: "パトリック・フラナガン", oneLiner: "ニューロフォン、ピラミッド研究、そして少年時代のペンタゴン顧問。" },
          zh: { title: "帕特里克·弗拉纳根", oneLiner: "Neurophone、金字塔研究，以及儿时就任五角大楼顾问。" },
        },
      },
      {
        slug: "robert-monroe",
        order: 5,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Robert A. Monroe", oneLiner: "Hemi-Sync, out-of-body travel, and the Monroe Institute." },
          es: { title: "Robert A. Monroe", oneLiner: "Hemi-Sync, viaje fuera del cuerpo y el Instituto Monroe." },
          ja: { title: "ロバート・A・モンロー", oneLiner: "ヘミシンク、体外離脱、モンロー研究所。" },
          zh: { title: "罗伯特·A·门罗", oneLiner: "Hemi-Sync、出体旅行与门罗研究所。" },
        },
      },
      {
        slug: "george-van-tassel",
        order: 6,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "George Van Tassel", oneLiner: "Giant Rock, the Integratron, and the Ashtar Command current." },
          es: { title: "George Van Tassel", oneLiner: "Giant Rock, el Integratron y la corriente del Comando Ashtar." },
          ja: { title: "ジョージ・ヴァン・タッセル", oneLiner: "ジャイアント・ロック、インテグラトロン、アシュタール・コマンドの潮流。" },
          zh: { title: "乔治·范塔塞尔", oneLiner: "巨石、整合机与阿什塔指挥部潮流。" },
        },
      },
    ],
  },

  {
    slug: "figures-privacy",
    group: "lineages",
    glyph: "◉",
    i18n: {
      en: {
        title: "Figures — Privacy",
        oneLiner: "Carriers of the civil-liberties argument whose cases tested it in public.",
      },
      es: {
        title: "Figuras — Privacidad",
        oneLiner: "Portadores del argumento de las libertades civiles cuyos casos lo pusieron a prueba en público.",
      },
      ja: {
        title: "人物 — プライバシー",
        oneLiner: "市民的自由の議論を公の場で試した担い手たち。",
      },
      zh: {
        title: "人物 —— 隐私",
        oneLiner: "公民自由论的承载者 —— 他们的案子在公众视野中检验了这一论证。",
      },
    },
    lessons: [
      {
        slug: "john-mcafee",
        order: 1,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "John McAfee", oneLiner: "Antivirus, Belize, the Libertarian runs, and a death in a Spanish cell." },
          es: { title: "John McAfee", oneLiner: "Antivirus, Belice, las campañas libertarias y una muerte en una celda española." },
          ja: { title: "ジョン・マカフィー", oneLiner: "アンチウイルス、ベリーズ、リバタリアンの選挙戦、スペインの独房での死。" },
          zh: { title: "约翰·迈克菲", oneLiner: "杀毒软件、伯利兹、自由党参选，以及西班牙牢房中的死亡。" },
        },
      },
      {
        slug: "kim-dotcom",
        order: 2,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Kim Dotcom", oneLiner: "Megaupload, the Coatesville raid, and a decade of extradition." },
          es: { title: "Kim Dotcom", oneLiner: "Megaupload, la redada en Coatesville y una década de extradición." },
          ja: { title: "キム・ドットコム", oneLiner: "Megaupload、コーツヴィルの強制捜査、そして十年に及ぶ引き渡し闘争。" },
          zh: { title: "金·多特康", oneLiner: "Megaupload、科茨维尔突袭，以及长达十年的引渡。" },
        },
      },
    ],
  },

  {
    slug: "figures-hidden-history",
    group: "lineages",
    glyph: "☾",
    i18n: {
      en: {
        title: "Figures — Hidden History",
        oneLiner: "Explorers, dissidents, and witnesses whose testimony the record has been reluctant to accept.",
      },
      es: {
        title: "Figuras — Historia Oculta",
        oneLiner: "Exploradores, disidentes y testigos cuyo testimonio el registro ha tardado en aceptar.",
      },
      ja: {
        title: "人物 — 隠された歴史",
        oneLiner: "その証言を記録が受け入れがたかった、探検家、異論者、目撃者たち。",
      },
      zh: {
        title: "人物 —— 被隐去的历史",
        oneLiner: "其证词官方记录迟迟不愿接纳的探险者、异见者、见证者。",
      },
    },
    lessons: [
      {
        slug: "richard-byrd",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Admiral Richard E. Byrd", oneLiner: "Polar explorer, Operation Highjump, and the diary question." },
          es: { title: "Almirante Richard E. Byrd", oneLiner: "Explorador polar, Operación Highjump y la cuestión del diario." },
          ja: { title: "リチャード・E・バード提督", oneLiner: "極地探検家、ハイジャンプ作戦、そして日記の問い。" },
          zh: { title: "理查德·E·伯德上将", oneLiner: "极地探险家、跳高行动，以及那部日记留下的问题。" },
        },
      },
      {
        slug: "robert-sepehr",
        order: 2,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Robert Sepehr", oneLiner: "Contemporary anthropologist working outside academic consensus." },
          es: { title: "Robert Sepehr", oneLiner: "Antropólogo contemporáneo que trabaja fuera del consenso académico." },
          ja: { title: "ロバート・セペール", oneLiner: "学界のコンセンサスの外で働く現代の人類学者。" },
          zh: { title: "罗伯特·塞佩", oneLiner: "在学界共识之外工作的当代人类学家。" },
        },
      },
      {
        slug: "robert-david-steele",
        order: 3,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Robert David Steele", oneLiner: "Former CIA case officer, open-source intelligence, late-career dissent." },
          es: { title: "Robert David Steele", oneLiner: "Ex oficial de caso de la CIA, inteligencia de fuentes abiertas, disidencia tardía." },
          ja: { title: "ロバート・デイヴィッド・スティール", oneLiner: "元CIAケースオフィサー、オープンソースインテリジェンス、晩年の異議申し立て。" },
          zh: { title: "罗伯特·大卫·斯蒂尔", oneLiner: "前 CIA 案件官、开源情报、晚年的异见。" },
        },
      },
      {
        slug: "leo-frank",
        order: 4,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Leo Frank, Mary Phagan, and the ADL (1913–1915)", oneLiner: "Atlanta, Marietta, Stone Mountain, and Chicago — a three-year compressed chronology." },
          es: { title: "Leo Frank, Mary Phagan y la ADL (1913–1915)", oneLiner: "Atlanta, Marietta, Stone Mountain y Chicago — una cronología comprimida de tres años." },
          ja: { title: "レオ・フランク、メアリー・フェイガン、ADL（1913–1915）", oneLiner: "アトランタ、マリエッタ、ストーン・マウンテン、シカゴ — 三年間に圧縮された年表。" },
          zh: { title: "利奥·弗兰克、玛丽·费根与 ADL（1913–1915）", oneLiner: "亚特兰大、玛丽埃塔、石山与芝加哥 —— 压缩在三年内的年表。" },
        },
      },
      {
        slug: "john-mcafee",
        order: 5,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "John McAfee", oneLiner: "Antivirus founder, fugitive, crypto promoter, Spanish cell." },
          es: { title: "John McAfee", oneLiner: "Fundador del antivirus, fugitivo, promotor de cripto, celda española." },
          ja: { title: "ジョン・マカフィー", oneLiner: "アンチウイルスの創設者、逃亡者、暗号プロモーター、スペインの独房。" },
          zh: { title: "约翰·迈克菲", oneLiner: "杀毒软件创始人、逃犯、加密货币推广者、西班牙监狱牢房。" },
        },
      },
      {
        slug: "kim-dotcom",
        order: 6,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Kim Dotcom", oneLiner: "Megaupload, the 2012 raid, and a twelve-year extradition case." },
          es: { title: "Kim Dotcom", oneLiner: "Megaupload, la redada de 2012 y un caso de extradición de doce años." },
          ja: { title: "キム・ドットコム", oneLiner: "Megaupload、2012年の強制捜査、そして十二年間に及ぶ引き渡し事件。" },
          zh: { title: "金·达康", oneLiner: "Megaupload、2012 年的突袭，以及长达十二年的引渡案。" },
        },
      },
    ],
  },

  {
    slug: "lineage-christianity",
    group: "lineages",
    glyph: "☦",
    i18n: {
      en: {
        title: "Lineage — Christianity",
        oneLiner: "Apostolic succession, Orthodoxy, and academic Christian apologetics as one continuous tradition.",
      },
      es: {
        title: "Linaje — Cristianismo",
        oneLiner: "La sucesión apostólica, la Ortodoxia y la apologética cristiana académica como una tradición continua.",
      },
      ja: {
        title: "系譜 — キリスト教",
        oneLiner: "使徒継承、正教会、学問的キリスト教護教論を一つの連続した伝統として。",
      },
      zh: {
        title: "传承 —— 基督教",
        oneLiner: "使徒统绪、正教，以及学术基督教护教学，作为一条连续的传统。",
      },
    },
    lessons: [
      {
        slug: "apostolic-succession",
        order: 1,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Apostolic Succession", oneLiner: "The unbroken chain of hands, read as living theology." },
          es: { title: "Sucesión Apostólica", oneLiner: "La cadena ininterrumpida de manos, leída como teología viva." },
          ja: { title: "使徒継承", oneLiner: "途切れぬ按手の鎖 — 生ける神学として読む。" },
          zh: { title: "使徒统绪", oneLiner: "不断的按手之链 —— 作为活的神学来阅读。" },
        },
      },
      {
        slug: "the-rosary",
        order: 2,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "The Rosary", oneLiner: "A five-century-old contemplative method, taught from the beads outward." },
          es: { title: "El Rosario", oneLiner: "Un método contemplativo de cinco siglos, enseñado desde las cuentas hacia afuera." },
          ja: { title: "ロザリオ", oneLiner: "五世紀にわたる観想の方法 — 数珠から内へと教わる。" },
          zh: { title: "玫瑰经", oneLiner: "传承五个世纪的默观方法 —— 从念珠开始一层一层教起。" },
        },
      },
      {
        slug: "orthodox-tradition",
        order: 3,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "The Orthodox Tradition", oneLiner: "Eastern Christianity as the oldest continuous theological lineage." },
          es: { title: "La Tradición Ortodoxa", oneLiner: "El cristianismo oriental como el linaje teológico continuo más antiguo." },
          ja: { title: "正教の伝統", oneLiner: "最古の連続した神学的系譜としての東方キリスト教。" },
          zh: { title: "正教传统", oneLiner: "作为最古老的连续神学传承的东方基督教。" },
        },
      },
      {
        slug: "academic-apologetics",
        order: 4,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Academic Christian Apologetics", oneLiner: "Plantinga, Craig, Wright, and the return of serious theism in the academy." },
          es: { title: "Apologética Cristiana Académica", oneLiner: "Plantinga, Craig, Wright y el retorno del teísmo serio a la academia." },
          ja: { title: "学問的キリスト教護教論", oneLiner: "プランティンガ、クレイグ、ライト、そして学界における真摯な有神論の復権。" },
          zh: { title: "学术基督教护教学", oneLiner: "普兰丁格、克雷格、赖特，以及严肃有神论在学界的回归。" },
        },
      },
      {
        slug: "early-church-fathers",
        order: 5,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "The Early Church Fathers", oneLiner: "Ignatius, Irenaeus, Athanasius, and the first three centuries." },
          es: { title: "Los Padres de la Iglesia Primitiva", oneLiner: "Ignacio, Ireneo, Atanasio y los tres primeros siglos." },
          ja: { title: "初期教父たち", oneLiner: "イグナティオス、エイレナイオス、アタナシオスと最初の三世紀。" },
          zh: { title: "早期教父", oneLiner: "伊格那丢、爱任纽、亚他那修，以及最初三个世纪。" },
        },
      },
    ],
  },

  {
    slug: "lineage-hackers",
    group: "lineages",
    glyph: "⌥",
    i18n: {
      en: {
        title: "Lineage — Hackers",
        oneLiner: "Open-source history as a tradition of people, not products.",
      },
      es: {
        title: "Linaje — Hackers",
        oneLiner: "La historia del código abierto como una tradición de personas, no de productos.",
      },
      ja: {
        title: "系譜 — ハッカーたち",
        oneLiner: "製品ではなく人の伝統としてのオープンソースの歴史。",
      },
      zh: {
        title: "传承 —— 黑客",
        oneLiner: "开源的历史 —— 人的传统，而非产品的。",
      },
    },
    lessons: [
      {
        slug: "mit-ai-lab",
        order: 1,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "The MIT AI Lab", oneLiner: "Before Stallman left — Hacker culture at Tech Square." },
          es: { title: "El Laboratorio de IA del MIT", oneLiner: "Antes de que Stallman se fuera — la cultura hacker en Tech Square." },
          ja: { title: "MIT AI ラボ", oneLiner: "ストールマンが去る前 — テック・スクエアのハッカー文化。" },
          zh: { title: "MIT 人工智能实验室", oneLiner: "在斯托曼离开之前 —— 科技广场的黑客文化。" },
        },
      },
      {
        slug: "cypherpunks",
        order: 2,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "The Cypherpunks", oneLiner: "The mailing list that produced Bitcoin — and much else." },
          es: { title: "Los Cypherpunks", oneLiner: "La lista de correo que produjo Bitcoin — y mucho más." },
          ja: { title: "サイファーパンクス", oneLiner: "Bitcoinを、そして多くを生み出したメーリングリスト。" },
          zh: { title: "密码朋克", oneLiner: "孕育出 Bitcoin 以及诸多事物的邮件列表。" },
        },
      },
      {
        slug: "free-software-movement",
        order: 3,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "The Free Software Movement", oneLiner: "Stallman, GNU, and the copyleft reversal." },
          es: { title: "El Movimiento del Software Libre", oneLiner: "Stallman, GNU y la inversión del copyleft." },
          ja: { title: "フリーソフトウェア運動", oneLiner: "ストールマン、GNU、コピーレフトの反転。" },
          zh: { title: "自由软件运动", oneLiner: "斯托曼、GNU，以及 copyleft 的反转。" },
        },
      },
      {
        slug: "homebrew-era",
        order: 4,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "The Homebrew Era", oneLiner: "Personal computing as a countercultural act." },
          es: { title: "La Era Homebrew", oneLiner: "La computación personal como acto contracultural." },
          ja: { title: "ホームブリュー時代", oneLiner: "反文化的行為としてのパーソナルコンピューティング。" },
          zh: { title: "自酿时代", oneLiner: "作为反文化行为的个人计算。" },
        },
      },
    ],
  },

  {
    slug: "lineage-cognition",
    group: "lineages",
    glyph: "◈",
    i18n: {
      en: {
        title: "Lineage — Cognition",
        oneLiner: "State-sponsored mind-control programs, consciousness research, and the war over inner space.",
      },
      es: {
        title: "Linaje — Cognición",
        oneLiner: "Programas estatales de control mental, investigación sobre la conciencia y la guerra por el espacio interior.",
      },
      ja: {
        title: "系譜 — 認知",
        oneLiner: "国家によるマインドコントロール計画、意識の研究、そして内的空間を巡る戦争。",
      },
      zh: {
        title: "传承 —— 认知",
        oneLiner: "国家主导的意识控制计划、意识研究，以及围绕内在空间的战争。",
      },
    },
    lessons: [
      {
        slug: "mkultra",
        order: 1,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Project MKULTRA", oneLiner: "The CIA's twenty-year behavioral-modification program, declassified." },
          es: { title: "Proyecto MKULTRA", oneLiner: "Los veinte años de programa de modificación conductual de la CIA, desclasificados." },
          ja: { title: "MKULTRA計画", oneLiner: "二十年にわたるCIAの行動改変計画、機密解除版。" },
          zh: { title: "MKULTRA 计划", oneLiner: "中情局长达二十年的行为改造计划，已解密。" },
        },
      },
      {
        slug: "operation-paperclip",
        order: 2,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Operation Paperclip", oneLiner: "The Nazi scientists quietly imported into American research." },
          es: { title: "Operación Paperclip", oneLiner: "Los científicos nazis importados silenciosamente a la investigación estadounidense." },
          ja: { title: "ペーパークリップ作戦", oneLiner: "アメリカの研究に静かに輸入されたナチスの科学者たち。" },
          zh: { title: "回形针行动", oneLiner: "被悄然引入美国研究体系的纳粹科学家。" },
        },
      },
      {
        slug: "monroe-institute",
        order: 3,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "The Monroe Institute", oneLiner: "Private consciousness research in the lineage of Hemi-Sync." },
          es: { title: "El Instituto Monroe", oneLiner: "Investigación privada de la conciencia en el linaje de Hemi-Sync." },
          ja: { title: "モンロー研究所", oneLiner: "ヘミシンクの系譜にある意識の私的研究。" },
          zh: { title: "门罗研究所", oneLiner: "Hemi-Sync 传承下的私立意识研究。" },
        },
      },
      {
        slug: "project-stargate",
        order: 4,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Project Stargate", oneLiner: "Remote viewing at Stanford Research Institute and Fort Meade." },
          es: { title: "Proyecto Stargate", oneLiner: "Visión remota en el Stanford Research Institute y Fort Meade." },
          ja: { title: "スターゲイト計画", oneLiner: "SRIとフォート・ミードにおける遠隔透視。" },
          zh: { title: "星际之门计划", oneLiner: "斯坦福研究所与米德堡的遥视。" },
        },
      },
    ],
  },

  {
    slug: "lineage-cosmology",
    group: "lineages",
    glyph: "✦",
    i18n: {
      en: {
        title: "Lineage — Cosmology",
        oneLiner: "Sacred cosmologies and alternative accounts of the earth's shape, history, and place.",
      },
      es: {
        title: "Linaje — Cosmología",
        oneLiner: "Cosmologías sagradas y relatos alternativos sobre la forma, la historia y el lugar de la tierra.",
      },
      ja: {
        title: "系譜 — 宇宙論",
        oneLiner: "聖なる宇宙論と、地球の形・歴史・位置に関する別の説明。",
      },
      zh: {
        title: "传承 —— 宇宙论",
        oneLiner: "神圣宇宙论，以及关于大地形状、历史与位置的另类叙述。",
      },
    },
    lessons: [
      {
        slug: "the-firmament",
        order: 1,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "The Firmament", oneLiner: "The sacred cosmos of Genesis, Enoch, and the Church Fathers." },
          es: { title: "El Firmamento", oneLiner: "El cosmos sagrado del Génesis, Enoc y los Padres de la Iglesia." },
          ja: { title: "蒼穹", oneLiner: "創世記、エノク書、教父たちの聖なる宇宙。" },
          zh: { title: "苍穹", oneLiner: "《创世记》、《以诺书》、教父们的神圣宇宙。" },
        },
      },
      {
        slug: "atlantis",
        order: 2,
        level: "beginner",
        status: "written",
        i18n: {
          en: { title: "Atlantis", oneLiner: "From Plato through Theosophy to Cayce — one continuous transmission." },
          es: { title: "Atlántida", oneLiner: "De Platón a la Teosofía y a Cayce — una transmisión continua." },
          ja: { title: "アトランティス", oneLiner: "プラトンから神智学、ケイシーへと続く一つの連続した伝承。" },
          zh: { title: "亚特兰蒂斯", oneLiner: "从柏拉图，经神智学，到凯西 —— 一条连续的传承。" },
        },
      },
      {
        slug: "hyperborea",
        order: 3,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Hyperborea", oneLiner: "The polar civilization in Greek memory and esoteric tradition." },
          es: { title: "Hiperbórea", oneLiner: "La civilización polar en la memoria griega y la tradición esotérica." },
          ja: { title: "ヒュペルボレア", oneLiner: "ギリシャの記憶と秘教伝統における極地文明。" },
          zh: { title: "极北乐土", oneLiner: "希腊记忆与秘传传统中的极地文明。" },
        },
      },
      {
        slug: "hollow-earth",
        order: 4,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "Hollow Earth", oneLiner: "Halley, Symmes, Agartha, and the inward cosmos." },
          es: { title: "Tierra Hueca", oneLiner: "Halley, Symmes, Agartha y el cosmos interior." },
          ja: { title: "空洞地球", oneLiner: "ハリー、シムズ、アガルタ、そして内なる宇宙。" },
          zh: { title: "空心地球", oneLiner: "哈雷、西姆斯、阿加尔塔，以及向内的宇宙。" },
        },
      },
      {
        slug: "lost-history-of-the-earth",
        order: 5,
        level: "intermediate",
        status: "written",
        i18n: {
          en: { title: "The Lost History of the Earth", oneLiner: "Cyclical civilizations, catastrophe, and the memory that predates written record." },
          es: { title: "La Historia Perdida de la Tierra", oneLiner: "Civilizaciones cíclicas, catástrofes y la memoria anterior al registro escrito." },
          ja: { title: "地球の失われた歴史", oneLiner: "循環する文明、大災害、文字記録に先立つ記憶。" },
          zh: { title: "大地被遗失的历史", oneLiner: "循环的文明、浩劫，以及先于文字记录的记忆。" },
        },
      },
    ],
  },
];

export const TRACKS_BY_SLUG: Record<string, TrackMeta> = Object.fromEntries(
  TRACKS.map((t) => [t.slug, t]),
);

export function tracksInGroup(g: TrackGroup): TrackMeta[] {
  return TRACKS.filter((t) => t.group === g);
}

export function getLesson(trackSlug: string, lessonSlug: string): LessonMeta | null {
  const t = TRACKS_BY_SLUG[trackSlug];
  if (!t) return null;
  return t.lessons.find((l) => l.slug === lessonSlug) ?? null;
}

export function allLessonPaths(): { track: string; lesson: string }[] {
  return TRACKS.flatMap((t) =>
    t.lessons.map((l) => ({ track: t.slug, lesson: l.slug })),
  );
}

export function isLang(value: string | undefined): value is Lang {
  return value !== undefined && (LANGUAGES as readonly string[]).includes(value);
}

export const DEFAULT_LANG: Lang = "en";

export function totalLessonCount(): number {
  return TRACKS.reduce((acc, t) => acc + t.lessons.length, 0);
}

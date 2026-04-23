/*
 *                    ☦
 *      K-OS MANUAL — ARTICLE REGISTRY (i18n)
 *
 *  Article bodies live at src/lib/doc/articles/<lang>/<slug>.tsx.
 *  This registry holds the slug → metadata map plus per-language UI strings.
 *
 *  Adding a language: extend LANGUAGES, drop new entries in LANG_LABELS /
 *  CATEGORY_* / UI_STRINGS / each ArticleMeta.i18n, and create the article
 *  files under articles/<newlang>/. Routes pre-render automatically via
 *  generateStaticParams in src/app/doc/lang/[lang]/[slug]/page.tsx.
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

export type ArticleCategory =
  | "foundations"
  | "datamoshpit"
  | "visuals"
  | "deeper"
  | "reference";

export interface I18nText {
  title: string;
  oneLiner: string;
}

export interface ArticleMeta {
  slug: string;
  category: ArticleCategory;
  level: "beginner" | "intermediate" | "advanced";
  i18n: Record<Lang, I18nText>;
  seeAlso?: string[];
}

export const CATEGORY_LABELS: Record<Lang, Record<ArticleCategory, string>> = {
  en: {
    foundations: "FOUNDATIONS",
    datamoshpit: "DATAMOSHPIT",
    visuals: "VISUALS",
    deeper: "GOING DEEPER",
    reference: "REFERENCE",
  },
  es: {
    foundations: "FUNDAMENTOS",
    datamoshpit: "DATAMOSHPIT",
    visuals: "VISUALES",
    deeper: "EN PROFUNDIDAD",
    reference: "REFERENCIA",
  },
  ja: {
    foundations: "基礎",
    datamoshpit: "DATAMOSHPIT",
    visuals: "ビジュアル",
    deeper: "より深く",
    reference: "リファレンス",
  },
  zh: {
    foundations: "基础",
    datamoshpit: "DATAMOSHPIT",
    visuals: "视觉",
    deeper: "进阶",
    reference: "参考",
  },
};

export const CATEGORY_DESCRIPTIONS: Record<Lang, Record<ArticleCategory, string>> = {
  en: {
    foundations: "Start here. Beginner-friendly. Zero assumed knowledge.",
    datamoshpit: "The tracker — making sounds and arrangements.",
    visuals: "The Scene VM — making things visible.",
    deeper: "Advanced articles referenced from earlier sections.",
    reference: "Lookup tables, file formats, and project culture.",
  },
  es: {
    foundations: "Empieza aquí. Para principiantes. Sin conocimientos previos.",
    datamoshpit: "El tracker — creando sonidos y arreglos.",
    visuals: "El Scene VM — haciendo las cosas visibles.",
    deeper: "Artículos avanzados referenciados desde secciones previas.",
    reference: "Tablas de referencia, formatos de archivo y cultura del proyecto.",
  },
  ja: {
    foundations: "ここから始めよう。初心者向け。前提知識ゼロ。",
    datamoshpit: "トラッカー — 音とアレンジメントを作る。",
    visuals: "Scene VM — 物事を見えるようにする。",
    deeper: "前のセクションから参照される上級記事。",
    reference: "ルックアップテーブル、ファイル形式、プロジェクト文化。",
  },
  zh: {
    foundations: "从这里开始。适合初学者。零基础。",
    datamoshpit: "音轨编辑器 — 制作声音和编排。",
    visuals: "Scene VM — 让事物可见。",
    deeper: "由前面章节引用的进阶文章。",
    reference: "查找表、文件格式和项目文化。",
  },
};

export const UI_STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    indexTitle: "K-OS Manual",
    indexBlurb:
      "A small, opinionated encyclopedia for K-OS III. Beginner-friendly intros link to deeper articles when you want to go further. Read whatever catches your eye, in any order.",
    seeAlso: "SEE ALSO",
    backToIndex: "INDEX",
    languageLabel: "LANG",
    levelBeginner: "BEGINNER",
    levelIntermediate: "INTERMEDIATE",
    levelAdvanced: "ADVANCED",
    notFound: "Article not found.",
    loading: "Loading…",
    versionLine: "VERSION 0.2.0-BETA.1 · {{count}} ARTICLES",
    epistemicNote:
      "On contested topics, this manual presents the debate rather than the verdict. See",
  },
  es: {
    indexTitle: "Manual de K-OS",
    indexBlurb:
      "Una pequeña enciclopedia opinada para K-OS III. Las introducciones para principiantes enlazan con artículos más profundos cuando quieras avanzar. Lee lo que te llame la atención, en cualquier orden.",
    seeAlso: "VER TAMBIÉN",
    backToIndex: "ÍNDICE",
    languageLabel: "IDIOMA",
    levelBeginner: "PRINCIPIANTE",
    levelIntermediate: "INTERMEDIO",
    levelAdvanced: "AVANZADO",
    notFound: "Artículo no encontrado.",
    loading: "Cargando…",
    versionLine: "VERSIÓN 0.2.0-BETA.1 · {{count}} ARTÍCULOS",
    epistemicNote:
      "En temas controvertidos, este manual presenta el debate en lugar del veredicto. Ver",
  },
  ja: {
    indexTitle: "K-OS マニュアル",
    indexBlurb:
      "K-OS III のための小さく主観的な百科事典。初心者向けの導入は、さらに学びたい人のために、より深い記事へリンクされています。どの順番でも、興味のあるものから読んでください。",
    seeAlso: "関連項目",
    backToIndex: "目次",
    languageLabel: "言語",
    levelBeginner: "初級",
    levelIntermediate: "中級",
    levelAdvanced: "上級",
    notFound: "記事が見つかりません。",
    loading: "読み込み中…",
    versionLine: "バージョン 0.2.0-BETA.1 · {{count}} 記事",
    epistemicNote:
      "議論のある話題について、このマニュアルは結論ではなく議論そのものを提示します。詳しくは",
  },
  zh: {
    indexTitle: "K-OS 手册",
    indexBlurb:
      "K-OS III 的一部小而有主见的百科全书。面向初学者的入门文章会链接到更深入的文章，供你想进一步了解时阅读。可以按任意顺序，从你感兴趣的部分开始读。",
    seeAlso: "另见",
    backToIndex: "目录",
    languageLabel: "语言",
    levelBeginner: "初级",
    levelIntermediate: "中级",
    levelAdvanced: "高级",
    notFound: "未找到文章。",
    loading: "加载中…",
    versionLine: "版本 0.2.0-BETA.1 · {{count}} 篇文章",
    epistemicNote:
      "对于有争议的话题，本手册呈现的是辩论本身而非定论。详见",
  },
};

export const ARTICLES: ArticleMeta[] = [
  {
    slug: "welcome",
    category: "foundations",
    level: "beginner",
    seeAlso: ["what-is-a-tracker", "the-rules"],
    i18n: {
      en: { title: "Welcome to K-OS", oneLiner: "What this whole thing is and where to start." },
      es: { title: "Bienvenido a K-OS", oneLiner: "Qué es todo esto y por dónde empezar." },
      ja: { title: "K-OSへようこそ", oneLiner: "K-OSとは何か、どこから始めるか。" },
      zh: { title: "欢迎来到 K-OS", oneLiner: "这一切是什么，以及从哪里开始。" },
    },
  },
  {
    slug: "what-is-a-tracker",
    category: "foundations",
    level: "beginner",
    seeAlso: ["song-chain-phrase", "hexadecimal"],
    i18n: {
      en: { title: "What Is a Tracker?", oneLiner: "A music program that uses a spreadsheet instead of a piano roll." },
      es: { title: "¿Qué es un Tracker?", oneLiner: "Un programa musical que usa una hoja de cálculo en lugar de un piano roll." },
      ja: { title: "トラッカーとは?", oneLiner: "ピアノロールの代わりにスプレッドシートを使う音楽プログラム。" },
      zh: { title: "什么是音轨编辑器?", oneLiner: "一种使用电子表格而非钢琴卷的音乐程序。" },
    },
  },
  {
    slug: "hexadecimal",
    category: "foundations",
    level: "beginner",
    seeAlso: ["slimentologika", "song-chain-phrase"],
    i18n: {
      en: { title: "Hexadecimal", oneLiner: "Counting in base 16 — and why trackers love it." },
      es: { title: "Hexadecimal", oneLiner: "Contar en base 16 — y por qué a los trackers les encanta." },
      ja: { title: "16進数", oneLiner: "16進数で数える — そしてなぜトラッカーがそれを好むのか。" },
      zh: { title: "十六进制", oneLiner: "用十六进制计数 — 以及为什么音轨编辑器钟爱它。" },
    },
  },
  {
    slug: "terminal-basics",
    category: "foundations",
    level: "beginner",
    seeAlso: ["running-k-os-locally"],
    i18n: {
      en: { title: "The Terminal", oneLiner: "What it is, how to open one, and why you'd want to." },
      es: { title: "La Terminal", oneLiner: "Qué es, cómo abrir una y por qué querrías hacerlo." },
      ja: { title: "ターミナル", oneLiner: "それは何か、どう開くか、なぜ使うのか。" },
      zh: { title: "终端", oneLiner: "终端是什么，如何打开，以及为什么要使用它。" },
    },
  },
  {
    slug: "running-k-os-locally",
    category: "foundations",
    level: "beginner",
    seeAlso: ["terminal-basics", "dmpit-format"],
    i18n: {
      en: { title: "Running K-OS Locally", oneLiner: "Cloning the repo, installing dependencies, starting the dev server." },
      es: { title: "Ejecutar K-OS Localmente", oneLiner: "Clonar el repositorio, instalar dependencias, iniciar el servidor de desarrollo." },
      ja: { title: "K-OSをローカルで実行", oneLiner: "リポジトリのクローン、依存関係のインストール、開発サーバーの起動。" },
      zh: { title: "在本地运行 K-OS", oneLiner: "克隆仓库、安装依赖、启动开发服务器。" },
    },
  },
  {
    slug: "song-chain-phrase",
    category: "datamoshpit",
    level: "intermediate",
    seeAlso: ["effect-commands", "hexadecimal", "scene-vm"],
    i18n: {
      en: { title: "Song → Chain → Phrase", oneLiner: "How a Datamoshpit composition is built up from layers." },
      es: { title: "Song → Chain → Phrase", oneLiner: "Cómo se construye una composición de Datamoshpit a partir de capas." },
      ja: { title: "Song → Chain → Phrase", oneLiner: "Datamoshpitの楽曲がどのように層から組み立てられるか。" },
      zh: { title: "Song → Chain → Phrase", oneLiner: "Datamoshpit 作品如何从各层构建而成。" },
    },
  },
  {
    slug: "effect-commands",
    category: "datamoshpit",
    level: "intermediate",
    seeAlso: ["song-chain-phrase", "hexadecimal"],
    i18n: {
      en: { title: "Effect Commands", oneLiner: "The two-letter codes that bend, slide, and chop your notes." },
      es: { title: "Comandos de Efecto", oneLiner: "Los códigos de dos letras que doblan, deslizan y cortan tus notas." },
      ja: { title: "エフェクトコマンド", oneLiner: "ノートを曲げ、スライドさせ、刻む2文字コード。" },
      zh: { title: "效果命令", oneLiner: "用两个字母的代码弯曲、滑音、切片你的音符。" },
    },
  },
  {
    slug: "slimentologika",
    category: "datamoshpit",
    level: "beginner",
    seeAlso: ["hexadecimal", "the-rules"],
    i18n: {
      en: { title: "Slimentologika", oneLiner: "The 16 pixel-glyphs that replace hex digits in K-OS." },
      es: { title: "Slimentologika", oneLiner: "Los 16 glifos pixelados que sustituyen a los dígitos hex en K-OS." },
      ja: { title: "Slimentologika", oneLiner: "K-OSで16進数の数字を置き換える16個のピクセルグリフ。" },
      zh: { title: "Slimentologika", oneLiner: "在 K-OS 中替代十六进制数字的 16 个像素字形。" },
    },
  },
  {
    slug: "per-instrument-visuals",
    category: "visuals",
    level: "intermediate",
    seeAlso: ["scene-vm", "song-chain-phrase"],
    i18n: {
      en: { title: "Per-Instrument Visuals", oneLiner: "Every instrument can carry a tiny visual scene that fires with its notes." },
      es: { title: "Visuales por Instrumento", oneLiner: "Cada instrumento puede llevar una pequeña escena visual que se dispara con sus notas." },
      ja: { title: "楽器ごとのビジュアル", oneLiner: "各楽器はノートと共に発火する小さなビジュアルシーンを持てる。" },
      zh: { title: "每乐器视觉效果", oneLiner: "每个乐器都可以携带一个小型视觉场景，与音符同时触发。" },
    },
  },
  {
    slug: "scene-vm",
    category: "visuals",
    level: "advanced",
    seeAlso: ["per-instrument-visuals", "song-chain-phrase"],
    i18n: {
      en: { title: "The Scene VM", oneLiner: "How visuals run in lockstep with audio under the hood." },
      es: { title: "El Scene VM", oneLiner: "Cómo los visuales se sincronizan con el audio bajo el capó." },
      ja: { title: "Scene VM", oneLiner: "ビジュアルが音と完全同期する仕組み。" },
      zh: { title: "Scene VM", oneLiner: "在底层视觉如何与音频同步运行。" },
    },
  },
  {
    slug: "dmpit-format",
    category: "reference",
    level: "advanced",
    seeAlso: ["song-chain-phrase", "running-k-os-locally"],
    i18n: {
      en: { title: "The .dmpit File Format", oneLiner: "What's inside a saved K-OS project, and why." },
      es: { title: "El Formato de Archivo .dmpit", oneLiner: "Qué hay dentro de un proyecto K-OS guardado, y por qué." },
      ja: { title: ".dmpitファイル形式", oneLiner: "保存されたK-OSプロジェクトの中身と、その理由。" },
      zh: { title: ".dmpit 文件格式", oneLiner: "保存的 K-OS 项目内部包含什么，以及为什么。" },
    },
  },
  {
    slug: "the-rules",
    category: "reference",
    level: "beginner",
    seeAlso: ["welcome", "slimentologika"],
    i18n: {
      en: { title: "The Rules", oneLiner: "Pixel-correct, no rounded corners, and what those mean for contributors." },
      es: { title: "Las Reglas", oneLiner: "Píxel-correcto, sin esquinas redondeadas, y qué significa todo eso para los contribuyentes." },
      ja: { title: "ルール", oneLiner: "ピクセル正確、角を丸めない、それらが貢献者にとって何を意味するか。" },
      zh: { title: "规则", oneLiner: "像素精准、不要圆角，以及这些对贡献者意味着什么。" },
    },
  },
  {
    slug: "glossary",
    category: "reference",
    level: "beginner",
    i18n: {
      en: { title: "Glossary", oneLiner: "A–Z of K-OS terms." },
      es: { title: "Glosario", oneLiner: "Términos de K-OS de la A a la Z." },
      ja: { title: "用語集", oneLiner: "K-OS用語のA-Z。" },
      zh: { title: "术语表", oneLiner: "K-OS 术语 A 到 Z。" },
    },
  },
];

export const ARTICLES_BY_SLUG: Record<string, ArticleMeta> = Object.fromEntries(
  ARTICLES.map((a) => [a.slug, a]),
);

export function articlesInCategory(cat: ArticleCategory): ArticleMeta[] {
  return ARTICLES.filter((a) => a.category === cat);
}

export function isLang(value: string | undefined): value is Lang {
  return value !== undefined && (LANGUAGES as readonly string[]).includes(value);
}

export const DEFAULT_LANG: Lang = "en";

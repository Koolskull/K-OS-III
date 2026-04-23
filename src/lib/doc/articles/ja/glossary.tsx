import { Lead, Code, Crossref } from "@/components/doc/elements";

export default function Glossary() {
  return (
    <>
      <Lead>
        K-OS固有の用語のクイックルックアップ。各概念が深く説明されている
        長い記事と相互参照されています。
      </Lead>

      <Term name="Asset Base">K-OSのバンドルアセットが住む絶対URL、ビルド時に <Code>NEXT_PUBLIC_ASSET_BASE</Code> 経由で設定可能。</Term>
      <Term name="Base Path">アプリが提供されるURLパスプレフィックス、例：<Code>koolskull.github.io/k-os</Code> の <Code>/k-os</Code>。</Term>
      <Term name="Beta">現在のリリース段階（<Code>0.2.0-beta.1</Code>）。動作する、ビルド可能、しかし粗い。</Term>
      <Term name="BPM">Beats per minute — 曲のテンポ。F7プロジェクト画面で設定、<Code>T</Code> エフェクトコマンドで曲途中に変更可能。</Term>
      <Term name="Chain">最大16のphrase IDが順番に再生されるシーケンス、オプションのステップごとtransposeあり。<Crossref to="song-chain-phrase" /> 参照。</Term>
      <Term name="Channel">8つのオーディオ出力チャンネルの1つ。各チャンネルは任意の時点で1つのchainを再生。</Term>
      <Term name="CMD1 / CMD2">phrase行の2つのエフェクトコマンド列。<Crossref to="effect-commands" /> 参照。</Term>
      <Term name="Datamoshpit">K-OSの主力アプリ — 音楽トラッカー。Song / Chain / Phraseエディタ、楽器編集、サンプルローディング、ライブパッド、Scene VMを含む。</Term>
      <Term name=".dmpit">K-OSプロジェクトファイル拡張子。<Code>project.json</Code> とバイナリサンプルを含むZIP。<Crossref to="dmpit-format" /> 参照。</Term>
      <Term name="FM Synthesis">周波数変調合成。K-OSの主要シンセエンジン、Sega Genesis / Mega DriveのYamaha YM2612をモデル。</Term>
      <Term name="Hex / Hexadecimal">16進数システム。K-OSではIDとエフェクト値に至る所で使用。<Crossref to="hexadecimal" /> 参照。</Term>
      <Term name="Instrument">音源 + オプションのvisual。K-OSはプロジェクトごとに256楽器をサポート。</Term>
      <Term name="Keyframe">変換値が明示的に設定されるvisualタイムライン上のポイント。<Crossref to="scene-vm" /> 参照。</Term>
      <Term name="KoolDraw">K-OSのピクセルアートスプライトエディタ。デスクトップのスタンドアロンアプリ；F4楽器visualエディタからスプライト作成サーフェスとして埋め込み可能。</Term>
      <Term name="LGPT">LittleGPTracker。K-OSの入力モデルが基づくPSP時代のトラッカー。</Term>
      <Term name="Live Mode">chainが進行する代わりに現在のsong行でループする再生モード。</Term>
      <Term name="Macro">ユーザー割り当て可能な楽器のノブ/スライダー、1つ以上の合成パラメータにマップ。</Term>
      <Term name="MIDI">Musical Instrument Digital Interface。K-OSはWeb MIDI API経由でMIDI入力をサポート。</Term>
      <Term name="Phrase">最小の再利用可能音楽単位 — 通常16行のノート、楽器、エフェクトデータ。<Crossref to="song-chain-phrase" /> 参照。</Term>
      <Term name="PicoTracker">RP2040ベースのハードウェアトラッカー、LGPTの精神的後継。</Term>
      <Term name="Quick-Fill">K-OSは空のchainステップとsongセルを最後に触れたphraseまたはchain IDで事前入力。LGPTの <Code>lastPhrase_</Code> トリック。</Term>
      <Term name="Scene VM">Visual Moduleランタイム — オーディオと同期で発火するvisualのためのK-OSのメカニズム。<Crossref to="scene-vm" /> 参照。</Term>
      <Term name="Slimentologika">トラッカーUIで16進数字を置き換えるK-OSのカスタム16グリフアルファベット。<Code>Tab</Code> で切り替え。<Crossref to="slimentologika" /> 参照。</Term>
      <Term name="Song">トップレベルのアレンジメント — 行 × 8チャンネル、各セルがchain IDを保持。<Crossref to="song-chain-phrase" /> 参照。</Term>
      <Term name="Song Mode">デフォルトの再生モード。chainは埋まったステップを通過してchain内でループ；chainが16ステップすべて埋まった時にsong行が進む。</Term>
      <Term name="Static Export">Next.jsが任意のWebホストで提供できる静的な <Code>out/</Code> フォルダを生成するビルドモード。</Term>
      <Term name="Table">tickごとのエフェクトの16行ループサブルーチン。詳細な音作りのために楽器にバインド。</Term>
      <Term name="Tick">トラッカーで最小の時間単位。1 tick = 60 / (BPM × TPB) 秒。</Term>
      <Term name="TPB">Ticks Per Beat。1ビート内のtick数。デフォルト6。</Term>
      <Term name="Tracker">ピアノロールではなく垂直なテキストスプレッドシートを使う音楽ソフトのクラス。<Crossref to="what-is-a-tracker" /> 参照。</Term>
      <Term name="Transpose">phraseの各ノートに適用される半音オフセット、chainでステップごとに設定。</Term>
      <Term name="Turbopack">Next.jsの増分バンドラー、K-OSの <Code>npm run dev</Code> と <Code>npm run build</Code> で使用。</Term>
      <Term name="VAL1 / VAL2">phrase行の2つのエフェクト値列。それぞれの2hex桁、それぞれのCMD列とペア。</Term>
      <Term name="VMI">Visual Machine Interface — K-OSがボタン状態とアニメーションUI要素に使う階層化PNGシーケンス規約。</Term>
      <Term name="WASM">WebAssembly — ブラウザで実行されるバイナリ形式。</Term>
      <Term name="YM2612">Sega Genesisの4オペレータFM合成チップ、Yamaha製。K-OSのFMシンセボイスのモデル。</Term>
    </>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #222" }}>
      <div style={{ fontFamily: "var(--dm-font-primary), monospace", fontSize: 13, letterSpacing: 1, color: "#ffff00", marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "#dddddd" }}>{children}</div>
    </div>
  );
}

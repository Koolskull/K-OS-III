import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref, Hex } from "@/components/doc/elements";

export default function SongChainPhrase() {
  return (
    <>
      <Lead>
        Datamoshpitの曲は3つの入れ子になったレイヤーから構築されます —
        <Strong>phrase</Strong>が<Strong>chain</Strong>に入れ子になり、chainが
        <Strong>song</Strong>に入れ子になります。各レイヤーは2桁hex IDで識別されます。
        どのように相互参照するかを理解すれば、トラッカー全体がアルファベットスープに
        見えなくなり、小さく密度の高い音楽言語に見え始めます。
      </Lead>

      <H2>3つのレイヤーを平易な言葉で</H2>
      <UList>
        <Li>
          <Strong>phrase</Strong>は小さなパターン — 通常16行のノート、楽器、エフェクト。
          最小の再利用可能な音楽単位。
        </Li>
        <Li>
          <Strong>chain</Strong>は順番に再生される最大16のphrase ID。時にはステップごとの
          トランスポーズオフセット付き。「Verse A」のようなもの。
        </Li>
        <Li>
          <Strong>song</Strong>はグリッド: 行 × 8チャンネル。各セルはchain IDを保持します。
          songの行は何がどのチャンネルでどの時間に再生されるかを決定します。
        </Li>
      </UList>
      <CodeBlock label="階層、絵で">
{`SONG  (アレンジメント; 多くの行 × 8チャンネル)
   │
   └── 各セルは02のようなCHAIN idを保持
       │
       └── そのchainは最大16ステップを持ち、
           それぞれが0AのようなPHRASE idを指す
           │
           └── そのphraseはノート/楽器/エフェクトデータの
               16行を持つ`}
      </CodeBlock>

      <H2>なぜ間接参照？</H2>
      <P>
        一見複雑に見えます — なぜ単に1つの大きなタイムラインを書かないのでしょうか？
        答えは再利用です。ドラムパターンは通常繰り返されます。キックパターンが
        phrase <Hex value={0} /> なら、songのすべてのドラムchainのstep 0として
        phrase <Hex value={0} /> を入れることができます。phrase <Hex value={0} /> を
        1回編集すれば、それを使うすべての場所が変わります。
      </P>
      <P>
        次のレベルでも同じアイデア。「verse drums」のようなchainは、複数のsong行で
        chain IDとして現れることができます。パターンを書き直さずにsongを再構成できます。
      </P>

      <H2>IDは0〜FF (0〜255)</H2>
      <P>
        各chainと各phraseには、<Hex value={0} link={false} /> から{" "}
        <Hex value={0xff} link={false} /> までのユニークな{" "}
        <Crossref to="hexadecimal">hex</Crossref> IDがあります。これでプロジェクトごとに
        256のphraseと256のchain — 十分です。
      </P>
      <P>
        K-OSは初めて編集したときにのみphraseまたはchainを作成します。phrase{" "}
        <Hex value={0xa5} link={false} /> にノートを書くと、そのphraseはそのキーストローク
        の前には存在せず、今は存在します。決して触らないphraseはメモリを取らず、保存された
        プロジェクトファイルには現れません。
      </P>

      <H2>画面</H2>
      <H3>F1 — Song</H3>
      <P>
        アレンジメントビュー。行は下、8つのチャンネル列は横。各セルは2hex桁 (chain ID) または
        <Code>--</Code> (空)。再生中の行は再生時にハイライトされます。
      </P>
      <CodeBlock label="基本的なイントロを持つsong">
{`     CH0 CH1 CH2 CH3 CH4 CH5 CH6 CH7
00   00  --  --  --  --  --  --  --   ← イントロ: チャンネル0のみ (ドラム)
01   00  01  --  --  --  --  --  --   ← ドラム + ベース
02   00  01  02  --  --  --  --  --   ← ドラム + ベース + リード
03   00  01  02  --  --  --  --  --   ← 繰り返し
04   --  --  --  --  --  --  --  --   ← 終了 (空の行 = そのチャンネルのsong終了)`}
      </CodeBlock>

      <H3>F2 — Chain</H3>
      <P>
        現在編集中のchain。16ステップ行。各ステップにはphrase IDとオプションの
        トランスポーズがあります。トランスポーズは同じphraseをピッチ上下にシフトして
        再利用できるようにします — アルペジオや異なるキーのsongセクションに便利です。
      </P>
      <CodeBlock label="Chain 02 — verse lead">
{`step  phrase  transpose
00    0A      00     ← 元のピッチでphrase 0Aを再生
01    0A      03     ← 3半音上げてphrase 0Aを再生
02    0A      05     ← 5半音上げて
03    0B      00     ← バリエーションphrase、元のピッチ
04    --      --     ← (空のステップはchainを終了 — 下記参照)`}
      </CodeBlock>

      <H3>F3 — Phrase</H3>
      <P>
        現在編集中のphrase。デフォルト16行 (<Code>Shift+W+Up/Down</Code> で2から256まで
        サイズ変更可能)。各行にはノート、楽器、スライス、2つのエフェクトコマンドの列が
        あります。エフェクト列が何ができるかは <Crossref to="effect-commands" /> を
        参照してください。
      </P>

      <H2>再生がレイヤーをどう歩くか</H2>
      <P>
        K-OSはchainをLGPTスタイルで再生します: chainは <Strong>埋まった</Strong>{" "}
        ステップを通って再生し、その後自分自身のstep 0にループバックします。
        song行はchainが16ステップ全部の文字通りの終わりに到達したときにのみ進みます —
        つまり短いchain (1〜8の埋まったステップ) は現在のsong行で無期限にループします。
      </P>
      <P>
        これは設計です。songを進めるには、より多くのchainステップを埋めるか、より多くの
        song行を埋めて、長く動作するchainを完了させてください。
      </P>

      <Aside title="「進まない」の瞬間" variant="tip">
        初めてのトラッカーユーザーはしばしばsongが時間で行ごとに進むことを期待します。
        進みません。各チャンネルは自分のchainを自分のペースで歩きます。チャンネル0の
        2ステップchainは、チャンネル1の8ステップchainがまだ最初のパスにいる間、永遠に
        再生されます。song行はchainがstep <Hex value={0xf} link={false} /> + 1 に
        到達したときに進みます — それより前ではありません。
      </Aside>

      <H2>画面間のドリル</H2>
      <P>
        K-OSは、より高レベルの画面から参照するレイヤーに「ドリルイン」できます。Song
        画面で、カーソルが埋まったchainセル上にあるとき、<Code>Shift+Right</Code> を
        押してchain画面に移動 — K-OSはそのchainを自動的に開きます。Chain画面で、
        カーソルがステップのphrase列上にあるとき、<Code>Shift+Right</Code> はそのphrase
        に連れて行きます。
      </P>
      <P>
        アクティブなchain IDとアクティブなphrase IDは上部ステータスバーに表示されます:
        chain画面で <Code>CHAIN 02</Code>、phrase画面で <Code>PHRASE 0A</Code>。
        どのアイテムを編集しているかを正確に伝えます。
      </P>

      <H2>クイックフィル (LGPTのlastPhraseトリック)</H2>
      <P>
        chainステップにphrase IDを入力すると、K-OSはそれを「最後に触れた」phraseとして
        記憶します。空のchainステップを配置 (Zキー) すると、そのIDで事前入力されます —
        同じphraseを複数のchainステップにスタンプするのに速いです。songビューのchain IDも
        同じアイデア。
      </P>

      <H2>Phraseのクローン</H2>
      <P>
        chain画面で、カーソルがステップのphrase列上にあるとき、<Code>Shift+W+Right</Code>{" "}
        を押すと、参照されたphraseを次の空きphrase IDにクローンします。chainステップは
        今クローンを指します。「ほぼ同じphraseだけど1つのノートが変わった」と言いたい
        ときに便利です。元に影響せずクローンを編集します。
      </P>

      <H2>これは他のトラッカーにどう対応するか</H2>
      <P>
        LGPTまたはPicoTrackerから来た場合: 同一モデル。Phrase、chain、song。右キーで
        ドリルダウン。<Code>Shift+W+arrow</Code> で二次コントロール。同じ行数。
      </P>
      <P>
        ゲームボーイのLSDJから来た場合: これも同一、ただ4つではなく8チャンネルで
        エフェクトコマンドが少し多いだけ。
      </P>
      <P>
        RenoiseまたはFurnaceから来た場合: あれらにはchainレイヤーがありません —
        パターン → song に直接行きます。Chainレイヤーはゲームボーイトラッカーの
        慣用句です；オプションですがコンパクトなアレンジに便利です。
      </P>

      <H2>次に読むこと</H2>
      <UList>
        <Li><Crossref to="effect-commands" /> — phraseのCMD列に入る2文字コード。</Li>
        <Li><Crossref to="per-instrument-visuals" /> — 楽器はノートと一緒に発火するビジュアルを持てる。</Li>
        <Li><Crossref to="dmpit-format" /> — 保存されたプロジェクトファイルが内部でどう見えるか。</Li>
      </UList>
    </>
  );
}

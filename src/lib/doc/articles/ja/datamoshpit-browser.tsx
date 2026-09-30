import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Table, Crossref } from "@/components/doc/elements";

export default function ThrashTrackerBrowser() {
  return (
    <>
      <Lead>
        Thrash Trackerのウィンドウは、Thrash Trackerのブラウザ版です。デスクトップ版と同じ曲の形です。8チャンネル、16ステップのchain、phrase、table、オシレーター、サンプル、4オペレーターのFM。プラグイン楽器はファイルに残り、音は出ません。
      </Lead>

      <Aside title="新しい曲はAmen breakから始まる" variant="warn">
        楽器 <Code>00</Code> の名前は <Code>AMEN</Code> です。Amen breakをサンプルとして鳴らします。phrase <Code>00</Code> は <Code>80</Code> 行、1拍8行で、行 <Code>00</Code> は <Code>C-4</Code> なのでファイルは録音どおりの速度です。テンポは4小節が録音の長さに合うように決まります。songページのスペースでbreakが鳴り、song行 <Code>00</Code> に戻って、もう一度スペースかEscapeまで繰り返します。新しい空の楽器は短い矩形波のままです。Ctrl+Shift+N。
      </Aside>

      <H2>いまいる画面</H2>
      <P>
        キャンバスは960×540です。隅のマップは2行です。Shift+F1からShift+F8でタイルへ飛びます。Shift+矢印はマップを歩き、端で止まります。
      </P>
      <CodeBlock label="マップ">{`S  C  P  L     song, chain, phrase, rack
T  I  V  R     table, instrument, visualiser, project`}</CodeBlock>
      <Table
        headers={["タイル", "Shift", "内容"]}
        rows={[
          ["S", "F1", "Song。256行、チャンネルC0–C7。セルはchain idか --。"],
          ["C", "F2", "Chain。16ステップ。PHがphrase、TRが移調。"],
          ["P", "F3", "Phrase。列は NT IN VL SL LP FX VA ST。"],
          ["L", "F4", "Rack。直前のphraseの4レイヤーのゲイン。"],
          ["T", "F5", "Table。デスクトップと同じ列。ブラウザがまだ鳴らさない列も含む。"],
          ["I", "F6", "楽器。名前、種類、オシレーターまたはFMアルゴリズム、音量、ADSR。"],
          ["V", "F7", "ビジュアライザー。グリッドとマップとミキサーは隠れる。背景とスコープだけ。"],
          ["R", "F8", "プロジェクト。名前、BPM、1拍のtick数、保存、読み込み。"],
        ]}
      />

      <H2>キー</H2>
      <Table
        headers={["キー", "動作"]}
        rows={[
          ["矢印", "カーソルを動かす。"],
          ["Shift+矢印", "マップのページを変える。"],
          ["スペース", "Songはカーソル行から再生、または停止。Chainとphraseはそのパターンの試聴、または停止。"],
          ["Escape", "停止。ウィンドウを閉じるとオーディオも閉じる。"],
          ["Enter", "Songはchainを開く。空なら作る。Chainはphraseを同じように開く。phraseの楽器列ではその楽器を開く。"],
          ["16進 0–9, A–F", "2桁でchain、phrase、楽器、音量、スライス、エフェクト値を書く。"],
          ["ピアノ、ノート列", "下段 zsxdcvgbhnjm,l.;/ と上段 q2w3er5t6y7ui9o0p。- と = でオクターブ。オクターブ4では z が C-4。"],
          ["Backspace", "セルを消す。名前の上では1文字消す。"],
          ["[ ]", "phraseの長さを変える。上限は FF。"],
          ["Ctrl+矢印", "楽器、rack、プロジェクトで値を変える。"],
          ["Ctrl+Shift+左右", "phraseまたはchainで、見ているパターンを変える。"],
          ["Ctrl+Shift+N", "次の空き楽器を短い矩形波にして開く。"],
          ["Ctrl+S / Ctrl+O", "サンプル付きの NAME.dm2.json を落とす、またはブラウザ用ファイルを開く。"],
          ["X / Shift+X / Z", "Songページで、ミュート、ソロ、全チャンネルのミュート解除。"],
        ]}
      />

      <H2>鳴る音</H2>
      <P>
        再生は <Code>public/dm2-worklet.js</Code> です。1行が1 tickです。1 tickは <Code>60 / (BPM × 1拍のtick数)</Code> 秒です。新しい曲は1拍8 tickなので、1拍は8行です。テンポはAmenのファイルから決まり、128行が録音の長さに合います。
      </P>
      <H3>オシレーター、サンプル、FM</H3>
      <UList>
        <Li><Strong>Synth。</Strong> サイン、矩形、ノコギリ、三角、ノイズ。</Li>
        <Li><Strong>Sampler。</Strong> 種類をsamplerにしてEnter。ブラウザがファイルをデコードする。C-4が元の速度。</Li>
        <Li><Strong>FM。</Strong> YM2612のアルゴリズム配置の4オペレーター。<Code>00</Code>–<Code>07</Code>。デスクトップのチップそのものではない。</Li>
        <Li><Strong>Plugin。</Strong> 曲の中に残せる。音は出ない。ステータスに <Code>PLUGIN STAYS ON THE DESKTOP</Code> が一度出る。</Li>
      </UList>
      <P>
        スロットでない楽器はレイヤー0だけが鳴る。phrase <Code>00</Code> はレイヤー0だけ開き、残り3つのゲインは <Code>00</Code> です。
      </P>
      <H3>Amen breakと短い矩形波</H3>
      <P>
        楽器 <Code>00</Code> は <Code>AMEN</Code>、サンプラーです。アタック <Code>00</Code>、ディケイ <Code>00</Code>、サステイン <Code>64</Code>、リリース <Code>00</Code>。ファイルは一度鳴って、録音の終わりで止まります。時間は <Code>(値 / 127)² × 4</Code> 秒です。
      </P>
      <P>
        Ctrl+Shift+N、または空のセルに未使用の楽器番号を書いたとき、短い矩形波ができます。名前は <Code>SQ</Code> に16進idを足したものです。アタック <Code>00</Code>、ディケイ <Code>40</Code>、サステイン <Code>00</Code>、リリース <Code>40</Code> です。<Code>AMEN</Code> を指しているセルを変えるまで、<Code>AMEN</Code> はそのままです。空のセルに割り当てると <Code>C-4</Code> と音量 <Code>80</Code> も書きます。
      </P>
      <H3>エフェクトとtable</H3>
      <P>phraseのエフェクトは1コマンドと1つの値です。workletが鳴らすのは次の2つです。</P>
      <Table
        headers={["Cmd", "聞こえること"]}
        rows={[
          ["KL", "その行でノートを切る。"],
          ["VO", "行のゲインを値にする。7Fがほぼ等倍。"],
        ]}
      />
      <P>
        <Crossref to="effect-commands" /> の長いコマンド一覧は、このウィンドウでは鳴りません。文字は入力できます。音はまだ変わりません。tableは移調がオンのとき音程を動かせます。スライス、リトリガー、フィルタ、クラッシュ、table自身のエフェクトは保存されて表示されます。workletはまだ適用しません。
      </P>

      <H2>chainの終わり</H2>
      <P>
        phraseの無いchainステップでそのchainは終わり、songの行が進みます。次のセルが空なら、チャンネルはその連なりの先頭に戻ります。初期の曲はチャンネル0の行 <Code>00</Code> だけなので、スペースはそのphraseを繰り返します。空のphrase行はノートを切りません。サンプラーはファイルの終わりで止まるので、Amen breakはphraseが戻るたびに一度鳴ります。
      </P>

      <H2>保存</H2>
      <P>
        編集のたびに、このブラウザのキー <Code>dm2-web-pattern</Code> へ書きます。そのコピーにサンプル音声は入りません。Ctrl+Sはサンプル付きの <Code>NAME.dm2.json</Code> を落とします。音声はリトルエンディアン16bitをbase64にしたものです。<Code>version</Code> は <Code>dm2.web</Code> です。
      </P>
      <Aside title="デスクトップの .dm2 でも .dmpit でもない" variant="info">
        デスクトップのThrash Trackerの <Code>.dm2</Code> は別のJSONです。<Crossref to="dmpit-format">.dmpit</Crossref> は前のブラウザトラッカーのzipです。どちらもこのウィンドウではまだ開きません。
      </Aside>

      <H2>このウィンドウがまだしないこと</H2>
      <UList>
        <Li>VST、AU、LV2はない。プラグインの音はない。</Li>
        <Li>クリップボード、アンドゥ、grooveページ、Slimentologikaの切り替えはない。</Li>
        <Li>Vタイルはスコープであり、デスクトップのフォント飛行ではない。</Li>
        <Li>2kool.tvは以前のサイトのままです。このトラッカーは、いま動かしているコピーのウィンドウです。</Li>
      </UList>
    </>
  );
}

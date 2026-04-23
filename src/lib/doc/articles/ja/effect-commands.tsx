import { Lead, P, H2, Strong, Code, CodeBlock, Aside, Table, Crossref, Hex } from "@/components/doc/elements";

export default function EffectCommands() {
  return (
    <>
      <Lead>
        各phrase行には2つのエフェクト列があります: <Code>CMD1/VAL1</Code> と{" "}
        <Code>CMD2/VAL2</Code>。エフェクトはトラッカーがノートを曲げ、ピッチ間を
        スライドさせ、サンプルを短く切り、行を増やさずに表現力を増す方法です。
        コマンドは2文字コード；値は2{" "}
        <Crossref to="hexadecimal">hex</Crossref>桁です。
      </Lead>

      <H2>形</H2>
      <CodeBlock>
{`row  note  inst  cmd1 val1   cmd2 val2
00   C-4   00    P0   01     V4   02
                  │   │      │   │
                  │   └──────┘   ← tickごとに0x01ずつピッチベンドダウン
                  └─ ピッチエフェクト`}
      </CodeBlock>
      <P>
        cmdは2つのASCII文字。valは2hex桁 (<Hex value={0} link={false} />–
        <Hex value={0xff} link={false} />)。ほとんどのコマンドはその行のノートに
        作用します。一部はキャンセルされるまで行をまたいで持続します。
      </P>

      <H2>最も便利なものから</H2>
      <Table
        headers={["CMD", "名前", "何をするか", "例"]}
        rows={[
          ["P", "Pitch bend", "ピッチを上下に曲げる。上位ビット (0x80) = 下。下位バイト = 速度。", "P01はゆっくり上に曲げる"],
          ["L", "Slide", "phrase内の次のノートに滑らかに移行。", "L03 = スライド速度3"],
          ["V", "Vibrato", "ピッチに振動を追加。上位ニブル = 速度、下位 = 深度。", "V42 = 速度4、深度2"],
          ["E", "Envelope", "ボリューム/振幅を設定。", "E08 = ボリュームを8に"],
          ["O", "Output / Pan", "チャンネルをパン。00=L、80=中央、FF=R。", "OFF = 完全に右"],
          ["K", "Kill", "Nティック後にノートを切る。", "K03 = 3ティック後に切る"],
          ["D", "Delay", "ノートの開始をNティック遅らせる。", "D03 = 3ティック遅延"],
          ["C", "Chord", "コードのノート間でアルペジオ。", "C37 = マイナー；C47 = メジャー"],
          ["H", "Hop", "phrase内でジャンプ。", "H08 = 行8にジャンプ；H00 = ストップ"],
          ["T", "Tempo", "song途中でBPMを変更。", "T80 = 128 BPM"],
        ]}
      />

      <H2>あまり一般的でないが強力</H2>
      <Table
        headers={["CMD", "名前", "何をするか"]}
        rows={[
          ["A", "Table", "tickごとのオートメーションテーブルを開始/停止。"],
          ["B", "MayBe", "ノートが時々だけ再生 — 値は確率。"],
          ["G", "Groove", "phrase途中でタイミンググルーブを切り替える。"],
          ["R", "Retrig", "ノートを急速にリトリガー (ロール/スタッター)。"],
          ["W", "Wave", "アクティブな楽器の波形/アルゴリズムを切り替える。"],
          ["Z", "Random", "前のコマンドの値を範囲内でランダム化。"],
        ]}
      />

      <H2>値の動作</H2>
      <P>
        ほぼすべての値フィールドは同じ慣習を使います:
      </P>
      <Table
        headers={["値", "意味"]}
        rows={[
          [<Hex value={0x00} key="0" link={false} />, "オフ / 最小 / エフェクトなし"],
          [<Hex value={0xff} key="ff" link={false} />, "最大"],
          [<Hex value={0x80} key="80" link={false} />, "中央 / ニュートラル / 「オフセットなし」(符号付き値の場合)"],
          [<Hex value={0x40} key="40" link={false} />, "4分の1；中程度の値で一般的"],
          [<Hex value={0xc0} key="c0" link={false} />, "4分の3"],
        ]}
      />
      <Aside title="hex値を一目で読む" variant="tip">
        上位ニブル × 16 + 下位ニブル = 10進値。<Hex value={0x42} link={false} />{" "}
        は4×16 + 2 = 66。これをほとんどしなくてもよい；数セッション後には
        <Hex value={0x40} link={false} /> がダイヤルのどこにあるか感じるようになります。
      </Aside>

      <H2>2つのエフェクトを持つ行</H2>
      <P>
        各行には <Strong>2つ</Strong> のエフェクト列があります。両方とも同じ行で
        左から右の順に発火します。次のような組み合わせに便利:
      </P>
      <CodeBlock>
{`note   inst   CMD1 VAL1   CMD2 VAL2
C-4    00     L03         OFF       ← スライドアップ + 完全に右にパン
D#4    01     V42         K06       ← ビブラート + 6ティック後に切る
A-3    00     P81         R04       ← ピッチベンドダウン + リトリガー`}
      </CodeBlock>

      <H2>「持続する」エフェクト</H2>
      <P>
        一部のエフェクト (pitch、vibrato、slide) は何かに置き換えられるまで動作し続けます。
        後の行で <Code>V00</Code> を設定するとビブラートが明示的にオフになります。
        列を空のままにすると前の設定が単に続きます。
      </P>
      <P>
        他のエフェクト (kill、delay、retrig) は書かれた行でのみ発火し、その後完了です。
      </P>

      <H2>Hopコマンド (H)</H2>
      <P>
        Hopは現在のphrase内で再生ヘッドをジャンプさせます。<Code>H00</Code> はその
        チャンネルの再生を停止します。<Code>H08</Code> は行8にジャンプします。
        phrase内でループを作成したり、パターン途中でチャンネルを停止したりするために
        使われます。
      </P>
      <P>
        Hopは主に高度なパターン (chainステップの一部を再生してから停止するワンショット
        phraseなど) で便利です。1日目は心配しないでください。
      </P>

      <H2>これにはエフェクトコマンドがオーディオプラグインに勝つ理由</H2>
      <P>
        DAWではピッチベンドオートメーションレーンを追加し、カーブを描き、再生を
        押すでしょう。トラッカーではセルに <Code>P03</Code> を書き、ゼロクリックで
        作業が完了します。songを通じて掛け算すると、節約される時間は大きいです。
        コストはコマンドコードを覚える必要があることですが — 一般的なものは約12個で、
        1週間で覚えるでしょう。
      </P>

      <H2>次に読むこと</H2>
      <P>
        <Crossref to="song-chain-phrase" /> はphraseがより大きな構造の中でどう生きるか。
        <Crossref to="hexadecimal" /> は <Hex value={0x42} link={false} /> のような
        値がまだ謎めいて感じる場合に。
      </P>
    </>
  );
}

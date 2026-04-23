import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function DmpitFormat() {
  return (
    <>
      <Lead>
        K-OSプロジェクトファイル（<Code>.dmpit</Code>）は、単一のJSONドキュメント
        にバイナリのサンプルファイルを加えたものを含むZIPアーカイブです。
        意図的に読みやすく — 任意の標準ツールで解凍して中身を検査できます。
        この記事は、ツールを書いたり、保存を監査したり、ホスト間でプロジェクトを
        移行したりできるよう構造を文書化します。
      </Lead>

      <H2>ファイルはzip</H2>
      <P>
        <Code>.dmpit</Code> を <Code>.zip</Code> に名前変更すれば、OSが開きます。
        またはコマンドラインで：
      </P>
      <CodeBlock>
{`unzip -l my-song.dmpit

# 典型的な出力:
#   project.json
#   samples/00_KICK.wav
#   samples/01_SNARE.wav
#   samples/02_HAT.wav`}
      </CodeBlock>

      <H2>project.json</H2>
      <P>
        プロジェクトの単一の真実の源。JSON形式。だいたいこんな感じ：
      </P>
      <CodeBlock label="トップレベル形（短縮）">
{`{
  "version": "0.1.0",
  "name": "MY SONG",
  "song": { "id": 0, "name": "MY SONG", "bpm": 120, "tpb": 6, "channels": 8, "rows": [...] },
  "chains": [{ "id": 0, "steps": [...] }],
  "phrases": [{ "id": 0, "rows": [...] }],
  "tables": [{ "id": 0, "rows": [...], "loopStart": 0 }],
  "instruments": [
    {
      "id": 0,
      "name": "FM BASS",
      "type": "fm",
      "fmAlgorithm": 0,
      "fmOperators": [...],
      "visual": {
        "enabled": true,
        "source": "color",
        "color": "#ff00aa",
        "totalFrames": 24,
        "triggerMode": "play-from-start"
      }
    }
  ],
  "samples": [{ "id": 0, "name": "KICK", "file": "samples/00_KICK.wav" }]
}`}
      </CodeBlock>

      <H2>サンプルファイル</H2>
      <P>
        オーディオサンプルは、zip内の <Code>samples/</Code> フォルダに生の
        <Code>.wav</Code> ファイルとして保存されます。JSONはそれらを相対パスで
        参照します。読み込み時、K-OSはWAVバイトを読み取り、メモリ内の
        オーディオバッファにデコードします。
      </P>

      <H2>レコードの保存方法</H2>
      <H3>PhrasesとChains：スパース</H3>
      <P>
        K-OSは実際に編集されたphraseとchainのみを保存します。1つのphraseを
        持つプロジェクトには、256個ではなく1個の <Code>phrases[]</Code> エントリ
        があります。IDの仕組みについては <Crossref to="song-chain-phrase" /> を参照。
      </P>

      <H3>Instruments：常に256</H3>
      <P>
        Instrumentsは256エントリの配列として事前割り当てされます（IDごとに1つ）。
        ほとんどのスロットは空白の "null" インストルメント；設定した少数が
        意味のあるデータを持ちます。固定長によりID別ルックアップがO(1)に。
      </P>

      <H3>InstrumentsのVisualデータ</H3>
      <P>
        Instrumentに設定済みvisualがあれば（F4 VISUALセクションがオン）、
        visualレコードは <Code>visual</Code> キーの下にinstrumentに含まれます。
        <Code>LOAD</Code> でアップロードされた、または <Code>DRAW [KOOLDRAW]</Code>{" "}
        で描画された画像データは、<Code>assetUrl</Code> フィールドにdata URLとして
        埋め込まれます。
      </P>

      <H3>カスタムキーフレーム</H3>
      <P>
        タイムラインエディタを使ってinstrument visualのカスタムキーフレームを
        オーサリングしていれば、それらは <Code>visual.customKeyframes[]</Code> に
        着地します。
      </P>

      <H2>バージョニング</H2>
      <P>
        トップレベルの <Code>version</Code> フィールドは現在 <Code>"0.1.0"</Code>。
        K-OSはバージョンに関係なく任意のプロジェクトを読みます。
      </P>
      <Aside title="ベータフォーマット警告" variant="warn">
        K-OSの <Code>0.2.0-beta</Code> リリースは <Code>0.3</Code> 前にフォーマットを
        変更するかもしれません。プロジェクトをローカルに保存しておきましょう。
      </Aside>

      <H2>プロジェクトの読み込み</H2>
      <P>
        コードパス：<Code>src/engine/project/ProjectIO.ts</Code>。関数{" "}
        <Code>loadProjectFile(blob)</Code> はBlobを取り、zipを解凍し、
        <Code>project.json</Code> をパースし、サンプルバイナリを <Code>ArrayBuffer</Code>{" "}
        に復元し、完全に型付けされた <Code>ProjectData</Code> オブジェクトを返します。
      </P>

      <H2>フォーマットに対するツールの作成</H2>
      <P>
        フォーマットはプレーンZIP + プレーンJSON。バッチでインストルメントを
        リネームしたり、サンプル名を抽出したりするツールを書くのは簡単：
      </P>
      <UList>
        <Li>任意のZIPライブラリで <Code>project.json</Code> を抽出。</Li>
        <Li>JSONをパース。</Li>
        <Li>メモリ内オブジェクトを操作。</Li>
        <Li>修正されたJSONで書き戻し、サンプルバイナリは無傷のまま、再zip。</Li>
      </UList>

      <H2>次に読むもの</H2>
      <UList>
        <Li><Crossref to="song-chain-phrase" /> — 各トップレベルデータ構造が何を表すか。</Li>
        <Li><Crossref to="per-instrument-visuals" /> — visualサブオブジェクトの意味。</Li>
      </UList>
    </>
  );
}

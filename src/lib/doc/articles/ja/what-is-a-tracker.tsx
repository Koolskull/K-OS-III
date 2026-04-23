import { Lead, P, H2, UList, Li, Strong, Crossref, CodeBlock, Aside } from "@/components/doc/elements";

export default function WhatIsATracker() {
  return (
    <>
      <Lead>
        <Strong>トラッカー</Strong>とは、ピアノロールの代わりに垂直な
        スプレッドシート状のテキストを使う音楽ソフトのことです。一見威圧的に
        見えますが、実際には今までに発明された中で最速の作曲方法のひとつです。
        K-OSの主力アプリ <Strong>Datamoshpit</Strong> はトラッカーです。
      </Lead>

      <H2>どこから来たか</H2>
      <P>
        トラッカーは1980年代後半、CommodoreAmiga上でデモシーンのために
        Karsten Obarskiが発明しました。最初のプログラムはUltimate Soundtracker
        です。そこからフォーマットはFastTracker II、Impulse Tracker、ProTracker
        に広がり、最終的にゲーム機 — 最も有名なのはGame BoyのLSDJと、PSPの
        LittleGPTracker (LGPT) — に到達しました。
      </P>
      <P>
        現代の子孫としてはRenoise（PC、プロ向け）、Polyend Tracker（ハードウェア）、
        Furnace（オープンソース、マルチシステム）、PicoTracker（RP2040ハード
        ウェア）があります。DatamoshpitはLSDJ / LGPTファミリーからUI規約を
        受け継いでいます — 少ないキー、密集した画面、すべてのキー入力が
        仕事をする。
      </P>

      <H2>実際に見えるもの</H2>
      <P>
        行の列。各行は1ビート、または1ビートの何分の1かです。矢印キーで
        カーソルを上下に動かし、セルにものをタイプします — ノート、楽器番号、
        エフェクトコマンド。再生を押すと、カーソルが行を上から下へ進み、
        プログラムはそこにあるものを再生します。
      </P>
      <CodeBlock label="トラッカー形式のシンプルなドラムパターン">
{`row  note  inst  cmd
00   C-4   00    --      ← キック
01   ---   --    --
02   ---   --    --
03   ---   --    --
04   D-4   01    --      ← スネア
05   ---   --    --
06   ---   --    --
07   ---   --    --
08   C-4   00    --      ← キック
09   ---   --    --
0A   ---   --    --
0B   ---   --    --
0C   D-4   01    --      ← スネア
0D   ---   --    --
0E   ---   --    --
0F   ---   --    --`}
      </CodeBlock>
      <P>
        これは16ステップのドラムパターンです。行番号は{" "}
        <Crossref to="hexadecimal">16進数</Crossref>（基数16）で書かれているので、
        <code>0</code>–<code>15</code> ではなく <code>00</code>–<code>0F</code> と
        表示されます。
      </P>

      <H2>みんなが愛する理由</H2>
      <UList>
        <Li><Strong>速度。</Strong>キーストロークを覚えれば、マウスを使わなくなります。何もクリックせずに曲全体が書けます。</Li>
        <Li><Strong>精度。</Strong>すべてのノートに正確な整数位置があります。ドラッグ＆スナップなし、後からのクオンタイズなし。タイプしたものがそのまま聞こえます。</Li>
        <Li><Strong>小ささ。</Strong>トラッカーの曲は数キロバイトのプレーンデータです。デモシーンの作曲家たちは、プレーヤーコードも含めて合計64KBに収まるサウンドトラックを書きました。</Li>
        <Li><Strong>ハードウェア互換性。</Strong>データモデルはGame Boy、電卓、マイコンで動くほどコンパクトです。Datamoshpitはブラウザで動きますが、同じアイデアは10ドルのデバイスでも動作します。</Li>
      </UList>

      <H2>階層</H2>
      <P>
        トラッカーは1つの巨大なパターンを書くわけではありません。曲を3つの
        ネストされた層から組み立てます：
      </P>
      <UList>
        <Li><Strong>Phrase</Strong> — 短いパターン、通常16行。最小の再利用可能単位。</Li>
        <Li><Strong>Chain</Strong> — 順番に再生される最大16個のフレーズのリスト。曲のセクションのようなもの。</Li>
        <Li><Strong>Song</Strong> — どのチェーンがどのチャンネルでどの時刻に再生されるかのリスト。アレンジメント。</Li>
      </UList>
      <P>
        詳しい仕組みは <Crossref to="song-chain-phrase" /> を読んでください。
      </P>

      <Aside title="初めて感じる瞬間">
        トラッカーが「腑に落ちる」瞬間は、4小節のドラムパターンを書いて、
        フレーズとして保存し、チェーン内で3回再利用できると気付いたときです。
        4小節タイプして16小節を書きました。次に別のフレーズに小さなバリエー
        ションを書き、4番目の小節に挿入すれば、もうアレンジができています。
        これを8チャンネルで異なるチェーンを再生するように掛け合わせれば、
        ほとんどタイプせずに曲全体ができあがります。
      </Aside>

      <H2>K-OSのちがい</H2>
      <P>
        クラシックなトラッカーには見られない3つのこと：
      </P>
      <UList>
        <Li><Strong>楽器ごとのビジュアル。</Strong>各楽器はそのノートが鳴るときに発火する小さなビジュアルシーンを持てます。<Crossref to="per-instrument-visuals" /> 参照。</Li>
        <Li><Strong><Crossref to="slimentologika" />。</Strong>標準の16進数字を置き換えるオプションのピクセルグリフ・アルファベット。Tabで切り替え。</Li>
        <Li><Strong>ブラウザネイティブ。</Strong>Web Audio API経由のオーディオ、インストール不要、プロジェクトは <code>.dmpit</code> ファイルとして保存（<Crossref to="dmpit-format" /> 参照）。</Li>
      </UList>
    </>
  );
}

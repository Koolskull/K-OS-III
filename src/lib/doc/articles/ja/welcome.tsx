import { Lead, P, H2, UList, Li, Strong, Crossref, Aside } from "@/components/doc/elements";

export default function Welcome() {
  return (
    <>
      <Lead>
        K-OS III はブラウザで動く架空のオペレーティングシステムで、実際に音楽、
        アート、（将来的には）オンチェーンの作業ができます。このマニュアルでは、
        中身が何か、使い方、そして — 望むなら — そのコードの読み方を学びます。
      </Lead>

      <P>
        プログラミング、音楽ソフト、OSの知識は不要です。このマニュアルは小さな
        百科事典のように作られています — 短い記事が前面に、深い記事がそこから
        リンクされています。気になるものから読んでください。
      </P>

      <H2>トラッカーを使ったことがない方へ</H2>
      <P>
        まず <Crossref to="what-is-a-tracker" /> から始めてください。K-OSが
        中心に据える音楽ソフトを説明します — SpotifyやGarageBandとは違いますが、
        見た目より簡単です。次に <Crossref to="hexadecimal" />（短い1ページ）で、
        必要となる唯一の変わった数学を学びます。
      </P>

      <H2>LSDJ、LGPT、PicoTrackerを使ったことがある方へ</H2>
      <P>
        K-OSはすぐに馴染むはずです。<Crossref to="song-chain-phrase" /> をざっと見て、
        K-OSが少し違うやり方をしている数か所を確認したら、{" "}
        <Crossref to="effect-commands" /> と{" "}
        <Crossref to="per-instrument-visuals" /> へ進んでください — ビジュアル
        まわりがK-OSとそれらのトラッカーとの最大の違いです。
      </P>

      <H2>自分のマシンでK-OSを動かしたい方へ</H2>
      <P>
        ターミナルを開いたことがないなら <Crossref to="terminal-basics" /> を読み、
        次に <Crossref to="running-k-os-locally" /> で正確なコマンドを確認します。
        合計20分程度、<code>npm install</code> の待ち時間を含めても。
      </P>

      <H2>すべてがどう作られているか知りたい方へ</H2>
      <P>
        <Crossref to="scene-vm" /> ではビジュアルエンジンを深掘りします。{" "}
        <Crossref to="dmpit-format" /> はプロジェクトの保存形式を説明します。{" "}
        <Crossref to="the-rules" /> はデザインの制約 — 角を丸めない、
        アンチエイリアシングなし、人気プリセットのフォントなし — と、それが
        なぜ重要かを説明します。
      </P>

      <Aside title="このマニュアルは、K-OSの他の部分と同様、主観的です">
        真剣な人々の間で意見が分かれるトピック（歴史、技術、神学、経済学）
        について、このマニュアルは結論ではなく議論そのものを提示します。
        プロジェクトの全姿勢については{" "}
        <a
          href="https://github.com/Koolskull/K-OS-III/blob/master/docs/EPISTEMIC_STANCE.md"
          style={{ color: "#ffff00" }}
        >
          EPISTEMIC_STANCE.md
        </a>{" "}
        を参照。以下の技術記事は事実に忠実です。プロジェクトの好みと客観的測定
        の違いがある場合は明示します。
      </Aside>

      <H2>クイックリンク</H2>
      <UList>
        <Li><Strong>トラッカーの基本：</Strong> <Crossref to="what-is-a-tracker" /> · <Crossref to="hexadecimal" /> · <Crossref to="song-chain-phrase" /></Li>
        <Li><Strong>ビジュアル：</Strong> <Crossref to="per-instrument-visuals" /> · <Crossref to="scene-vm" /></Li>
        <Li><Strong>ローカル開発：</Strong> <Crossref to="terminal-basics" /> · <Crossref to="running-k-os-locally" /></Li>
        <Li><Strong>リファレンス：</Strong> <Crossref to="effect-commands" /> · <Crossref to="dmpit-format" /> · <Crossref to="glossary" /></Li>
      </UList>
    </>
  );
}

import { Lead, P, H2, UList, Li, Strong, Code, Aside, Crossref } from "@/components/doc/elements";

export default function TheRules() {
  return (
    <>
      <Lead>
        K-OSにはすべてのUI要素が従う小さな設計ルールがあります。それらは
        ルック、貢献者の振る舞い、追加される機能の種類を形作ります。
        美的なものもあれば、すべて意図的です。一緒になって、何百人もの
        貢献者と何十年ものコードを通じてOSの一貫性を保ちます。
      </Lead>

      <H2>5つのルール</H2>
      <UList>
        <Li><Strong>1. 角を丸めない。</Strong>境界は鋭い。ボタンは長方形。アイコンはピクセルグリッド。CSSルール <Code>border-radius: 0</Code> がグローバルに適用。</Li>
        <Li><Strong>2. アンチエイリアスなし。</Strong>ピクセルはくっきり。すべての画像に <Code>image-rendering: pixelated</Code>。本文に <Code>-webkit-font-smoothing: none</Code>。</Li>
        <Li><Strong>3. グラデーションボタンなし。</Strong>ピクセルアートサーフェスのみ。フラット塗り、イラストの境界、手描きスプライト。CSSグラデーションで長方形を3D風に飾るのはなし。</Li>
        <Li><Strong>4. すべてのピクセルは居場所を稼ぐ。</Strong>埋め草のクロムなし。すべてのグリフ、すべての線、すべてのスペーサーは何かをしているべき。</Li>
        <Li><Strong>5. すべてのファイルは祝福される。</Strong>ほとんどのソースファイルの最初にあるASCIIアートを見てください。CSSルールではなく、文化的ルール。</Li>
      </UList>

      <H2>なぜこれらが特に</H2>
      <P>
        角丸、アンチエイリアス、グラデーションは消費者向けSaaSの視覚言語です。
        現代のほぼすべてのUIにあります。「プレミアム、フレンドリー、プロフェッショナル」
        を伝えることを意図しています。同時に汎用的 — それを見ても、ラベルを
        読むまでどのアプリにいるか分かりません。
      </P>
      <P>
        K-OSは反対の方向に行きます。鋭い角と可視ピクセルが伝えます：これは
        ツールであり、製品ではない。Game Boy、Amiga、LSDJ、デモシーン制作を
        含む伝統に属します。ブートシーケンスが始まる瞬間に、どんな部屋にいるか
        分かります。
      </P>

      <H2>実践的にどう意味するか</H2>
      <UList>
        <Li><Strong>ビットマップフォントを使う。</Strong>Kongtextが主要顔。HDスケール（1280px+）でSometype Mono。他のピクセル/ビットマップフォントは構わない；現代のシステムフォント（San Francisco、Segoe UI、Roboto）はダメ。</Li>
        <Li><Strong>テキストはモノクロ。</Strong>白地に黒、または黒地に白。クロスリファレンスとBETAバッジに黄色アクセント。コードに緑。エラーと危険なアクションに赤。プレースホルダーにマゼンタ。</Li>
        <Li><Strong>ボタンにはVMIアセット。</Strong>「Visual Machine Interface」システムは、ボタン状態（default、hover、pressed）に階層化PNGシーケンスを使用。</Li>
        <Li><Strong>発明する前に尋ねる。</Strong>既存テンプレートのないボタンやウィンドウが必要な場合、メンテナーに尋ねる。新しいクロムをフリーランスで作らない。</Li>
      </UList>

      <H2>コードを書く貢献者向け</H2>
      <P>
        上記のCSSルールは <Code>src/app/globals.css</Code> で{" "}
        <Code>border-radius: 0 !important</Code> 経由でグローバルに強制
        されます。インラインスタイルで技術的にオーバーライドできますが、
        してはいけません。PRレビュアーが確認します。
      </P>

      <Aside title="Slimentologikaルール" variant="info">
        複数桁の <Crossref to="slimentologika">Slimentologika</Crossref> 値は
        方向ルールに従います：桁はレイアウトに対して<Strong>垂直に</Strong>{" "}
        積まれます。垂直リストは水平の桁ペアを、水平行は垂直の桁ペアを
        得ます。これは装飾ではなく可読性 — 隣接する値は識別可能なまま。
      </Aside>

      <H2>文化的側面</H2>
      <P>
        「すべてのファイルは祝福される」というルールは、各ソースファイルが
        小さなASCIIアートヘッダーを得ることを意味します — 通常は聖人、
        テンプル十字、または詩篇の抜粋。これはK-OSのアイデンティティの
        一部です。
      </P>
      <P>
        <Code>CONTRIBUTING.md</Code> から：「貢献するために世界観を共有する
        必要はない。アイデンティティがプロジェクトの一部であり、削り取られる
        装飾ではないことを尊重する必要がある。」
      </P>

      <H2>次に読むもの</H2>
      <UList>
        <Li><Crossref to="welcome" /> — ルールがプロジェクトの広範な使命にどう収まるか。</Li>
        <Li><Crossref to="slimentologika" /> — 最も目立つ美的決定。</Li>
      </UList>
    </>
  );
}

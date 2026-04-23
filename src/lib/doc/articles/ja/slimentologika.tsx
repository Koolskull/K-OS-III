import { Lead, P, H2, UList, Li, Strong, Code, Aside, Crossref } from "@/components/doc/elements";

export default function Slimentologika() {
  return (
    <>
      <Lead>
        <Strong>Slimentologika</Strong> はKOOLSKULL OS独自の16グリフの
        ピクセルアートアルファベットです。各グリフは{" "}
        <Crossref to="hexadecimal">hex</Crossref> 桁 (<Code>0</Code>–<Code>F</Code>) に
        1対1でマップします。トラッカー画面で <Code>Tab</Code> を押して、標準のhex桁と
        Slimentologikaを切り替えます。基礎となる数字は同一です — 視覚表現だけが
        変わります。
      </Lead>

      <H2>由来</H2>
      <P>
        古代の緑の粘液の寺院から。(また: Koolskullから。グリフセットは10年以上にわたって
        サイドプロジェクトで静かに進化してきましたが、ついにK-OS IIIのために体系化
        されました。)
      </P>

      <H2>プロジェクトが独自の数字システムを発明する理由</H2>
      <UList>
        <Li>
          <Strong>視覚的密度。</Strong>グリフは小さいサイズ — 8×8ピクセル — で読みやすく
          設計されており、識別性を損ないません。標準のhex桁は8×8で同じように見え始めます。
        </Li>
        <Li>
          <Strong>アイデンティティ。</Strong>SlimentologikaはK-OSの美学の最も目立つ
          ピース。OSが何であるかを宣言する方法です。
        </Li>
        <Li>
          <Strong>パターン認識。</Strong>目がグリフファミリー (丸いもの、四角いもの、
          斜めのもの) を学ぶと、複数桁の値を桁ごとではなく形ごとに読みます。最終的には
          hexを読むより速くなります。
        </Li>
        <Li>
          <Strong>オプション。</Strong>欲しくなければ使いません。Tabで切り替えます。
          データモデルではSlimentologikaを使うものはなにもありません；純粋に表示
          レイヤーです。
        </Li>
      </UList>

      <H2>グリフ</H2>
      <P>
        16のピクセルアートアイコン。最初の4つ (<Code>0</Code>–<Code>3</Code>) は
        最もシンプルで最初に覚える価値があります。なぜならほぼすべての値に現れるからです
        (<Code>00</Code> から <Code>3F</Code> が最小の一般的な範囲をカバーするので)。
      </P>
      <P>
        完全な参照画像はK-OSの <Code>public/sprites/ST0.png</Code> から{" "}
        <Code>STF.png</Code> にあります。<Code>SlimeDigit</Code> コンポーネント
        (<Code>src/components/apps/datamoshpit/ui/SlimeDigit.tsx</Code>) 経由で
        レンダリングされます。
      </P>

      <H2>方向ルール</H2>
      <P>
        K-OSでSlimentologikaを見るとき、複数桁の値には厳格なルールが従います:
      </P>
      <UList>
        <Li>
          <Strong>水平レイアウト</Strong> (ノブが横に並ぶ、パッドグリッドの列) では、
          桁は <Strong>垂直に</Strong> 積まれます — 1つが他の上に。
        </Li>
        <Li>
          <Strong>垂直レイアウト</Strong> (phrase行、リスト) では、桁は <Strong>横に
          並んで</Strong>、左から右に。
        </Li>
      </UList>
      <P>
        ルールは「桁はレイアウトの方向に対して垂直に行く」です。書くと変ですが、実践
        では即座に明らかです。ポイントは複数桁の値が隣の値と崩れて混ざらないようにする
        ことです。
      </P>

      <H2>実践的なアドバイス</H2>
      <UList>
        <Li>16個全てを一度に覚えようとしないでください。最初に0〜3を学びましょう。</Li>
        <Li>混乱したらいつでもhex (<Code>Tab</Code>) に切り替えてください。</Li>
        <Li>phrase行番号は最高の学習表面です — 常に見ており、<Code>00</Code>–<Code>0F</Code> なので、自然と同じ少数のグリフを何度も学びます。</Li>
        <Li>本当に望まない限り、Slimentologikaをhexより速く読むことを期待しないでください。両方ともうまく機能します。</Li>
      </UList>

      <Aside title="宗教ではありません" variant="info">
        K-OSはSlimentologikaを使うかどうかであなたを評価しません。グリフは風味であり、
        要件ではありません。すべての音楽をhexモードで作り、1つのグリフも見ないなら、
        それで結構です。Slimentologikaに全力で取り組み、緑の四角形のイデオグラムで
        夢を見始めるなら、それも結構です。要点はオプションが存在することです。
      </Aside>

      <H2>他にどこに現れるか</H2>
      <UList>
        <Li>K-OSのブートシーケンスは詩篇の合間にいくつかのSlimentologika文字を点滅させます。</Li>
        <Li>タスクバーは標準ASCIIを使用；Slimentologikaはトラッカー専用です。</Li>
        <Li>スプライトエディタの色選択器はhex値を標準形式で表示します (Slimentologikaはまだそこで切り替わりません — 保留中)。</Li>
        <Li>2KOOL Productionsのマーチャンダイズとk-OSの美学がさらに広げます。</Li>
      </UList>

      <H2>次に読むこと</H2>
      <UList>
        <Li><Crossref to="hexadecimal" /> 基礎となる数字システム。</Li>
        <Li><Crossref to="the-rules" /> Slimentologikaが収まるより広い視覚的慣習。</Li>
      </UList>
    </>
  );
}

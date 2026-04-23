import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref, Hex } from "@/components/doc/elements";

export default function PerInstrumentVisuals() {
  return (
    <>
      <Lead>
        Datamoshpitの各楽器は、ノートが鳴ったときに発火する小さなビジュアル
        シーン — フラットな色、画像、シェーダー、3Dモデル — を持てます。
        ビジュアル設定はF4楽器ページにあります；レンダリングは{" "}
        <Crossref to="scene-vm">Scene VM</Crossref> が処理します。デフォルトは
        オフ；オンにすると設定が現れます。
      </Lead>

      <H2>メンタルモデル</H2>
      <P>
        各楽器を2つの半分として考えてください：音源（既に知っているFMシンセ、
        サンプルプレーヤー、ノイズ生成器）と、オプションのビジュアル源
        （独自の短いタイムラインを持つ小さなシーン）。トラッカーがその楽器を
        使ってチャンネルでノートを再生すると、オーディオが発火し<Strong>そして</Strong>
        ビジュアルも発火します — 互いに同期して。
      </P>
      <P>
        複数の楽器 → 複数のビジュアル。Scene VMには「アクティブ楽器に追従」
        モードがあり、最後に発火した楽器を常に表示します — フレーズ内で
        楽器を切り替えると、ビジュアルも切り替わります。
      </P>

      <H2>楽器のビジュアルを有効化</H2>
      <P>
        F4楽器ページで、FMオペレーターの下までスクロール。<Code>── VISUAL ──</Code>{" "}
        セパレーターが見えます。その下に1行：
      </P>
      <CodeBlock>{`ENABL  OFF`}</CodeBlock>
      <P>
        カーソルを合わせて、Q+矢印で <Code>ON</Code> に。残りの設定が現れます。
      </P>

      <H2>クイック設定</H2>
      <UList>
        <Li><Code>RND</Code> — Q+矢印でランダムフィールドを新シードで再ロール。</Li>
        <Li><Code>SRC</Code> — ビジュアル源：<Code>NONE / COLOR / IMAGE / VIDEO / SHADER / MODEL / IFRAME</Code>。</Li>
        <Li><Code>COLOR</Code> — SRC=COLORのみ。256段階HSLパレット。</Li>
        <Li><Code>SHADR</Code> — SRC=SHADERのみ。組み込みシェーダーIDをサイクル。</Li>
        <Li><Code>ASSET / LOAD / DRAW / CLR</Code> — SRC=IMAGEのみ。下の「アセット源」参照。</Li>
        <Li><Code>W H</Code> — スケール前のピクセルサイズ（8〜1024）。</Li>
        <Li><Code>X Y</Code> — 位置 <Hex value={0x00} link={false} />（左上）から <Hex value={0xff} link={false} />（右下）まで。両方 <Hex value={0x80} link={false} /> でセンター。</Li>
        <Li><Code>LEN</Code> — シーンタイムラインの総フレーム数。8〜128。</Li>
        <Li><Code>TRIG</Code> — ノートが再生ヘッドをどう動かすか：<Code>START / FRAME / PITCH / VELAMP / NONE</Code>。</Li>
        <Li><Code>TFRM</Code> — TRIG=FRAMEのみ。ノート時にジャンプするフレーム。</Li>
        <Li><Code>PLO PHI</Code> — TRIG=PITCHのみ。シーンフレームにマップされるMIDIノート範囲。</Li>
        <Li><Code>TLINE</Code> — タイムラインエディタを開く。詳細なキーフレーム編集用。</Li>
        <Li><Code>TCLR</Code> — カスタムキーフレームがある時に表示。自動生成に戻す。</Li>
      </UList>

      <H2>トリガーモード</H2>
      <H3>play-from-start（デフォルト）</H3>
      <P>各ノートがシーンをフレーム1にリセットし、タイムラインを進める。ワンショット効果（キックでフラッシュ、スネアで回転）に最適。</P>
      <H3>play-from-frame</H3>
      <P>ノートが再生ヘッドを設定フレームにジャンプして進める。アニメーションの中盤に飛び込みたい時に。</P>
      <H3>pitch-mapped</H3>
      <P>ノートのピッチが設定範囲内のシーンフレームにマップ。高いノート＝後のフレーム。シーンがメロディで制御される「スクラバー」のように動作。</P>
      <H3>velocity-amp</H3>
      <P>ノートで再生ヘッドは動かない；シーンは連続再生。ノートのベロシティがノイズの振幅をスケール。</P>
      <H3>none</H3>
      <P>シーンは永遠にループ、ノートを無視。アンビエント背景に。</P>

      <H2>アセット源</H2>
      <H3>Color</H3>
      <P>
        フラット色の長方形。外部ファイル不要。256段階パレットはHSL — Q+矢印で
        サイクル。
      </P>
      <H3>Image（PNG / JPG / GIF）</H3>
      <P>
        <Code>SRC=IMAGE</Code> の行で3つの新しい行が現れます：<Code>ASSET</Code>
        （現在のアセットの読み取り専用表示）、<Code>LOAD</Code>（Q+矢印で
        ネイティブファイル選択を開く）、<Code>DRAW</Code>（Q+矢印で組み込みの
        KoolDrawを開いてこの楽器用にスプライトを描く）。
      </P>
      <P>
        選択または描画された画像は、プロジェクトファイル内にデータURLとして
        保存されます。つまり保存された <Code>.dmpit</Code> プロジェクトは
        ポータブル — ファイルを持つ誰でも画像も持っています。
      </P>
      <H3>GIF、video、shader、model、iframe</H3>
      <P>
        これらはデータモデルでファーストクラスのタイプですが、Scene VM v0
        レンダラーは現在のところcolorとimageのみ完全実装しています。他の源
        タイプは現在は色付きプレースホルダーをレンダリング；完全な実装は
        将来のリリースで。
      </P>

      <H2>ライブプレビュー</H2>
      <P>
        トップバーの <Code>VM</Code> ボタンを切り替えて <Code>VM:FLW</Code>
        （フォロー）が表示されるまで。最後に発火した楽器のビジュアルを表示する
        ドラッグ可能なウィンドウが現れます。フレーズを再生 — ビジュアルが
        各ノートに追従します。
      </P>

      <H2>カスタムキーフレーム（タイムラインエディタ）</H2>
      <P>
        クイック設定からの自動生成シーンは良い出発点です。より細かい制御 —
        複数のキーフレーム、カスタムイージング、brightness / blur / hue-rotate
        / saturate フィルター — のために、<Code>TLINE</Code> でインライン
        タイムラインエディタを開きます。
      </P>

      <Aside title="デフォルトは良い" variant="tip">
        ほとんどの楽器では、デフォルトのランダム化シーン + トリガーモード選択
        で十分。タイムラインエディタは特定の形が頭にあるときだけ開いて
        ください。それ以外は、ランダマイザー + RND再ロールがずっと速いです。
      </Aside>

      <H2>次に読むもの</H2>
      <UList>
        <Li><Crossref to="scene-vm" /> — ビジュアルがどう音と同期し続けるかの技術的モデル。</Li>
        <Li><Crossref to="song-chain-phrase" /> — 楽器がより大きな構成にどう収まるか。</Li>
      </UList>
    </>
  );
}

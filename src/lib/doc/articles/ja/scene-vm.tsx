import { Lead, P, H2, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function SceneVM() {
  return (
    <>
      <Lead>
        <Strong>Scene VM</Strong>（Visual Module）は、トラッカーのノートと
        並行して発火するビジュアルのためのK-OSのランタイムです。小さく、
        意図的にtheatreフリーで、すべてのフレームをオーディオを駆動するのと
        同じtickクロックで処理 — だからビジュアルが同期から外れることは
        ありません。この記事は内部の仕組みを扱います。使うだけなら{" "}
        <Crossref to="per-instrument-visuals" /> から始めてください。
      </Lead>

      <H2>由来</H2>
      <P>
        Scene VMはBeetleGame（姉妹プロジェクト）のカットシーンランタイムを
        スリム化したポートです。BeetleGameのエディタは便利ですが重い；
        K-OSではランタイムだけが欲しかった — キーフレーム補間、シンプレックス
        ノイズ、マニフェスト駆動のレイヤーレンダリング — エディタのクロムも
        Theatre.jsもなしで。
      </P>
      <P>
        コードベースでは{" "}
        <Code>src/components/apps/datamoshpit/visuals/scene-vm/</Code> にあります。
        合計約1,200行。libフォルダに純粋関数、同じフォルダにReactコンポーネント。
      </P>

      <H2>メンタルモデル</H2>
      <P>
        <Strong>シーン</Strong>はJSON形のマニフェストで記述されます：どの
        レイヤーをレンダリングするか、どこに配置するか、各レイヤーがどの
        キーフレームをアニメートするか。レンダラーはこのマニフェストを
        フレームごとに歩き、可視出力を生成します（現在はCSS変換でDOM
        ベース；3DモデルのThree.jsは計画中）。
      </P>
      <P>
        <Strong>ビジュアルモジュール</Strong>はDatamoshpitの楽器に
        バインドされたシーン。トラッカーがノートを発火すると、エンジンが
        ノートイベントを発行；バインドされたシーンの再生ヘッドがトリガー
        モードに基づいて進む、ジャンプ、またはスクラブします。
      </P>

      <H2>マニフェスト</H2>
      <P>
        最小では、シーンマニフェストはこんな感じ：
      </P>
      <CodeBlock label="最小限のシーン">
{`{
  id: "kick-punch",
  name: "KICK PUNCH",
  duration: 0.5,            // 秒
  totalFrames: 12,
  layers: [
    {
      id: "punch",
      type: "solid",
      z: 1,
      solidColor: "#ffffff",
      solidSize: { w: 96, h: 96 },
      transformKeyframes: [
        { frame: 1,  mode: "linear", x: 0.5, y: 0.5, scaleX: 0.2, scaleY: 0.2, rotation: 0, opacity: 1 },
        { frame: 3,  mode: "bezier", x: 0.5, y: 0.5, scaleX: 2.5, scaleY: 2.5, rotation: 0, opacity: 1 },
        { frame: 12, mode: "linear", x: 0.5, y: 0.5, scaleX: 0.4, scaleY: 0.4, rotation: 0, opacity: 0 },
      ],
    },
  ],
}`}
      </CodeBlock>
      <P>
        これは小から大にポップしてフェードアウトする白い四角 — キックドラムの
        フラッシュです。3つのキーフレーム；レンダラーがフレームごとに補間。
      </P>

      <H2>lib</H2>
      <UList>
        <Li><Strong><Code>types.ts</Code></Strong> — スリム化されたシーン型。レイヤー型、キーフレームの形、マニフェスト。</Li>
        <Li><Strong><Code>keyframe-interpolation.ts</Code></Strong> — イージングエンジン。<Code>linear</Code>、<Code>bezier</Code>、<Code>hold</Code>、<Code>bounce-in/out/both</Code>。純粋関数。</Li>
        <Li><Strong><Code>simplex-noise.ts</Code></Strong> — Stefan-Gustavsonの2Dシンプレックスノイズ + 環境ゆらぎとキーフレームシェイクのヘルパー。</Li>
        <Li><Strong><Code>timeline-utils.ts</Code></Strong> — フレーム ↔ 時間変換 + <Code>tickToFrame(tick, bpm, tpb)</Code>。</Li>
        <Li><Strong><Code>asset-resolver.ts</Code></Strong> — マニフェストローカルのアセットルックアップ。v0用のスタブ。</Li>
      </UList>

      <H2>レンダラー</H2>
      <P>
        <Code>SceneVMPlayer.tsx</Code> はマニフェストのレイヤーを歩き、
        <Code>z</Code> でソートし、各々を配置・変換されたDOM要素として
        レンダリング。CSS変換（<Code>translate</Code>、<Code>scale</Code>、
        <Code>rotate</Code>）とCSSフィルター（<Code>brightness</Code>、
        <Code>blur</Code>、<Code>hue-rotate</Code>、<Code>saturate</Code>）は、
        レイヤーのtransformKeyframesを現在のフレームに対して補間したもの
        から来ます。CSS <Code>mix-blend-mode</Code> がレイヤーごとの
        コンポジションを処理。
      </P>

      <H2>オーディオブリッジ</H2>
      <P>
        <Code>src/engine/tracker/</Code> の <Code>TrackerEngine</Code> は、
        フレーズ行がノートを発火するたびに <Code>NoteEvent</Code> を発行
        します。Scene VMウィンドウは <Code>onNoteEvent(cb)</Code> 経由で
        そのイベントストリームに購読し、再生ヘッドの変更を駆動します。
      </P>
      <P>
        重要なことに、ノートイベントはオーディオアタックと<Strong>同じ
        Tone.jsスケジュール</Strong>で発火 — サンプル精度。再生ヘッドの
        更新は即座に発生；rAFループがキーフレーム間を補間して、オーディオが
        やったことに追いつきます。
      </P>
      <CodeBlock label="ノートイベントの形">
{`interface NoteEvent {
  channel: number;       // 0..7
  note: number;          // トランスポーズ後のMIDIノート
  velocity: number;      // 0..127（今は固定100）
  tick: number;          // グローバルtickカウンター
  phraseRow: number;
  instrument: number | null;
  type: "on" | "off";
}`}
      </CodeBlock>

      <H2>環境ノイズ + キーフレームシェイク</H2>
      <UList>
        <Li><Strong>環境ノイズ</Strong>（レイヤーごと） — 連続実行、プロパティ別に設定可能。静的なコンポジションに穏やかな生命を加える。</Li>
        <Li><Strong>キーフレームシェイク</Strong> — タイムライン上のノイズキーフレーム間で振幅/周波数を補間。ドラマチックな揺れの瞬間がランプアップしてフェードアウト。</Li>
      </UList>

      <H2>パフォーマンス</H2>
      <P>
        ターゲットは中程度のラップトップで、8チャンネルアクティブで3つが
        シェーダーを実行している状態で60fps。DOMベースのv0はcolor/imageレイヤー
        では簡単に達成。シェーダーレイヤーはFBOプールが必要になるでしょう。
      </P>

      <Aside title="トラッカーがマスタークロック" variant="info">
        ビジュアルはtickのスレーブ；tickはTone.jsのトランスポートから来ており、
        オーディオ出力に対してサンプル精度。ビジュアルレイヤーが追いつけ
        なければ、フレームを落とす；オーディオを遅くしません。これは譲れず、
        Scene VMが経過時間アニメーションではなくフレーム補間の周りに構築
        されている理由です。
      </Aside>

      <H2>次に読むもの</H2>
      <UList>
        <Li><Crossref to="per-instrument-visuals" /> — ユーザー向け設定。</Li>
        <Li><Crossref to="dmpit-format" /> — シーンがプロジェクトファイルにどうシリアライズされるか。</Li>
      </UList>
    </>
  );
}

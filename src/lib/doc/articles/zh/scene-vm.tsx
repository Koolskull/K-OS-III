import { Lead, P, H2, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function SceneVM() {
  return (
    <>
      <Lead>
        <Strong>Scene VM</Strong>（视觉模块）是 K-OS 的运行时，用于与音轨
        编辑器音符一起触发的视觉。它很小，故意没有 theatre，并通过驱动
        音频的相同 tick 时钟路由每一帧 — 因此视觉永远不会失同步。本文涵盖
        它在底层如何工作。如果你只想使用它，从{" "}
        <Crossref to="per-instrument-visuals" /> 开始。
      </Lead>

      <H2>它来自哪里</H2>
      <P>
        Scene VM 是来自 BeetleGame（姊妹项目）的过场动画运行时的精简端口。
        BeetleGame 的编辑器有用但很重；对于 K-OS 我们只想要运行时 — 关键帧
        插值、单纯形噪声、由清单驱动的层渲染 — 没有编辑器装饰，没有 Theatre.js。
      </P>
      <P>
        在代码库中位于{" "}
        <Code>src/components/apps/datamoshpit/visuals/scene-vm/</Code>。总共
        约 1,200 行。lib 文件夹中的纯函数，同一文件夹中的 React 组件。
      </P>

      <H2>心理模型</H2>
      <P>
        <Strong>场景</Strong>由 JSON 形状的清单描述：要渲染的层、放置位置、
        每层动画的关键帧。渲染器每帧遍历此清单并产生可见输出（当前是
        DOM 基于 CSS 变换；3D 模型的 Three.js 是计划中的）。
      </P>
      <P>
        <Strong>视觉模块</Strong>是绑定到 Datamoshpit 乐器的场景。当音轨
        编辑器触发音符时，引擎发出音符事件；绑定场景的播放头根据触发模式
        前进、跳跃或擦洗。
      </P>

      <H2>清单</H2>
      <P>最小的，场景清单看起来像这样：</P>
      <CodeBlock label="最小可行场景">
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
        那是一个白色方块从小到大弹出并淡出 — 一个底鼓闪光。三个关键帧；
        渲染器每帧在它们之间插值。
      </P>

      <H2>lib</H2>
      <UList>
        <Li><Strong><Code>types.ts</Code></Strong> — 精简的场景类型。层类型、关键帧形状、清单。</Li>
        <Li><Strong><Code>keyframe-interpolation.ts</Code></Strong> — 缓动引擎。模式：<Code>linear</Code>、<Code>bezier</Code>、<Code>hold</Code>、<Code>bounce-in/out/both</Code>。纯函数。</Li>
        <Li><Strong><Code>simplex-noise.ts</Code></Strong> — 2D Stefan-Gustavson 单纯形噪声 + 环境晃动和关键帧抖动的辅助函数。</Li>
        <Li><Strong><Code>timeline-utils.ts</Code></Strong> — 帧 ↔ 时间转换 + <Code>tickToFrame(tick, bpm, tpb)</Code>。</Li>
        <Li><Strong><Code>asset-resolver.ts</Code></Strong> — 清单本地的资源查找。v0 的存根。</Li>
      </UList>

      <H2>渲染器</H2>
      <P>
        <Code>SceneVMPlayer.tsx</Code> 遍历清单的层，按 <Code>z</Code> 排序，
        并将每个渲染为定位、变换的 DOM 元素。CSS 变换（<Code>translate</Code>、
        <Code>scale</Code>、<Code>rotate</Code>）和 CSS 滤镜（<Code>brightness</Code>、
        <Code>blur</Code>、<Code>hue-rotate</Code>、<Code>saturate</Code>）来自
        将层的 transformKeyframes 与当前帧插值。CSS <Code>mix-blend-mode</Code>{" "}
        处理逐层合成。
      </P>

      <H2>音频桥</H2>
      <P>
        <Code>src/engine/tracker/</Code> 中的 <Code>TrackerEngine</Code> 每次
        phrase 行触发音符时发出 <Code>NoteEvent</Code>。Scene VM 窗口通过{" "}
        <Code>onNoteEvent(cb)</Code> 订阅该事件流并使用它来驱动播放头变化。
      </P>
      <P>
        关键的是，音符事件在音频攻击的<Strong>相同 Tone.js 调度</Strong>上
        触发 — 样本精确。播放头更新立即发生；rAF 循环在关键帧之间插值赶上
        音频刚刚做的事情。
      </P>
      <CodeBlock label="音符事件形状">
{`interface NoteEvent {
  channel: number;       // 0..7
  note: number;          // 移调后的 MIDI 音符
  velocity: number;      // 0..127（目前固定为 100）
  tick: number;          // 全局 tick 计数器
  phraseRow: number;
  instrument: number | null;
  type: "on" | "off";
}`}
      </CodeBlock>

      <H2>环境噪声 + 关键帧抖动</H2>
      <UList>
        <Li><Strong>环境噪声</Strong>每层 — 持续运行，每属性可配置。为静态作品增加温和的活力。</Li>
        <Li><Strong>关键帧抖动</Strong> — 在时间线上的噪声关键帧之间插值噪声振幅/频率。戏剧性的抖动时刻渐入和淡出。</Li>
      </UList>

      <H2>性能</H2>
      <P>
        目标是在中端笔记本上 8 通道活动、其中 3 个运行着色器时达到 60fps。
        基于 DOM 的 v0 对于颜色/图像层很容易达到这个。着色器层在它们到来时
        将需要 FBO 池。
      </P>

      <Aside title="音轨编辑器是主时钟" variant="info">
        视觉是 tick 的从机；tick 来自 Tone.js 的传输，相对于音频输出是样本
        精确的。如果视觉层跟不上，它丢帧；它不会减慢音频。这是不可协商的，
        也是为什么 Scene VM 是围绕帧插值而不是经过时间动画构建的。
      </Aside>

      <H2>接下来读什么</H2>
      <UList>
        <Li><Crossref to="per-instrument-visuals" /> 了解面向用户的设置。</Li>
        <Li><Crossref to="dmpit-format" /> 了解场景如何序列化到项目文件。</Li>
      </UList>
    </>
  );
}

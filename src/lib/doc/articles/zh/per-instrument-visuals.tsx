import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref, Hex } from "@/components/doc/elements";

export default function PerInstrumentVisuals() {
  return (
    <>
      <Lead>
        Datamoshpit 中的每个乐器都可以携带一个小型视觉场景 — 一个平面颜色、
        一个图像、一个着色器、一个 3D 模型 — 当其音符触发时触发。视觉设置
        位于 F4 乐器页面；渲染由{" "}
        <Crossref to="scene-vm">Scene VM</Crossref> 处理。它默认关闭；打开
        显示控件。
      </Lead>

      <H2>心理模型</H2>
      <P>
        把每个乐器想成有两个一半：一个声源（你已经知道的 FM 合成器、样本
        播放器或噪声生成器）和一个可选的视觉源（一个有自己短时间线的小型
        场景）。当音轨编辑器使用该乐器在通道上播放音符时，音频触发
        <Strong>并且</Strong>视觉触发，相互同步。
      </P>
      <P>
        多个乐器 → 多个视觉。Scene VM 有一个"跟随活动乐器"模式，始终显示
        最近触发的乐器 — 在你的 phrase 中切换乐器，视觉切换。
      </P>

      <H2>为乐器开启视觉</H2>
      <P>
        在 F4 乐器页面，向下滚动经过 FM 操作员。你会看到 <Code>── VISUAL ──</Code>{" "}
        分隔符。在它下面有一行：
      </P>
      <CodeBlock>{`ENABL  OFF`}</CodeBlock>
      <P>将光标放上去，Q+方向键到 <Code>ON</Code>，其余的控件出现。</P>

      <H2>快速设置</H2>
      <UList>
        <Li><Code>RND</Code> — Q+方向键用新种子重新滚动随机字段。</Li>
        <Li><Code>SRC</Code> — 视觉源：<Code>NONE / COLOR / IMAGE / VIDEO / SHADER / MODEL / IFRAME</Code>。</Li>
        <Li><Code>COLOR</Code> — 仅当 SRC=COLOR 时。256 步 HSL 调色板。Q+方向键循环。</Li>
        <Li><Code>SHADR</Code> — 仅当 SRC=SHADER 时。在内置着色器 ID 之间循环。</Li>
        <Li><Code>ASSET / LOAD / DRAW / CLR</Code> — 仅当 SRC=IMAGE 时。见下面的"资源源"。</Li>
        <Li><Code>W H</Code> — 缩放前的像素大小（8 到 1024）。</Li>
        <Li><Code>X Y</Code> — 位置从 <Hex value={0x00} link={false} />（左上）到 <Hex value={0xff} link={false} />（右下）。两者都为 <Hex value={0x80} link={false} /> 是居中。</Li>
        <Li><Code>LEN</Code> — 场景时间线的总帧数。范围 8 到 128。</Li>
        <Li><Code>TRIG</Code> — 音符如何驱动播放头：<Code>START / FRAME / PITCH / VELAMP / NONE</Code>。</Li>
        <Li><Code>TFRM</Code> — 仅当 TRIG=FRAME 时。音符上跳转的帧。</Li>
        <Li><Code>PLO PHI</Code> — 仅当 TRIG=PITCH 时。映射到场景帧的 MIDI 音符范围。</Li>
        <Li><Code>TLINE</Code> — 打开时间线编辑器进行细粒度关键帧创作。</Li>
        <Li><Code>TCLR</Code> — 当存在自定义关键帧时出现。还原为自动生成的。</Li>
      </UList>

      <H2>触发模式</H2>
      <H3>play-from-start（默认）</H3>
      <P>每个音符将场景重置为帧 1 并向前播放。最适合一次性效果（底鼓上的闪光、军鼓上的旋转）。</P>
      <H3>play-from-frame</H3>
      <P>音符将播放头跳到配置的帧并从那里向前播放。当你想跳入动画中部时有用。</P>
      <H3>pitch-mapped</H3>
      <P>音符的音高映射到配置范围内的场景帧。更高的音符 = 后面的帧。让场景像由旋律控制的"擦洗器"那样工作。</P>
      <H3>velocity-amp</H3>
      <P>播放头不在音符上移动；场景持续播放。音符速度缩放噪声振幅。</P>
      <H3>none</H3>
      <P>场景永远循环，对音符无动于衷。用于环境背景。</P>

      <H2>资源源</H2>
      <H3>Color</H3>
      <P>平面有色矩形。无外部文件。256 步调色板是 HSL — Q+方向键 <Code>COLOR</Code> 字段循环。</P>
      <H3>Image (PNG / JPG / GIF)</H3>
      <P>
        在 <Code>SRC=IMAGE</Code> 行上出现三个新行：<Code>ASSET</Code>（当前
        资源的只读显示）、<Code>LOAD</Code>（Q+方向键打开本机文件选择器）和
        <Code>DRAW</Code>（Q+方向键打开嵌入的 KoolDraw 让你为此乐器绘制
        一个精灵）。
      </P>
      <P>
        选择或绘制的图像存储为项目文件内的数据 URL。这意味着保存的{" "}
        <Code>.dmpit</Code> 项目是可移植的 — 拥有该文件的任何人也拥有图像。
      </P>
      <H3>GIF、视频、着色器、模型、iframe</H3>
      <P>
        这些是数据模型中的一等类型，但 Scene VM v0 渲染器迄今仅完全实现了
        颜色和图像。其他源类型今天渲染彩色占位符；完整的实现在未来发布中
        到来。
      </P>

      <H2>实时预览</H2>
      <P>
        切换顶栏的 <Code>VM</Code> 按钮直到看到 <Code>VM:FLW</Code>（跟随）。
        出现一个可拖动窗口，显示最近触发的乐器视觉。播放你的 phrase — 视觉
        跟随每个音符。
      </P>

      <H2>自定义关键帧（时间线编辑器）</H2>
      <P>
        从你的快速设置自动生成的场景是一个好的起点。要进行更细的控制 —
        多个关键帧、自定义缓动、亮度 / 模糊 / 色相旋转 / 饱和度滤镜 — 用{" "}
        <Code>TLINE</Code> 打开内联时间线编辑器。
      </P>

      <Aside title="默认值是好的" variant="tip">
        对于大多数乐器，默认随机化场景 + 触发模式选择就足够了。仅在你
        头脑中有特定形状时打开时间线编辑器。否则随机生成器 + RND 重新
        滚动要快得多。
      </Aside>

      <H2>接下来读什么</H2>
      <UList>
        <Li><Crossref to="scene-vm" /> 了解视觉如何与音频保持同步的技术模型。</Li>
        <Li><Crossref to="song-chain-phrase" /> 了解乐器如何融入更大的作曲。</Li>
      </UList>
    </>
  );
}

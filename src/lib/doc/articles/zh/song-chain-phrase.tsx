import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref, Hex } from "@/components/doc/elements";

export default function SongChainPhrase() {
  return (
    <>
      <Lead>
        Datamoshpit 歌曲由三个嵌套层构成 — <Strong>phrase</Strong> 嵌套在
        <Strong>chain</Strong> 中，chain 嵌套在 <Strong>song</Strong> 中。
        每层由一个两位十六进制 ID 标识。一旦你理解了它们如何相互引用，整个
        音轨编辑器就不再像字母汤，而是开始看起来像一个小而密集的音乐语言。
      </Lead>

      <H2>用平实语言说三层</H2>
      <UList>
        <Li><Strong>phrase</Strong>是一个小型模式 — 通常 16 行音符、乐器和效果。最小的可重用音乐单位。</Li>
        <Li><Strong>chain</Strong>是按顺序播放的最多 16 个 phrase ID。有时每步带移调偏移。像"Verse A"。</Li>
        <Li><Strong>song</Strong>是一个网格：行 × 8 通道。每个单元格保存一个 chain ID。song 行决定什么在什么通道何时播放。</Li>
      </UList>
      <CodeBlock label="层级，图示">
{`SONG  (编排；多行 × 8 通道)
   │
   └── 每个单元格保存一个 CHAIN id，如 02
       │
       └── 该 chain 有最多 16 步，
           每步指向一个 PHRASE id，如 0A
           │
           └── 该 phrase 有 16 行
               音符/乐器/效果数据`}
      </CodeBlock>

      <H2>为什么要间接？</H2>
      <P>
        乍看复杂 — 为什么不直接写一条巨大的时间线？答案是重用。鼓点模式
        通常会重复。如果你的底鼓模式是 phrase <Hex value={0} />，你可以将
        phrase <Hex value={0} /> 作为 song 中每个鼓点 chain 的步骤 0。编辑
        phrase <Hex value={0} /> 一次，每个使用它的地方都会改变。
      </P>
      <P>
        在下一级别同样的想法。一个像"verse drums"的 chain 可以在多个 song
        行中作为 chain ID 出现。无需重写模式即可重组你的 song。
      </P>

      <H2>ID 是 0–FF（0–255）</H2>
      <P>
        每个 chain 和每个 phrase 都有一个唯一的{" "}
        <Crossref to="hexadecimal">十六进制</Crossref> ID，从{" "}
        <Hex value={0} link={false} /> 到 <Hex value={0xff} link={false} />。
        这给你每个项目 256 个 phrase 和 256 个 chain — 足够。
      </P>
      <P>
        K-OS 仅在你首次编辑时创建 phrase 或 chain。如果你在 phrase{" "}
        <Hex value={0xa5} link={false} /> 中写音符，那个 phrase 在按键之前
        不存在，现在它存在。你从未触及的 phrase 不占用内存，也不出现在
        保存的项目文件中。
      </P>

      <H2>屏幕</H2>
      <H3>F1 — Song</H3>
      <P>
        编排视图。行向下，八个通道列横向。每个单元格是两个十六进制位
        （chain ID）或 <Code>--</Code>（空）。当前播放的行在播放期间高亮。
      </P>
      <CodeBlock label="带基本前奏的 song">
{`     CH0 CH1 CH2 CH3 CH4 CH5 CH6 CH7
00   00  --  --  --  --  --  --  --   ← 前奏：仅通道 0（鼓）
01   00  01  --  --  --  --  --  --   ← 鼓 + 贝斯
02   00  01  02  --  --  --  --  --   ← 鼓 + 贝斯 + 主旋律
03   00  01  02  --  --  --  --  --   ← 重复
04   --  --  --  --  --  --  --  --   ← 结束（空行 = 该通道的 song 结束）`}
      </CodeBlock>

      <H3>F2 — Chain</H3>
      <P>
        当前编辑的 chain。16 步行。每步有一个 phrase ID 和一个可选的移调。
        移调让你可以重用相同的 phrase 但音高上下移动 — 对琶音或不同调的
        歌曲段落很有用。
      </P>
      <CodeBlock label="Chain 02 — verse 主旋律">
{`步骤  phrase  移调
00    0A      00     ← 以原始音高播放 phrase 0A
01    0A      03     ← 上移 3 个半音播放 phrase 0A
02    0A      05     ← 上移 5 个半音
03    0B      00     ← 变化 phrase，原始音高
04    --      --     ← (空步骤结束 chain — 见下文)`}
      </CodeBlock>

      <H3>F3 — Phrase</H3>
      <P>
        当前编辑的 phrase。默认 16 行（用 <Code>Shift+W+Up/Down</Code> 可
        从 2 调整到 256）。每行有音符、乐器、切片和两个效果命令的列。参见
        <Crossref to="effect-commands" /> 了解效果列能做什么。
      </P>

      <H2>播放如何遍历层</H2>
      <P>
        K-OS 以 LGPT 风格播放 chain：chain 通过其<Strong>已填充</Strong>
        的步骤播放，然后在自身内循环回步骤 0。song 行仅在 chain 达到所有
        16 步的字面结束时才前进 — 这意味着短 chain（1–8 已填充步骤）在
        当前 song 行上无限循环。
      </P>
      <P>
        这是设计如此。要使 song 前进，请填充更多 chain 步骤，或填充更多
        song 行并让长时间运行的 chain 完成。
      </P>

      <Aside title="「为什么不前进」的瞬间" variant="tip">
        首次使用音轨编辑器的用户经常期望 song 按时间逐行前进。它们不会。
        每个通道按自己的节奏遍历自己的 chain。通道 0 上的两步 chain 将
        永远重播，而通道 1 的八步 chain 仍在第一遍。song 行在 chain 达到
        步骤 <Hex value={0xf} link={false} /> + 1 时前进 — 而不是之前。
      </Aside>

      <H2>在屏幕之间钻取</H2>
      <P>
        K-OS 让你可以从更高级别的屏幕"钻入"它引用的层。在 Song 屏幕上，
        当光标在已填充的 chain 单元格上时，按 <Code>Shift+Right</Code> 导航
        到 Chain 屏幕 — K-OS 自动打开该 chain。从 Chain 屏幕，当光标在
        步骤的 phrase 列上时，<Code>Shift+Right</Code> 带你到该 phrase。
      </P>
      <P>
        活动 chain ID 和活动 phrase ID 显示在顶部状态栏：在 chain 屏幕上
        <Code>CHAIN 02</Code>，在 phrase 屏幕上 <Code>PHRASE 0A</Code>。
        它们告诉你你正在编辑的确切项目。
      </P>

      <H2>快速填充（LGPT lastPhrase 技巧）</H2>
      <P>
        当你将 phrase ID 输入 chain 步骤时，K-OS 将其记住为"最后触摸"的
        phrase。放置一个空的 chain 步骤（Z 键），它会预填充该 ID — 快速
        将相同 phrase 印章到多个 chain 步骤。同样的想法用于 song 视图中
        的 chain ID。
      </P>

      <H2>克隆 phrase</H2>
      <P>
        在 chain 屏幕上，当光标在步骤的 phrase 列上时，按{" "}
        <Code>Shift+W+Right</Code> 将引用的 phrase 克隆到下一个空闲 phrase ID。
        chain 步骤现在指向克隆。当你想要"几乎相同的 phrase，但更改了一个
        音符"时很有用。在不影响原始的情况下编辑克隆。
      </P>

      <H2>这如何映射到其他音轨编辑器</H2>
      <P>
        如果你来自 LGPT 或 PicoTracker：相同的模型。Phrase、chain、song。
        通过右键钻取。<Code>Shift+W+arrow</Code> 用于辅助控件。相同的行计数。
      </P>
      <P>
        如果你来自 Game Boy 上的 LSDJ：也相同，只是 8 通道而不是 4 个，
        效果命令略多。
      </P>
      <P>
        如果你来自 Renoise 或 Furnace：那些没有 chain 层 — 它们直接从
        模式 → song。Chain 层是 Game Boy 音轨编辑器的惯用语；它是可选的，
        但对紧凑编排很有用。
      </P>

      <H2>接下来读什么</H2>
      <UList>
        <Li><Crossref to="effect-commands" /> — 进入 phrase 的 CMD 列的两字母代码。</Li>
        <Li><Crossref to="per-instrument-visuals" /> — 乐器可以携带与其音符一起触发的视觉效果。</Li>
        <Li><Crossref to="dmpit-format" /> — 保存的项目文件在内部是什么样的。</Li>
      </UList>
    </>
  );
}

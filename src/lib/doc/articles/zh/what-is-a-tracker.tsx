import { Lead, P, H2, UList, Li, Strong, Crossref, CodeBlock, Aside } from "@/components/doc/elements";

export default function WhatIsATracker() {
  return (
    <>
      <Lead>
        <Strong>音轨编辑器</Strong>是一种使用文本垂直电子表格而非钢琴卷的
        音乐软件。乍看令人生畏，然后却被证明是有史以来发明的最快速的作曲
        方法之一。K-OS 的旗舰应用 <Strong>Datamoshpit</Strong> 就是一个音轨
        编辑器。
      </Lead>

      <H2>它们的来源</H2>
      <P>
        音轨编辑器由 Karsten Obarski 在 1980 年代后期为了 demoscene 在 Commodore
        Amiga 上发明。最初的程序是 Ultimate Soundtracker。从那里，格式扩展到
        FastTracker II、Impulse Tracker、ProTracker，最终进入游戏机 — 最有名的
        是 Game Boy 上的 LSDJ 和 PSP 上的 LittleGPTracker (LGPT)。
      </P>
      <P>
        现代的后代包括 Renoise (PC，专业级)、Polyend Tracker (硬件)、Furnace
        (开源、多系统) 和 PicoTracker (RP2040 硬件)。Datamoshpit 从 LSDJ / LGPT
        家族继承 UI 约定 — 少量按键、密集屏幕、每个键击都做事。
      </P>

      <H2>实际看到的</H2>
      <P>
        一列行。每行是一拍，或一拍的某个分数。你用箭头键上下移动光标，并在
        单元格中输入内容 — 音符、乐器号、效果命令。当你按播放时，光标自顶向下
        步进各行，程序播放那里的内容。
      </P>
      <CodeBlock label="音轨编辑器形式的简单鼓点模式">
{`row  note  inst  cmd
00   C-4   00    --      ← 底鼓
01   ---   --    --
02   ---   --    --
03   ---   --    --
04   D-4   01    --      ← 军鼓
05   ---   --    --
06   ---   --    --
07   ---   --    --
08   C-4   00    --      ← 底鼓
09   ---   --    --
0A   ---   --    --
0B   ---   --    --
0C   D-4   01    --      ← 军鼓
0D   ---   --    --
0E   ---   --    --
0F   ---   --    --`}
      </CodeBlock>
      <P>
        那是一个 16 步鼓点模式。行号以{" "}
        <Crossref to="hexadecimal">十六进制</Crossref>（基数 16）写出，所以你
        会看到 <code>00</code>–<code>0F</code> 而不是 <code>0</code>–<code>15</code>。
      </P>

      <H2>人们为何喜爱</H2>
      <UList>
        <Li><Strong>速度。</Strong>一旦你知道了快捷键，你就不再使用鼠标。整首歌写出来不点击任何东西。</Li>
        <Li><Strong>精度。</Strong>每个音符都有精确的整数位置。无拖放捕捉，无事后量化。你输入的就是你听到的。</Li>
        <Li><Strong>小巧。</Strong>一首音轨编辑器歌曲是几千字节的纯数据。Demoscene 作曲家写了能放入 64 KB 的整张原声带 — 包括播放器代码。</Li>
        <Li><Strong>硬件可移植性。</Strong>数据模型如此紧凑，可以在 Game Boy、计算器、微控制器上运行。Datamoshpit 在浏览器中运行；同样的想法在 10 美元的设备上工作。</Li>
      </UList>

      <H2>层级</H2>
      <P>
        音轨编辑器不写一个巨大的模式。他们用三个嵌套层构建歌曲：
      </P>
      <UList>
        <Li><Strong>Phrase (乐句)</Strong> — 一个简短的模式，通常 16 行。最小的可重用单位。</Li>
        <Li><Strong>Chain (链)</Strong> — 按顺序播放的最多 16 个乐句的列表。像歌曲的一个段落。</Li>
        <Li><Strong>Song (歌曲)</Strong> — 哪些链在哪些通道上、何时播放的列表。编排。</Li>
      </UList>
      <P>
        阅读 <Crossref to="song-chain-phrase" /> 了解详细工作原理。
      </P>

      <Aside title="第一次感受它的瞬间">
        音轨编辑器豁然开朗的瞬间是当你意识到你可以写一个 4 小节的鼓点模式，
        将其保存为乐句，然后在你的链中重用三次。你刚刚通过键入 4 小节就写了
        16 小节。然后你在另一个乐句中写一个小变化，把它放到第 4 小节，现在你
        有了一个编排。在 8 个通道上乘以播放不同的链，你就用很少的输入做出了
        整首歌。
      </Aside>

      <H2>K-OS 与众不同的地方</H2>
      <UList>
        <Li><Strong>每乐器视觉。</Strong>每个乐器都可以携带一个小型视觉场景，与其音符同时触发。参见 <Crossref to="per-instrument-visuals" />。</Li>
        <Li><Strong><Crossref to="slimentologika" />。</Strong>替代标准十六进制数字的可选像素字形字母表。Tab 切换。</Li>
        <Li><Strong>浏览器原生。</Strong>通过 Web Audio API 输出音频，无需安装，项目保存为 <code>.dmpit</code> 文件（参见 <Crossref to="dmpit-format" />）。</Li>
      </UList>
    </>
  );
}

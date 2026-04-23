import { Lead, P, H2, Strong, Code, CodeBlock, Aside, Table, Crossref, Hex } from "@/components/doc/elements";

export default function EffectCommands() {
  return (
    <>
      <Lead>
        每个 phrase 行都有两个效果列：<Code>CMD1/VAL1</Code> 和{" "}
        <Code>CMD2/VAL2</Code>。效果是音轨编辑器弯曲音符、在音高之间滑动、
        切短样本以及在不增加更多行的情况下变得有表现力的方式。命令是两个
        字符的代码；值是两个 <Crossref to="hexadecimal">十六进制</Crossref> 位。
      </Lead>

      <H2>形式</H2>
      <CodeBlock>
{`row  note  inst  cmd1 val1   cmd2 val2
00   C-4   00    P0   01     V4   02
                  │   │      │   │
                  │   └──────┘   ← 每 tick 0x01 的音高向下弯曲
                  └─ 音高效果`}
      </CodeBlock>
      <P>
        cmd 是两个 ASCII 字母。val 是两个十六进制位（
        <Hex value={0} link={false} />–<Hex value={0xff} link={false} />）。
        大多数命令作用于其行中的音符。一些跨行持续，直到被取消。
      </P>

      <H2>最实用的优先</H2>
      <Table
        headers={["CMD", "名称", "作用", "示例"]}
        rows={[
          ["P", "Pitch bend", "向上或向下弯曲音高。高位 (0x80) = 向下。低字节 = 速度。", "P01 缓慢向上弯曲"],
          ["L", "Slide", "平滑滑到 phrase 中的下一个音符。", "L03 = 滑动速度 3"],
          ["V", "Vibrato", "添加音高振荡。高半字节 = 速度，低半字节 = 深度。", "V42 = 速度 4，深度 2"],
          ["E", "Envelope", "设置音量/振幅。", "E08 = 设置音量为 8"],
          ["O", "Output / Pan", "声相通道。00=L，80=中央，FF=R。", "OFF = 完全右"],
          ["K", "Kill", "在 N tick 后切断音符。", "K03 = 3 tick 后切断"],
          ["D", "Delay", "将音符的开始延迟 N tick。", "D03 = 延迟 3 tick"],
          ["C", "Chord", "在和弦中的音符之间琶音。", "C37 = 小调；C47 = 大调"],
          ["H", "Hop", "在 phrase 内跳转。", "H08 = 跳到第 8 行；H00 = 停止"],
          ["T", "Tempo", "在歌曲中途更改 BPM。", "T80 = 128 BPM"],
        ]}
      />

      <H2>不太常见但强大</H2>
      <Table
        headers={["CMD", "名称", "作用"]}
        rows={[
          ["A", "Table", "启动/停止每 tick 自动化表。"],
          ["B", "MayBe", "音符仅有时播放 — 值为概率。"],
          ["G", "Groove", "在 phrase 中途切换计时 groove。"],
          ["R", "Retrig", "快速重新触发音符（滚动/口吃）。"],
          ["W", "Wave", "切换活动乐器的波形/算法。"],
          ["Z", "Random", "在范围内随机化前一个命令的值。"],
        ]}
      />

      <H2>值如何工作</H2>
      <Table
        headers={["值", "含义"]}
        rows={[
          [<Hex value={0x00} key="0" link={false} />, "关 / 最小 / 无效果"],
          [<Hex value={0xff} key="ff" link={false} />, "最大"],
          [<Hex value={0x80} key="80" link={false} />, "中央 / 中性 / '无偏移'（对于有符号值）"],
          [<Hex value={0x40} key="40" link={false} />, "四分之一；对中等值常见"],
          [<Hex value={0xc0} key="c0" link={false} />, "四分之三"],
        ]}
      />
      <Aside title="一目了然地读十六进制值" variant="tip">
        高半字节 × 16 + 低半字节 = 十进制值。<Hex value={0x42} link={false} /> 是
        4×16 + 2 = 66。你几乎从不必这样做；几次会话后你将感觉到{" "}
        <Hex value={0x40} link={false} /> 在表盘上的位置。
      </Aside>

      <H2>双效果行</H2>
      <P>每行有<Strong>两个</Strong>效果列。两者在同一行触发，按从左到右的顺序。对于以下组合很有用：</P>
      <CodeBlock>
{`note   inst   CMD1 VAL1   CMD2 VAL2
C-4    00     L03         OFF       ← 滑音上 + 完全右声相
D#4    01     V42         K06       ← 颤音 + 6 tick 后切断
A-3    00     P81         R04       ← 音高弯曲下 + 重新触发`}
      </CodeBlock>

      <H2>"持续"的效果</H2>
      <P>一些效果（音高、颤音、滑动）持续运行直到某物替换它们。在后续行设置 <Code>V00</Code> 显式关闭颤音。让列空着只是继续之前的设置。</P>
      <P>其他效果（kill、delay、retrig）只在它们写入的行触发，然后完成。</P>

      <H2>Hop 命令 (H)</H2>
      <P>
        Hop 在当前 phrase 内跳转播放头。<Code>H00</Code> 停止该通道的播放。
        <Code>H08</Code> 跳到第 8 行。用于在 phrase 内创建循环或在模式中途
        停止通道。
      </P>

      <H2>为什么效果命令在这方面胜过音频插件</H2>
      <P>
        在 DAW 中你会添加一个音高弯曲自动化通道，绘制一条曲线，按播放。
        在音轨编辑器中你在单元格中写 <Code>P03</Code>，工作以零次点击完成。
        在整首歌曲中乘以这个，节省的时间是巨大的。代价是你必须记住命令
        代码 — 但常见的大约有十几个，你将在一周内学会它们。
      </P>

      <H2>接下来读什么</H2>
      <P>
        <Crossref to="song-chain-phrase" /> 了解 phrase 如何在更大的结构中
        生存。如果像 <Hex value={0x42} link={false} /> 这样的值仍然神秘，请
        阅读 <Crossref to="hexadecimal" />。
      </P>
    </>
  );
}

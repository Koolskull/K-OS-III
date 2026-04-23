import { Lead, Code, Crossref } from "@/components/doc/elements";

export default function Glossary() {
  return (
    <>
      <Lead>
        K-OS 特定术语的快速查找。与每个概念被深入解释的较长文章交叉引用。
      </Lead>

      <Term name="Asset Base">K-OS 捆绑资源所在的绝对 URL，可在构建时通过 <Code>NEXT_PUBLIC_ASSET_BASE</Code> 配置。</Term>
      <Term name="Base Path">应用提供服务的 URL 路径前缀，例如 <Code>koolskull.github.io/k-os</Code> 的 <Code>/k-os</Code>。</Term>
      <Term name="Beta">当前发布阶段（<Code>0.2.0-beta.1</Code>）。可工作、可构建，但粗糙。</Term>
      <Term name="BPM">每分钟节拍数 — 歌曲的节奏。在 F7 项目屏幕上设置，可以用 <Code>T</Code> 效果命令在歌曲中途更改。</Term>
      <Term name="Chain">最多 16 个 phrase ID 按顺序播放的序列，带可选的每步移调。<Crossref to="song-chain-phrase" /> 参见。</Term>
      <Term name="Channel">8 个音频输出通道之一。每个通道在任何给定时间播放一个 chain。</Term>
      <Term name="CMD1 / CMD2">phrase 行中的两个效果命令列。<Crossref to="effect-commands" /> 参见。</Term>
      <Term name="Datamoshpit">K-OS 的旗舰应用 — 音乐音轨编辑器。包括 Song / Chain / Phrase 编辑器、乐器编辑、样本加载、实时垫、Scene VM。</Term>
      <Term name=".dmpit">K-OS 项目文件扩展名。包含 <Code>project.json</Code> 和二进制样本文件的 ZIP 归档。<Crossref to="dmpit-format" /> 参见。</Term>
      <Term name="FM Synthesis">频率调制合成。K-OS 的主要合成引擎，模型基于 Sega Genesis / Mega Drive 中使用的 Yamaha YM2612。</Term>
      <Term name="Hex / Hexadecimal">基数 16 数字系统。在 K-OS 中各处用于 ID 和效果值。<Crossref to="hexadecimal" /> 参见。</Term>
      <Term name="Instrument">声源加可选视觉。K-OS 每个项目支持 256 个乐器。</Term>
      <Term name="Keyframe">视觉时间线上变换值显式设置的点。<Crossref to="scene-vm" /> 参见。</Term>
      <Term name="KoolDraw">K-OS 的像素艺术精灵编辑器。桌面上的独立应用；可从 F4 乐器视觉编辑器作为精灵创建表面嵌入。</Term>
      <Term name="LGPT">LittleGPTracker。K-OS 输入模型基于的 PSP 时代音轨编辑器。</Term>
      <Term name="Live Mode">chain 在当前 song 行循环而不是前进的播放模式。</Term>
      <Term name="Macro">乐器上的用户可分配旋钮/滑块，映射到一个或多个合成参数。</Term>
      <Term name="MIDI">音乐设备数字接口。K-OS 通过 Web MIDI API 支持 MIDI 输入。</Term>
      <Term name="Phrase">最小的可重用音乐单位 — 通常 16 行音符、乐器和效果数据。<Crossref to="song-chain-phrase" /> 参见。</Term>
      <Term name="PicoTracker">基于 RP2040 的硬件音轨编辑器，LGPT 的精神继任者。</Term>
      <Term name="Quick-Fill">K-OS 用最近触摸的 phrase 或 chain ID 预填充空 chain 步骤和 song 单元格。LGPT 的 <Code>lastPhrase_</Code> 技巧。</Term>
      <Term name="Scene VM">Visual Module 运行时 — K-OS 用于与音频同步触发的视觉的机制。<Crossref to="scene-vm" /> 参见。</Term>
      <Term name="Slimentologika">K-OS 自定义的 16 字形字母表，在音轨编辑器 UI 中替换十六进制位。用 <Code>Tab</Code> 切换。<Crossref to="slimentologika" /> 参见。</Term>
      <Term name="Song">顶级编排 — 行 × 8 通道，每个单元格保存一个 chain ID。<Crossref to="song-chain-phrase" /> 参见。</Term>
      <Term name="Song Mode">默认播放模式。chain 通过其填充的步骤播放并在 chain 内循环；song 行在 chain 达到全部 16 个填充步骤时前进。</Term>
      <Term name="Static Export">Next.js 产生静态 <Code>out/</Code> 文件夹的构建模式，可由任何 Web 主机提供服务。</Term>
      <Term name="Table">每 tick 效果的 16 行循环子例程。绑定到乐器以进行细致的声音塑形。</Term>
      <Term name="Tick">音轨编辑器中最小的时间单位。一个 tick = 60 / (BPM × TPB) 秒。</Term>
      <Term name="TPB">每拍 tick 数。一拍中的 tick 数。默认 6。</Term>
      <Term name="Tracker">使用文本垂直电子表格而不是钢琴卷的音乐软件类。<Crossref to="what-is-a-tracker" /> 参见。</Term>
      <Term name="Transpose">应用于 phrase 中每个音符的半音偏移，在 chain 中按步骤设置。</Term>
      <Term name="Turbopack">Next.js 的增量打包器，用于 K-OS 的 <Code>npm run dev</Code> 和 <Code>npm run build</Code>。</Term>
      <Term name="VAL1 / VAL2">phrase 行中的两个效果值列。各两个十六进制位，与各自的 CMD 列配对。</Term>
      <Term name="VMI">Visual Machine Interface — K-OS 用于按钮状态和动画 UI 元素的分层 PNG 序列约定。</Term>
      <Term name="WASM">WebAssembly — 在浏览器中运行的二进制格式。</Term>
      <Term name="YM2612">来自 Sega Genesis 的 Yamaha 4 操作员 FM 合成芯片。K-OS 的 FM 合成器声音以它为模型。</Term>
    </>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #222" }}>
      <div style={{ fontFamily: "var(--dm-font-primary), monospace", fontSize: 13, letterSpacing: 1, color: "#ffff00", marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "#dddddd" }}>{children}</div>
    </div>
  );
}

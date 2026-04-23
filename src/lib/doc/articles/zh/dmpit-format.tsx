import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function DmpitFormat() {
  return (
    <>
      <Lead>
        K-OS 项目文件（<Code>.dmpit</Code>）是一个 ZIP 归档，包含一个 JSON
        文档加上二进制样本文件。它故意可读 — 你可以用任何标准工具解压并
        检查里面的内容。本文记录该结构，让你可以编写工具、审计保存，或
        在主机之间迁移项目。
      </Lead>

      <H2>该文件是 zip</H2>
      <P>将 <Code>.dmpit</Code> 重命名为 <Code>.zip</Code>，你的 OS 会打开它。或者使用命令行：</P>
      <CodeBlock>
{`unzip -l my-song.dmpit

# 典型输出：
#   project.json
#   samples/00_KICK.wav
#   samples/01_SNARE.wav
#   samples/02_HAT.wav`}
      </CodeBlock>

      <H2>project.json</H2>
      <P>项目的唯一真实来源。JSON 格式。大致看起来像这样：</P>
      <CodeBlock label="顶层形状（缩短）">
{`{
  "version": "0.1.0",
  "name": "MY SONG",
  "song": { "id": 0, "name": "MY SONG", "bpm": 120, "tpb": 6, "channels": 8, "rows": [...] },
  "chains": [{ "id": 0, "steps": [...] }],
  "phrases": [{ "id": 0, "rows": [...] }],
  "tables": [{ "id": 0, "rows": [...], "loopStart": 0 }],
  "instruments": [
    {
      "id": 0,
      "name": "FM BASS",
      "type": "fm",
      "fmAlgorithm": 0,
      "fmOperators": [...],
      "visual": {
        "enabled": true,
        "source": "color",
        "color": "#ff00aa",
        "totalFrames": 24,
        "triggerMode": "play-from-start"
      }
    }
  ],
  "samples": [{ "id": 0, "name": "KICK", "file": "samples/00_KICK.wav" }]
}`}
      </CodeBlock>

      <H2>样本文件</H2>
      <P>
        音频样本作为原始的 <Code>.wav</Code> 文件存储在 zip 内的{" "}
        <Code>samples/</Code> 文件夹中。JSON 通过相对路径引用它们。加载时，
        K-OS 读取 WAV 字节并将它们解码为内存中的音频缓冲区。
      </P>

      <H2>记录如何存储</H2>
      <H3>Phrases 和 chains：稀疏</H3>
      <P>
        K-OS 仅存储实际编辑过的 phrase 和 chain。具有一个 phrase 的项目在{" "}
        <Code>phrases[]</Code> 中有一个条目，而不是 256 个。参见{" "}
        <Crossref to="song-chain-phrase" /> 了解 ID 如何工作。
      </P>

      <H3>Instruments：始终 256</H3>
      <P>
        Instruments 预分配为 256 个条目的数组（每个 ID 一个）。大多数槽是空白
        的"null"乐器；你配置的少数携带有意义的数据。固定长度保持按 ID 查找
        为 O(1)。
      </P>

      <H3>Instruments 上的视觉数据</H3>
      <P>
        如果乐器有配置的视觉（F4 VISUAL 部分打开），视觉记录在 <Code>visual</Code>{" "}
        键下包含在乐器中。通过 <Code>LOAD</Code> 上传或通过{" "}
        <Code>DRAW [KOOLDRAW]</Code> 绘制的图像数据作为数据 URL 嵌入到{" "}
        <Code>assetUrl</Code> 字段中 — 项目文件保持自包含。
      </P>

      <H3>自定义关键帧</H3>
      <P>
        如果你使用时间线编辑器为乐器视觉创作了自定义关键帧，那些会落在{" "}
        <Code>visual.customKeyframes[]</Code> 中。
      </P>

      <H2>版本控制</H2>
      <P>
        顶层 <Code>version</Code> 字段当前为 <Code>"0.1.0"</Code>。K-OS 读取
        任何项目，无论版本如何。
      </P>
      <Aside title="Beta 格式警告" variant="warn">
        K-OS 的 <Code>0.2.0-beta</Code> 版本可能会在 <Code>0.3</Code> 之前
        更改格式。在你构建项目时本地保存它们。
      </Aside>

      <H2>加载项目</H2>
      <P>
        代码路径：<Code>src/engine/project/ProjectIO.ts</Code>。函数{" "}
        <Code>loadProjectFile(blob)</Code> 接受一个 Blob，解压 zip，解析{" "}
        <Code>project.json</Code>，从 zip 将样本二进制数据恢复为{" "}
        <Code>ArrayBuffer</Code>，并返回完全类型化的 <Code>ProjectData</Code> 对象。
      </P>

      <H2>针对该格式编写工具</H2>
      <P>该格式是普通 ZIP + 普通 JSON。编写工具来批量重命名乐器或提取样本名称很简单：</P>
      <UList>
        <Li>使用任何 ZIP 库提取 <Code>project.json</Code>。</Li>
        <Li>解析 JSON。</Li>
        <Li>操作内存对象。</Li>
        <Li>用修改后的 JSON 写回，保持样本二进制完整，重新压缩。</Li>
      </UList>

      <H2>接下来读什么</H2>
      <UList>
        <Li><Crossref to="song-chain-phrase" /> 了解每个顶层数据结构代表什么。</Li>
        <Li><Crossref to="per-instrument-visuals" /> 了解视觉子对象的含义。</Li>
      </UList>
    </>
  );
}

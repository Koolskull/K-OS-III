import { Lead, P, H2, UList, Li, Strong, Crossref, Aside } from "@/components/doc/elements";

export default function Welcome() {
  return (
    <>
      <Lead>
        K-OS III 是一个在浏览器中运行的虚构操作系统，并且真的可以用于制作音乐、
        美术，以及（最终的）链上工作。本手册将告诉你它内部有什么、如何使用它，
        以及 — 如果你愿意 — 如何阅读它的代码。
      </Lead>

      <P>
        无需任何编程、音乐软件或操作系统的知识即可开始。本手册以小型百科全书
        的方式构建 — 前面是简短的文章，从中链接到更深入的文章。读你感兴趣的
        任何内容。
      </P>

      <H2>如果你从未使用过音轨编辑器</H2>
      <P>
        从 <Crossref to="what-is-a-tracker" /> 开始。它解释了 K-OS 围绕构建的
        音乐软件类型 — 与 Spotify 或 GarageBand 中的任何东西都不同，但比看起来
        简单。然后，<Crossref to="hexadecimal" />（一个简短的页面）会教你
        将需要的唯一一种奇怪的数学。
      </P>

      <H2>如果你使用过 LSDJ、LGPT 或 PicoTracker</H2>
      <P>
        K-OS 会很快让你感到熟悉。浏览 <Crossref to="song-chain-phrase" /> 了解
        K-OS 做事略有不同的少数地方，然后跳到{" "}
        <Crossref to="effect-commands" /> 和{" "}
        <Crossref to="per-instrument-visuals" /> — 视觉部分是 K-OS 与那些音轨
        编辑器之间最大的差异。
      </P>

      <H2>如果你想在自己的机器上运行 K-OS</H2>
      <P>
        如果你从未打开过终端，请阅读 <Crossref to="terminal-basics" />，然后{" "}
        <Crossref to="running-k-os-locally" /> 提供准确的命令。包括等待{" "}
        <code>npm install</code> 在内总共二十分钟。
      </P>

      <H2>如果你想知道这一切是如何构建的</H2>
      <P>
        <Crossref to="scene-vm" /> 深入研究视觉引擎。
        <Crossref to="dmpit-format" /> 描述项目保存格式。
        <Crossref to="the-rules" /> 解释设计约束 — 不要圆角、不要抗锯齿、
        不要流行预设字体 — 以及它们为何重要。
      </P>

      <Aside title="本手册和 K-OS 的其他部分一样有自己的观点">
        在严肃的人们意见分歧的话题上（历史、技术、神学、经济学），本手册
        呈现辩论本身而非定论。请参阅项目的{" "}
        <a
          href="https://github.com/Koolskull/K-OS-III/blob/master/docs/EPISTEMIC_STANCE.md"
          style={{ color: "#ffff00" }}
        >
          EPISTEMIC_STANCE.md
        </a>{" "}
        了解完整立场。下面的技术文章坚持事实；当某事是项目偏好与客观测量的
        区别时，我们会明确说明。
      </Aside>

      <H2>快速链接</H2>
      <UList>
        <Li><Strong>音轨编辑器基础：</Strong> <Crossref to="what-is-a-tracker" /> · <Crossref to="hexadecimal" /> · <Crossref to="song-chain-phrase" /></Li>
        <Li><Strong>视觉：</Strong> <Crossref to="per-instrument-visuals" /> · <Crossref to="scene-vm" /></Li>
        <Li><Strong>本地开发：</Strong> <Crossref to="terminal-basics" /> · <Crossref to="running-k-os-locally" /></Li>
        <Li><Strong>参考：</Strong> <Crossref to="effect-commands" /> · <Crossref to="dmpit-format" /> · <Crossref to="glossary" /></Li>
      </UList>
    </>
  );
}

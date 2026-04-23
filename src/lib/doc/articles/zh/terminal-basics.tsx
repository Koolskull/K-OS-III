import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function TerminalBasics() {
  return (
    <>
      <Lead>
        <Strong>终端</Strong>（也称为命令行、shell 或控制台）是计算机的纯文本
        界面。你输入命令，按回车，计算机回应。它看起来很古老，是开发人员
        拥有的最强大的工具之一。要在自己的机器上运行 K-OS 你需要使用一个 — 但
        只是短暂地，并且只是为了少数几个命令。
      </Lead>

      <H2>为什么要费心</H2>
      <P>
        你在计算机上做的几乎所有事情都是终端所做之事的包装器。安装软件的
        图形应用程序是下载和解压文件的终端命令的包装器。Finder 窗口是列出
        和打开文件的终端命令的包装器。包装器看起来更漂亮；终端做得更多、
        更快，并允许你将命令串联起来。
      </P>
      <P>
        对于 K-OS 具体来说，你需要终端来：安装 Node.js 依赖（一个命令）、
        启动本地开发服务器（一个命令）、从 GitHub 拉取项目更新（一个命令）。
        就是这样。你不必住在那里。
      </P>

      <H2>如何打开</H2>
      <H3>在 macOS 上</H3>
      <UList>
        <Li>按 <Code>⌘ + Space</Code> 打开 Spotlight，输入 <Strong>terminal</Strong>，按回车。</Li>
        <Li>或打开 Finder → 应用程序 → 实用工具 → 终端。</Li>
      </UList>
      <H3>在 Windows 上</H3>
      <UList>
        <Li>按 Windows 键，输入 <Strong>terminal</Strong>，按回车。（Windows 11 自带 Windows Terminal；Windows 10 有 PowerShell — 都可以。）</Li>
        <Li>为获得最 Linux 的体验，从 Microsoft Store 安装 <Strong>WSL</Strong>（Windows Subsystem for Linux）。K-OS 说明假设有类 Unix 的 shell，WSL 提供了它。</Li>
      </UList>
      <H3>在 Linux 上</H3>
      <UList>
        <Li>你可能已经知道。在大多数发行版上 <Code>Ctrl+Alt+T</Code>，或在桌面上右击 → "打开终端"。</Li>
      </UList>

      <H2>你将看到什么</H2>
      <P>
        在以 <Code>$</Code> 或 <Code>%</Code> 或 <Code>&gt;</Code> 结尾的提示符
        旁边的闪烁光标。那是 shell 在等你输入。提示符之前的任何内容都是
        信息：你的用户名、当前文件夹、有时是时间。现在不要担心。
      </P>
      <CodeBlock label="典型的提示符是这样">
{`koolskull@laptop ~/Documents $ _`}
      </CodeBlock>

      <H2>你真正需要的五个命令</H2>
      <P>精简列表。掌握这些，你就能做 K-OS 要求的所有事情。</P>
      <Aside title="命令约定" variant="info">
        当本手册显示像 <Code>cd K-OS-III</Code> 这样的命令时，你完全输入{" "}
        <Code>cd K-OS-III</Code>，然后按回车。终端执行操作并向你显示结果
        （或者什么也不显示，如果操作是无声成功）。
      </Aside>

      <H3>1. <Code>pwd</Code> — "print working directory"（打印工作目录）</H3>
      <P>告诉你当前在哪个文件夹。有疑问时，运行这个。</P>
      <CodeBlock>{`pwd`}</CodeBlock>

      <H3>2. <Code>ls</Code> — 列出当前文件夹中的文件</H3>
      <P>显示你所在文件夹中的内容。<Code>ls -la</Code> 显示隐藏文件和详细信息（大小、修改日期）。</P>
      <CodeBlock>{`ls
ls -la`}</CodeBlock>

      <H3>3. <Code>cd</Code> — "change directory"（移动到文件夹）</H3>
      <P>
        <Code>cd Documents</Code> 将你移动到名为 Documents 的文件夹（如果它
        在你当前的文件夹中存在）。<Code>cd ..</Code> 将你向上移动一级。
        <Code>cd ~</Code> 将你带回你的主文件夹。
      </P>
      <CodeBlock>{`cd Documents
cd ~/Projects/K-OS-III
cd ..`}</CodeBlock>

      <H3>4. <Code>git clone</Code> — 从 GitHub 下载项目</H3>
      <P>将远程仓库复制到你的当前文件夹。K-OS 位于 <Code>github.com/Koolskull/K-OS-III</Code>：</P>
      <CodeBlock>{`git clone https://github.com/Koolskull/K-OS-III.git`}</CodeBlock>
      <P>这完成后，<Code>ls</Code> 将显示你当前位置中的新 <Code>K-OS-III</Code> 文件夹。<Code>cd</Code> 进入它。</P>

      <H3>5. <Code>npm</Code> — Node Package Manager</H3>
      <P>
        K-OS 是一个 Node.js 项目。<Code>npm</Code> 是安装它依赖的库并运行
        其脚本的工具。K-OS 需要的确切 npm 命令在下一页（
        <Crossref to="running-k-os-locally" />）。现在，只需知道{" "}
        <Code>npm</Code> 是你将用来启动本地开发服务器的工具。
      </P>

      <H2>能省时间的事</H2>
      <UList>
        <Li><Strong>Tab 补全。</Strong>输入部分文件名，按 Tab，shell 帮你补全。按两次列出匹配项。</Li>
        <Li><Strong>上箭头。</Strong>调用你运行的最后一个命令。两次上箭头表示两个命令前，等等。节省你的手指。</Li>
        <Li><Strong><Code>Ctrl+C</Code> 停止运行中的命令。</Strong>当开发服务器正在运行而你想停止它时，那是按键。不是 Cmd+W，不是关闭终端 — Ctrl+C。</Li>
        <Li><Strong><Code>Ctrl+L</Code>（或 <Code>clear</Code>）清屏。</Strong>当输出变得嘈杂时。</Li>
        <Li><Strong>将文件夹拖放到终端窗口</Strong>在大多数 OS 上 — 它粘贴文件夹的完整路径。当你不记得要输入的确切路径时很有用。</Li>
      </UList>

      <H2>如果出问题</H2>
      <UList>
        <Li><Code>command not found</Code> — 你尝试运行的程序没有安装（或不在你的 PATH 中）。对于 npm，那意味着你需要 Node.js。</Li>
        <Li><Code>permission denied</Code> — 通常你试图写入你不拥有的文件夹。大多数情况下，解决方案是从你拥有的文件夹运行（你的主目录，而不是系统文件夹）。</Li>
        <Li><Code>no such file or directory</Code> — 路径中的拼写错误，或你不在你认为你在的地方。运行 <Code>pwd</Code> 和 <Code>ls</Code> 来确定方位。</Li>
        <Li><Strong>终端卡住了。</Strong>试 <Code>Ctrl+C</Code>。如果没用，关闭终端打开一个新的。</Li>
      </UList>

      <H2>接下来读什么</H2>
      <P>
        打开终端并定位好后，前往 <Crossref to="running-k-os-locally" /> 获取
        实际的 K-OS 命令。
      </P>
    </>
  );
}

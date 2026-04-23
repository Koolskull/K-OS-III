import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function RunningKOSLocally() {
  return (
    <>
      <Lead>
        在自己的机器上运行 K-OS 第一次大约需要十分钟，主要是等待下载。之后，
        启动它就是一个命令。本文从"我打开了终端"到"K-OS 在我的浏览器中
        localhost 上运行"贯穿每一步。如果你还没有打开终端，请从{" "}
        <Crossref to="terminal-basics" /> 开始。
      </Lead>

      <H2>首先你需要什么</H2>
      <UList>
        <Li><Strong>Node.js v20 或更新版本。</Strong>从 <a href="https://nodejs.org" style={{ color: "#ffff00" }}>nodejs.org</a> 下载。使用默认设置安装。</Li>
        <Li><Strong>Git。</Strong>在 Mac 和 Linux 上几乎肯定已经安装。在 Windows 上，通过 <a href="https://git-scm.com" style={{ color: "#ffff00" }}>git-scm.com</a> 安装或使用 WSL。</Li>
        <Li><Strong>大约 1 GB 的磁盘空间。</Strong>K-OS 本身很小，但其依赖（Next.js、Three.js、Tone.js 等）会累积起来。</Li>
      </UList>

      <Aside title="验证你的安装" variant="tip">
        在终端中，运行 <Code>node --version</Code> 和 <Code>git --version</Code>。
        两者都应打印版本号。如果其中之一说"command not found"，先安装那个工具。
      </Aside>

      <H2>逐步</H2>

      <H3>1. 选择一个工作文件夹</H3>
      <P>K-OS 将成为你所在位置的子文件夹。大多数人将项目放在 <Code>~/Documents</Code> 或 <Code>~/Projects</Code> 下：</P>
      <CodeBlock>{`cd ~/Documents`}</CodeBlock>

      <H3>2. 克隆仓库</H3>
      <CodeBlock>{`git clone https://github.com/Koolskull/K-OS-III.git`}</CodeBlock>
      <P>Git 下载整个项目（~50 MB）。完成后，你将看到一个新文件夹。<Code>ls</Code> 确认：</P>
      <CodeBlock>{`ls
# 你应该在列表中看到 K-OS-III`}</CodeBlock>

      <H3>3. 进入项目文件夹</H3>
      <CodeBlock>{`cd K-OS-III`}</CodeBlock>
      <P>下面的所有内容都假设你在这个文件夹内。如果你迷失方向，运行 <Code>pwd</Code> — 它应以 <Code>K-OS-III</Code> 结尾。</P>

      <H3>4. 安装依赖</H3>
      <CodeBlock>{`npm install --legacy-peer-deps`}</CodeBlock>
      <P>
        这是慢的部分。<Code>npm</Code> 读取 <Code>package.json</Code>，下载
        K-OS 依赖的每个库，并将它们放在名为 <Code>node_modules</Code> 的
        文件夹中。第一次运行根据你的网络需要 1-3 分钟。你会看到大量滚动
        的输出，最后会有类似"added 412 packages"的内容。那就是成功。
      </P>
      <P>
        需要 <Code>--legacy-peer-deps</Code> 标志，因为某些 K-OS 依赖声明
        了过于严格的版本要求，npm 通常会拒绝满足。该标志告诉 npm"忽略那些，
        使用 package.json 中实际的内容"。它是安全和有意的 — 如果你忘记它，
        你会看到一堵红色错误墙，安装将中止。
      </P>

      <H3>5. 启动开发服务器</H3>
      <CodeBlock>{`npm run dev`}</CodeBlock>
      <P>Next.js 启动一个本地 Web 服务器。几秒钟内你会看到：</P>
      <CodeBlock label="你应该看到类似这样的内容">
{`▲ Next.js 16.1.6 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.1.X:3000

✓ Ready in 358ms`}
      </CodeBlock>

      <H3>6. 在浏览器中打开</H3>
      <P>
        访问 <Code>http://localhost:3000</Code>。K-OS 启动序列滚动，桌面加载，
        你就在里面了。就这样。你正在运行 K-OS。
      </P>

      <Aside title="开发服务器持续运行" variant="info">
        你启动 <Code>npm run dev</Code> 的终端现在忙于服务应用。让它保持
        打开。当你编辑源文件时，服务器检测到更改，浏览器自动刷新（这称为
        Hot Module Reload）。要停止服务器，在该终端中按 <Code>Ctrl+C</Code>。
      </Aside>

      <H2>你可能想要的其他命令</H2>

      <H3><Code>npm run build</Code></H3>
      <P>
        构建 K-OS 的生产版本。运行 TypeScript 编译器，打包所有内容，优化
        资源。GitHub Pages 部署和任何真正发布站点的内容都使用它。如果有
        TypeScript 错误或代码有 <Code>npm run dev</Code> 容忍但生产不容忍
        的问题，则失败。
      </P>

      <H3><Code>npm run lint</Code></H3>
      <P>运行类型检查器。告诉你代码是否有类型错误。在提交 pull request 前运行。</P>

      <H3><Code>npm run preview:export</Code></H3>
      <P>
        构建静态导出（与发布到 <Code>koolskull.github.io/k-os</Code> 相同的
        输出）并在端口 4044 上本地提供。使用此命令验证更改在生产构建中工作，
        而不仅是在 dev 模式下。URL 是 <Code>http://localhost:4044/k-os/</Code>{" "}
        — 注意 <Code>/k-os/</Code> 路径前缀。
      </P>

      <H2>如果出问题</H2>

      <H3>"npm: command not found"</H3>
      <P>Node.js 没有安装，或者你的终端会话没有捕获到它。从 nodejs.org 安装 Node，然后关闭并重新打开终端。</P>

      <H3>"port 3000 is already in use"</H3>
      <P>其他东西正在使用端口 3000（也许你忘记的早期 <Code>npm run dev</Code>）。要么终止其他进程，要么在不同的端口上运行：</P>
      <CodeBlock>{`PORT=3050 npm run dev`}</CodeBlock>

      <H3>"Cannot find module ..."</H3>
      <P>依赖没有完全安装。删除 <Code>node_modules</Code> 然后重新运行 install：</P>
      <CodeBlock>{`rm -rf node_modules package-lock.json
npm install --legacy-peer-deps`}</CodeBlock>

      <H3>浏览器显示空白页面或 "ECONNREFUSED"</H3>
      <UList>
        <Li>检查终端 — 开发服务器还在运行吗？它是否因错误而崩溃？</Li>
        <Li>浏览器指向正确的端口吗？（通常是 3000。）</Li>
        <Li>尝试不同的浏览器。Audio + WebGL + Web MIDI 在最新的 Chrome/Firefox/Safari 中工作得最好。</Li>
      </UList>

      <H2>接下来读什么</H2>
      <P>K-OS 运行后，深入实际应用：</P>
      <UList>
        <Li><Crossref to="what-is-a-tracker" /> — 如果你想开始使用 Datamoshpit。</Li>
        <Li><Crossref to="dmpit-format" /> — 如果你对保存的项目如何存储感兴趣。</Li>
        <Li><Crossref to="the-rules" /> — 如果你想贡献代码。</Li>
      </UList>
    </>
  );
}

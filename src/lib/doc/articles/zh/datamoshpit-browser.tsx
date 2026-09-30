import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Table, Crossref } from "@/components/doc/elements";

export default function ThrashTrackerBrowser() {
  return (
    <>
      <Lead>
        Thrash Tracker 窗口是 Thrash Tracker 的浏览器版。歌曲形状与桌面版相同：八个通道、十六步的 chain、phrase、table、振荡器、采样，以及四算子调频。插件乐器会留在文件里，但不会出声。
      </Lead>

      <Aside title="新歌从 Amen break 开始" variant="warn">
        乐器 <Code>00</Code> 的名字是 <Code>AMEN</Code>。它是作为采样播放的 Amen break。phrase <Code>00</Code> 有 <Code>80</Code> 行，每拍八行，第 <Code>00</Code> 行是 <Code>C-4</Code>，所以文件按录音速度播放。速度被锁成这四小节和录音一样长。在 song 页按空格会播放这段 break，通道回到第 <Code>00</Code> 行，直到再按一次空格或 Escape。新的空白乐器仍是短方波：Ctrl+Shift+N。
      </Aside>

      <H2>你在哪一页</H2>
      <P>
        画布是 960×540。角落的地图有两行。Shift+F1 到 Shift+F8 跳到对应格子。Shift+方向键在地图上移动，到边缘就停下。
      </P>
      <CodeBlock label="地图">{`S  C  P  L     song, chain, phrase, rack
T  I  V  R     table, instrument, visualiser, project`}</CodeBlock>
      <Table
        headers={["格子", "Shift", "是什么"]}
        rows={[
          ["S", "F1", "Song。256 行，通道 C0–C7。每格是 chain 编号，或 --。"],
          ["C", "F2", "Chain。16 步。PH 是 phrase。TR 是移调。"],
          ["P", "F3", "Phrase。列是 NT IN VL SL LP FX VA ST。"],
          ["L", "F4", "Rack。刚才那条 phrase 的四层增益。"],
          ["T", "F5", "Table。与桌面相同的列，包括浏览器还不会发声的列。"],
          ["I", "F6", "乐器。名字、类型、振荡器或 FM 算法、音量、ADSR。"],
          ["V", "F7", "可视化。网格、地图和混音条都隐藏。只留下背景和波形。"],
          ["R", "F8", "项目。名字、BPM、每拍 tick 数、保存、打开。"],
        ]}
      />

      <H2>按键</H2>
      <Table
        headers={["键", "作用"]}
        rows={[
          ["方向键", "移动光标。"],
          ["Shift+方向键", "在地图上换页。"],
          ["空格", "Song：从光标行播放，或停止。Chain 或 phrase：试听那个图案，或停止。"],
          ["Escape", "停止。关掉窗口也会关掉音频。"],
          ["Enter", "Song 打开 chain，格子是空的就新建。Chain 同样打开 phrase。在 phrase 的乐器列上，Enter 打开那个乐器。"],
          ["十六进制 0–9、A–F", "两位数字写入 chain、phrase、乐器、音量、切片或效果值。"],
          ["钢琴，音符列", "下排 zsxdcvgbhnjm,l.;/，上排 q2w3er5t6y7ui9o0p。- 和 = 改八度。八度 4 时 z 是 C-4。"],
          ["Backspace", "清除格子。在名字上则删一个字母。"],
          ["[ ]", "缩短或加长 phrase，最长 FF。"],
          ["Ctrl+方向键", "在乐器、rack 或项目页改变光标下的值。"],
          ["Ctrl+Shift+左/右", "在 phrase 或 chain 上换你正在看的图案。"],
          ["Ctrl+Shift+N", "把下一个空闲乐器做成短方波并打开它。"],
          ["Ctrl+S / Ctrl+O", "下载带采样的 NAME.dm2.json，或打开浏览器工程文件。"],
          ["X / Shift+X / Z", "在 song 页：静音该通道、独奏，或取消全部静音。"],
        ]}
      />

      <H2>你听到的</H2>
      <P>
        播放在 <Code>public/dm2-worklet.js</Code> 里。一行是一个 tick。一个 tick 的长度是 <Code>60 / (BPM × 每拍 tick 数)</Code> 秒。新工程每拍 8 个 tick，所以一拍是八行。速度来自 Amen 文件，使 128 行和录音一样长。
      </P>
      <H3>振荡器、采样、调频</H3>
      <UList>
        <Li><Strong>Synth。</Strong>正弦、方波、锯齿、三角、噪声。</Li>
        <Li><Strong>Sampler。</Strong>把类型设成 sampler 再按 Enter。浏览器解码文件。C-4 是原来的速度。</Li>
        <Li><Strong>FM。</Strong>YM2612 算法布局的四算子，算法 <Code>00</Code>–<Code>07</Code>。这是 worklet 里的重写，不是桌面那颗芯片。</Li>
        <Li><Strong>Plugin。</Strong>可以留在歌曲里。不会出声。状态行会说一次 <Code>PLUGIN STAYS ON THE DESKTOP</Code>。</Li>
      </UList>
      <P>
        没有分槽的乐器只播放第 0 层。phrase <Code>00</Code> 只打开第 0 层，另外三层的增益是 <Code>00</Code>。
      </P>
      <H3>Amen break 和短方波</H3>
      <P>
        乐器 <Code>00</Code> 是 <Code>AMEN</Code>，一个采样器。起音 <Code>00</Code>、衰减 <Code>00</Code>、延音 <Code>64</Code>、释音 <Code>00</Code>。文件播放一次，在录音结束时停下。时间是 <Code>(数值 / 127)² × 4</Code> 秒。
      </P>
      <P>
        Ctrl+Shift+N，或第一次把未使用的乐器编号写进空格子，会做出短方波。名字是 <Code>SQ</Code> 加上十六进制编号。起音 <Code>00</Code>、衰减 <Code>40</Code>、延音 <Code>00</Code>、释音 <Code>40</Code>。在格子改指向它之前，它不会替换 <Code>AMEN</Code>。写进空格子时还会写入 <Code>C-4</Code> 和音量 <Code>80</Code>。
      </P>
      <H3>效果和 table</H3>
      <P>phrase 有一个命令和一个数值。worklet 会发声的只有两个命令：</P>
      <Table
        headers={["命令", "听到的"]}
        rows={[
          ["KL", "在这一行切断音符。"],
          ["VO", "用数值设置这一行的增益。7F 大约是原音量。"],
        ]}
      />
      <P>
        <Crossref to="effect-commands" /> 里那份长命令表不是这个窗口在播放的内容。那些字母可以输入，但还不会改变声音。table 在移调打开时可以改变音高。切片、重触发、滤波、压碎，以及 table 自己的效果列会被保存并画出来。worklet 还不会应用它们。
      </P>

      <H2>chain 如何结束</H2>
      <P>
        没有 phrase 的 chain 步会结束这条 chain，song 行随之前进。如果该通道下一格是空的，通道会回到这一段的开头。出厂歌曲只填了通道 0 的第 <Code>00</Code> 行，所以空格会循环那一条 phrase。空的 phrase 行不会切断音符。采样器在文件结束时停下，所以 Amen break 在 phrase 每次循环时播放一次。
      </P>

      <H2>保存</H2>
      <P>
        每次编辑都会写进这个浏览器的键 <Code>dm2-web-pattern</Code>，里面不含采样音频。Ctrl+S 下载带采样的 <Code>NAME.dm2.json</Code>。采样是小端 16 位 PCM 的 base64。<Code>version</Code> 字段是 <Code>dm2.web</Code>。
      </P>
      <Aside title="不是桌面 .dm2，也不是 .dmpit" variant="info">
        桌面 Thrash Tracker 的 <Code>.dm2</Code> 是另一份 JSON。<Crossref to="dmpit-format">.dmpit</Crossref> 是旧浏览器音轨器的 zip。这个窗口还打不开它们。
      </Aside>

      <H2>这个窗口还不是</H2>
      <UList>
        <Li>没有 VST、AU 或 LV2。没有插件音频。</Li>
        <Li>没有剪贴板、撤销、groove 页，也没有 Slimentologika 切换。</Li>
        <Li>V 格子是波形页，不是桌面那种字体飞过的画面。</Li>
        <Li>2kool.tv 仍是以前的站点。这个音轨器是你正在运行的这份里的窗口。</Li>
      </UList>
    </>
  );
}

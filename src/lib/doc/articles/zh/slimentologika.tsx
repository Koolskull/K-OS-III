import { Lead, P, H2, UList, Li, Strong, Code, Aside, Crossref } from "@/components/doc/elements";

export default function Slimentologika() {
  return (
    <>
      <Lead>
        <Strong>Slimentologika</Strong> 是 KOOLSKULL OS 独有的十六字形像素
        艺术字母表。每个字形一对一映射到一个{" "}
        <Crossref to="hexadecimal">十六进制</Crossref>位（<Code>0</Code>–
        <Code>F</Code>）。在任何音轨编辑器屏幕中按 <Code>Tab</Code> 在标准
        十六进制位和 Slimentologika 之间切换。底层数字相同 — 只是视觉
        表示改变。
      </Lead>

      <H2>它来自哪里</H2>
      <P>
        来自古老的绿色粘液神殿。（也来自：Koolskull。字形集已在副项目中
        悄悄演变了十多年，最终为 K-OS III 编纂。）
      </P>

      <H2>为什么一个项目会发明自己的数字系统</H2>
      <UList>
        <Li><Strong>视觉密度。</Strong>字形设计为在小尺寸 — 8×8 像素 — 下可读，而不损害区分度。标准十六进制位在 8×8 开始看起来一样。</Li>
        <Li><Strong>身份。</Strong>Slimentologika 是 K-OS 美学的最显眼部分。这是 OS 宣告它是什么的方式。</Li>
        <Li><Strong>模式识别。</Strong>一旦你的眼睛学会字形家族（圆形、方形、对角线），你按形状而不是按位读取多位值。最终比读取十六进制更快。</Li>
        <Li><Strong>可选。</Strong>如果你不想要它，你不使用它。Tab 切换。数据模型中没有任何东西使用 Slimentologika；它纯粹是显示层。</Li>
      </UList>

      <H2>字形</H2>
      <P>
        十六个像素艺术图标。前四个（<Code>0</Code>–<Code>3</Code>）最简单，
        值得首先记住，因为它们出现在几乎每个值中（因为 <Code>00</Code> 到{" "}
        <Code>3F</Code> 涵盖了最小的常见范围）。
      </P>
      <P>
        完整的参考图像在 K-OS 的 <Code>public/sprites/ST0.png</Code> 到{" "}
        <Code>STF.png</Code>。它们通过 <Code>SlimeDigit</Code> 组件
        （<Code>src/components/apps/datamoshpit/ui/SlimeDigit.tsx</Code>）
        渲染。
      </P>

      <H2>方向规则</H2>
      <P>当你在 K-OS 中看到 Slimentologika 时，它对多位值遵循严格规则：</P>
      <UList>
        <Li>在<Strong>水平布局</Strong>（旋钮并排、垫格列）中，位<Strong>垂直堆叠</Strong> — 一个在另一个上面。</Li>
        <Li>在<Strong>垂直布局</Strong>（phrase 行、列表）中，位<Strong>并排</Strong>，从左到右。</Li>
      </UList>
      <P>
        规则是"位垂直于布局方向"。写下来听起来奇怪，在实践中立即明显。
        要点是防止多位值与旁边的值合并。
      </P>

      <H2>实用建议</H2>
      <UList>
        <Li>不要试图一次记住所有十六个。先学 0–3。</Li>
        <Li>困惑时切换到十六进制（<Code>Tab</Code>）。</Li>
        <Li>phrase 行号是最好的学习面 — 你不断看到它们，它们从 <Code>00</Code>–<Code>0F</Code>，所以你自然地一遍又一遍地学习同一些字形。</Li>
        <Li>除非你真的想要，否则不要期望读取 Slimentologika 比十六进制更快。两者都工作得很好。</Li>
      </UList>

      <Aside title="它不是宗教" variant="info">
        K-OS 不会因你是否使用 Slimentologika 给你打分。字形是风味，不是
        要求。如果你在十六进制模式下做所有音乐，从不看一个字形，那也很好。
        如果你全力投入 Slimentologika 并开始用绿色方块字符做梦，那也很好。
        要点是选项存在。
      </Aside>

      <H2>它还出现在哪里</H2>
      <UList>
        <Li>K-OS 启动序列在诗篇之间闪现一些 Slimentologika 字符。</Li>
        <Li>任务栏使用标准 ASCII；Slimentologika 是音轨编辑器独有的。</Li>
        <Li>精灵编辑器的颜色选择器以标准形式显示十六进制值（Slimentologika 在那里还不能切换 — 待定）。</Li>
        <Li>2KOOL Productions 商品和 K-OS 美学进一步传播它。</Li>
      </UList>

      <H2>接下来读什么</H2>
      <UList>
        <Li><Crossref to="hexadecimal" /> 了解底层数字系统。</Li>
        <Li><Crossref to="the-rules" /> 了解 Slimentologika 所处的更广泛的视觉约定。</Li>
      </UList>
    </>
  );
}

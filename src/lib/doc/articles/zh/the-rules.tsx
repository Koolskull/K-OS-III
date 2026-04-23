import { Lead, P, H2, UList, Li, Strong, Code, Aside, Crossref } from "@/components/doc/elements";

export default function TheRules() {
  return (
    <>
      <Lead>
        K-OS 有一小套设计规则，每个 UI 元素都遵循。它们塑造外观、贡献者的
        行为以及添加的功能类型。一些是审美的。所有都是有意的。它们一起
        在数百名贡献者和数十年代码中保持 OS 的一致性。
      </Lead>

      <H2>五条规则</H2>
      <UList>
        <Li><Strong>1. 不要圆角。</Strong>边界是锐利的。按钮是矩形。图标是像素网格。CSS 规则 <Code>border-radius: 0</Code> 全局适用。</Li>
        <Li><Strong>2. 不要抗锯齿。</Strong>像素是清晰的。每个图像上 <Code>image-rendering: pixelated</Code>。正文上 <Code>-webkit-font-smoothing: none</Code>。</Li>
        <Li><Strong>3. 不要渐变按钮。</Strong>仅像素艺术表面。平面填充、插图边框、手绘精灵。没有 CSS 渐变装饰矩形使其看起来像 3D。</Li>
        <Li><Strong>4. 每个像素都赢得它的位置。</Strong>没有填充装饰。每个字形、每条线、每个间隔符都应该在做某事。</Li>
        <Li><Strong>5. 每个文件都被祝福。</Strong>查看大多数源文件顶部的 ASCII 艺术。文化规则，不是 CSS 规则。</Li>
      </UList>

      <H2>为什么特别是这些</H2>
      <P>
        圆角、抗锯齿和渐变是消费者 SaaS 的视觉语言。几乎每个现代 UI 都
        有它们。它们旨在传达"高端、友好、专业"。它们也是通用的 — 当你
        看到它们时，在你阅读标签之前，你不知道你在哪个应用中。
      </P>
      <P>
        K-OS 走相反的方向。锐利的角和可见的像素表明：这是工具，不是产品。
        它属于包括 Game Boy、Amiga、LSDJ、demoscene 制作的传统。当启动
        序列开始时，你就知道你在什么样的房间。
      </P>

      <H2>这在实践中意味着什么</H2>
      <UList>
        <Li><Strong>使用位图字体。</Strong>Kongtext 是主要字体。HD 比例（1280px+）下的 Sometype Mono。其他像素/位图字体可以；现代系统字体（San Francisco、Segoe UI、Roboto）不行。</Li>
        <Li><Strong>文本颜色是单色的。</Strong>白底黑字或黑底白字。交叉引用和 BETA 徽章使用黄色重音。代码用绿色。错误和危险操作用红色。占位符用品红色。</Li>
        <Li><Strong>VMI 资源用于按钮。</Strong>"Visual Machine Interface"系统使用分层 PNG 序列用于按钮状态（默认、悬停、按下）。</Li>
        <Li><Strong>在发明前询问。</Strong>如果你需要没有现有模板的按钮或窗口，请询问维护者。不要自由创造新的装饰。</Li>
      </UList>

      <H2>对于编写代码的贡献者</H2>
      <P>
        上面的 CSS 规则在 <Code>src/app/globals.css</Code> 中通过{" "}
        <Code>border-radius: 0 !important</Code> 全局强制执行。内联样式在
        技术上可以覆盖，但不应该。PR 审阅者检查。
      </P>

      <Aside title="Slimentologika 规则" variant="info">
        多位 <Crossref to="slimentologika">Slimentologika</Crossref> 值
        遵循方向规则：位<Strong>垂直于</Strong>布局堆叠。垂直列表获得
        水平位对；水平行获得垂直位对。这不是装饰，这是可读性。
      </Aside>

      <H2>文化方面</H2>
      <P>
        "每个文件都被祝福"规则意味着每个源文件都获得一个小型 ASCII 艺术
        头部 — 通常是圣人、圣殿十字架或诗篇摘录。这是 K-OS 身份的一部分。
      </P>
      <P>
        来自 <Code>CONTRIBUTING.md</Code>："你不必分享世界观就可以贡献。
        你必须尊重身份是项目的一部分，而不是要被打磨掉的装饰。"
      </P>

      <H2>接下来读什么</H2>
      <UList>
        <Li><Crossref to="welcome" /> 了解规则如何融入更广泛的项目使命。</Li>
        <Li><Crossref to="slimentologika" /> 了解最显眼的审美决定。</Li>
      </UList>
    </>
  );
}

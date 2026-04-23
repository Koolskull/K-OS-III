import { Lead, P, H2, UList, Li, Strong, Code, Aside, Crossref } from "@/components/doc/elements";

export default function Slimentologika() {
  return (
    <>
      <Lead>
        <Strong>Slimentologika</Strong> es un alfabeto pixelado de dieciséis
        glifos único de KOOLSKULL OS. Cada glifo mapea uno-a-uno a un dígito{" "}
        <Crossref to="hexadecimal">hex</Crossref> (<Code>0</Code>–<Code>F</Code>).
        Pulsa <Code>Tab</Code> en cualquier pantalla del tracker para alternar
        entre dígitos hex estándar y Slimentologika. Los números subyacentes
        son idénticos — solo cambia la representación visual.
      </Lead>

      <H2>De dónde viene</H2>
      <P>
        Del Templo Antiguo del Limo Verde. (También: de Koolskull. El conjunto
        de glifos ha estado evolucionando silenciosamente durante más de una
        década en proyectos paralelos, finalmente codificado para K-OS III.)
      </P>

      <H2>Por qué un proyecto inventaría su propio sistema numérico</H2>
      <UList>
        <Li>
          <Strong>Densidad visual.</Strong> Los glifos están diseñados para ser
          legibles a tamaños pequeños — 8×8 píxeles — sin comprometer la
          distinción. Los dígitos hex estándar a 8×8 empiezan a verse iguales.
        </Li>
        <Li>
          <Strong>Identidad.</Strong> Slimentologika es la pieza más visible
          del estilo de K-OS. Es cómo el OS anuncia lo que es.
        </Li>
        <Li>
          <Strong>Reconocimiento de patrones.</Strong> Una vez que tu ojo
          aprende las familias de glifos (los redondos, los cuadrados, los con
          diagonales), lees valores de varios dígitos forma-por-forma en lugar
          de dígito-por-dígito. Más rápido que leer hex, eventualmente.
        </Li>
        <Li>
          <Strong>Opcional.</Strong> Si no lo quieres, no lo usas. Tab alterna.
          Nada en el modelo de datos usa Slimentologika; es puramente una capa
          de display.
        </Li>
      </UList>

      <H2>Los glifos</H2>
      <P>
        Dieciséis íconos de pixel art. Los primeros cuatro (<Code>0</Code>–<Code>3</Code>)
        son los más simples y vale la pena memorizarlos primero porque
        aparecen en casi cada valor (ya que <Code>00</Code> a <Code>3F</Code>{" "}
        cubre el rango común más pequeño).
      </P>
      <P>
        La imagen de referencia completa está en K-OS en{" "}
        <Code>public/sprites/ST0.png</Code> a <Code>STF.png</Code>. Se renderizan
        vía el componente <Code>SlimeDigit</Code> (
        <Code>src/components/apps/datamoshpit/ui/SlimeDigit.tsx</Code>).
      </P>

      <H2>Regla de orientación</H2>
      <P>
        Cuando ves Slimentologika en K-OS, sigue una regla estricta para
        valores de varios dígitos:
      </P>
      <UList>
        <Li>
          En un <Strong>layout horizontal</Strong> (knobs lado a lado, columnas
          de pad-grid), los dígitos se apilan <Strong>verticalmente</Strong> —
          uno encima del otro.
        </Li>
        <Li>
          En un <Strong>layout vertical</Strong> (filas de phrase, listas), los
          dígitos van <Strong>lado a lado</Strong>, izquierda a derecha.
        </Li>
      </UList>
      <P>
        La regla es "los dígitos van perpendiculares a la dirección del
        layout". Suena raro escrito y es instantáneamente obvio en la práctica.
        El punto es evitar que los valores de varios dígitos colapsen en los
        valores junto a ellos.
      </P>

      <H2>Consejo práctico</H2>
      <UList>
        <Li>No intentes memorizar los dieciséis de una vez. Aprende 0–3 primero.</Li>
        <Li>Alterna a hex (<Code>Tab</Code>) cuando estés confundido.</Li>
        <Li>Los números de fila de phrase son la mejor superficie de aprendizaje — los ves constantemente y van <Code>00</Code>–<Code>0F</Code>, así que naturalmente aprendes el mismo puñado de glifos una y otra vez.</Li>
        <Li>No esperes leer Slimentologika más rápido que hex a menos que realmente lo quieras. Ambos funcionan bien.</Li>
      </UList>

      <Aside title="No es una religión" variant="info">
        K-OS no te califica por usar Slimentologika. Los glifos son un sabor,
        no un requisito. Si haces toda tu música en modo hex y nunca miras un
        solo glifo, está bien. Si te lanzas de lleno a Slimentologika y empiezas
        a soñar en ideogramas de cuadrados verdes, también está bien. El punto
        es que la opción existe.
      </Aside>

      <H2>Dónde más aparece</H2>
      <UList>
        <Li>La secuencia de arranque de K-OS muestra algunos caracteres Slimentologika entre Salmos.</Li>
        <Li>La taskbar usa ASCII estándar; Slimentologika es exclusiva del tracker.</Li>
        <Li>El selector de color del Sprite Editor muestra valores hex en forma estándar (Slimentologika no alterna ahí aún — pendiente).</Li>
        <Li>Merch de 2KOOL Productions y la estética de K-OS lo extienden más allá.</Li>
      </UList>

      <H2>Qué leer después</H2>
      <UList>
        <Li><Crossref to="hexadecimal" /> para el sistema numérico subyacente.</Li>
        <Li><Crossref to="the-rules" /> para las convenciones visuales más amplias dentro de las que vive Slimentologika.</Li>
      </UList>
    </>
  );
}

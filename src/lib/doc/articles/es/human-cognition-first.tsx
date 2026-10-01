import { Lead, P, H2, UList, Li, Strong, Em, Crossref, Aside } from "@/components/doc/elements";

export default function HumanCognitionFirst() {
  return (
    <>
      <Lead>
        K-OS toma una postura sobre la persona que lo usa. La mayoría del
        software moderno está optimizado para entrenar el{" "}
        <Em>consumo pasivo</Em> — feeds que no paran de desplazarse, interfaces
        que esconden su propio funcionamiento, apps que piensan por ti para
        que tú sigas produciendo clics. K-OS está construido al revés. Sus
        herramientas te piden que aprendas cómo funcionan para que realmente
        puedas manejarlas.
      </Lead>

      <H2>Consumo vs. digestión</H2>
      <P>
        Consumir medios es para lo que el entretenimiento mainstream está
        optimizado: bucles cortos, victorias fáciles, nada que te lleves
        contigo después. El incentivo de negocio es obvio — la atención es
        inventario, y el inventario que se queda quieto no tiene que ser
        interesante. Décadas de este patrón han entrenado a audiencias enteras
        para <Em>ver</Em> más y <Em>hacer</Em> menos.
      </P>
      <P>
        Digerir información es lo contrario. Reduces el ritmo, notas lo que
        acabas de recibir, puedes darte la vuelta y usarlo. Una herramienta
        que enseña su propio funcionamiento — incluso cuando es menos agradable
        en los primeros cinco minutos — te trata como una persona cuya
        capacidad de procesamiento vale la pena invertir. Una herramienta que
        esconde su funcionamiento para sentirse más fácil te trata como una
        superficie a la que entregar contenido.
      </P>

      <H2>Por qué los trackers enseñan, y las DAWs esconden</H2>
      <P>
        Un tracker presenta todo su modelo musical en pantalla. Ves cada nota,
        cada ID de instrumento, cada comando de efecto como hex literal.
        Nada está abstraído en un misterio. Una vez que lees la cuadrícula,
        entiendes lo que la máquina está haciendo — lo que significa que
        puedes doblarla en cualquier dirección que quieras.
      </P>
      <P>
        La mayoría de las DAWs modernas hacen lo contrario. El modelo de datos
        está escondido tras abstracciones "amigables" que sólo exponen el
        camino feliz. Avanzas más rápido el primer día, y chocas contra un
        techo el día treinta que no tienes el vocabulario para superar. La
        herramienta que era más fácil termina siendo más pequeña.
      </P>
      <P>
        K-OS está construido alrededor del trato del tracker a propósito. Ver{" "}
        <Crossref to="what-is-a-tracker" /> para el argumento del tracker y{" "}
        <Crossref to="hexadecimal" /> para por qué la superficie numérica vale
        la pena aprenderla.
      </P>

      <H2>La tesis del poder creativo</H2>
      <P>
        Aquí va la apuesta a largo plazo: maximizar la capacidad de
        procesamiento de un ser humano es tan importante como maximizar la
        eficiencia de una máquina. Las herramientas que hacen crecer a sus
        usuarios crean artistas, ingenieros, organizadores y pensadores más
        rápido que las herramientas que los miman. En una línea de tiempo lo
        bastante larga, el segundo tipo de herramienta produce una audiencia
        dependiente y el primero produce una capaz.
      </P>
      <P>
        Las personas capaces con agencia creativa son el mecanismo por el
        cual el poder financiero y social realmente se desplaza. No a través
        de la teoría. A través de hacer cosas — música, software, dispositivos,
        sistemas, argumentos — que otras personas puedan usar. Cuanta más de
        esa capacidad existe, distribuida ampliamente, menos frágil queda la
        cultura que la rodea. K-OS existe, en el sentido más amplio, para
        añadirle combustible a eso.
      </P>

      <H2>Qué te pide esto como lector</H2>
      <P>
        No tienes que estar de acuerdo con nada de lo anterior para usar K-OS.
        Pero vale la pena saber por qué el manual se escribió como se escribió.
        Cuando un artículo te pide leer una tabla hex en vez de ver un vídeo
        de treinta segundos, es a propósito. Cuando una UI te muestra campos
        numéricos crudos en vez de presets, es a propósito. Cuando un atajo
        tiene que aprenderse en vez de descubrirse tocando cada icono, es a
        propósito.
      </P>
      <P>
        La recompensa es que sales del otro lado con algo que realmente puedes
        usar — no con algo que consumiste y olvidaste.
      </P>

      <Aside title="Lectura relacionada">
        <Crossref to="why-k-os" /> · <Crossref to="the-rules" /> ·{" "}
        <Crossref to="what-is-a-tracker" />
      </Aside>

      <H2>Ver también</H2>
      <UList>
        <Li><Strong>La visión del proyecto:</Strong> <Crossref to="why-k-os" /></Li>
        <Li><Strong>Cómo se entrega:</Strong> <Crossref to="from-browser-to-hardware" /></Li>
        <Li><Strong>Las restricciones que salen de esta postura:</Strong> <Crossref to="the-rules" /></Li>
      </UList>
    </>
  );
}

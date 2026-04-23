import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref, Hex } from "@/components/doc/elements";

export default function PerInstrumentVisuals() {
  return (
    <>
      <Lead>
        Cada instrumento en Datamoshpit puede llevar una pequeña escena visual
        — un color plano, una imagen, un shader, un modelo 3D — que se dispara
        cuando se disparan sus notas. Los ajustes visuales viven en la página
        de Instrumento F4; el renderizado lo maneja el{" "}
        <Crossref to="scene-vm">Scene VM</Crossref>. Está apagado por defecto;
        encenderlo revela los controles.
      </Lead>

      <H2>El modelo mental</H2>
      <P>
        Piensa en cada instrumento como teniendo dos mitades: una fuente de
        sonido (el sintetizador FM, reproductor de samples o generador de ruido
        que ya conoces) y una fuente visual opcional (una pequeña escena con
        su propia línea de tiempo corta). Cuando el tracker toca una nota en
        un canal usando ese instrumento, el audio dispara <Strong>y</Strong>{" "}
        el visual dispara, en sincronía entre ellos.
      </P>
      <P>
        Múltiples instrumentos → múltiples visuales. El Scene VM tiene un modo
        "follow active instrument" que siempre muestra el instrumento que
        disparó más recientemente — cambia instrumentos en tu phrase, el visual
        cambia.
      </P>

      <H2>Activar visuales para un instrumento</H2>
      <P>
        En la página de Instrumento F4, baja más allá de los operadores FM.
        Verás un separador <Code>── VISUAL ──</Code>. Debajo, una sola fila:
      </P>
      <CodeBlock>
{`ENABL  OFF`}
      </CodeBlock>
      <P>
        Pon el cursor encima, Q-flick a <Code>ON</Code>, y aparece el resto de
        los controles.
      </P>

      <H2>Los ajustes rápidos</H2>
      <UList>
        <Li><Code>RND</Code> — Q-flick para re-rolear los campos aleatorios con una nueva semilla.</Li>
        <Li><Code>SRC</Code> — fuente visual: <Code>NONE / COLOR / IMAGE / VIDEO / SHADER / MODEL / IFRAME</Code>.</Li>
        <Li><Code>COLOR</Code> — solo cuando SRC=COLOR. Paleta HSL de 256 pasos. Q-flick cicla.</Li>
        <Li><Code>SHADR</Code> — solo cuando SRC=SHADER. Cicla entre IDs de shader integrados.</Li>
        <Li><Code>ASSET / LOAD / DRAW / CLR</Code> — solo cuando SRC=IMAGE. Ver "Fuentes de asset" abajo.</Li>
        <Li><Code>W H</Code> — tamaño en píxeles antes de escala (8 a 1024).</Li>
        <Li><Code>X Y</Code> — posición de <Hex value={0x00} link={false} /> (esquina superior izquierda) a <Hex value={0xff} link={false} /> (esquina inferior derecha). <Hex value={0x80} link={false} /> en ambos es centrado.</Li>
        <Li><Code>LEN</Code> — total de frames para la línea de tiempo de la escena. Rango 8 a 128.</Li>
        <Li><Code>TRIG</Code> — cómo una nota dirige el playhead: <Code>START / FRAME / PITCH / VELAMP / NONE</Code>.</Li>
        <Li><Code>TFRM</Code> — solo cuando TRIG=FRAME. Frame al que saltar en una nota.</Li>
        <Li><Code>PLO PHI</Code> — solo cuando TRIG=PITCH. Rango de notas MIDI que mapea a frames de escena.</Li>
        <Li><Code>TLINE</Code> — abre el editor de timeline para autoría de keyframes detallada.</Li>
        <Li><Code>TCLR</Code> — aparece cuando existen keyframes personalizados. Revierte a auto-generados.</Li>
      </UList>

      <H2>Modos de trigger</H2>
      <H3>play-from-start (por defecto)</H3>
      <P>Cada nota resetea la escena al frame 1 y avanza por la línea de tiempo. Mejor para efectos one-shot (un flash en un kick, un giro en una caja).</P>
      <H3>play-from-frame</H3>
      <P>La nota salta el playhead a un frame configurado y avanza desde ahí. Útil cuando quieres caer en mitad de una animación.</P>
      <H3>pitch-mapped</H3>
      <P>El tono de la nota mapea a un frame de escena dentro del rango configurado. Notas más altas = frames posteriores. Permite que la escena actúe como un "scrubber" controlado por la melodía.</P>
      <H3>velocity-amp</H3>
      <P>El playhead no se mueve en una nota; la escena se reproduce continuamente. La velocidad de la nota escala la amplitud del ruido.</P>
      <H3>none</H3>
      <P>La escena se repite para siempre, indiferente a las notas. Usar para fondo ambiente.</P>

      <H2>Fuentes de asset</H2>
      <H3>Color</H3>
      <P>
        Un rectángulo de color plano. Sin archivo externo. La paleta de 256
        pasos es HSL — Q-flick el campo <Code>COLOR</Code> para ciclar.
      </P>

      <H3>Image (PNG / JPG / GIF)</H3>
      <P>
        En la fila <Code>SRC=IMAGE</Code>, aparecen tres nuevas filas:{" "}
        <Code>ASSET</Code> (display read-only del asset actual), <Code>LOAD</Code>{" "}
        (Q-flick abre un selector de archivos nativo), y <Code>DRAW</Code>{" "}
        (Q-flick abre KoolDraw embebido para que pintes un sprite para este
        instrumento).
      </P>
      <P>
        Las imágenes seleccionadas o dibujadas se almacenan como data URLs
        dentro del archivo del proyecto. Eso significa que un proyecto{" "}
        <Code>.dmpit</Code> guardado es portable — cualquiera con el archivo
        tiene las imágenes también. El trade-off: los datos de imagen inflan
        el tamaño del proyecto, así que imágenes muy grandes (varios MB) se
        acumulan.
      </P>

      <H3>GIF, video, shader, model, iframe</H3>
      <P>
        Estos son tipos de primera clase en el modelo de datos pero el
        renderizador v0 del Scene VM solo implementa completamente color e
        imagen por ahora. Los otros tipos de fuente renderizan placeholders de
        color hoy; las implementaciones completas llegan en releases futuros.
        El formato de guardado es compatible hacia adelante — configúralos
        ahora y cobrarán vida cuando los renderizadores se envíen.
      </P>

      <H2>Vista previa en vivo</H2>
      <P>
        Alterna el botón <Code>VM</Code> de la barra superior hasta que veas{" "}
        <Code>VM:FLW</Code> (follow). Aparece una ventana arrastrable mostrando
        cualquier visual de instrumento que disparó más recientemente. Toca tu
        phrase — los visuales siguen cada nota.
      </P>

      <H2>Keyframes personalizados (el editor de timeline)</H2>
      <P>
        La escena auto-generada de tus ajustes rápidos es un buen punto de
        partida. Para control más fino — múltiples keyframes, easing
        personalizado, filtros brightness / blur / hue-rotate / saturate —
        abre el editor de timeline inline con <Code>TLINE</Code>.
      </P>
      <P>
        El editor tiene una tabla de keyframes a la izquierda y una vista
        previa en vivo a la derecha. Agrega y quita keyframes, edita el número
        de frame de cada uno, posición, escala, rotación, opacidad y filtros
        CSS. Pulsa <Code>SAVE</Code> para confirmar; el visual ahora usa tus
        keyframes de autor en lugar de los auto-generados. <Code>TCLR</Code>{" "}
        revierte.
      </P>

      <Aside title="Los defaults son buenos" variant="tip">
        Para la mayoría de los instrumentos, la escena randomizada por defecto
        + la elección de modo de trigger es suficiente. Solo abre el editor de
        timeline cuando tengas una forma específica en mente. De lo contrario
        el randomizador + RND re-roll es mucho más rápido.
      </Aside>

      <H2>El visualizador en modo "FLW"</H2>
      <P>
        La ventana del Scene VM en modo follow es un panel flotante arrastrable
        con una barra de título mostrando el instrumento que dispara
        actualmente. Es chrome píxel-correcto, sin esquinas redondeadas, sin
        AA. Diseñado para estar estacionado en la esquina de tu pantalla
        durante una sesión.
      </P>

      <H2>Qué leer después</H2>
      <UList>
        <Li><Crossref to="scene-vm" /> para el modelo técnico detrás de cómo los visuales permanecen sincronizados con el audio.</Li>
        <Li><Crossref to="song-chain-phrase" /> para cómo los instrumentos encajan en la composición más grande.</Li>
      </UList>
    </>
  );
}

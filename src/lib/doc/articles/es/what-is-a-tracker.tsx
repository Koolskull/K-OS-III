import { Lead, P, H2, UList, Li, Strong, Crossref, CodeBlock, Aside } from "@/components/doc/elements";

export default function WhatIsATracker() {
  return (
    <>
      <Lead>
        Un <Strong>tracker</Strong> es un tipo de software musical que utiliza
        una hoja de cálculo vertical de texto en lugar de un piano roll. Al
        principio parece intimidante y luego resulta ser una de las formas más
        rápidas jamás inventadas para escribir música. La aplicación principal
        de K-OS, <Strong>Datamoshpit</Strong>, es un tracker.
      </Lead>

      <H2>De dónde vienen</H2>
      <P>
        Los trackers fueron inventados en el Commodore Amiga a finales de los
        años 80 por Karsten Obarski para la demoscene. El programa original era
        Ultimate Soundtracker. De ahí, el formato se extendió a FastTracker II,
        Impulse Tracker, ProTracker, y eventualmente a consolas — más
        famosamente LSDJ en la Game Boy y LittleGPTracker (LGPT) en la PSP.
      </P>
      <P>
        Los descendientes modernos incluyen Renoise (PC, profesional), Polyend
        Tracker (hardware), Furnace (open source, multi-sistema), y PicoTracker
        (hardware RP2040). Datamoshpit toma sus convenciones de UI de la familia
        LSDJ / LGPT — pocas teclas, pantallas densas, cada pulsación hace
        trabajo.
      </P>

      <H2>Qué ves en realidad</H2>
      <P>
        Una columna de filas. Cada fila es un beat, o alguna fracción de uno.
        Mueves un cursor arriba y abajo con las flechas y escribes cosas en las
        celdas — notas, números de instrumento, comandos de efecto. Cuando
        presionas play, el cursor avanza por las filas de arriba abajo y el
        programa toca lo que esté ahí.
      </P>
      <CodeBlock label="Un patrón de batería simple en forma de tracker">
{`row  note  inst  cmd
00   C-4   00    --      ← bombo
01   ---   --    --
02   ---   --    --
03   ---   --    --
04   D-4   01    --      ← caja
05   ---   --    --
06   ---   --    --
07   ---   --    --
08   C-4   00    --      ← bombo
09   ---   --    --
0A   ---   --    --
0B   ---   --    --
0C   D-4   01    --      ← caja
0D   ---   --    --
0E   ---   --    --
0F   ---   --    --`}
      </CodeBlock>
      <P>
        Eso es un patrón de batería de 16 pasos. Los números de fila se escriben
        en <Crossref to="hexadecimal">hexadecimal</Crossref> (base 16), así que
        verás <code>00</code>–<code>0F</code> en lugar de <code>0</code>–<code>15</code>.
      </P>

      <H2>Por qué le encantan a la gente</H2>
      <UList>
        <Li><Strong>Velocidad.</Strong> Una vez que conoces los atajos, dejas de usar el ratón. Canciones enteras se escriben sin clicar nada.</Li>
        <Li><Strong>Precisión.</Strong> Cada nota tiene una posición entera exacta. Sin arrastrar y soltar, sin cuantizar después. Lo que escribiste es lo que escuchas.</Li>
        <Li><Strong>Tamaño pequeño.</Strong> Una canción de tracker son unos pocos kilobytes de datos planos. Los compositores demoscene escribieron bandas sonoras enteras que cabían en 64 KB en total — incluyendo el código del reproductor.</Li>
        <Li><Strong>Portabilidad de hardware.</Strong> El modelo de datos es tan compacto que funciona en Game Boys, calculadoras, microcontroladores. Datamoshpit corre en un navegador; las mismas ideas funcionan en un dispositivo de $10.</Li>
      </UList>

      <H2>La jerarquía</H2>
      <P>
        Los trackers no escriben un patrón gigante. Construyen canciones a
        partir de tres capas anidadas:
      </P>
      <UList>
        <Li><Strong>Phrase</Strong> — un patrón corto, normalmente 16 filas. La unidad reutilizable más pequeña.</Li>
        <Li><Strong>Chain</Strong> — una lista de hasta 16 phrases tocadas en secuencia. Como una sección de la canción.</Li>
        <Li><Strong>Song</Strong> — una lista de qué chains tocan en qué canales y en qué momento. El arreglo.</Li>
      </UList>
      <P>
        Lee <Crossref to="song-chain-phrase" /> para ver cómo funciona esto en detalle.
      </P>

      <Aside title="El primer momento en que lo sientes">
        El momento en que los trackers hacen "click" es cuando te das cuenta de
        que puedes escribir un patrón de batería de 4 compases, guardarlo como
        un phrase y reusarlo tres veces en tu chain. Acabas de escribir 16
        compases tecleando 4. Luego escribes una pequeña variación en otro
        phrase, la pones en el 4º compás, y ya tienes un arreglo. Multiplica
        esto a través de 8 canales tocando diferentes chains y has hecho una
        canción entera tecleando muy poco.
      </Aside>

      <H2>Qué tiene de diferente K-OS</H2>
      <P>
        Tres cosas que no encontrarás en los trackers clásicos:
      </P>
      <UList>
        <Li><Strong>Visuales por instrumento.</Strong> Cada instrumento puede llevar una pequeña escena visual que se dispara cuando suenan sus notas. Ver <Crossref to="per-instrument-visuals" />.</Li>
        <Li><Strong><Crossref to="slimentologika" />.</Strong> Un alfabeto opcional de glifos pixelados que reemplaza los dígitos hex estándar. Tab los alterna.</Li>
        <Li><Strong>Nativo del navegador.</Strong> Audio vía Web Audio API, sin instalación, proyectos guardados como archivos <code>.dmpit</code> (ver <Crossref to="dmpit-format" />).</Li>
      </UList>
    </>
  );
}

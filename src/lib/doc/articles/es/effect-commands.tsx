import { Lead, P, H2, Strong, Code, CodeBlock, Aside, Table, Crossref, Hex } from "@/components/doc/elements";

export default function EffectCommands() {
  return (
    <>
      <Lead>
        Cada fila de phrase tiene dos columnas de efecto: <Code>CMD1/VAL1</Code>{" "}
        y <Code>CMD2/VAL2</Code>. Los efectos son cómo un tracker dobla notas,
        desliza entre tonos, corta samples cortos y se vuelve expresivo sin
        agregar más filas. Un comando es un código de dos caracteres; el valor
        son dos dígitos <Crossref to="hexadecimal">hex</Crossref>.
      </Lead>

      <H2>La forma</H2>
      <CodeBlock>
{`row  note  inst  cmd1 val1   cmd2 val2
00   C-4   00    P0   01     V4   02
                  │   │      │   │
                  │   └──────┘   ← pitch-bend hacia abajo 0x01 por tick
                  └─ efecto de pitch`}
      </CodeBlock>
      <P>
        El cmd son dos letras ASCII. El val son dos dígitos hex (
        <Hex value={0} link={false} />–<Hex value={0xff} link={false} />). La
        mayoría de los comandos actúan sobre la nota en su fila. Algunos
        persisten a través de filas hasta ser cancelados.
      </P>

      <H2>Los más útiles primero</H2>
      <Table
        headers={["CMD", "Nombre", "Qué hace", "Ejemplo"]}
        rows={[
          ["P", "Pitch bend", "Dobla el tono arriba o abajo. Bit alto (0x80) = abajo. Byte bajo = velocidad.", "P01 dobla arriba lento"],
          ["L", "Slide", "Desliza suavemente a la siguiente nota en la phrase.", "L03 = velocidad de slide 3"],
          ["V", "Vibrato", "Añade una oscilación de tono. Nibble alto = velocidad, bajo = profundidad.", "V42 = velocidad 4, profundidad 2"],
          ["E", "Envelope", "Establece el volumen / amplitud.", "E08 = volumen a 8"],
          ["O", "Output / Pan", "Pan del canal. 00=I, 80=centro, FF=D.", "OFF = totalmente derecha"],
          ["K", "Kill", "Corta la nota después de N ticks.", "K03 = corta después de 3 ticks"],
          ["D", "Delay", "Retrasa el inicio de la nota por N ticks.", "D03 = retrasa 3 ticks"],
          ["C", "Chord", "Arpegia entre notas en un acorde.", "C37 = menor; C47 = mayor"],
          ["H", "Hop", "Salta dentro de la phrase.", "H08 = salta a fila 8; H00 = stop"],
          ["T", "Tempo", "Cambia BPM en mitad de la song.", "T80 = 128 BPM"],
        ]}
      />

      <H2>Menos comunes pero potentes</H2>
      <Table
        headers={["CMD", "Nombre", "Qué hace"]}
        rows={[
          ["A", "Table", "Inicia/detiene una automatización por tick."],
          ["B", "MayBe", "La nota toca solo a veces — el valor es probabilidad."],
          ["G", "Groove", "Cambia el groove de timing en mitad de phrase."],
          ["R", "Retrig", "Retriggerea la nota rápidamente (rolls / stutters)."],
          ["W", "Wave", "Cambia la forma de onda/algoritmo del instrumento activo."],
          ["Z", "Random", "Aleatoriza el valor del comando previo dentro de un rango."],
        ]}
      />

      <H2>Cómo funcionan los valores</H2>
      <P>
        Casi cada campo de valor usa las mismas convenciones:
      </P>
      <Table
        headers={["Valor", "Significado"]}
        rows={[
          [<Hex value={0x00} key="0" link={false} />, "Off / mínimo / sin efecto"],
          [<Hex value={0xff} key="ff" link={false} />, "Máximo"],
          [<Hex value={0x80} key="80" link={false} />, "Centro / neutro / 'sin offset' (para valores con signo)"],
          [<Hex value={0x40} key="40" link={false} />, "Un cuarto; común para valores medios"],
          [<Hex value={0xc0} key="c0" link={false} />, "Tres cuartos"],
        ]}
      />
      <Aside title="Leyendo un valor hex de un vistazo" variant="tip">
        Nibble alto × 16 + nibble bajo = valor decimal. <Hex value={0x42} link={false} /> es 4×16 + 2 = 66.
        Casi nunca tienes que hacer esto; sentirás dónde está <Hex value={0x40} link={false} /> en el dial después de unas pocas sesiones.
      </Aside>

      <H2>Filas de doble efecto</H2>
      <P>
        Cada fila tiene <Strong>dos</Strong> columnas de efecto. Ambos disparan
        en la misma fila, en orden de izquierda a derecha. Útil para
        combinaciones como:
      </P>
      <CodeBlock>
{`note   inst   CMD1 VAL1   CMD2 VAL2
C-4    00     L03         OFF       ← slide arriba + pan totalmente derecha
D#4    01     V42         K06       ← vibrato + corte tras 6 ticks
A-3    00     P81         R04       ← pitch-bend abajo + retrig`}
      </CodeBlock>

      <H2>Efectos que "se quedan"</H2>
      <P>
        Algunos efectos (pitch, vibrato, slide) siguen operando hasta que algo
        los reemplaza. Establecer <Code>V00</Code> en una fila posterior apaga
        el vibrato explícitamente. Dejar la columna vacía simplemente continúa
        el ajuste anterior.
      </P>
      <P>
        Otros efectos (kill, delay, retrig) solo disparan en la fila donde
        están escritos y luego terminan.
      </P>

      <H2>El comando Hop (H)</H2>
      <P>
        Hop salta el playhead dentro de la phrase actual. <Code>H00</Code>{" "}
        detiene el playback para ese canal. <Code>H08</Code> salta a la fila 8.
        Usado para crear loops dentro de una phrase, o para detener un canal a
        mitad de patrón.
      </P>
      <P>
        Hop es útil principalmente en patrones avanzados (phrases one-shot que
        tocan parte de un paso de chain y luego paran, etc.). No te preocupes
        por él el primer día.
      </P>

      <H2>Por qué los comandos de efecto vencen a los plugins de audio para esto</H2>
      <P>
        En un DAW agregarías un carril de automatización de pitch-bend,
        dibujarías una curva, presionarías play. En un tracker escribes{" "}
        <Code>P03</Code> en una celda y el trabajo está hecho en cero clicks.
        Multiplicado por una song, el tiempo ahorrado es sustancial. El costo
        es que tienes que memorizar los códigos de comando — pero hay alrededor
        de una docena comunes y los conocerás en una semana.
      </P>

      <H2>Qué leer después</H2>
      <P>
        <Crossref to="song-chain-phrase" /> para cómo viven las phrases dentro
        de la estructura más grande. <Crossref to="hexadecimal" /> si valores
        como <Hex value={0x42} link={false} /> aún parecen misteriosos.
      </P>
    </>
  );
}

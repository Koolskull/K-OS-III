import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref, Hex } from "@/components/doc/elements";

export default function SongChainPhrase() {
  return (
    <>
      <Lead>
        Las canciones de Datamoshpit se construyen a partir de tres capas
        anidadas — las <Strong>phrases</Strong> se anidan en{" "}
        <Strong>chains</Strong>, los chains se anidan en la <Strong>song</Strong>.
        Cada capa se identifica con un ID hex de dos dígitos. Una vez que
        entiendes cómo se referencian, todo el tracker deja de parecer sopa de
        letras y se convierte en un lenguaje musical pequeño y denso.
      </Lead>

      <H2>Las tres capas en palabras simples</H2>
      <UList>
        <Li>
          Una <Strong>phrase</Strong> es un patrón pequeño — normalmente 16
          filas de notas, instrumentos y efectos. La unidad musical reutilizable
          más pequeña.
        </Li>
        <Li>
          Un <Strong>chain</Strong> es hasta 16 IDs de phrase tocados en
          secuencia. A veces con un offset de transposición por paso. Como un
          "Verso A".
        </Li>
        <Li>
          Una <Strong>song</Strong> es una rejilla: filas × 8 canales. Cada
          celda contiene un ID de chain. La fila de la song determina qué toca
          en qué canal y en qué momento.
        </Li>
      </UList>
      <CodeBlock label="La jerarquía, en imagen">
{`SONG  (el arreglo; muchas filas × 8 canales)
   │
   └── cada celda contiene un ID de CHAIN, como 02
       │
       └── ese chain tiene hasta 16 pasos,
           cada uno apuntando a un ID de PHRASE, como 0A
           │
           └── esa phrase tiene 16 filas de
               datos de nota / instrumento / efecto`}
      </CodeBlock>

      <H2>¿Por qué la indirección?</H2>
      <P>
        A primera vista parece complicado — ¿por qué no simplemente escribir
        una línea de tiempo gigante? La respuesta es reutilización. Un patrón
        de batería normalmente se repite. Si tu patrón de bombo es la phrase{" "}
        <Hex value={0} />, puedes poner la phrase <Hex value={0} /> como paso 0
        de cada chain de batería en la song. Edita la phrase <Hex value={0} />{" "}
        una vez, y cada lugar que la usa cambia.
      </P>
      <P>
        La misma idea en el siguiente nivel. Un chain como "batería del verso"
        puede aparecer como ID de chain en múltiples filas de song. Reestructura
        tu song sin reescribir los patrones.
      </P>

      <H2>Los IDs son 0–FF (0–255)</H2>
      <P>
        Cada chain y cada phrase tiene un ID{" "}
        <Crossref to="hexadecimal">hex</Crossref> único de{" "}
        <Hex value={0} link={false} /> a <Hex value={0xff} link={false} />. Eso
        te da 256 phrases y 256 chains por proyecto — suficiente.
      </P>
      <P>
        K-OS solo crea una phrase o chain cuando la editas por primera vez. Si
        escribes notas en la phrase <Hex value={0xa5} link={false} />, esa
        phrase no existía antes de esa pulsación y ahora sí. Las phrases que
        nunca tocas no ocupan memoria y no aparecen en el archivo de proyecto
        guardado.
      </P>

      <H2>Las pantallas</H2>
      <H3>F1 — Song</H3>
      <P>
        La vista de arreglo. Filas hacia abajo, ocho columnas de canal a lo
        ancho. Cada celda son dos dígitos hex (un ID de chain) o <Code>--</Code>{" "}
        (vacío). La fila que se está reproduciendo se resalta durante el playback.
      </P>
      <CodeBlock label="Una song con una intro básica">
{`     CH0 CH1 CH2 CH3 CH4 CH5 CH6 CH7
00   00  --  --  --  --  --  --  --   ← intro: solo canal 0 (batería)
01   00  01  --  --  --  --  --  --   ← batería + bajo
02   00  01  02  --  --  --  --  --   ← batería + bajo + lead
03   00  01  02  --  --  --  --  --   ← repite
04   --  --  --  --  --  --  --  --   ← fin (filas vacías = song terminada para ese canal)`}
      </CodeBlock>

      <H3>F2 — Chain</H3>
      <P>
        El chain actualmente editado. 16 filas de paso. Cada paso tiene un ID
        de phrase y una transposición opcional. La transposición te permite
        reusar la misma phrase pero desplazada arriba o abajo en tono — útil
        para arpegios o secciones de song en diferentes tonalidades.
      </P>
      <CodeBlock label="Chain 02 — lead del verso">
{`paso  phrase  transposición
00    0A      00     ← toca phrase 0A en tono original
01    0A      03     ← toca phrase 0A transpuesta 3 semitonos arriba
02    0A      05     ← 5 semitonos arriba
03    0B      00     ← phrase de variación, tono original
04    --      --     ← (los pasos vacíos terminan el chain — ver abajo)`}
      </CodeBlock>

      <H3>F3 — Phrase</H3>
      <P>
        La phrase actualmente editada. 16 filas por defecto (redimensionable
        de 2 a 256 con <Code>Shift+W+Up/Down</Code>). Cada fila tiene columnas
        para nota, instrumento, slice, y dos comandos de efecto. Ver{" "}
        <Crossref to="effect-commands" /> para qué pueden hacer las columnas
        de efecto.
      </P>

      <H2>Cómo el playback recorre las capas</H2>
      <P>
        K-OS toca chains al estilo LGPT: el chain toca a través de sus pasos{" "}
        <Strong>poblados</Strong>, después vuelve al paso 0 dentro de sí mismo.
        La fila de song solo avanza cuando un chain alcanza el final literal de
        los 16 pasos — lo que significa que chains cortos (1–8 pasos poblados)
        se repiten en la fila de song actual indefinidamente.
      </P>
      <P>
        Esto es por diseño. Para hacer que la song avance, pobla más pasos de
        chain, O pobla más filas de song y deja que los chains de larga duración
        se completen.
      </P>

      <Aside title="El momento de '¿por qué no avanza?'" variant="tip">
        Los usuarios primerizos de tracker a menudo esperan que las songs
        marchen fila por fila en el tiempo. No lo hacen. Cada canal recorre su
        propio chain a su propio ritmo. Un chain de dos pasos en el canal 0 se
        repetirá para siempre mientras el chain de ocho pasos del canal 1 sigue
        en su primera pasada. La fila de song avanza cuando el chain alcanza el
        paso <Hex value={0xf} link={false} /> + 1 — no antes.
      </Aside>

      <H2>Drillear entre pantallas</H2>
      <P>
        K-OS te permite "entrar" desde una pantalla de nivel superior a la capa
        que referencia. Desde la pantalla Song, con el cursor en una celda de
        chain poblada, presiona <Code>Shift+Right</Code> para navegar a la
        pantalla Chain — y K-OS abre automáticamente ese chain. Desde la
        pantalla Chain, con el cursor en la columna de phrase de un paso,{" "}
        <Code>Shift+Right</Code> te lleva a esa phrase.
      </P>
      <P>
        El ID del chain activo y el ID de la phrase activa se muestran en la
        barra de estado superior: <Code>CHAIN 02</Code> en la pantalla chain,{" "}
        <Code>PHRASE 0A</Code> en la pantalla phrase. Te dicen exactamente qué
        ítem estás editando.
      </P>

      <H2>Quick-fill (el truco lastPhrase de LGPT)</H2>
      <P>
        Cuando escribes un ID de phrase en un paso de chain, K-OS lo recuerda
        como la phrase "tocada por última vez". Coloca un paso de chain vacío
        (tecla Z) y se pre-rellena con ese ID — rápido para estampar la misma
        phrase en múltiples pasos de chain. Misma idea con IDs de chain en la
        vista de song.
      </P>

      <H2>Clonar una phrase</H2>
      <P>
        En la pantalla chain, con el cursor en la columna de phrase de un paso,
        presiona <Code>Shift+W+Right</Code> para clonar la phrase referenciada
        al siguiente ID de phrase libre. El paso de chain ahora apunta al clon.
        Útil cuando quieres "casi la misma phrase, con una nota cambiada".
        Edita el clon sin afectar al original.
      </P>

      <H2>Cómo esto se relaciona con otros trackers</H2>
      <P>
        Si vienes de LGPT o PicoTracker: modelo idéntico. Phrase, chain, song.
        Drill-down vía la tecla derecha. <Code>Shift+W+arrow</Code> para
        controles secundarios. Mismos conteos de filas.
      </P>
      <P>
        Si vienes de LSDJ en la Game Boy: también idéntico, solo con 8 canales
        en lugar de 4 y un poco más de comandos de efecto.
      </P>
      <P>
        Si vienes de Renoise o Furnace: esos no tienen la capa de chain — van
        de pattern → song directamente. La capa chain es un modismo de los
        trackers de Game Boy; es opcional pero útil para arreglos compactos.
      </P>

      <H2>Qué leer después</H2>
      <UList>
        <Li><Crossref to="effect-commands" /> — los códigos de dos letras que van en las columnas CMD de una phrase.</Li>
        <Li><Crossref to="per-instrument-visuals" /> — los instrumentos pueden llevar visuales que se disparan junto a sus notas.</Li>
        <Li><Crossref to="dmpit-format" /> — cómo se ve un archivo de proyecto guardado por dentro.</Li>
      </UList>
    </>
  );
}

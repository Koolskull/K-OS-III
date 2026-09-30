import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Table, Crossref } from "@/components/doc/elements";

export default function ThrashTrackerBrowser() {
  return (
    <>
      <Lead>
        La ventana Thrash Tracker es la copia en el navegador de Thrash Tracker.
        La misma forma de canción que el tracker de escritorio: ocho canales,
        chains de dieciséis pasos, phrases, tablas, osciladores, samples y un
        FM de cuatro operadores. Los instrumentos plugin se guardan en el
        archivo y no suenan.
      </Lead>

      <Aside title="Una canción nueva empieza con el Amen break" variant="warn">
        El instrumento <Code>00</Code> se llama <Code>AMEN</Code>. Es el Amen
        break, tocado como sample. La phrase <Code>00</Code> tiene{" "}
        <Code>80</Code> filas, ocho filas por beat, y la fila <Code>00</Code> es{" "}
        <Code>C-4</Code> para que el archivo suene a su propia velocidad. El
        tempo se fija para que esos cuatro compases coincidan con la grabación.
        Espacio en song toca el break y el canal vuelve a la fila <Code>00</Code>{" "}
        hasta que pulsas Espacio otra vez o Escape. Un instrumento nuevo sigue
        siendo el ataque cuadrado corto: Ctrl+Shift+N.
      </Aside>

      <H2>Dónde estás</H2>
      <P>
        El lienzo mide 960×540. El mapa de la esquina tiene dos filas.
        Shift+F1 a Shift+F8 saltan a una baldosa. Shift+flechas recorren el
        mapa y se detienen en el borde.
      </P>
      <CodeBlock label="Mapa">{`S  C  P  L     song, chain, phrase, rack
T  I  V  R     tabla, instrumento, visualizador, proyecto`}</CodeBlock>
      <Table
        headers={["Baldosa", "Shift", "Qué es"]}
        rows={[
          ["S", "F1", "Song. 256 filas, canales C0–C7. Cada celda es un id de chain, o --."],
          ["C", "F2", "Chain. 16 pasos. PH es la phrase. TR es la transposición."],
          ["P", "F3", "Phrase. Columnas NT IN VL SL LP FX VA ST."],
          ["L", "F4", "Rack. Cuatro ganancias de capa de la phrase en la que estabas."],
          ["T", "F5", "Tabla. Las columnas del escritorio, incluidas las que el navegador aún no suena."],
          ["I", "F6", "Instrumento. Nombre, tipo, oscilador o algoritmo FM, volumen, ADSR."],
          ["V", "F7", "Visualizador. Se ocultan la rejilla, el mapa y el mezclador. Quedan el fondo y el scope."],
          ["R", "F8", "Proyecto. Nombre, BPM, ticks por beat, guardar, abrir."],
        ]}
      />

      <H2>Teclas</H2>
      <Table
        headers={["Tecla", "Qué hace"]}
        rows={[
          ["Flechas", "Mueven el cursor."],
          ["Shift+flechas", "Cambian de página en el mapa."],
          ["Espacio", "Song: reproduce desde la fila del cursor, o para. Chain o phrase: audiciona ese patrón, o para."],
          ["Escape", "Para. Cerrar la ventana también cierra el audio."],
          ["Enter", "Song abre el chain y lo crea si la celda está vacía. Chain abre la phrase igual. En una phrase, Enter en la columna de instrumento abre ese instrumento."],
          ["Hex 0–9, A–F", "Dos dígitos escriben un chain, phrase, instrumento, volumen, slice o valor de efecto."],
          ["Piano, columna de nota", "Fila baja zsxdcvgbhnjm,l.;/ y fila alta q2w3er5t6y7ui9o0p. - y = cambian la octava. En la octava 4, z es C-4."],
          ["Retroceso", "Borra la celda. En un nombre, borra una letra."],
          ["[ ]", "Acortan o alargan la phrase, hasta FF."],
          ["Ctrl+flechas", "En instrumento, rack o proyecto, cambian el valor bajo el cursor."],
          ["Ctrl+Shift+izquierda/derecha", "En phrase o chain, cambian qué patrón estás viendo."],
          ["Ctrl+Shift+N", "Crea el siguiente instrumento libre como un ataque cuadrado."],
          ["Ctrl+S / Ctrl+O", "Descarga NAME.dm2.json con samples, o abre un archivo del navegador."],
          ["X / Shift+X / Z", "En song: silenciar el canal, solo, o despertar todos."],
        ]}
      />

      <H2>Lo que se oye</H2>
      <P>
        El audio corre en <Code>public/dm2-worklet.js</Code>. Una fila es un
        tick. Un tick dura <Code>60 / (BPM × ticks por beat)</Code> segundos.
        Un proyecto nuevo tiene 8 ticks por beat: un beat son ocho filas. El
        tempo sale del archivo Amen para que 128 filas coincidan con la grabación.
      </P>
      <H3>Oscilador, sample, FM</H3>
      <UList>
        <Li><Strong>Synth.</Strong> Seno, cuadrada, sierra, triángulo, ruido.</Li>
        <Li><Strong>Sampler.</Strong> Pon el tipo en sampler y pulsa Enter. El navegador decodifica el archivo. C-4 es la velocidad original.</Li>
        <Li><Strong>FM.</Strong> Cuatro operadores, algoritmos <Code>00</Code>–<Code>07</Code>, el esquema del YM2612. Es una reimplementación, no el chip de escritorio.</Li>
        <Li><Strong>Plugin.</Strong> Puede quedar en la canción. No suena. La línea de estado dice <Code>PLUGIN STAYS ON THE DESKTOP</Code> una vez.</Li>
      </UList>
      <P>
        Un instrumento sin slots solo toca la capa 0. La phrase <Code>00</Code> abre
        la capa 0 y deja las otras tres en ganancia <Code>00</Code>.
      </P>
      <H3>El Amen break y el ataque cuadrado</H3>
      <P>
        El instrumento <Code>00</Code> es <Code>AMEN</Code>, un sampler. Ataque{" "}
        <Code>00</Code>, decay <Code>00</Code>, sustain <Code>64</Code>, release{" "}
        <Code>00</Code>. El archivo suena una vez y se detiene al terminar la
        grabación. Los tiempos son <Code>(valor / 127)² × 4</Code> segundos.
      </P>
      <P>
        Ctrl+Shift+N, o la primera vez que escribes un instrumento sin usar en
        una celda vacía, construye un ataque cuadrado. Se llama <Code>SQ</Code>{" "}
        más el id hex. Ataque <Code>00</Code>, decay <Code>40</Code>, sustain{" "}
        <Code>00</Code>, release <Code>40</Code>. No sustituye a <Code>AMEN</Code>{" "}
        hasta que una celda lo señala. En una celda vacía también escribe{" "}
        <Code>C-4</Code> y volumen <Code>80</Code>.
      </P>
      <H3>Efectos y tablas</H3>
      <P>La phrase tiene un comando y un valor. El worklet suena dos comandos:</P>
      <Table
        headers={["Cmd", "Qué se oye"]}
        rows={[
          ["KL", "Corta la nota en esa fila."],
          ["VO", "Pone la ganancia de la fila. 7F es cerca de la unidad."],
        ]}
      />
      <P>
        La lista larga de <Crossref to="effect-commands" /> no es lo que suena
        esta ventana. Esas letras se pueden escribir. Aún no cambian el sonido.
        Una tabla puede transponer la nota si la transposición está activa.
        Slice, retrigger, filtro, crush y los efectos de la tabla se guardan y
        se dibujan. El worklet todavía no los aplica.
      </P>

      <H2>Cómo termina un chain</H2>
      <P>
        Un paso de chain sin phrase termina ese chain y la fila de song avanza.
        Si la celda siguiente de ese canal está vacía, el canal vuelve al
        principio de su tramo. La canción de fábrica solo llena la fila{" "}
        <Code>00</Code> del canal 0, así que Espacio repite esa phrase. Una fila
        vacía de phrase no corta la nota. Un sampler se detiene al acabar el
        archivo, así que el Amen break suena una vez cada vez que la phrase
        vuelve a empezar.
      </P>

      <H2>Guardar</H2>
      <P>
        Cada edición se escribe en este navegador con la clave{" "}
        <Code>dm2-web-pattern</Code>, sin el audio de los samples. Ctrl+S
        descarga <Code>NAME.dm2.json</Code> con los samples en base64, PCM de
        16 bits little-endian. El campo <Code>version</Code> es <Code>dm2.web</Code>.
      </P>
      <Aside title="No es un .dm2 de escritorio ni un .dmpit" variant="info">
        Un <Code>.dm2</Code> de Thrash Tracker de escritorio es otro JSON. Un{" "}
        <Crossref to="dmpit-format">.dmpit</Crossref> es un zip del tracker
        anterior. Ninguno abre en esta ventana todavía.
      </Aside>

      <H2>Lo que esta ventana no es</H2>
      <UList>
        <Li>Sin VST, AU ni LV2. Sin audio de plugins.</Li>
        <Li>Sin portapapeles, deshacer, página de groove ni Slimentologika.</Li>
        <Li>La baldosa V es el scope, no el vuelo de fuentes del escritorio.</Li>
        <Li>2kool.tv sigue siendo el sitio anterior. Este tracker es la ventana de la copia que estás ejecutando.</Li>
      </UList>
    </>
  );
}

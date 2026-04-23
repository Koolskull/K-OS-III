import { Lead, P, H2, Strong, Code, Crossref } from "@/components/doc/elements";

export default function Glossary() {
  return (
    <>
      <Lead>
        Búsqueda rápida de términos específicos de K-OS. Referenciados con los
        artículos más largos donde cada concepto se explica en profundidad.
      </Lead>

      <Term name="Asset Base">
        La URL absoluta donde viven los assets agrupados de K-OS, configurable
        en build time vía <Code>NEXT_PUBLIC_ASSET_BASE</Code>. Permite que el
        mismo artefacto <Code>out/</Code> sirva diferentes hosts. Ver{" "}
        <Code>docs/DEPLOYMENT.md</Code>.
      </Term>

      <Term name="Base Path">
        El prefijo de ruta URL bajo el que se sirve la app, ej. <Code>/k-os</Code>{" "}
        para <Code>koolskull.github.io/k-os</Code>. Configurado vía{" "}
        <Code>NEXT_PUBLIC_BASE_PATH</Code> en build time.
      </Term>

      <Term name="Beta">
        La etapa de release actual (<Code>0.2.0-beta.1</Code>). Funcional,
        construible, pero rugoso. El formato de guardado puede cambiar antes
        de 0.3.
      </Term>

      <Term name="BPM">
        Beats por minuto — el tempo de la song. Configurado en la pantalla
        Project F7, puede cambiarse en mitad de song con el comando de efecto{" "}
        <Code>T</Code>.
      </Term>

      <Term name="Chain">
        Una secuencia de hasta 16 IDs de phrase que tocan en orden, con
        transposición opcional por paso. La capa media de la jerarquía de la
        song. Ver <Crossref to="song-chain-phrase" />.
      </Term>

      <Term name="Channel">
        Uno de los 8 canales de salida de audio. Cada canal toca un chain en
        cualquier momento dado. Los canales son independientes — recorren sus
        propios chains a su propio ritmo.
      </Term>

      <Term name="CMD1 / CMD2">
        Las dos columnas de comando de efecto en una fila de phrase. Ver{" "}
        <Crossref to="effect-commands" />.
      </Term>

      <Term name="Datamoshpit">
        La aplicación principal de K-OS — el music tracker. Incluye los
        editores Song / Chain / Phrase, edición de instrumentos, carga de
        samples, live pads, el Scene VM. Nombrado por la estética visual de
        datamoshing del shader crt-feedback.
      </Term>

      <Term name=".dmpit">
        Extensión de archivo de proyecto K-OS. Un archivo ZIP que contiene{" "}
        <Code>project.json</Code> y archivos binarios de sample. Ver{" "}
        <Crossref to="dmpit-format" />.
      </Term>

      <Term name="FM Synthesis">
        Síntesis por modulación de frecuencia. El motor de sintetizador
        primario de K-OS, modelado en el Yamaha YM2612 usado en el Sega
        Genesis / Mega Drive. Cuatro operadores por voz, ocho algoritmos para
        rutearlos.
      </Term>

      <Term name="Hex / Hexadecimal">
        Sistema de números base-16. Usado en todas partes en K-OS para IDs y
        valores de efecto. Ver <Crossref to="hexadecimal" />.
      </Term>

      <Term name="Instrument">
        Una fuente de sonido más visual opcional. K-OS soporta 256 instrumentos
        por proyecto. Tipos incluyen FM, sample y synth. Ver{" "}
        <Crossref to="per-instrument-visuals" /> para el lado visual.
      </Term>

      <Term name="Keyframe">
        Un punto en la línea de tiempo visual donde los valores de transformación
        se establecen explícitamente. El Scene VM interpola entre keyframes
        usando el modo de easing configurado (linear, bezier, hold, bounce).
        Ver <Crossref to="scene-vm" />.
      </Term>

      <Term name="KoolDraw">
        El editor de sprite pixel-art de K-OS. App standalone en el escritorio;
        embebible como superficie de creación de sprites desde el editor visual
        de instrumentos F4.
      </Term>

      <Term name="LGPT">
        LittleGPTracker. El tracker de la era PSP en el que está basado el
        modelo de input de K-OS. Fuente reflejada en{" "}
        <Code>../LittleGPTracker-master/</Code> en el workspace.
      </Term>

      <Term name="Live Mode">
        Un modo de playback donde los chains se repiten en la fila de song
        actual en lugar de avanzar. Alterna desde la pantalla Song F1 con{" "}
        <Code>Shift+W+Up</Code>.
      </Term>

      <Term name="Macro">
        Un knob/slider asignable por el usuario en un instrumento que mapea a
        uno o más parámetros de síntesis. Te permite crear controles de alto
        nivel.
      </Term>

      <Term name="MIDI">
        Musical Instrument Digital Interface. K-OS soporta input MIDI vía la
        Web MIDI API — conecta un controlador y las notas fluyen a la phrase
        activa. MIDI Learn asigna knobs físicos a parámetros.
      </Term>

      <Term name="Phrase">
        La unidad musical reutilizable más pequeña — típicamente 16 filas de
        datos de nota, instrumento y efecto. Ver <Crossref to="song-chain-phrase" />.
      </Term>

      <Term name="PicoTracker">
        Tracker de hardware basado en RP2040, sucesor espiritual de LGPT.
        Modelo de input similar. Fuente reflejada en{" "}
        <Code>../picoTracker-master/</Code> en el workspace.
      </Term>

      <Term name="Quick-Fill">
        K-OS pre-rellena pasos de chain vacíos y celdas de song con el ID de
        phrase o chain tocado más recientemente. El truco LGPT{" "}
        <Code>lastPhrase_</Code>.
      </Term>

      <Term name="Scene VM">
        El runtime de Visual Module — el mecanismo de K-OS para visuales que
        disparan en sincronía con el audio. Ver <Crossref to="scene-vm" />.
      </Term>

      <Term name="Slimentologika">
        El alfabeto personalizado de 16 glifos de K-OS que reemplaza los
        dígitos hex en la UI del tracker. Alterna con <Code>Tab</Code>. Ver{" "}
        <Crossref to="slimentologika" />.
      </Term>

      <Term name="Song">
        El arreglo de nivel superior — filas × 8 canales, cada celda contiene
        un ID de chain. Ver <Crossref to="song-chain-phrase" />.
      </Term>

      <Term name="Song Mode">
        El modo de playback por defecto. Los chains tocan a través de sus
        pasos poblados y se repiten dentro del chain; la fila de song avanza
        cuando un chain alcanza los 16 pasos poblados.
      </Term>

      <Term name="Static Export">
        Un modo de build donde Next.js produce una carpeta estática{" "}
        <Code>out/</Code> que puede ser servida por cualquier host web. Usado
        para deploys de K-OS a GitHub Pages y 2kool.tv. Ver{" "}
        <Code>docs/DEPLOYMENT.md</Code>.
      </Term>

      <Term name="Table">
        Una subrutina de bucle de 16 filas de efectos por tick. Vinculada a
        un instrumento para shaping de sonido detallado (vibrato, arpegios,
        modulación automatizada).
      </Term>

      <Term name="Tick">
        La unidad de tiempo más pequeña en el tracker. Un tick = 60 / (BPM ×
        TPB) segundos. El TrackerEngine emite un tick a la vez y recorre las
        filas de phrase en consecuencia.
      </Term>

      <Term name="TPB">
        Ticks Per Beat. El número de ticks en un beat. Por defecto 6. Las
        filas de phrase avanzan cada TPB ticks (así que por defecto, 6 ticks
        por fila).
      </Term>

      <Term name="Tracker">
        Una clase de software musical que usa una hoja de cálculo vertical de
        texto en lugar de un piano roll. Ver <Crossref to="what-is-a-tracker" />.
      </Term>

      <Term name="Transpose">
        Un offset de semitono aplicado a cada nota en una phrase, configurado
        por paso en un chain. Te permite reusar una phrase en diferentes
        tonos.
      </Term>

      <Term name="Turbopack">
        El bundler incremental de Next.js, usado por <Code>npm run dev</Code>{" "}
        y <Code>npm run build</Code> de K-OS. Más rápido que el modo webpack
        antiguo.
      </Term>

      <Term name="VAL1 / VAL2">
        Las dos columnas de valor de efecto en una fila de phrase. Dos dígitos
        hex cada uno, emparejados con su respectiva columna CMD.
      </Term>

      <Term name="VMI">
        Visual Machine Interface — la convención de secuencia de PNG en capas
        que K-OS usa para estados de botón y elementos de UI animados. Ver{" "}
        <Code>VMI_ARTIST_GUIDE.md</Code>.
      </Term>

      <Term name="WASM">
        WebAssembly — un formato binario que corre en navegadores. K-OS usa
        WASM para los juegos agrupados (Commander Keen, SuperTux cuando está
        disponible).
      </Term>

      <Term name="YM2612">
        El chip de síntesis FM de 4 operadores Yamaha del Sega Genesis. La voz
        del sintetizador FM de K-OS está modelada en él.
      </Term>
    </>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid #222",
      }}
    >
      <div
        style={{
          fontFamily: "var(--dm-font-primary), monospace",
          fontSize: 13,
          letterSpacing: 1,
          color: "#ffff00",
          marginBottom: 4,
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "#dddddd" }}>{children}</div>
    </div>
  );
}

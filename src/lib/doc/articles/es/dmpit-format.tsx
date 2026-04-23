import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function DmpitFormat() {
  return (
    <>
      <Lead>
        Un archivo de proyecto K-OS (<Code>.dmpit</Code>) es un archivo ZIP
        que contiene un solo documento JSON más archivos de sample binarios.
        Está deliberadamente legible — puedes descomprimir uno con cualquier
        herramienta estándar e inspeccionar lo que contiene. Este artículo
        documenta la estructura para que puedas escribir tooling, auditar
        guardados o migrar proyectos entre hosts.
      </Lead>

      <H2>El archivo es un zip</H2>
      <P>
        Renombra un <Code>.dmpit</Code> a <Code>.zip</Code> y tu OS lo abrirá.
        O usa la línea de comandos:
      </P>
      <CodeBlock>
{`unzip -l my-song.dmpit

# output típico:
#   project.json
#   samples/00_KICK.wav
#   samples/01_SNARE.wav
#   samples/02_HAT.wav`}
      </CodeBlock>

      <H2>project.json</H2>
      <P>
        La única fuente de verdad para el proyecto. Formateado JSON. Se ve
        más o menos así:
      </P>
      <CodeBlock label="Forma de nivel superior (acortada)">
{`{
  "version": "0.1.0",
  "name": "MY SONG",
  "song": {
    "id": 0,
    "name": "MY SONG",
    "bpm": 120,
    "tpb": 6,
    "channels": 8,
    "rows": [
      { "chains": [0, null, null, null, null, null, null, null] },
      { "chains": [0, 1, null, null, null, null, null, null] },
      ...
    ]
  },
  "chains": [
    { "id": 0, "steps": [{ "phrase": 0, "transpose": 0 }, { ... }] },
    ...
  ],
  "phrases": [
    { "id": 0, "rows": [
      { "note": 60, "instrument": 0, "effect1": null, "effect2": null, "slice": null },
      ...
    ]},
    ...
  ],
  "tables": [
    { "id": 0, "rows": [...], "loopStart": 0 }
  ],
  "instruments": [
    {
      "id": 0,
      "name": "FM BASS",
      "type": "fm",
      "volume": 100,
      "pan": 64,
      "fmAlgorithm": 0,
      "fmFeedback": 3,
      "fmOperators": [...],
      "macros": [],
      "visual": {
        "enabled": true,
        "source": "color",
        "color": "#ff00aa",
        "width": 96,
        "height": 96,
        "posX": 128,
        "posY": 128,
        "totalFrames": 24,
        "triggerMode": "play-from-start"
      }
    },
    ...
  ],
  "samples": [
    { "id": 0, "name": "KICK", "file": "samples/00_KICK.wav" },
    ...
  ]
}`}
      </CodeBlock>

      <H2>Archivos de sample</H2>
      <P>
        Los samples de audio se almacenan como archivos <Code>.wav</Code> raw
        dentro de una carpeta <Code>samples/</Code> en el zip. El JSON los
        referencia por ruta relativa. Al cargar, K-OS lee los bytes WAV y los
        decodifica en buffers de audio en memoria.
      </P>

      <H2>Cómo se almacenan los registros</H2>
      <H3>Phrases y chains: dispersos</H3>
      <P>
        K-OS solo almacena phrases y chains que han sido editados realmente.
        Un proyecto con una phrase tiene una entrada en <Code>phrases[]</Code>,
        no 256. Ver <Crossref to="song-chain-phrase" /> para cómo funcionan los
        IDs y por qué esto importa para la portabilidad.
      </P>

      <H3>Instruments: siempre 256</H3>
      <P>
        Los instrumentos son pre-asignados como un array de 256 entradas (uno
        por ID). La mayoría de los slots son instrumentos "null" en blanco;
        los pocos que has configurado llevan datos significativos. La longitud
        fija mantiene los lookups O(1) por ID.
      </P>

      <H3>Datos visuales en instruments</H3>
      <P>
        Si un instrumento tiene un visual configurado (la sección VISUAL de F4
        está encendida), el registro visual se incluye en el instrumento bajo
        la clave <Code>visual</Code>. Datos de imagen subidos vía{" "}
        <Code>LOAD</Code> o dibujados vía <Code>DRAW [KOOLDRAW]</Code> se
        incrustan como data URL en el campo <Code>assetUrl</Code> — el archivo
        del proyecto permanece autocontenido.
      </P>
      <P>
        Trade-off: un proyecto con tres sprites grandes incrustados puede ser
        de muchos MB. Si compartes muchos sprites, considera mantenerlos fuera
        del proyecto y referenciarlos por URL — el engine acepta ambos.
      </P>

      <H3>Keyframes personalizados</H3>
      <P>
        Si has usado el editor de timeline para autorizar keyframes
        personalizados para un visual de instrumento, esos aterrizan en{" "}
        <Code>visual.customKeyframes[]</Code>. El engine de renderizado los
        prefiere sobre los keyframes auto-generados cuando están presentes.
      </P>

      <H2>Versionado</H2>
      <P>
        El campo <Code>version</Code> de nivel superior es actualmente{" "}
        <Code>"0.1.0"</Code>. K-OS lee cualquier proyecto sin importar la
        versión (sin migraciones aún) y escribe la versión con la que se
        envió. A medida que el formato evolucione, agregaremos migraciones al
        cargar y bumpearemos el campo de versión al escribir.
      </P>
      <Aside title="Advertencia de formato beta" variant="warn">
        El release <Code>0.2.0-beta</Code> de K-OS puede cambiar el formato
        antes de <Code>0.3</Code>. Guarda tus proyectos localmente mientras
        los construyes. No esperamos cambios disruptivos pero el beta lleva
        ese riesgo.
      </Aside>

      <H2>Cargando un proyecto</H2>
      <P>
        Code path: <Code>src/engine/project/ProjectIO.ts</Code>. La función{" "}
        <Code>loadProjectFile(blob)</Code> toma un Blob (típicamente de un
        selector de archivos), descomprime el zip, parsea{" "}
        <Code>project.json</Code>, restaura datos binarios de sample del zip
        en <Code>ArrayBuffer</Code>s, y devuelve un objeto{" "}
        <Code>ProjectData</Code> totalmente tipado.
      </P>
      <CodeBlock label="La API real">
{`import { loadProjectFile, downloadProject } from "@/engine/project/ProjectIO";

// Cargar
const project = await loadProjectFile(file);

// Guardar (descarga vía navegador)
await downloadProject(project);`}
      </CodeBlock>

      <H2>Escribiendo tooling contra el formato</H2>
      <P>
        El formato es ZIP simple + JSON simple. Escribir una herramienta que,
        digamos, renombre instrumentos en lote a través de muchos proyectos, o
        extraiga nombres de sample sin cargar el proyecto entero en K-OS, es
        directo:
      </P>
      <UList>
        <Li>Usa cualquier librería ZIP para extraer <Code>project.json</Code>.</Li>
        <Li>Parsea el JSON.</Li>
        <Li>Manipula el objeto en memoria.</Li>
        <Li>Escribe de vuelta con el JSON modificado, dejando los binarios de sample intactos, re-zippeando.</Li>
      </UList>
      <P>
        Los tipos TypeScript viven en <Code>src/types/tracker.ts</Code> y son
        el esquema canónico. Si quieres escribir una herramienta en Python o
        Rust, esos tipos son fáciles de espejar.
      </P>

      <H2>Qué leer después</H2>
      <UList>
        <Li><Crossref to="song-chain-phrase" /> para qué representa cada estructura de datos de nivel superior.</Li>
        <Li><Crossref to="per-instrument-visuals" /> para qué significa el sub-objeto visual.</Li>
        <Li><Crossref to="running-k-os-locally" /> si quieres clonar el repo e inspeccionar <Code>ProjectIO.ts</Code> tú mismo.</Li>
      </UList>
    </>
  );
}

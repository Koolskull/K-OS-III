import { Lead, P, H2, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function SceneVM() {
  return (
    <>
      <Lead>
        El <Strong>Scene VM</Strong> (Visual Module) es el runtime de K-OS
        para visuales que se disparan junto a las notas del tracker. Es
        pequeño, deliberadamente sin theatre, y rutea cada frame a través del
        mismo reloj de tick que dirige el audio — así que los visuales nunca
        pueden desincronizarse. Este artículo cubre cómo funciona por debajo.
        Empieza con <Crossref to="per-instrument-visuals" /> si solo quieres
        usarlo.
      </Lead>

      <H2>De dónde vino</H2>
      <P>
        El Scene VM es un port reducido del runtime de cutscenes de BeetleGame
        (un proyecto hermano). El editor de BeetleGame era útil pero pesado;
        para K-OS queríamos solo el runtime — interpolación de keyframes,
        ruido simplex, renderizado de capas dirigido por manifiesto — sin el
        chrome del editor y sin Theatre.js.
      </P>
      <P>
        Vive en el codebase en{" "}
        <Code>src/components/apps/datamoshpit/visuals/scene-vm/</Code>.
        Aproximadamente 1.200 líneas en total. Funciones puras en la carpeta
        lib, componentes React en la misma carpeta.
      </P>

      <H2>El modelo mental</H2>
      <P>
        Una <Strong>escena</Strong> se describe por un manifiesto con forma de
        JSON: qué capas renderizar, dónde colocarlas, por qué keyframes anima
        cada capa. El renderizador recorre este manifiesto cada frame y
        produce el output visible (actualmente DOM-based con CSS transforms;
        Three.js para modelos 3D está planeado).
      </P>
      <P>
        Un <Strong>módulo visual</Strong> es una escena vinculada a un
        instrumento de Datamoshpit. Cuando el tracker dispara una nota, el
        engine emite un evento de nota; el playhead de la escena vinculada
        avanza, salta o scrubea basado en el modo de trigger.
      </P>

      <H2>El manifiesto</H2>
      <P>
        En su forma más pequeña, un manifiesto de escena se ve así:
      </P>
      <CodeBlock label="Escena mínima viable">
{`{
  id: "kick-punch",
  name: "KICK PUNCH",
  duration: 0.5,            // segundos
  totalFrames: 12,
  layers: [
    {
      id: "punch",
      type: "solid",
      z: 1,
      solidColor: "#ffffff",
      solidSize: { w: 96, h: 96 },
      transformKeyframes: [
        { frame: 1,  mode: "linear", x: 0.5, y: 0.5, scaleX: 0.2, scaleY: 0.2, rotation: 0, opacity: 1 },
        { frame: 3,  mode: "bezier", x: 0.5, y: 0.5, scaleX: 2.5, scaleY: 2.5, rotation: 0, opacity: 1 },
        { frame: 12, mode: "linear", x: 0.5, y: 0.5, scaleX: 0.4, scaleY: 0.4, rotation: 0, opacity: 0 },
      ],
    },
  ],
}`}
      </CodeBlock>
      <P>
        Eso es un cuadrado blanco que pasa de pequeño a grande y se desvanece
        — un flash de bombo. Tres keyframes; el renderizador interpola entre
        ellos cada frame.
      </P>

      <H2>La lib</H2>
      <P>
        La carpeta lib bajo <Code>visuals/scene-vm/lib/</Code>:
      </P>
      <UList>
        <Li>
          <Strong><Code>types.ts</Code></Strong> — tipos de escena reducidos.
          Tipos de capa, formas de keyframe, manifiesto. Refleja pero no
          importa los tipos de BeetleGame.
        </Li>
        <Li>
          <Strong><Code>keyframe-interpolation.ts</Code></Strong> — el motor de
          easing. Modos: <Code>linear</Code>, <Code>bezier</Code>,{" "}
          <Code>hold</Code>, <Code>bounce-in/out/both</Code>. Funciones puras.
        </Li>
        <Li>
          <Strong><Code>simplex-noise.ts</Code></Strong> — ruido simplex 2D de
          Stefan-Gustavson + helpers para wobble ambiente y shake con keyframes.
          Cero dependencias; cabe en 130 líneas.
        </Li>
        <Li>
          <Strong><Code>timeline-utils.ts</Code></Strong> — conversión frame
          ↔ tiempo más <Code>tickToFrame(tick, bpm, tpb)</Code> para convertir
          ticks del tracker en frames de escena.
        </Li>
        <Li>
          <Strong><Code>asset-resolver.ts</Code></Strong> — lookup de asset
          local al manifiesto. Stub para v0; crecerá cuando agreguemos
          registries de asset a nivel del OS.
        </Li>
      </UList>

      <H2>El renderizador</H2>
      <P>
        <Code>SceneVMPlayer.tsx</Code> recorre las capas del manifiesto, las
        ordena por <Code>z</Code>, y renderiza cada una como un elemento DOM
        posicionado y transformado. CSS transforms (<Code>translate</Code>,{" "}
        <Code>scale</Code>, <Code>rotate</Code>) y filtros CSS (
        <Code>brightness</Code>, <Code>blur</Code>, <Code>hue-rotate</Code>,{" "}
        <Code>saturate</Code>) vienen de interpolar los transformKeyframes de
        la capa contra el frame actual. CSS <Code>mix-blend-mode</Code> maneja
        el composing por capa.
      </P>
      <P>
        Renderizado DOM-based es intencional para v0. Es barato, depurable, y
        el cuello de botella para los visuales de K-OS no es la velocidad de
        relleno — es la variedad de tipos de capa que queremos soportar
        (image, video, shader, modelo 3D). Cuando las capas 3D lleguen
        montarán un Three.js Canvas junto al stack DOM.
      </P>

      <H2>El puente con el audio</H2>
      <P>
        El <Code>TrackerEngine</Code> en <Code>src/engine/tracker/</Code> emite
        un <Code>NoteEvent</Code> cada vez que una fila de phrase dispara una
        nota. Las ventanas Scene VM se suscriben a ese stream de eventos vía{" "}
        <Code>onNoteEvent(cb)</Code> y lo usan para dirigir cambios de
        playhead.
      </P>
      <P>
        Crucialmente, los eventos de nota disparan en el{" "}
        <Strong>mismo schedule de Tone.js</Strong> que el ataque del audio —
        precisión de muestra. La actualización del playhead pasa
        inmediatamente; el loop rAF interpolando entre keyframes alcanza lo
        que sea que el audio acaba de hacer.
      </P>
      <CodeBlock label="La forma del evento de nota">
{`interface NoteEvent {
  channel: number;       // 0..7
  note: number;          // nota MIDI tras transposición
  velocity: number;      // 0..127 (constante 100 por ahora)
  tick: number;          // contador global de tick
  phraseRow: number;
  instrument: number | null;
  type: "on" | "off";
}`}
      </CodeBlock>

      <H2>Repaso de modos de trigger</H2>
      <UList>
        <Li><Code>play-from-start</Code> — la nota resetea el playhead a 1, avanza.</Li>
        <Li><Code>play-from-frame</Code> — la nota salta el playhead a un frame especificado.</Li>
        <Li><Code>pitch-mapped</Code> — el tono de la nota scrubea el playhead dentro de un rango MIDI.</Li>
        <Li><Code>velocity-amp</Code> — la nota no mueve el playhead; modula la amplitud del ruido.</Li>
        <Li><Code>none</Code> — el playhead se repite continuamente, ignorando notas.</Li>
      </UList>

      <H2>Ruido ambiente + shake con keyframes</H2>
      <P>
        Dos capas de movimiento orgánico:
      </P>
      <UList>
        <Li>
          <Strong>Ruido ambiente</Strong> por capa — corre continuamente,
          configurable por propiedad (x, y, rotation, scaleX, scaleY). Canales
          independientes con su propia amplitud / frecuencia / semilla. Agrega
          vida sutil a composiciones estáticas.
        </Li>
        <Li>
          <Strong>Shake con keyframes</Strong> — amplitud/frecuencia de ruido
          interpoladas entre keyframes de ruido en la línea de tiempo.
          Momentos dramáticos de shake que se acumulan y desvanecen. Se
          suma aditivamente al ambiente.
        </Li>
      </UList>

      <H2>El compositor (planeado)</H2>
      <P>
        v0 renderiza una ventana Scene VM a la vez. El diseño completo (ver{" "}
        <Code>docs/DATAMOSHPIT_VIDEO_SPEC.md</Code> en el repo) es un
        compositor de 8 capas donde cada canal de Datamoshpit puede llevar su
        propia escena, y las capas se mezclan en un canvas de salida. Hoy,
        múltiples ventanas coexisten; mañana, un solo canvas compuesto.
      </P>

      <H2>Performance</H2>
      <P>
        El objetivo es 60fps en una laptop de gama media con 8 canales activos
        y 3 de ellos corriendo shaders. v0 DOM-based logra eso fácilmente para
        capas color/imagen. Las capas shader necesitarán un pool de FBO
        cuando lleguen; los iframes pueden bloquear el main thread, con una
        mejor práctica documentada para autores de visualizadores.
      </P>

      <Aside title="El tracker es el reloj maestro" variant="info">
        Los visuales son esclavos de los ticks; los ticks vienen del transport
        de Tone.js, que es preciso a la muestra contra la salida de audio. Si
        una capa visual no puede mantener el ritmo, dropea frames; no ralentiza
        el audio. Esto no es negociable y es por qué el Scene VM está
        construido alrededor de interpolación de frames en lugar de animación
        de tiempo transcurrido.
      </Aside>

      <H2>Qué leer después</H2>
      <UList>
        <Li><Crossref to="per-instrument-visuals" /> para los ajustes orientados al usuario.</Li>
        <Li><Crossref to="dmpit-format" /> para cómo las escenas se serializan en archivos de proyecto.</Li>
        <Li>El spec de diseño completo vive en <Code>docs/DATAMOSHPIT_VIDEO_SPEC.md</Code> en el repo. Cubre los tres tipos de VM v0, el modelo de compositor, y las diez preguntas abiertas pendientes.</Li>
      </UList>
    </>
  );
}

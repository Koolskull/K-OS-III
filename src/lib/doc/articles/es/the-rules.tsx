import { Lead, P, H2, UList, Li, Strong, Code, Aside, Crossref } from "@/components/doc/elements";

export default function TheRules() {
  return (
    <>
      <Lead>
        K-OS tiene un pequeño conjunto de reglas de diseño que cada elemento
        de UI sigue. Dan forma al look, al comportamiento de los contribuyentes
        y al tipo de funciones que se agregan. Algunas son estéticas. Todas
        son intencionales. Juntas mantienen al OS coherente a través de
        cientos de contribuyentes y décadas de código.
      </Lead>

      <H2>Las cinco reglas</H2>
      <UList>
        <Li>
          <Strong>1. Sin esquinas redondeadas.</Strong> Los bordes son
          afilados. Los botones son rectángulos. Los íconos son rejillas de
          píxeles. La regla CSS <Code>border-radius: 0</Code> aplica
          globalmente.
        </Li>
        <Li>
          <Strong>2. Sin anti-aliasing.</Strong> Los píxeles son nítidos.{" "}
          <Code>image-rendering: pixelated</Code> en cada imagen.{" "}
          <Code>-webkit-font-smoothing: none</Code> en el texto del cuerpo.
        </Li>
        <Li>
          <Strong>3. Sin botones con gradiente.</Strong> Solo superficies pixel-art.
          Rellenos planos, bordes ilustrados, sprites dibujados a mano. Sin
          gradientes CSS vistiendo rectángulos para parecer 3D.
        </Li>
        <Li>
          <Strong>4. Cada píxel se gana su lugar.</Strong> Sin chrome de
          relleno. Cada glifo, cada línea, cada espaciador debería estar
          haciendo algo.
        </Li>
        <Li>
          <Strong>5. Cada archivo es bendecido.</Strong> Mira el ASCII art al
          principio de la mayoría de los archivos fuente. Regla cultural, no
          regla de CSS.
        </Li>
      </UList>

      <H2>Por qué estas específicamente</H2>
      <P>
        Las esquinas redondeadas, anti-aliasing y gradientes son el lenguaje
        visual del SaaS de consumo. Casi cada UI moderna los tiene. Están
        destinados a comunicar "premium, amigable, profesional". También son
        genéricos — cuando los ves no sabes en qué app estás hasta que lees
        las etiquetas.
      </P>
      <P>
        K-OS va en la otra dirección. Esquinas afiladas y píxeles visibles
        señalan: esto es una herramienta, no un producto. Pertenece a una
        tradición que incluye al Game Boy, al Amiga, LSDJ, producción
        demoscene. Sabes qué tipo de cuarto estás cuando empieza la secuencia
        de arranque.
      </P>

      <H2>Qué significa esto en la práctica</H2>
      <UList>
        <Li>
          <Strong>Usa fuentes bitmap.</Strong> Kongtext es la cara primaria.
          Sometype Mono en escalas HD (1280px+). Otras fuentes pixel/bitmap
          están bien; las fuentes modernas del sistema (San Francisco, Segoe
          UI, Roboto) no.
        </Li>
        <Li>
          <Strong>El color es monocromático para texto.</Strong> Blanco sobre
          negro o negro sobre blanco. Acentos amarillos para referencias
          cruzadas y la insignia BETA. Verde para código. Rojo para errores y
          acciones peligrosas. Magenta para placeholders.
        </Li>
        <Li>
          <Strong>Assets VMI para botones.</Strong> El sistema "Visual
          Machine Interface" usa secuencias de PNG en capas para estados de
          botón (default, hover, pressed). Ver{" "}
          <Code>VMI_ARTIST_GUIDE.md</Code> para la convención de nombres.
        </Li>
        <Li>
          <Strong>Pregunta antes de inventar.</Strong> Si necesitas un botón o
          ventana que no tiene una plantilla existente, pregúntale al
          mantenedor. No hagas chrome nuevo de improviso.
        </Li>
      </UList>

      <H2>Para contribuyentes que escriben código</H2>
      <P>
        Las reglas CSS arriba se imponen globalmente en{" "}
        <Code>src/app/globals.css</Code> vía{" "}
        <Code>border-radius: 0 !important</Code>. Los estilos inline pueden
        técnicamente sobreescribir pero no deberían. Los revisores de PR
        verifican.
      </P>
      <P>
        Las variables CSS llevan el prefijo <Code>--dm-</Code>. Los nombres de
        clase usan el prefijo <Code>dm-</Code>. Esto mantiene las clases de
        utilidad de Tailwind y el styling específico de K-OS distinguibles.
      </P>

      <Aside title="La regla de Slimentologika" variant="info">
        Los valores <Crossref to="slimentologika">Slimentologika</Crossref> de
        múltiples dígitos siguen una regla de orientación: los dígitos se
        apilan <Strong>perpendicular</Strong> al layout. Las listas
        verticales obtienen pares de dígitos horizontales; las filas
        horizontales obtienen pares de dígitos verticales. Esto no es
        decoración, es legibilidad — los valores adyacentes permanecen
        distintos.
      </Aside>

      <H2>El lado cultural</H2>
      <P>
        La regla "cada archivo es bendecido" significa que cada archivo fuente
        obtiene un pequeño encabezado de ASCII art — usualmente un santo, la
        cruz Templaria, o un extracto de Salmo. Esto es parte de la identidad
        de K-OS.
      </P>
      <P>
        De <Code>CONTRIBUTING.md</Code>: "No tienes que compartir la
        cosmovisión para contribuir. Sí tienes que respetar que la identidad
        es parte del proyecto, no decoración para ser limada."
      </P>

      <H2>Qué leer después</H2>
      <UList>
        <Li><Crossref to="welcome" /> para cómo las reglas encajan con la misión más amplia del proyecto.</Li>
        <Li><Crossref to="slimentologika" /> para la decisión estética más visible.</Li>
        <Li>El <Code>koolskull-os-ui-notes.md</Code> del repo para el ensayo de forma más larga sobre "Maximalistic Minimalism" — la filosofía detrás de las reglas.</Li>
      </UList>
    </>
  );
}

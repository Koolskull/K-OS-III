import { Lead, P, H2, UList, Li, Strong, Crossref, Aside } from "@/components/doc/elements";

export default function Welcome() {
  return (
    <>
      <Lead>
        K-OS III es un sistema operativo ficticio que se ejecuta en tu navegador
        y que de verdad sirve para hacer música, arte y (eventualmente) trabajo
        on-chain. Este manual te enseñará qué hay dentro, cómo usarlo y — si
        quieres — cómo leer su código.
      </Lead>

      <P>
        No necesitas saber nada sobre programación, software musical o sistemas
        operativos para empezar. Este manual está construido como una pequeña
        enciclopedia — artículos cortos al frente, artículos más profundos
        enlazados desde ellos. Lee lo que te llame la atención.
      </P>

      <H2>Si nunca has usado un tracker</H2>
      <P>
        Empieza con <Crossref to="what-is-a-tracker" />. Explica el tipo de
        software musical alrededor del cual se construye K-OS — diferente a
        cualquier cosa en Spotify o GarageBand, pero más fácil de lo que parece.
        Después, <Crossref to="hexadecimal" /> (una página corta) te enseña la
        única matemática rara que necesitarás.
      </P>

      <H2>Si has usado LSDJ, LGPT o PicoTracker</H2>
      <P>
        K-OS te resultará familiar rápidamente. Hojea{" "}
        <Crossref to="song-chain-phrase" /> para ver los pocos lugares donde
        K-OS hace cosas un poco diferentes, luego salta a{" "}
        <Crossref to="effect-commands" /> y{" "}
        <Crossref to="per-instrument-visuals" /> — la parte visual es la mayor
        diferencia entre K-OS y esos trackers.
      </P>

      <H2>Si quieres ejecutar K-OS en tu propia máquina</H2>
      <P>
        Lee <Crossref to="terminal-basics" /> si nunca has abierto una terminal,
        después <Crossref to="running-k-os-locally" /> para los comandos exactos.
        Veinte minutos en total, incluyendo la espera de <code>npm install</code>.
      </P>

      <H2>Si quieres saber cómo está construido todo</H2>
      <P>
        <Crossref to="scene-vm" /> profundiza en el motor visual.{" "}
        <Crossref to="dmpit-format" /> describe el formato de guardado de
        proyectos. <Crossref to="the-rules" /> explica las restricciones de
        diseño — sin esquinas redondeadas, sin anti-aliasing, sin fuentes
        preestablecidas populares — y por qué importan.
      </P>

      <Aside title="El manual es opinado, como el resto de K-OS">
        En temas donde personas serias no están de acuerdo (historia, tecnología,
        teología, economía), este manual presenta el debate en lugar de un
        veredicto. Ver{" "}
        <a
          href="https://github.com/Koolskull/K-OS-III/blob/master/docs/EPISTEMIC_STANCE.md"
          style={{ color: "#ffff00" }}
        >
          EPISTEMIC_STANCE.md
        </a>{" "}
        del proyecto para la postura completa. Los artículos técnicos a
        continuación se ciñen a los hechos; te avisamos cuando algo es una
        preferencia del proyecto vs. una medición objetiva.
      </Aside>

      <H2>Enlaces rápidos</H2>
      <UList>
        <Li><Strong>Lo básico del tracker:</Strong> <Crossref to="what-is-a-tracker" /> · <Crossref to="hexadecimal" /> · <Crossref to="song-chain-phrase" /></Li>
        <Li><Strong>Visuales:</Strong> <Crossref to="per-instrument-visuals" /> · <Crossref to="scene-vm" /></Li>
        <Li><Strong>Desarrollo local:</Strong> <Crossref to="terminal-basics" /> · <Crossref to="running-k-os-locally" /></Li>
        <Li><Strong>Referencia:</Strong> <Crossref to="effect-commands" /> · <Crossref to="dmpit-format" /> · <Crossref to="glossary" /></Li>
      </UList>
    </>
  );
}

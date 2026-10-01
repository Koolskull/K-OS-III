import { Lead, P, H2, UList, Li, Strong, Crossref, Aside } from "@/components/doc/elements";

export default function WhyKOS() {
  return (
    <>
      <Lead>
        K-OS es un sistema operativo real entregado primero a través de un
        navegador web. Eso es una decisión deliberada, no una limitación — es
        la forma más rápida de llegar a la mayor cantidad de personas en la
        mayor variedad de hardware, incluido el hardware que el software
        moderno ha dado por obsoleto.
      </Lead>

      <H2>Un OS real, no una simulación</H2>
      <P>
        K-OS no es un homenaje visual a Windows 95 ni una captura de pantalla
        de escritorio con piel de navegador. Debajo de las apps con ventanas
        hay un entorno operativo real: un shell que lanza programas, un
        gestor de ventanas, un sistema de archivos virtual, un enrutador de
        entrada que normaliza teclados, gamepads y táctil en un solo flujo, y
        motores reales de sonido y visuales. Todo lo que hace un OS, K-OS lo
        hace — simplemente da la casualidad de que, por ahora, corre dentro
        de una pestaña del navegador.
      </P>
      <P>
        Ese "por ahora" importa. Un prototipo portátil impreso en 3D usando
        pantallas LCD comunes ya se construyó y está en pruebas. Una edición
        instalable basada en Linux (sobre una bifurcación de Zorin OS) está
        en desarrollo. La web es la primera superficie de entrega. No es la
        única.
      </P>

      <H2>El navegador es el portal universal</H2>
      <P>
        Ninguna otra superficie de software está tan universalmente disponible
        como una URL. Sin aprobación de tienda de apps, sin instalación, sin
        dependencia de dispositivo, sin impuesto de sistema operativo. Si
        puedes abrir un navegador, puedes abrir K-OS. Los teléfonos cuentan.
        Los portátiles viejos cuentan. Los Chromebooks escolares cuentan. La
        máquina que creías demasiado lenta para correr nada nuevo cuenta.
      </P>
      <P>
        Esto importa porque el éxito del proyecto depende de que muchas manos
        lo encuentren, lo usen, lo rompan, reporten errores y envíen parches.
        Una build web maximiza el área de superficie para ese bucle. El
        hardware que sólo unas pocas personas tienen no puede producir el
        mismo volumen de retroalimentación, y las plataformas cerradas no
        pueden producirla en absoluto.
      </P>

      <H2>Corriendo donde el software moderno ya no corre</H2>
      <P>
        La industria informática ha decidido, silenciosamente, que el hardware
        de hace cinco años es basura. Los OS de consumo abandonan el soporte;
        las tiendas de apps dejan de servir actualizaciones; las webs envían
        megabytes de JavaScript para un solo botón. K-OS toma la postura
        contraria. Builds ligeras, primitivas de la plataforma web donde sea
        posible, subsistemas pesados opcionales (3D, emuladores WASM) que sólo
        cargan cuando se invocan. El objetivo es que K-OS siga siendo usable
        en las máquinas que la gente realmente tiene, no en la que un
        reseñador tiene en la mano este trimestre.
      </P>

      <H2>Qué significa "empezar aquí"</H2>
      <P>
        La versión del navegador es el proyecto mínimo viable. Es el campo de
        pruebas público: una forma abierta, enlazable y gratuita de que
        cualquiera pruebe lo que K-OS intenta ser, lo desmonte y nos diga qué
        está mal. Cada punto de fricción que encuentre un usuario del
        navegador ahora es uno que las versiones portátil e instalable podrán
        evitar después. Madurar antes de enviar es la estrategia.
      </P>

      <Aside title="Esto también es una postura sobre para quién es el software">
        K-OS está planteado como una herramienta creativa, no como una
        superficie de entrega de contenido. Ver{" "}
        <Crossref to="human-cognition-first" /> para el argumento completo, y{" "}
        <Crossref to="from-browser-to-hardware" /> para la hoja de ruta de
        entrega.
      </Aside>

      <H2>Profundizar</H2>
      <UList>
        <Li><Strong>La hoja de ruta:</Strong> <Crossref to="from-browser-to-hardware" /></Li>
        <Li><Strong>La postura sobre el lector:</Strong> <Crossref to="human-cognition-first" /></Li>
        <Li><Strong>Las restricciones de diseño que derivan de esto:</Strong> <Crossref to="the-rules" /></Li>
      </UList>
    </>
  );
}

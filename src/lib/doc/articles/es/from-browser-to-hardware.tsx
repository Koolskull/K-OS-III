import { Lead, P, H2, UList, OList, Li, Strong, Code, Crossref, Aside } from "@/components/doc/elements";

export default function FromBrowserToHardware() {
  return (
    <>
      <Lead>
        K-OS se entrega por etapas. El navegador es la etapa cero — el proyecto
        mínimo viable. Cada etapa siguiente se alimenta de lo que la anterior
        aprendió. Ninguna etapa reemplaza a las anteriores; la build del
        navegador se queda viva para siempre.
      </Lead>

      <H2>Etapa 0 — la build del navegador (ahora mismo)</H2>
      <P>
        Dentro de lo que estás leyendo este manual. Corre en cualquier cosa
        que pueda cargar una página web: ordenadores de escritorio, portátiles,
        teléfonos, tablets, Chromebooks escolares, hardware envejecido que las
        apps más nuevas han descartado. La distribución es un enlace. La
        instalación es pulsar <Code>F11</Code> si lo quieres a pantalla
        completa. Cero intermediarios.
      </P>
      <P>
        Esta etapa es también el laboratorio público. Es donde los usuarios
        prueban, rompen, revisan, critican y copian. Cuanto más tiempo y más
        duro se use esta etapa, más madura queda la interfaz antes de aterrizar
        en hardware que no se puede parchear tan casualmente.
      </P>

      <H2>Etapa 1 — la PWA</H2>
      <P>
        La misma base de código, empaquetada como Progressive Web App. Se
        instala en la pantalla de inicio en teléfonos y en la lista de apps
        en el escritorio. Funciona sin conexión. Se lanza sin la barra del
        navegador a la vista para que se sienta como una app nativa. No se
        necesita aprobación de tienda de apps en la mayoría de plataformas —
        aunque la enviaremos donde ayude a la descubribilidad.
      </P>
      <P>
        La PWA mayormente cierra la brecha entre "un sitio web" y "un programa
        que posees". Es el puente natural entre la etapa cero y el hardware
        real.
      </P>

      <H2>Etapa 2 — el prototipo portátil</H2>
      <P>
        Un dispositivo físico diseñado para K-OS y nada más. La carcasa está
        impresa en 3D usando un archivo que cualquiera con acceso a una
        impresora puede compartir y reproducir. La pantalla es una LCD común —
        del tipo ya producido en masa para tableros, cuadros de instrumentos y
        electrónica de hobby. El objetivo es un dispositivo cuya lista de
        materiales sea lo bastante pequeña, y cuyas piezas sean lo bastante
        comunes, como para que la gente pueda construirse uno si quiere.
      </P>
      <P>
        Una primera impresión de esta carcasa existe y se está usando para
        pruebas ahora mismo. El diseño no es definitivo; en parte para eso es
        la etapa cero — para sacar a la luz qué necesita realmente la interfaz
        para sentirse bien en un dispositivo dedicado.
      </P>

      <H2>Etapa 3 — edición Linux instalable</H2>
      <P>
        Un sistema operativo de escritorio construido sobre una bifurcación
        de Zorin OS, con K-OS como shell. Para usuarios que quieren una máquina
        completa dedicada a esto — la misma experiencia que en el navegador,
        pero como su escritorio real, con integración con el sistema de
        archivos, rendimiento nativo y sin un navegador sentado en medio.
      </P>

      <H2>Por qué este orden</H2>
      <OList>
        <Li><Strong>Navegador primero = alcance de pruebas.</Strong> Cuanta más gente pruebe K-OS antes de enviar un dispositivo dedicado, menos unidades se desperdician en un diseño que necesitaba más iteración.</Li>
        <Li><Strong>PWA después = sensación casi nativa en los dispositivos que la gente ya tiene.</Strong> Demuestra que el shell funciona sin un navegador visible.</Li>
        <Li><Strong>Portátil luego = hardware dirigido y reparable.</Strong> Construido con piezas que cualquiera puede comprar, en una carcasa que cualquiera puede imprimir.</Li>
        <Li><Strong>Linux instalable al final = uso de escritorio a escala completa.</Strong> Para entonces las decisiones de diseño están ganadas; lo único que queda es dejar que el shell se sostenga por sí mismo como OS principal.</Li>
      </OList>

      <Aside title="El camino es público">
        Las cuatro etapas viven en un solo repositorio. Los errores de la
        etapa cero que reportes hoy se convierten en decisiones de la etapa
        dos de las que te beneficias después — incluso si nunca posees el
        portátil.
      </Aside>

      <H2>Ver también</H2>
      <UList>
        <Li><Strong>El porqué:</Strong> <Crossref to="why-k-os" /></Li>
        <Li><Strong>Correr K-OS desde el código hoy:</Strong> <Crossref to="running-k-os-locally" /></Li>
        <Li><Strong>La postura sobre el lector:</Strong> <Crossref to="human-cognition-first" /></Li>
      </UList>
    </>
  );
}

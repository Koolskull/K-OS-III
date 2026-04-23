import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function TerminalBasics() {
  return (
    <>
      <Lead>
        La <Strong>terminal</Strong> (también llamada línea de comandos, shell
        o consola) es una interfaz solo-texto a tu computadora. Escribes un
        comando, presionas Enter, la computadora responde. Parece antigua y es
        una de las herramientas más poderosas que tiene un desarrollador. Para
        ejecutar K-OS en tu propia máquina necesitas usar una — pero solo
        brevemente, y solo para un puñado de comandos.
      </Lead>

      <H2>Por qué molestarse</H2>
      <P>
        Casi todo lo que haces en una computadora es un envoltorio alrededor de
        lo que la terminal hace. Una app gráfica para instalar software es un
        envoltorio alrededor de un comando de terminal que descarga y descomprime
        archivos. Una ventana del finder es un envoltorio alrededor de comandos
        de terminal que listan y abren archivos. Los envoltorios son más
        agradables a la vista; la terminal hace más, más rápido, y te permite
        encadenar comandos.
      </P>
      <P>
        Para K-OS específicamente, necesitas la terminal para: instalar
        dependencias de Node.js (un comando), iniciar el servidor de desarrollo
        local (un comando), y bajar actualizaciones del proyecto desde GitHub
        (un comando). Eso es todo. No tienes que vivir ahí.
      </P>

      <H2>Cómo abrir una</H2>
      <H3>En macOS</H3>
      <UList>
        <Li>Pulsa <Code>⌘ + Espacio</Code> para abrir Spotlight, escribe <Strong>terminal</Strong>, pulsa Enter.</Li>
        <Li>O abre Finder → Aplicaciones → Utilidades → Terminal.</Li>
      </UList>
      <H3>En Windows</H3>
      <UList>
        <Li>Pulsa la tecla Windows, escribe <Strong>terminal</Strong>, pulsa Enter. (Windows 11 trae Windows Terminal; Windows 10 tiene PowerShell — ambos funcionan.)</Li>
        <Li>Para la experiencia más parecida a Linux, instala <Strong>WSL</Strong> (Windows Subsystem for Linux) desde Microsoft Store. Las instrucciones de K-OS asumen un shell tipo Unix, que WSL te da.</Li>
      </UList>
      <H3>En Linux</H3>
      <UList>
        <Li>Probablemente ya lo sabes. <Code>Ctrl+Alt+T</Code> en la mayoría de las distros, o clic derecho en el escritorio → "Abrir Terminal".</Li>
      </UList>

      <H2>Qué verás</H2>
      <P>
        Un cursor parpadeante junto a un prompt que termina con <Code>$</Code>{" "}
        o <Code>%</Code> o <Code>&gt;</Code>. Eso es el shell esperando que
        escribas. Cualquier cosa antes del prompt es información: tu nombre de
        usuario, la carpeta actual, a veces la hora. No te preocupes por eso
        ahora.
      </P>
      <CodeBlock label="Cómo se ve un prompt típico">
{`koolskull@laptop ~/Documents $ _`}
      </CodeBlock>

      <H2>Los cinco comandos que realmente necesitas</H2>
      <P>
        Lista corta. Domina estos y puedes hacer todo lo que K-OS te pide.
      </P>
      <Aside title="Convención de comandos" variant="info">
        Cuando este manual muestra comandos como <Code>cd K-OS-III</Code>,
        escribes <Code>cd K-OS-III</Code> exactamente, después pulsas Enter.
        La terminal hace la acción y te muestra el resultado (o nada, si la
        acción fue silenciosa y exitosa).
      </Aside>

      <H3>1. <Code>pwd</Code> — "print working directory" (imprimir directorio actual)</H3>
      <P>Te dice en qué carpeta estás actualmente. Cuando dudes, ejecuta esto.</P>
      <CodeBlock>{`pwd`}</CodeBlock>

      <H3>2. <Code>ls</Code> — listar archivos en la carpeta actual</H3>
      <P>
        Muestra qué hay en la carpeta donde estás. <Code>ls -la</Code> muestra
        archivos ocultos y detalles (tamaño, fecha de modificación).
      </P>
      <CodeBlock>{`ls
ls -la`}</CodeBlock>

      <H3>3. <Code>cd</Code> — "change directory" (moverse a una carpeta)</H3>
      <P>
        <Code>cd Documents</Code> te mueve dentro de una carpeta llamada
        Documents (si existe en tu carpeta actual). <Code>cd ..</Code> te mueve
        un nivel arriba. <Code>cd ~</Code> te lleva a tu carpeta de inicio.
      </P>
      <CodeBlock>{`cd Documents
cd ~/Projects/K-OS-III
cd ..`}</CodeBlock>

      <H3>4. <Code>git clone</Code> — descargar un proyecto de GitHub</H3>
      <P>
        Copia un repositorio remoto a tu carpeta actual. K-OS vive en{" "}
        <Code>github.com/Koolskull/K-OS-III</Code>:
      </P>
      <CodeBlock>{`git clone https://github.com/Koolskull/K-OS-III.git`}</CodeBlock>
      <P>
        Después de que esto termine, <Code>ls</Code> mostrará una nueva carpeta{" "}
        <Code>K-OS-III</Code> en tu ubicación actual. Haz <Code>cd</Code> dentro.
      </P>

      <H3>5. <Code>npm</Code> — Node Package Manager</H3>
      <P>
        K-OS es un proyecto de Node.js. <Code>npm</Code> es la herramienta que
        instala las librerías de las que depende y ejecuta sus scripts. Los
        comandos npm exactos que K-OS necesita están en la siguiente página
        (<Crossref to="running-k-os-locally" />). Por ahora, solo necesitas
        saber que <Code>npm</Code> es lo que usarás para iniciar el servidor
        de desarrollo local.
      </P>

      <H2>Cosas que te ahorrarán tiempo</H2>
      <UList>
        <Li>
          <Strong>Tab completion.</Strong> Escribe un nombre de archivo parcial,
          pulsa Tab, el shell lo completa. Dos pulsaciones lista las opciones.
        </Li>
        <Li>
          <Strong>Flecha arriba.</Strong> Recupera el último comando que
          ejecutaste. Flecha arriba dos veces para dos comandos atrás, etc.
          Salva tus dedos.
        </Li>
        <Li>
          <Strong><Code>Ctrl+C</Code> detiene un comando en ejecución.</Strong> Cuando
          el servidor de desarrollo está corriendo y quieres detenerlo, esa es
          la pulsación. No Cmd+W, no cerrar la terminal — Ctrl+C.
        </Li>
        <Li>
          <Strong><Code>Ctrl+L</Code> (o <Code>clear</Code>) limpia la pantalla.</Strong>{" "}
          Cuando el output se vuelve ruidoso.
        </Li>
        <Li>
          <Strong>Arrastra y suelta una carpeta sobre la ventana de la terminal</Strong>{" "}
          en la mayoría de los SO — pega la ruta completa de la carpeta. Útil
          cuando no recuerdas la ruta exacta para escribir.
        </Li>
      </UList>

      <H2>Si algo va mal</H2>
      <UList>
        <Li>
          <Code>command not found</Code> — el programa que intentaste ejecutar
          no está instalado (o no está en tu PATH). Para npm, eso significa que
          necesitas Node.js.
        </Li>
        <Li>
          <Code>permission denied</Code> — normalmente estás intentando escribir
          a una carpeta que no es tuya. La mayoría de las veces la solución es
          ejecutar desde una carpeta que sí es tuya (tu directorio home, no una
          carpeta de sistema).
        </Li>
        <Li>
          <Code>no such file or directory</Code> — error tipográfico en la
          ruta, o no estás donde crees que estás. Ejecuta <Code>pwd</Code> y{" "}
          <Code>ls</Code> para orientarte.
        </Li>
        <Li>
          <Strong>La terminal está colgada.</Strong> Prueba <Code>Ctrl+C</Code>.
          Si eso no ayuda, cierra la terminal y abre una nueva.
        </Li>
      </UList>

      <H2>Qué leer después</H2>
      <P>
        Con la terminal abierta y orientado, ve a{" "}
        <Crossref to="running-k-os-locally" /> para los comandos reales de K-OS.
      </P>
    </>
  );
}

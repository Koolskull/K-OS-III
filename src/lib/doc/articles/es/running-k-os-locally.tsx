import { Lead, P, H2, H3, UList, Li, Strong, Code, CodeBlock, Aside, Crossref } from "@/components/doc/elements";

export default function RunningKOSLocally() {
  return (
    <>
      <Lead>
        Ejecutar K-OS en tu propia máquina toma unos diez minutos la primera
        vez, en su mayoría esperando descargas. Después, iniciarlo es un
        comando. Este artículo recorre cada paso desde "tengo una terminal
        abierta" hasta "K-OS está corriendo en mi navegador en localhost". Si
        aún no tienes una terminal abierta, empieza con{" "}
        <Crossref to="terminal-basics" />.
      </Lead>

      <H2>Qué necesitas primero</H2>
      <UList>
        <Li>
          <Strong>Node.js v20 o más reciente.</Strong> Descarga de{" "}
          <a href="https://nodejs.org" style={{ color: "#ffff00" }}>nodejs.org</a>.
          Instala con la configuración por defecto.
        </Li>
        <Li>
          <Strong>Git.</Strong> Casi seguro ya está instalado en Mac y Linux.
          En Windows, instala vía{" "}
          <a href="https://git-scm.com" style={{ color: "#ffff00" }}>git-scm.com</a>{" "}
          o usa WSL.
        </Li>
        <Li>
          <Strong>Aproximadamente 1 GB de espacio en disco.</Strong> K-OS en sí
          es pequeño, pero sus dependencias (Next.js, Three.js, Tone.js, etc.)
          se acumulan.
        </Li>
      </UList>

      <Aside title="Verifica tus instalaciones" variant="tip">
        En una terminal, ejecuta <Code>node --version</Code> y{" "}
        <Code>git --version</Code>. Ambos deberían imprimir números de versión.
        Si alguno dice "command not found", instala esa herramienta primero.
      </Aside>

      <H2>Paso a paso</H2>

      <H3>1. Elige una carpeta donde trabajar</H3>
      <P>
        K-OS se convertirá en una subcarpeta donde estés. La mayoría de la
        gente pone proyectos en <Code>~/Documents</Code> o <Code>~/Projects</Code>:
      </P>
      <CodeBlock>{`cd ~/Documents`}</CodeBlock>

      <H3>2. Clona el repositorio</H3>
      <CodeBlock>{`git clone https://github.com/Koolskull/K-OS-III.git`}</CodeBlock>
      <P>
        Git descarga el proyecto entero (~50 MB). Cuando termina, verás una
        nueva carpeta. <Code>ls</Code> para confirmar:
      </P>
      <CodeBlock>{`ls
# deberías ver K-OS-III en la lista`}</CodeBlock>

      <H3>3. Entra a la carpeta del proyecto</H3>
      <CodeBlock>{`cd K-OS-III`}</CodeBlock>
      <P>
        Todo abajo asume que estás dentro de esta carpeta. Si pierdes la
        cuenta, ejecuta <Code>pwd</Code> — debería terminar con{" "}
        <Code>K-OS-III</Code>.
      </P>

      <H3>4. Instala dependencias</H3>
      <CodeBlock>{`npm install --legacy-peer-deps`}</CodeBlock>
      <P>
        Esta es la parte lenta. <Code>npm</Code> lee <Code>package.json</Code>,
        descarga cada librería de la que K-OS depende, y las pone en una
        carpeta llamada <Code>node_modules</Code>. La primera ejecución toma
        1-3 minutos dependiendo de tu internet. Verás mucho output en pantalla
        que termina con algo como "added 412 packages". Eso es éxito.
      </P>
      <P>
        El flag <Code>--legacy-peer-deps</Code> es necesario porque algunas
        dependencias de K-OS declaran requisitos de versión demasiado estrictos
        que npm normalmente se niega a satisfacer. El flag le dice a npm
        "ignora esos, usa lo que está realmente en package.json". Es seguro e
        intencional — si lo olvidas, verás un muro de errores rojos y la
        instalación se abortará.
      </P>

      <H3>5. Inicia el servidor de desarrollo</H3>
      <CodeBlock>{`npm run dev`}</CodeBlock>
      <P>
        Next.js levanta un servidor web local. En unos segundos verás:
      </P>
      <CodeBlock label="Deberías ver algo así">
{`▲ Next.js 16.1.6 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.1.X:3000

✓ Ready in 358ms`}
      </CodeBlock>

      <H3>6. Ábrelo en tu navegador</H3>
      <P>
        Visita <Code>http://localhost:3000</Code>. La secuencia de arranque de
        K-OS se desplaza, el escritorio carga, y ya estás dentro. Eso es. Estás
        ejecutando K-OS.
      </P>

      <Aside title="El servidor de desarrollo se queda corriendo" variant="info">
        La terminal desde la que iniciaste <Code>npm run dev</Code> ahora está
        ocupada sirviendo la app. Déjala abierta. Cuando edites archivos
        fuente, el servidor detecta cambios y el navegador se refresca
        automáticamente (esto se llama Hot Module Reload). Para detener el
        servidor, presiona <Code>Ctrl+C</Code> en esa terminal.
      </Aside>

      <H2>Otros comandos que podrías querer</H2>

      <H3><Code>npm run build</Code></H3>
      <P>
        Construye la versión de producción de K-OS. Ejecuta el compilador de
        TypeScript, empaqueta todo, optimiza assets. Lo usa el deploy de GitHub
        Pages y cualquier cosa que envíe el sitio para producción real. Falla
        si hay errores de TypeScript o si tu código tiene problemas que{" "}
        <Code>npm run dev</Code> tolera pero producción no.
      </P>

      <H3><Code>npm run lint</Code></H3>
      <P>
        Ejecuta el verificador de tipos. Te dice si tu código tiene errores de
        tipo. Ejecuta antes de enviar un pull request.
      </P>

      <H3><Code>npm run preview:export</Code></H3>
      <P>
        Construye el static export (el mismo output que se envía a{" "}
        <Code>koolskull.github.io/k-os</Code>) y lo sirve localmente en el
        puerto 4044. Usa esto para verificar que los cambios funcionan en el
        build de producción, no solo en modo dev. La URL es{" "}
        <Code>http://localhost:4044/k-os/</Code> — nota el prefijo de ruta
        <Code>/k-os/</Code>.
      </P>

      <H2>Si algo va mal</H2>

      <H3>"npm: command not found"</H3>
      <P>Node.js no está instalado, o tu sesión de terminal no lo ha detectado.
        Instala Node desde nodejs.org, después cierra y reabre tu terminal.</P>

      <H3>"port 3000 is already in use"</H3>
      <P>
        Algo más está usando el puerto 3000 (quizás un{" "}
        <Code>npm run dev</Code> anterior que olvidaste). O mata el otro
        proceso o ejecuta en un puerto diferente:
      </P>
      <CodeBlock>{`PORT=3050 npm run dev`}</CodeBlock>

      <H3>"Cannot find module ..."</H3>
      <P>
        Las dependencias no se instalaron del todo. Borra <Code>node_modules</Code>{" "}
        y vuelve a ejecutar install:
      </P>
      <CodeBlock>{`rm -rf node_modules package-lock.json
npm install --legacy-peer-deps`}</CodeBlock>

      <H3>El navegador muestra una página en blanco o "ECONNREFUSED"</H3>
      <UList>
        <Li>Revisa la terminal — ¿el servidor de desarrollo sigue corriendo? ¿Crashó con un error?</Li>
        <Li>¿El navegador apunta al puerto correcto? (Normalmente 3000.)</Li>
        <Li>Prueba un navegador diferente. Audio + WebGL + Web MIDI funcionan mejor en Chrome/Firefox/Safari recientes.</Li>
      </UList>

      <H2>Qué leer después</H2>
      <P>
        Una vez que K-OS esté corriendo, métete en la app real:
      </P>
      <UList>
        <Li><Crossref to="what-is-a-tracker" /> — si quieres empezar a usar Datamoshpit.</Li>
        <Li><Crossref to="dmpit-format" /> — si tienes curiosidad sobre cómo se almacenan los proyectos guardados.</Li>
        <Li><Crossref to="the-rules" /> — si quieres contribuir código.</Li>
      </UList>
    </>
  );
}

import { Lead, P, H2, H3, UList, OList, Li, Strong, Code, CodeBlock, Aside, Table, Crossref } from "@/components/doc/elements";

export default function Hexadecimal() {
  return (
    <>
      <Lead>
        Hexadecimal — abreviado <Strong>hex</Strong> — es solo una forma de
        escribir números usando <Strong>16 dígitos</Strong> en lugar de los 10
        con los que creciste. K-OS usa hex en todas partes: números de fila,
        números de canal, valores de efectos. Una vez que puedas leerlo, toda
        la interfaz se vuelve más fácil.
      </Lead>

      <H2>Ya conoces la base 10</H2>
      <P>
        El número <Code>347</Code> significa: 3 centenas, 4 decenas, 7 unidades.
        Cada posición de dígito vale diez veces la siguiente a su derecha.
        Usamos diez símbolos (<Code>0</Code> al <Code>9</Code>) porque tenemos
        diez dedos.
      </P>
      <P>
        Las computadoras no tienen dedos. Tienen interruptores on/off. Hacer
        matemáticas con números de dieciséis símbolos resultó ser mucho más
        conveniente para ellas — dieciséis es una potencia de dos, así que cada
        dígito hex cabe exactamente en cuatro dígitos binarios. Un par de
        dígitos hex es un byte (ocho bits). Por eso ves hex en todas partes en
        computación.
      </P>

      <H2>Los dieciséis dígitos</H2>
      <P>
        Los primeros diez son familiares: <Code>0 1 2 3 4 5 6 7 8 9</Code>.
        Después nos quedamos sin dígitos individuales, así que tomamos las
        primeras seis letras del alfabeto para diez al quince:
      </P>
      <Table
        headers={["Hex", "Decimal", "Hex", "Decimal"]}
        rows={[
          ["0", "0", "8", "8"],
          ["1", "1", "9", "9"],
          ["2", "2", "A", "10"],
          ["3", "3", "B", "11"],
          ["4", "4", "C", "12"],
          ["5", "5", "D", "13"],
          ["6", "6", "E", "14"],
          ["7", "7", "F", "15"],
        ]}
      />

      <H2>Contando hacia arriba</H2>
      <P>
        Hex cuenta de la misma manera que decimal: cuando te quedas sin dígitos,
        llevas una a la siguiente posición. Después de <Code>F</Code> viene{" "}
        <Code>10</Code> (que significa dieciséis, no diez). Después de{" "}
        <Code>1F</Code> viene <Code>20</Code> (treinta y dos).
      </P>
      <CodeBlock label="Contando de 0 a 32 en hex">
{`00  01  02  03  04  05  06  07
08  09  0A  0B  0C  0D  0E  0F   ← fin de los primeros dieciséis
10  11  12  13  14  15  16  17
18  19  1A  1B  1C  1D  1E  1F   ← fin de los segundos dieciséis
20                                ← treinta y dos`}
      </CodeBlock>

      <H2>Leyendo bytes hex de dos dígitos</H2>
      <P>
        La mayoría de las cosas en K-OS se muestran como <Strong>dos dígitos hex</Strong> —
        un solo byte, que puede contener valores <Code>00</Code> a <Code>FF</Code>{" "}
        (cero a 255). El dígito de la izquierda es el "nibble alto" — vale 16
        cada uno. El dígito de la derecha es el "nibble bajo" — vale 1 cada uno.
      </P>
      <P>
        Para convertir <Code>4C</Code> a decimal: nibble alto es <Code>4</Code>{" "}
        (4 × 16 = 64). Nibble bajo es <Code>C</Code> (vale 12). Total: 64 + 12 = 76.
      </P>
      <P>
        Casi nunca necesitas hacer esta conversión mentalmente. El punto del
        hex es que puedes comparar y combinar valores rápidamente sin convertir:
      </P>
      <UList>
        <Li><Code>00</Code> es "off" o "mínimo"</Li>
        <Li><Code>FF</Code> es "máximo" o "lleno"</Li>
        <Li><Code>80</Code> está justo en el medio (128, mitad de 256)</Li>
        <Li><Code>40</Code> es un cuarto, <Code>C0</Code> es tres cuartos</Li>
      </UList>

      <Aside title="Truco: pan, volumen y 'centrado'" variant="tip">
        Pan en K-OS va de <Code>00</Code> (totalmente izquierda) a <Code>FF</Code>{" "}
        (totalmente derecha), siendo <Code>80</Code> centrado. En cualquier
        campo de K-OS donde veas <Code>80</Code>, ese campo lo trata como
        "neutro" o "sin desplazamiento". Una vez que detectas el patrón lo verás
        en movimiento granular, transposición y varios efectos.
      </Aside>

      <H2>Por qué los trackers usan hex específicamente</H2>
      <P>
        Tres razones:
      </P>
      <OList>
        <Li>
          <Strong>16 cabe.</Strong> Una phrase de tracker convencionalmente
          tiene 16 filas. Así que los números de fila van <Code>00</Code>–<Code>0F</Code> —
          exactamente un dígito hex. Simplemente encaja.
        </Li>
        <Li>
          <Strong>Compacto.</Strong> Dos caracteres pueden contener cualquier
          valor de un solo byte. Decimal necesitaría tres (<Code>000</Code>–<Code>255</Code>) y
          desperdiciaría espacio en pantalla.
        </Li>
        <Li>
          <Strong>Los patrones de bits son visibles.</Strong> Muchos efectos de
          tracker son flags de bit. <Code>0x80</Code> significa "el bit alto
          está activado". Saber que eso es binario <Code>10000000</Code> es útil
          cuando estás ajustando comandos de efecto y viendo cómo se acumulan.
        </Li>
      </OList>

      <H2>El prefijo "0x"</H2>
      <P>
        En código (y a veces en este manual), verás números escritos como{" "}
        <Code>0x4C</Code>. El <Code>0x</Code> es solo un marcador que dice
        "esto es hex" para que no confundas <Code>10</Code> (el número decimal
        diez) con <Code>0x10</Code> (el número hex dieciséis). Dentro de la UI
        del tracker de K-OS, el prefijo se omite porque cada valor en pantalla
        es hex por defecto.
      </P>

      <H2>Atajos rápidos de conversión</H2>
      <UList>
        <Li>Un dígito hex ≤ <Code>9</Code>: equivale a su valor decimal.</Li>
        <Li><Code>A</Code>=10, <Code>B</Code>=11, <Code>C</Code>=12, <Code>D</Code>=13, <Code>E</Code>=14, <Code>F</Code>=15. Memoriza esta fila.</Li>
        <Li>Para convertir dos dígitos hex: multiplica el de la izquierda por 16, suma el de la derecha.</Li>
        <Li>Para ir de decimal a hex: divide entre 16. El cociente es el dígito de la izquierda, el resto el de la derecha.</Li>
      </UList>

      <H3>Pruébalo</H3>
      <CodeBlock>
{`Hex   Cómo leerlo          Decimal
0F    15                    15
10    1×16 + 0              16
20    2×16 + 0              32
40    4×16 + 0              64
80    8×16 + 0              128
A0    10×16 + 0             160
FF    15×16 + 15            255`}
      </CodeBlock>

      <H2>Slimentologika es solo hex con formas diferentes</H2>
      <P>
        K-OS incluye un alfabeto pixelado de 16 glifos llamado{" "}
        <Crossref to="slimentologika" />. Los glifos mapean exactamente a los
        dígitos hex <Code>0</Code>–<Code>F</Code>. Pulsar <Code>Tab</Code> en
        cualquier pantalla del tracker alterna entre los dígitos hex estándar y
        los glifos Slimentologika. Los números subyacentes son idénticos —
        solo cambia la representación visual.
      </P>
    </>
  );
}

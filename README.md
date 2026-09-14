# Atelier · Generador de Nombres por Lotes

Aplicación web para componer nombres y palabras **por lotes** en tipografías
caligráficas y exportarlos a **PDF vectorial**, **SVG de corte** o impresión
directa, con medidas físicas reales.

Pensada para producción de **vinil autoadhesivo** (plotter de corte) y
**sublimación** sobre tazas, franelas y textiles.

```
┌──────────────┬────────────────────────────────────────────┐
│  Controles   │  Hojas a escala real (A4, Carta, taza…)    │
│              │                                             │
│  1 Texto     │      María    Sofía    Valentina            │
│  2 Fuente    │      Emiliano    Regalo                     │
│  3 Tamaño    │                                             │
│  4 Color     │  ← lo que ves es lo que se imprime →        │
│  5 Adornos   │                                             │
│  6 Hoja      │  Piezas: 19 · Hojas: 2 · Aprov.: 28 %       │
│  7 Ajustes   │                                             │
└──────────────┴────────────────────────────────────────────┘
```

---

## Índice

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Guía de uso](#guía-de-uso)
- [Flujos de producción](#flujos-de-producción)
- [Precisión dimensional](#precisión-dimensional)
- [Arquitectura técnica](#arquitectura-técnica)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Licencias](#licencias)

---

## Características

### Composición por lotes
- Un nombre o palabra por línea, sin límite práctico de cantidad.
- Sintaxis por línea: `Nombre | repeticiones | tamaño`.
- Repetición global, conversión a MAYÚSCULAS / minúsculas / Capitalizado.
- Utilidades de lista: ordenar A→Z, eliminar duplicados, limpiar vacías.
- Paginación automática con empaquetado por filas y alineación por línea base.

### Tipografía
- **42 fuentes** disponibles: Joseph Sophia (local) + 41 de Google Fonts,
  agrupadas en *Caligráficas*, *Manuscritas* y *Rectas*.
- Carga de fuentes propias por arrastre (`.ttf`, `.otf`, `.woff`, `.woff2`).
- **Explorador de glifos**: lee el archivo binario de la fuente y muestra
  dibujados *todos* sus caracteres, incluidos los que no tienen tecla.
- 16 interruptores de alternativas OpenType: `swsh`, `salt`, `calt`, `liga`,
  `dlig`, `hlig`, `ss01`–`ss08`, `titl`, `ornm`.
- Paleta de 32 símbolos decorativos (corazones, florones, estrellas).

### Medidas reales
- Unidades: **milímetros, centímetros, pulgadas y puntos**.
- Tres criterios de tamaño: **altura de mayúscula**, **alto total del texto**
  o **tamaño de fuente**.
- Ancho máximo por pieza: reduce automáticamente los nombres largos.
- Papeles: A4, Carta, Oficio, A3, Tabloide, A5, **taza 11 oz (200 × 90 mm)**,
  **rollos de vinil** (300 × 600 y 600 × 900 mm) y medida personalizada.

### Salidas
| Botón | Resultado | Uso recomendado |
|---|---|---|
| **Imprimir** | Vectorial nativo del navegador, escala 1:1 | Impresión directa y «Guardar como PDF» |
| **PDF** | PDF vectorial con el texto convertido a contornos | Envío a imprenta, archivo final |
| **SVG** | Un archivo por hoja, texto como `<path>` | Plotter de corte (Silhouette, Cricut, Roland) |
| **Guardar** | Proyecto `.json` con todo el estado | Retomar el trabajo más tarde |

### Interfaz
- Temas claro y oscuro con persistencia.
- Zoom con ajuste automático al ancho disponible.
- Ajustes reutilizables guardados en el navegador.
- Modo **Espejo** para transfer y sublimación.
- Guías de recorte en pantalla (no se imprimen).
- Estadísticas en vivo: piezas, hojas y aprovechamiento del papel.

---

## Requisitos

- Un navegador moderno basado en Chromium, Firefox o Safari.
- **Un servidor HTTP.** No abras el archivo con `file://`: el navegador
  bloquea por CORS la lectura del archivo de fuente y perderías el explorador
  de glifos y la exportación vectorial.
- Conexión a internet en la primera carga (Tailwind y Google Fonts vienen de
  CDN y quedan en caché).

---

## Instalación

1. Copia la carpeta del proyecto dentro del `DocumentRoot` de tu servidor.

2. Coloca tu archivo de Joseph Sophia en `fonts/` con este nombre exacto:

   ```
   fonts/josephsophia.ttf     ← recomendado
   fonts/josephsophia.otf     ← también válido
   ```

   Usa **`.ttf` o `.otf`**: son los únicos formatos que permiten extraer los
   contornos, y de eso dependen el explorador de glifos y la exportación
   vectorial. Los formatos `.woff2` y `.woff` sirven solo para la vista previa.

3. Abre la aplicación en el navegador:

   ```
   http://localhost/<ruta-del-proyecto>/
   ```

> **Nota sobre XAMPP.** Si obtienes un 404, comprueba qué servidor está
> respondiendo realmente en el puerto 80. Es habitual tener más de una
> instalación y que la activa apunte a otro `DocumentRoot` distinto del que
> declara tu `httpd.conf`.

### Verás dos 404 en la consola

`josephsophia.woff2` y `josephsophia.woff` darán 404 si solo tienes el `.otf`
o el `.ttf`. Es el comportamiento normal de `@font-face`: el navegador prueba
los formatos en orden de preferencia y se queda con el primero que exista. Si
quieres una consola limpia, convierte la fuente a `.woff2` y déjala junto al
`.otf`.

---

## Estructura del proyecto

```
generar-nombres-fuentes/
├── index.html          Estructura, panel de control y modal de glifos
├── css/
│   └── styles.css      Temas, @font-face, estilos de hoja e impresión
├── js/
│   ├── app.js          Estado, tipografías, medición, maquetación y render
│   └── export.js       PDF, SVG, proyecto .json y explorador de glifos
├── fonts/
│   ├── LEEME.md        Instrucciones de instalación de la fuente
│   └── josephsophia.*  Tu archivo de fuente (no incluido)
└── README.md
```

---

## Guía de uso

### 1 · Texto y lote

Escribe un nombre por línea. Cada línea admite dos parámetros opcionales
separados por barra vertical:

```
Nombre | repeticiones | tamaño
```

| Ejemplo | Resultado |
|---|---|
| `María` | Una pieza con el tamaño global |
| `María \| 6` | Seis copias de «María» |
| `Sofía \| 2 \| 35` | Dos copias de «Sofía» a 35 (en la unidad activa) |

El tamaño por línea se expresa en la unidad seleccionada en el panel
*Tamaño*, y anula el tamaño global solo para esa línea.

### 2 · Fuente

Selecciona una de la lista o arrastra tu propio archivo sobre la zona
punteada. Dos insignias informan del estado:

- **`vector`** — la aplicación tiene el archivo binario y puede generar
  contornos reales (PDF y SVG vectoriales).
- **`falta`** — la fuente está declarada pero el archivo no se encontró.

### 3 · Tamaño

Elige primero **qué** se mide:

| Criterio | Qué fija | Cuándo usarlo |
|---|---|---|
| **Altura de mayúscula** | La altura de una `H` | Lo más habitual: tamaños uniformes entre nombres |
| **Alto total del texto** | La caja de tinta completa de cada pieza | Cuando cada nombre debe caber en una altura exacta |
| **Tamaño de fuente** | El valor tipográfico clásico | Si vienes de un diseño con medidas en puntos |

*Ancho máximo* reduce proporcionalmente las piezas que se pasen de ese ancho:
útil cuando el rollo de vinil tiene un ancho fijo.

### 4 · Color y contorno

Tres presets cubren casi todo:

- **Negro sólido** — impresión y sublimación.
- **Solo corte** — sin relleno, línea fina: lo que espera un plotter.
- **Relleno + borde** — letra blanca con perfil, para vinil de dos capas.

### 5 · Terminaciones y adornos

Aquí se resuelven las colas decorativas y las terminaciones con corazón.

**Opción A — Explorador de glifos** (requiere `.ttf`/`.otf`). Pulsa **Glifos**
en la barra superior. Verás dibujados todos los caracteres de la fuente, con
filtros:

| Filtro | Contenido |
|---|---|
| **Adornos y terminaciones** | Zona de uso privado (U+E000…), donde viven las colas y remates |
| **Ligaduras** | Glifos compuestos (`T_h`, `s_s`…) |
| **Letras** | Alfabeto |
| **Números y signos** | Cifras y puntuación |

Sobre cada glifo:
- **Clic** → lo añade como **sufijo** (al final de cada nombre).
- **Alt + clic** → lo añade como **prefijo**.
- **Shift + clic** → lo inserta en el texto donde tengas el cursor.

> En Joseph Sophia hay **89 glifos decorativos** en esa zona privada. Se
> eligen a ojo aunque se llamen `uniE05A` o `T_h`.

**Opción B — Alternativas OpenType.** Activa `swsh`, `salt` o `ss01`…`ss08`.
Muchas fuentes sustituyen automáticamente las letras finales por su versión
con cola cuando estos ajustes están activos.

### 6 · Hoja y disposición

Papel, orientación, margen, separación horizontal y vertical, y alineación de
las filas (izquierda, centrada, derecha o justificada).

Tres interruptores importantes:

- **Guías de recorte** — solo en pantalla, nunca se imprimen.
- **Espejo** — invierte horizontalmente. Obligatorio en sublimación y transfer.
- **Numerar páginas** — útil en lotes largos.

### 7 · Ajustes guardados

Guarda la configuración completa (sin la lista de nombres) con un nombre y
recupérala en un clic. Se almacena en el navegador, en `localStorage`.

---

## Flujos de producción

### Vinil de corte

1. Panel *Color y contorno* → preset **Solo corte**.
2. Panel *Hoja* → papel a la medida de tu rollo (o *Personalizado*).
3. Panel *Tamaño* → **Ancho máximo** igual al ancho útil del rollo.
4. Botón **SVG**. Obtendrás un archivo por hoja, con el texto ya convertido a
   trazados: el plotter corta el contorno real de la letra, no una caja.

### Sublimación (tazas, franelas)

1. Panel *Hoja* → **Taza 11 oz** o el tamaño de tu plancha.
2. Activa **Espejo**.
3. Botón **Imprimir** → *Guardar como PDF*, con márgenes **Ninguno** y escala
   **100 %**.

> Usa siempre **Imprimir** o **PDF**, nunca una captura de pantalla: el
> resultado es vectorial y conserva la nitidez a cualquier tamaño.

### Impresión directa

Botón **Imprimir**. La aplicación fija la regla `@page` al tamaño exacto del
papel elegido, de modo que no hay reescalado. En el diálogo del navegador:

- Márgenes: **Ninguno**
- Escala: **100 %** (nunca «Ajustar a la página»)

---

## Precisión dimensional

Todo el motor trabaja en **milímetros**. Cada hoja se dibuja como un único
`<svg>` cuyo sistema de coordenadas es *1 unidad = 1 mm*, así que la vista
previa, el PDF y el SVG comparten exactamente la misma geometría.

### Por qué se mide una sola vez a tamaño grande

El navegador ajusta el contorno del texto a píxeles enteros del dispositivo
(*hinting*). A tamaño de pantalla eso **cuantiza** la altura de tinta en saltos
de unos 0,26 mm: para una `H` de 25 mm solo son alcanzables 24,87 y 25,14 mm,
nunca 25,00. Cualquier bucle que persiga los 25,00 medidos oscila entre esos
dos valores sin converger.

Además es un artefacto **de pantalla**: al imprimir, la resolución es mucho
mayor y el contorno sigue fielmente al tamaño de fuente.

La solución implementada es medir una única vez a 1000 unidades —donde el
error de cuantización baja a ~0,03 %— y escalar linealmente, que es como se
comporta realmente la tipografía. Como efecto secundario, las medidas se
cachean por texto, de modo que un lote con muchas repeticiones se maqueta con
una sola medición por nombre distinto.

### Resultados medidos

| Prueba | Pedido | Obtenido | Error |
|---|---|---|---|
| Altura de mayúscula | 150,00 mm | 150,02 mm | 0,013 % |
| Ancho máximo | 80,00 mm | 80,01 mm | 0,013 % |
| Conversión de unidades | 1 pulgada | 25,40 mm | exacto |

---

## Arquitectura técnica

### Módulos

| Archivo | Responsabilidad |
|---|---|
| `js/app.js` | Catálogo de fuentes y papeles, estado, parseo del lote, medición con `getBBox()`, empaquetado en filas y páginas, construcción del SVG de hoja, interfaz |
| `js/export.js` | Conversión de texto a contornos con opentype.js, exportación PDF y SVG, proyecto `.json`, explorador de glifos |

Ambos comparten el espacio de nombres global `NF`. La función
`NF.buildPageSVG()` es la **única** que dibuja: la usan por igual la vista
previa, el PDF y el SVG, de modo que la exportación no puede desviarse de lo
que ve el usuario.

### Maquetación

1. **Medición** — cada pieza se mide una vez a 1000 unidades en un `<svg>`
   oculto pero renderizado, respetando alternativas OpenType e interletraje.
2. **Escalado** — se calcula el tamaño de fuente según el criterio elegido y
   se aplican los límites de ancho máximo y área útil.
3. **Empaquetado en filas** — las piezas se acumulan mientras quepan a lo
   ancho; dentro de cada fila se alinean por **línea base**, no por el borde
   superior, que es lo que da un resultado tipográficamente correcto con
   fuentes de altura variable.
4. **Reparto en páginas** — las filas se acumulan mientras quepan a lo alto.
5. **Alineación** — desplazamiento o reparto del espacio sobrante.

### Dependencias

Cargadas al inicio:

| Librería | Uso |
|---|---|
| Tailwind CSS (CDN) | Utilidades de maquetación de la interfaz |
| Google Fonts | Las 41 tipografías del catálogo |

Cargadas **bajo demanda**, solo al pulsar exportar:

| Librería | Versión | Uso |
|---|---|---|
| [opentype.js](https://github.com/opentypejs/opentype.js) | 1.3.4 | Leer el archivo de fuente, enumerar glifos y generar contornos |
| [jsPDF](https://github.com/parallax/jsPDF) | 2.5.2 | Construir el documento PDF |
| [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) | 2.2.4 | Volcar el SVG de cada hoja al PDF como vectores |

### Estrategia de exportación PDF

La vista previa se dibuja con el mismo generador de SVG que la exportación y en
el mismo modo: si hay archivo de fuente, ambas dibujan contornos; si no, ambas
dibujan texto vivo. Por eso el PDF no puede salir distinto de la pantalla.

1. **Vectorial** — si hay archivo de fuente disponible, el texto se convierte
   a trazados y se vuelca con svg2pdf. Es el resultado preferente. Las
   sustituciones OpenType (ligaduras y alternativas `ssXX`, `swsh`, `salt`…) se
   aplican leyendo la tabla GSUB de la fuente, igual que hace el navegador.
2. **Rasterizado a 300 ppp** — si algo falla, se rasteriza a imagen el propio
   SVG de la hoja, con la tipografía incrustada como data URI. Sirve para
   impresión y sublimación, pero no para corte por contorno.
3. **Imprimir** — siempre disponible y siempre vectorial; es la vía más fiable.

### Almacenamiento local

| Clave | Contenido |
|---|---|
| `atelier.theme` | Tema claro u oscuro |
| `atelier.presets` | Ajustes guardados por el usuario |

---

## Limitaciones conocidas

- **`file://` no funciona del todo.** El navegador bloquea por CORS la lectura
  del archivo de fuente, así que sin servidor HTTP no hay explorador de glifos
  ni exportación vectorial. La vista previa y la impresión sí funcionan.
- **Las alternativas contextuales (`calt`) no llegan al PDF vectorial.** El
  modelador reproduce sustituciones simples y ligaduras, que es lo que usan las
  alternativas `ssXX`, `swsh` y `salt`; las reglas contextuales encadenadas no.
  La vista previa dibuja lo mismo que se exportará, así que la diferencia se ve
  antes de imprimir.
- **La exportación vectorial exige `.ttf` o `.otf`.** Las fuentes de Google
  Fonts se sirven como `.woff2`, que no se puede descomprimir en el navegador;
  para exportarlas en vectorial hay que descargar el `.ttf` y cargarlo a mano.
- **Descargas múltiples.** Al exportar SVG de varias hojas el navegador puede
  pedir permiso para descargar varios archivos.
- **El filtro «Ligaduras» puede aparecer vacío** en fuentes que guardan sus
  ligaduras dentro de la zona de uso privado; en ese caso están todas bajo
  *Adornos y terminaciones*.

---

## Licencias

El código de la aplicación es de uso libre dentro del proyecto.

**Las tipografías tienen licencia propia.** Joseph Sophia es una fuente
comercial y **no se distribuye** con esta aplicación: debes usar tu propia
licencia. Las fuentes de Google Fonts se sirven bajo sus respectivas licencias
(SIL Open Font License en su mayoría). Comprueba siempre las condiciones de
uso comercial antes de vender productos hechos con una tipografía.

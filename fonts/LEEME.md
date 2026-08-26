# Carpeta de fuentes

Coloca aquí los archivos de tus tipografías propias.

## Joseph Sophia

La aplicación la busca automáticamente con estos nombres (en este orden):

```
fonts/josephsophia.woff2
fonts/josephsophia.woff
fonts/josephsophia.otf
fonts/josephsophia.ttf
```

No hace falta un archivo aparte para los swashes: en Joseph Sophia las colas
decorativas y las terminaciones con corazón viven dentro del mismo archivo, en
la zona de uso privado (U+E000 en adelante) y como ligaduras.

> **Importante:** Joseph Sophia es una fuente comercial. No se distribuye con
> esta aplicación; debes usar tu propia licencia.

## ¿Qué formato conviene?

| Formato | Vista previa | Explorador de glifos | PDF/SVG vectorial |
|---------|:---:|:---:|:---:|
| `.woff2` | ✅ | ❌ | ❌ |
| `.woff`  | ✅ | ❌ | ❌ |
| **`.ttf`** | ✅ | ✅ | ✅ |
| **`.otf`** | ✅ | ✅ | ✅ |

Usa **`.ttf` o `.otf`**: son los únicos que permiten convertir el texto en
contornos reales, que es lo que necesita el plotter de corte de vinil y lo que
hace que el PDF sea vectorial (nítido a cualquier tamaño, sin depender de que la
fuente esté instalada en el otro equipo).

## Cómo encontrar las terminaciones con corazón

1. Copia `josephsophia.ttf` (u `.otf`) en esta carpeta y recarga la página.
2. Pulsa **Glifos** en la barra superior.
3. Filtra por **Adornos y terminaciones** (zona U+E000…) o por **Ligaduras**:
   ahí están las colas, los remates y los corazones. Se ven dibujados, así que
   los eliges a ojo aunque se llamen `uniE05A` o `T_h`.
4. Clic = se añade como **sufijo** · Alt+clic = **prefijo** · Shift+clic = se
   inserta en el texto donde tengas el cursor.

También puedes probar los botones de **Alternativas OpenType** (`swsh`, `salt`,
`ss01`…`ss08`): muchas fuentes activan ahí las terminaciones automáticamente.

## Otras fuentes

Cualquier otro `.ttf/.otf/.woff/.woff2` se puede cargar sin copiarlo aquí:
arrástralo sobre la zona punteada del panel **Fuente**.

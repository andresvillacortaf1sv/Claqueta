# Claqueta

Editor de guiones profesional, **open-source** y **local-first**. Un "Final Draft abierto" construido sobre la web, pensado para migrar después a escritorio sin reescribir el núcleo.

> **Claqueta** es un nombre de trabajo (la tablilla de cine). Cámbialo cuando quieras en `package.json`, `index.html` y la barra de herramientas.

## Estado actual — Fases 1 y 2 ✅

Lo que ya funciona:

- **Motor de editor** sobre ProseMirror con esquema estricto de guion (7 elementos: encabezado, acción, personaje, paréntesis, diálogo, transición, plano).
- **Formato inteligente**:
  - `Tab` / `Shift-Tab` ciclan el tipo de elemento.
  - `Enter` con texto crea el **siguiente elemento lógico** (p. ej. tras un PERSONAJE viene un DIÁLOGO; tras una TRANSICIÓN, un ENCABEZADO).
  - `Enter` en una **línea vacía rota el tipo** (acción → personaje → diálogo → …): das Enter varias veces hasta el elemento que quieras, sin crear líneas en blanco.
  - `Ctrl/Cmd + 1..7` fija el elemento directamente.
- **Reglas automáticas**: teclear `INT.` / `EXT.` crea un encabezado de escena; `CORTE A:` / `FUNDE A:` crean una transición.
- **Formato de industria**: Courier Prime 12pt, página US Letter (8.5"), sangrados estándar por elemento, MAYÚSCULAS donde corresponde.
- **Paginación de industria** (botón **Páginas / PDF**): reparte el guion en páginas US Letter (54 líneas), numera desde la página 2, controla huérfanos de encabezado/personaje y **parte diálogos largos con `(MÁS)` y `PERSONAJE (CONT'D)`**.
- **Exportación a PDF** fiel al formato, generada en el navegador (sin servidor).
- **Saltos de página en vivo** en el editor: mientras escribes aparece la marca "Página N" medida sobre el alto real del texto (la hoja crece y el texto nunca cae sobre el fondo).
- **Interoperabilidad** (menú **Archivo**): importar y exportar **FDX** (Final Draft) y **Fountain** (texto plano abierto).
- **Interfaz tipo ribbon** con pestañas **Inicio** (portapapeles, elemento desplegable, fuente: negrita/cursiva/subrayado/tachado, portada, archivo, páginas/PDF) y **Edición** (revisiones).
- **Modo revisión** (pestaña **Edición**): colores estándar de la industria (azul, rosa, amarillo…); los bloques que editas quedan **sombreados** en el color de la revisión, visible en editor, vista previa y PDF.
- **Página de título** editable (botón **Portada** en Inicio), incluida en la vista previa y el PDF.
- **Local-first**: autoguardado en el navegador (localStorage). Nada sale del dispositivo.
- Atajos de marcas: `Ctrl/Cmd + B / I / U`, deshacer/rehacer.

## Cómo ejecutarlo

Necesitas Node.js 18+.

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`.

Para compilar a producción:

```bash
npm run build      # genera /dist
npm run preview    # sirve /dist localmente
```

## Arquitectura

El núcleo del editor vive en `src/editor/` y es **independiente de React y del navegador**, para poder reusarlo tal cual al empaquetar a escritorio (Tauri) más adelante.

```
src/
  editor/
    elements.ts     Tipos de elemento + reglas Tab/Enter (la "gramática")
    schema.ts       Esquema ProseMirror (un nodo por tipo de línea)
    commands.ts     Comandos de formato inteligente
    inputrules.ts   Conversión automática (INT./EXT., transiciones)
    keymap.ts       Mapa de teclado
    document.ts     Documento inicial + persistencia local
  components/
    Workspace.tsx   Monta el editor y conecta barra/estado
    Toolbar.tsx     Selector de elementos
    StatusBar.tsx   Elemento actual + pistas de teclado
  components/
    Preview.tsx     Vista paginada + botón de exportar PDF
  lib/
    serialize.ts    Documento ProseMirror → lista de bloques
    layout.ts       Paginador de industria (función pura, sin DOM)
    pdf.ts          Exportación a PDF con jsPDF (carga diferida)
    (próximas fases: fdx.ts, fountain.ts…)
  styles/
    app.css         Interfaz (escritorio oscuro, página de papel, vista previa)
    editor.css      Formato del guion (medidas de industria)
```

Pruebas de lógica (sin navegador): `npx tsx test/logic.test.ts` y `npx tsx test/layout.test.ts`.

## Hoja de ruta

| Fase | Entrega |
|------|---------|
| 1 ✅ | Fundación: motor de editor + formato inteligente + estilos de industria |
| 2 ✅ | Paginación de industria (US Letter, MÁS/CONT'D, numeración) + export a PDF |
| 3 ✅ | Import/Export **FDX** (Final Draft) + soporte **Fountain** |
| 4 ✅ | Modo revisiones (colores + asteriscos) + página de título |
| 5 | Escaleta / tarjetas (beat board) + navegador de escenas |
| 6 | Sección de personajes + reportes (líneas, apariciones, arco) |
| 7 | Asistente de IA (trae tu propia clave) + empaquetado a escritorio con Tauri |

## Licencia

Pendiente de elegir (sugerido: **MIT** o **GPL-3.0** para mantenerlo libre). 

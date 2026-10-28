# Claqueta

Editor de guiones profesional, **open-source** y **local-first**. Un "Final Draft abierto" construido sobre la web, pensado para migrar después a escritorio sin reescribir el núcleo.

> **Claqueta** es un nombre de trabajo (la tablilla de cine). Cámbialo cuando quieras en `package.json`, `index.html` y la barra de herramientas.

## Estado actual — Fase 1: Fundación ✅

Lo que ya funciona:

- **Motor de editor** sobre ProseMirror con esquema estricto de guion (7 elementos: encabezado, acción, personaje, paréntesis, diálogo, transición, plano).
- **Formato inteligente**:
  - `Tab` / `Shift-Tab` ciclan el tipo de elemento.
  - `Enter` crea el **siguiente elemento lógico** (p. ej. tras un PERSONAJE viene un DIÁLOGO; tras una TRANSICIÓN, un ENCABEZADO).
  - `Enter` en un diálogo/elemento vacío "sale" a ACCIÓN.
  - `Ctrl/Cmd + 1..7` fija el elemento directamente.
- **Reglas automáticas**: teclear `INT.` / `EXT.` crea un encabezado de escena; `CORTE A:` / `FUNDE A:` crean una transición.
- **Formato de industria**: Courier Prime 12pt, página US Letter (8.5"), sangrados estándar por elemento, MAYÚSCULAS donde corresponde.
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
  styles/
    app.css         Interfaz (escritorio oscuro, página de papel)
    editor.css      Formato del guion (medidas de industria)
  lib/              (próximas fases: fdx, fountain, pdf, paginación…)
```

## Hoja de ruta

| Fase | Entrega |
|------|---------|
| 1 ✅ | Fundación: motor de editor + formato inteligente + estilos de industria |
| 2 | Paginación de industria (US Letter, MÁS/CONT., numeración) + export a PDF |
| 3 | Import/Export **FDX** (Final Draft) + soporte **Fountain** |
| 4 | Modo revisiones (colores), asteriscos, bloqueo de páginas + página de título |
| 5 | Escaleta / tarjetas (beat board) + navegador de escenas |
| 6 | Sección de personajes + reportes (líneas, apariciones, arco) |
| 7 | Asistente de IA (trae tu propia clave) + empaquetado a escritorio con Tauri |

## Licencia

Pendiente de elegir (sugerido: **MIT** o **GPL-3.0** para mantenerlo libre). 

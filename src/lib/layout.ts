/**
 * Motor de paginación de industria.
 *
 * Toma los bloques del guion y los reparte en páginas US Letter respetando el
 * formato estándar: 54 líneas de texto por página (margen de 1" arriba/abajo
 * sobre 11", a 6 líneas por pulgada), sangrados por elemento, espaciado entre
 * elementos y cortes de página correctos:
 *   - La ACCIÓN se parte libremente entre páginas.
 *   - El DIÁLOGO se parte añadiendo "(MÁS)" al pie y "PERSONAJE (CONT'D)" arriba.
 *   - ENCABEZADO y PERSONAJE no quedan huérfanos al final de una página.
 *
 * Es una función pura (sin DOM): la reusan tanto la vista previa como el PDF.
 */
import { ElementType } from "../editor/elements";
import { Block } from "./serialize";

export type Align = "left" | "right";

export interface ElementMetrics {
  /** Sangrado izquierdo en caracteres (10 caracteres = 1 pulgada). */
  indent: number;
  /** Ancho útil en caracteres para el ajuste de línea. */
  width: number;
  align: Align;
  upper: boolean;
  bold: boolean;
}

/** Medidas de cada elemento según el estándar de guion (US Letter, 12pt Courier). */
export const METRICS: Record<ElementType, ElementMetrics> = {
  scene_heading: { indent: 0, width: 60, align: "left", upper: true, bold: true },
  action: { indent: 0, width: 60, align: "left", upper: false, bold: false },
  character: { indent: 22, width: 38, align: "left", upper: true, bold: false },
  parenthetical: { indent: 16, width: 25, align: "left", upper: false, bold: false },
  dialogue: { indent: 10, width: 35, align: "left", upper: false, bold: false },
  transition: { indent: 0, width: 60, align: "right", upper: true, bold: false },
  shot: { indent: 0, width: 60, align: "left", upper: true, bold: false },
};

/** Líneas en blanco antes de cada elemento (cuando no abre la página). */
const SPACE_BEFORE: Record<ElementType, number> = {
  scene_heading: 1,
  action: 1,
  character: 1,
  parenthetical: 0,
  dialogue: 0,
  transition: 1,
  shot: 1,
};

export const LINES_PER_PAGE = 54;

export interface TextLine {
  kind: "text";
  style: ElementType;
  text: string;
}
export interface BlankLine {
  kind: "blank";
}
export type Line = TextLine | BlankLine;

export interface Page {
  number: number;
  lines: Line[];
}

/** Ajuste de línea por palabras, con corte duro de palabras más largas que el ancho. */
export function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (w.length > width) {
      if (line) {
        lines.push(line);
        line = "";
      }
      let rest = w;
      while (rest.length > width) {
        lines.push(rest.slice(0, width));
        rest = rest.slice(width);
      }
      line = rest;
      continue;
    }
    if (!line) line = w;
    else if (line.length + 1 + w.length <= width) line += " " + w;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export function paginate(blocks: Block[], rpp: number = LINES_PER_PAGE): Page[] {
  const pages: Line[][] = [[]];
  let count = 0;
  let currentChar = "";

  const cur = () => pages[pages.length - 1];
  const place = (line: Line) => {
    cur().push(line);
    count++;
  };
  const blankBefore = (n: number) => {
    for (let i = 0; i < n; i++) {
      if (count > 0) {
        cur().push({ kind: "blank" });
        count++;
      }
    }
  };
  const brk = () => {
    pages.push([]);
    count = 0;
  };
  const room = () => rpp - count;
  const placeContd = () => {
    if (currentChar) place({ kind: "text", style: "character", text: `${currentChar} (CONT'D)` });
  };

  function placeSimple(type: ElementType, wrapped: string[], sb: number, nextHasLines: boolean) {
    // Control de huérfanos: encabezado y personaje no deben quedar solos al pie.
    const needNext = (type === "scene_heading" || type === "character") && nextHasLines ? 1 : 0;
    const sbEff = count > 0 ? sb : 0;
    if (count > 0 && count + sbEff + wrapped.length + needNext > rpp) {
      brk();
    }
    blankBefore(count > 0 ? sb : 0);
    for (const t of wrapped) place({ kind: "text", style: type, text: t });
  }

  function placeSplittable(type: ElementType, wrapped: string[], sb: number) {
    if (count > 0) {
      if (count + sb >= rpp) brk();
      else blankBefore(sb);
    }
    let i = 0;
    while (i < wrapped.length) {
      if (room() <= 0) {
        brk();
        if (type === "dialogue") placeContd();
      }
      if (type === "dialogue") {
        const remaining = wrapped.length - i;
        if (remaining > room()) {
          if (room() > 1) {
            const canPlace = room() - 1; // reservar una línea para "(MÁS)"
            for (let k = 0; k < canPlace; k++)
              place({ kind: "text", style: "dialogue", text: wrapped[i++] });
            place({ kind: "text", style: "dialogue", text: "(MÁS)" });
          }
          brk();
          placeContd();
          continue;
        }
      }
      place({ kind: "text", style: type, text: wrapped[i++] });
    }
  }

  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    const m = METRICS[b.type];
    let text = b.text ?? "";
    if (m.upper) text = text.toUpperCase();
    if (!text.trim()) continue; // los bloques vacíos no aparecen en el guion paginado
    if (b.type === "character") currentChar = text.trim();

    const wrapped = wrap(text, m.width);
    const sb = SPACE_BEFORE[b.type];

    if (b.type === "action" || b.type === "dialogue") {
      placeSplittable(b.type, wrapped, sb);
    } else {
      const next = blocks[bi + 1];
      const nextHasLines = !!next && !!(next.text ?? "").trim();
      placeSimple(b.type, wrapped, sb, nextHasLines);
    }
  }

  return pages.map((lines, i) => ({ number: i + 1, lines }));
}

/**
 * Import / Export de Fountain (https://fountain.io), el formato abierto de
 * texto plano para guiones. Implementa un subconjunto práctico y robusto:
 * suficiente para interoperar con la mayoría de guiones y editores.
 */
import { ElementType } from "../editor/elements";
import { Block } from "./serialize";

const SCENE_RE = /^(int|ext|est|int\.?\/ext|i\/e|interior|exterior)[\s.]/i;

function isUpper(line: string): boolean {
  return line.length > 0 && line === line.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(line);
}

// ---------- Exportar ----------
export function blocksToFountain(blocks: Block[]): string {
  const out: string[] = [];
  const blank = () => {
    if (out.length && out[out.length - 1] !== "") out.push("");
  };

  for (const b of blocks) {
    const text = (b.text ?? "").trim();
    if (!text) continue;
    switch (b.type) {
      case "scene_heading":
        blank();
        out.push(text.toUpperCase());
        break;
      case "action":
        blank();
        // Forzar acción si el texto podría confundirse con un encabezado.
        out.push(SCENE_RE.test(text) ? "!" + text : text);
        break;
      case "character":
        blank();
        out.push(text.toUpperCase());
        break;
      case "parenthetical":
        out.push(/^\(.*\)$/.test(text) ? text : `(${text})`);
        break;
      case "dialogue":
        out.push(text);
        break;
      case "transition":
        blank();
        out.push("> " + text.toUpperCase().replace(/^>\s*/, ""));
        break;
      case "shot":
        blank();
        out.push(text.toUpperCase());
        break;
    }
  }
  return out.join("\n") + "\n";
}

// ---------- Importar ----------
export function fountainToBlocks(input: string): Block[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const prevBlank = (idx: number) => idx === 0 || lines[idx - 1].trim() === "";
  const nextNonBlank = (idx: number) => idx + 1 < lines.length && lines[idx + 1].trim() !== "";

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === "") {
      i++;
      continue;
    }

    // Encabezado de escena: INT./EXT. … o forzado con "."
    if (SCENE_RE.test(line) || /^\.[^.]/.test(line)) {
      blocks.push({ type: "scene_heading", text: line.replace(/^\./, "").trim() });
      i++;
      continue;
    }

    // Transición forzada ">" o heurística (MAYÚSCULAS terminando en "TO:")
    if (/^>/.test(line)) {
      blocks.push({ type: "transition", text: line.replace(/^>\s*/, "").replace(/<\s*$/, "").trim() });
      i++;
      continue;
    }
    if (isUpper(line) && /TO:$/.test(line)) {
      blocks.push({ type: "transition", text: line });
      i++;
      continue;
    }

    // Acción forzada "!"
    if (/^!/.test(line)) {
      blocks.push({ type: "action", text: line.slice(1) });
      i++;
      continue;
    }

    // Personaje: MAYÚSCULAS, línea en blanco antes y diálogo después
    if (isUpper(line) && !/[.!?]$/.test(line) && prevBlank(i) && nextNonBlank(i)) {
      blocks.push({ type: "character", text: line });
      i++;
      while (i < lines.length && lines[i].trim() !== "") {
        const dl = lines[i].trim();
        const type: ElementType = /^\(.*\)$/.test(dl) ? "parenthetical" : "dialogue";
        blocks.push({ type, text: dl });
        i++;
      }
      continue;
    }

    // Por defecto: acción
    blocks.push({ type: "action", text: line });
    i++;
  }

  return blocks;
}

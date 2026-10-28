/**
 * Extracción y manipulación de escenas para el navegador y la escaleta.
 * Una "escena" es un encabezado y todos los bloques que le siguen hasta el
 * próximo encabezado.
 */
import { Node as PMNode } from "prosemirror-model";

export interface Scene {
  order: number; // número de escena (0-based)
  pos: number; // posición del nodo de encabezado en el documento
  heading: string;
  summary: string; // beat/resumen escrito por el usuario (atributo del encabezado)
  synopsis: string; // automático: primera línea de acción de la escena
}

export function getScenes(doc: PMNode): Scene[] {
  const scenes: Scene[] = [];
  let current: Scene | null = null;
  let order = 0;

  doc.forEach((node, offset) => {
    if (node.type.name === "scene_heading") {
      current = {
        order: order++,
        pos: offset,
        heading: node.textContent || "(escena sin título)",
        summary: node.attrs.summary ?? "",
        synopsis: "",
      };
      scenes.push(current);
    } else if (current && !current.synopsis && node.type.name === "action" && node.textContent.trim()) {
      current.synopsis = node.textContent.trim();
    }
  });

  return scenes;
}

export interface SceneGroups {
  preamble: PMNode[];
  scenes: PMNode[][]; // cada grupo: [encabezado, ...bloques de la escena]
}

export function sceneGroups(doc: PMNode): SceneGroups {
  const children: PMNode[] = [];
  doc.forEach((n) => children.push(n));

  const preamble: PMNode[] = [];
  const scenes: PMNode[][] = [];
  let current: PMNode[] | null = null;

  for (const n of children) {
    if (n.type.name === "scene_heading") {
      current = [n];
      scenes.push(current);
    } else if (current) {
      current.push(n);
    } else {
      preamble.push(n);
    }
  }

  return { preamble, scenes };
}

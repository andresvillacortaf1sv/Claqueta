/** Desglose por escena: datos detectados automáticamente del guion. */
import { Node as PMNode } from "prosemirror-model";
import { parseHeading } from "./locations";

export interface SceneBreakdown {
  index: number;
  pos: number;
  heading: string;
  ie: string;
  place: string;
  time: string;
  cast: string[]; // personajes con intervención en la escena
}

function canonical(raw: string): string {
  return raw.replace(/\s*\(.*\)\s*$/, "").toUpperCase().trim();
}

export function getSceneBreakdown(doc: PMNode): SceneBreakdown[] {
  const scenes: SceneBreakdown[] = [];
  const casts: Set<string>[] = [];
  let current: SceneBreakdown | null = null;

  doc.forEach((node, offset) => {
    const t = node.type.name;
    if (t === "scene_heading") {
      const { ie, place, time } = parseHeading(node.textContent);
      current = {
        index: scenes.length,
        pos: offset,
        heading: node.textContent.trim() || "(escena sin título)",
        ie,
        place,
        time,
        cast: [],
      };
      scenes.push(current);
      casts.push(new Set());
    } else if (t === "character" && current) {
      const name = canonical(node.textContent);
      if (name) casts[current.index].add(name);
    }
  });

  scenes.forEach((s) => (s.cast = [...casts[s.index]]));
  return scenes;
}

/** Clave estable para asociar elementos manuales a una escena por su encabezado. */
export function sceneKey(heading: string): string {
  return heading.toUpperCase().trim();
}

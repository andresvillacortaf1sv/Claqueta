/**
 * Detección de personajes y reportes a partir del documento.
 * Agrupa por nombre (ignorando extensiones como "(CONT'D)" o "(O.S.)") y cuenta
 * parlamentos, palabras y escenas en las que aparece cada uno.
 */
import { Node as PMNode } from "prosemirror-model";

export interface CharacterStat {
  name: string;
  dialogues: number; // número de parlamentos
  words: number; // total de palabras habladas
  scenes: number; // escenas distintas en las que habla
  firstPos: number; // posición de su primera intervención (para saltar)
}

function canonicalName(raw: string): string {
  return raw
    .replace(/\s*\(.*\)\s*$/, "") // quita "(CONT'D)", "(O.S.)", etc.
    .toUpperCase()
    .trim();
}

export function getCharacters(doc: PMNode): CharacterStat[] {
  const map = new Map<
    string,
    { dialogues: number; words: number; scenes: Set<number>; firstPos: number }
  >();
  let sceneIdx = -1;
  let speaker: string | null = null;

  doc.forEach((node, offset) => {
    const t = node.type.name;
    if (t === "scene_heading") {
      sceneIdx++;
    } else if (t === "character") {
      const name = canonicalName(node.textContent.trim());
      speaker = name || null;
      if (name && !map.has(name)) {
        map.set(name, { dialogues: 0, words: 0, scenes: new Set(), firstPos: offset });
      }
    } else if (t === "dialogue" && speaker) {
      const e = map.get(speaker);
      if (e) {
        e.dialogues++;
        e.words += node.textContent.trim().split(/\s+/).filter(Boolean).length;
        if (sceneIdx >= 0) e.scenes.add(sceneIdx);
      }
    }
  });

  return [...map.entries()]
    .map(([name, e]) => ({
      name,
      dialogues: e.dialogues,
      words: e.words,
      scenes: e.scenes.size,
      firstPos: e.firstPos,
    }))
    .sort((a, b) => b.dialogues - a.dialogues || a.name.localeCompare(b.name));
}

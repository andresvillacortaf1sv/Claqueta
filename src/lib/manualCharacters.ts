/**
 * Personajes añadidos manualmente (sin necesidad de haber escrito el guion).
 * Se fusionan con los detectados automáticamente en el tablero de personajes.
 */
import { CharacterStat } from "./characters";


import { pkey } from "./projects";
export function loadManualCharacters(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(pkey("personajes-manuales")) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function persist(list: string[]): void {
  try {
    localStorage.setItem(pkey("personajes-manuales"), JSON.stringify(list));
  } catch {
    /* no disponible */
  }
}

export function addManualCharacter(name: string): string[] {
  const n = name.trim().toUpperCase();
  const list = loadManualCharacters();
  if (n && !list.includes(n)) list.push(n);
  persist(list);
  return list;
}

export function removeManualCharacter(name: string): string[] {
  const list = loadManualCharacters().filter((c) => c !== name.trim().toUpperCase());
  persist(list);
  return list;
}

/** Une los personajes detectados con los manuales (sin duplicar). */
export function mergeCharacters(detected: CharacterStat[]): CharacterStat[] {
  const byName = new Map(detected.map((c) => [c.name, c]));
  for (const name of loadManualCharacters()) {
    if (!byName.has(name)) {
      byName.set(name, { name, dialogues: 0, words: 0, scenes: 0, firstPos: 0 });
    }
  }
  return [...byName.values()].sort((a, b) => b.dialogues - a.dialogues || a.name.localeCompare(b.name));
}

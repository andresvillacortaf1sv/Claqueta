/** Fichas de personaje (descripción/notas), guardadas localmente por nombre. */

const KEY = "claqueta:fichas";

export type CharacterNotes = Record<string, string>;

export function loadCharacterNotes(): CharacterNotes {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveCharacterNote(name: string, note: string): void {
  try {
    const notes = loadCharacterNotes();
    notes[name] = note;
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    /* almacenamiento no disponible */
  }
}

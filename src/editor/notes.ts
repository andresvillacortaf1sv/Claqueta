/**
 * Notas del guion ancladas a una posición, mostradas como marcadores en el
 * margen (fuera de la página). Al hacer clic en un marcador se abre su editor.
 *
 * Las notas viven en el estado del plugin y se guardan en localStorage; sus
 * posiciones se remapean en cada cambio del documento para seguir al texto.
 */
import { Plugin, PluginKey, EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export interface Note {
  id: string;
  pos: number;
  text: string;
}

export const notesKey = new PluginKey<Note[]>("notes");
const STORAGE = "claqueta:notas";

function load(): Note[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function persist(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(notes));
  } catch {
    /* no disponible */
  }
}

type NotesMeta =
  | { type: "add"; note: Note }
  | { type: "update"; id: string; text: string }
  | { type: "remove"; id: string };

export function notesPlugin(): Plugin<Note[]> {
  return new Plugin<Note[]>({
    key: notesKey,
    state: {
      init: () => load(),
      apply(tr, value) {
        let notes = value;
        // Remapear posiciones al cambiar el documento (las notas siguen al texto).
        if (tr.docChanged) {
          notes = notes.map((n) => ({ ...n, pos: tr.mapping.map(n.pos) }));
        }
        const meta = tr.getMeta(notesKey) as NotesMeta | undefined;
        if (meta) {
          if (meta.type === "add") notes = [...notes, meta.note];
          else if (meta.type === "update") notes = notes.map((n) => (n.id === meta.id ? { ...n, text: meta.text } : n));
          else if (meta.type === "remove") notes = notes.filter((n) => n.id !== meta.id);
          persist(notes);
        } else if (tr.docChanged) {
          persist(notes);
        }
        return notes;
      },
    },
  });
}

export function addNote(view: EditorView): string {
  const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const pos = view.state.selection.from;
  view.dispatch(view.state.tr.setMeta(notesKey, { type: "add", note: { id, pos, text: "" } }));
  return id;
}

export function updateNote(view: EditorView, id: string, text: string): void {
  view.dispatch(view.state.tr.setMeta(notesKey, { type: "update", id, text }));
}

export function removeNote(view: EditorView, id: string): void {
  view.dispatch(view.state.tr.setMeta(notesKey, { type: "remove", id }));
}

export function getNotes(state: EditorState): Note[] {
  return notesKey.getState(state) ?? [];
}

/** Coordenadas (en px, relativas a la ventana) del marcador de una nota. */
export function noteCoords(view: EditorView, id: string): { left: number; top: number } | null {
  const note = getNotes(view.state).find((n) => n.id === id);
  if (!note) return null;
  const pos = Math.min(Math.max(1, note.pos), view.state.doc.content.size);
  try {
    const c = view.coordsAtPos(pos);
    return { left: c.left, top: c.top };
  } catch {
    return null;
  }
}

export type { Transaction };

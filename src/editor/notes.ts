/**
 * Notas del guion ancladas a una posición, mostradas como marcadores en el
 * margen (fuera de la página). Al hacer clic en un marcador se abre su editor.
 *
 * Las notas viven en el estado del plugin y se guardan en localStorage; sus
 * posiciones se remapean en cada cambio del documento para seguir al texto.
 */
import { Plugin, PluginKey, EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { pkey } from "../lib/projects";
export interface Note {
  id: string;
  pos: number;
  text: string;
  category?: string; // id de NOTE_CATEGORIES
}

/** Categorías de nota (función + color), como anotaciones de director. */
export const NOTE_CATEGORIES: { id: string; label: string; color: string }[] = [
  { id: "director", label: "Dirección", color: "#c8803a" },
  { id: "camara", label: "Cámara", color: "#2d6cdf" },
  { id: "sonido", label: "Sonido", color: "#2e9e5b" },
  { id: "arte", label: "Arte", color: "#8a63d2" },
  { id: "actuacion", label: "Actuación", color: "#e05aa0" },
  { id: "duda", label: "Duda / revisar", color: "#d9705f" },
  { id: "idea", label: "Idea", color: "#c9a21a" },
];

export function noteColor(categoryId?: string): string {
  return NOTE_CATEGORIES.find((c) => c.id === categoryId)?.color ?? "#c8803a";
}

export const notesKey = new PluginKey<Note[]>("notes");

function load(): Note[] {
  try {
    const v = JSON.parse(localStorage.getItem(pkey("notas")) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function persist(notes: Note[]): void {
  try {
    localStorage.setItem(pkey("notas"), JSON.stringify(notes));
  } catch {
    /* no disponible */
  }
}

type NotesMeta =
  | { type: "add"; note: Note }
  | { type: "update"; id: string; text: string; category?: string }
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
          else if (meta.type === "update")
            notes = notes.map((n) =>
              n.id === meta.id ? { ...n, text: meta.text, category: meta.category ?? n.category } : n,
            );
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
  view.dispatch(view.state.tr.setMeta(notesKey, { type: "add", note: { id, pos, text: "", category: "director" } }));
  return id;
}

export function updateNote(view: EditorView, id: string, text: string, category?: string): void {
  view.dispatch(view.state.tr.setMeta(notesKey, { type: "update", id, text, category }));
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

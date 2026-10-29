/**
 * Pizarra conceptual: tarjetas/nodos libres en un lienzo, con conexiones y un
 * modo de línea de tiempo. Guardado local por tablero.
 */

export type CardKind = "idea" | "nota" | "hito";

export interface BoardCard {
  id: string;
  kind: CardKind;
  text: string;
  x: number;
  y: number;
  color: string;
  date?: string; // sólo para hitos (línea de tiempo)
}

export interface BoardEdge {
  id: string;
  from: string;
  to: string;
}

export interface Board {
  id: string;
  name: string;
  cards: BoardCard[];
  edges: BoardEdge[];
}

export const CARD_KINDS: { id: CardKind; label: string; color: string }[] = [
  { id: "idea", label: "Idea", color: "#c8803a" },
  { id: "nota", label: "Nota", color: "#2d6cdf" },
  { id: "hito", label: "Hito", color: "#2e9e5b" },
];

const KEY = "claqueta:pizarras";

export function loadBoards(): Board[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) && v.length ? v : [defaultBoard()];
  } catch {
    return [defaultBoard()];
  }
}

export function saveBoards(boards: Board[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(boards));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function defaultBoard(): Board {
  return { id: `b-${Date.now()}`, name: "Pizarra 1", cards: [], edges: [] };
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

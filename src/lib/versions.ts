/**
 * Control de versiones local: guarda instantáneas (borradores) del guion con
 * nombre y fecha, para listarlas, restaurarlas y compararlas.
 */
import { Block } from "./serialize";

export interface Version {
  id: string;
  name: string;
  date: string; // ISO
  blocks: Block[];
}

const KEY = "claqueta:versiones";
const MAX = 50;

export function loadVersions(): Version[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function persist(list: Version[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* almacenamiento lleno o no disponible */
  }
}

export function saveVersion(name: string, blocks: Block[]): Version {
  const version: Version = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || new Date().toLocaleString("es"),
    date: new Date().toISOString(),
    blocks,
  };
  const list = [version, ...loadVersions()];
  persist(list);
  return version;
}

export function deleteVersion(id: string): void {
  persist(loadVersions().filter((v) => v.id !== id));
}

/** Representa cada bloque como una línea legible para el diff. */
export function blocksToLines(blocks: Block[]): string[] {
  const LABEL: Record<string, string> = {
    scene_heading: "ENCABEZADO",
    action: "ACCIÓN",
    character: "PERSONAJE",
    parenthetical: "PARÉNTESIS",
    dialogue: "DIÁLOGO",
    transition: "TRANSICIÓN",
    shot: "PLANO",
  };
  return blocks
    .filter((b) => (b.text ?? "").trim())
    .map((b) => `[${LABEL[b.type] ?? b.type}] ${b.text.trim()}`);
}

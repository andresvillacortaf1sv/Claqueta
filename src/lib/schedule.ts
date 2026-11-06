/**
 * Plan de rodaje: días de rodaje con elementos (escenas, comida, movimiento,
 * nota). Las escenas se identifican por su índice; las no asignadas se calculan
 * comparando con las escenas del guion. Guardado local.
 */

import { pkey } from "./projects";
export type StripKind = "scene" | "meal" | "move" | "note";

export interface Strip {
  id: string;
  kind: StripKind;
  sceneIndex?: number; // sólo para kind "scene"
  text?: string; // para meal/move/note
}

export interface ShootDay {
  id: string;
  date: string; // ISO o libre
  strips: Strip[];
}

export interface Schedule {
  days: ShootDay[];
}


export function loadSchedule(): Schedule {
  try {
    const v = JSON.parse(localStorage.getItem(pkey("plan-rodaje")) || "");
    if (v && Array.isArray(v.days)) return v;
  } catch {
    /* vacío */
  }
  return { days: [] };
}

export function saveSchedule(s: Schedule): void {
  try {
    localStorage.setItem(pkey("plan-rodaje"), JSON.stringify(s));
  } catch {
    /* no disponible */
  }
}

export function newId(p: string): string {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Índices de escena que aún no están en ningún día. */
export function unassignedScenes(total: number, schedule: Schedule): number[] {
  const assigned = new Set<number>();
  for (const d of schedule.days)
    for (const s of d.strips) if (s.kind === "scene" && s.sceneIndex !== undefined) assigned.add(s.sceneIndex);
  const out: number[] = [];
  for (let i = 0; i < total; i++) if (!assigned.has(i)) out.push(i);
  return out;
}

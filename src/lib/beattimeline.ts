/**
 * Beat Timeline: línea de tiempo horizontal con carriles (actos, escenas, beats,
 * notas, elementos). Cada item tiene inicio y duración en segundos. Local, por
 * proyecto.
 */
import { pkey } from "./projects";

export type LaneId = "acto" | "escena" | "beat" | "nota" | "elemento";

export const LANES: { id: LaneId; label: string; color: string }[] = [
  { id: "acto", label: "Actos / capas", color: "#c9a21a" },
  { id: "escena", label: "Escenas", color: "#2e9e5b" },
  { id: "beat", label: "Beats", color: "#e05aa0" },
  { id: "nota", label: "Notas", color: "#2d6cdf" },
  { id: "elemento", label: "Elementos", color: "#8a63d2" },
];

export function laneColor(id: LaneId): string {
  return LANES.find((l) => l.id === id)?.color ?? "#c8803a";
}

export interface TimelineItem {
  id: string;
  lane: LaneId;
  start: number; // segundos
  duration: number; // segundos
  label: string;
  color?: string;
}

export interface Timeline {
  items: TimelineItem[];
  totalSeconds: number;
}

export function loadTimeline(): Timeline {
  try {
    const v = JSON.parse(localStorage.getItem(pkey("beat-timeline")) || "");
    if (v && Array.isArray(v.items)) return { totalSeconds: v.totalSeconds || 6000, items: v.items };
  } catch {
    /* vacío */
  }
  return { items: [], totalSeconds: 6000 }; // 100 min por defecto
}

export function saveTimeline(t: Timeline): void {
  try {
    localStorage.setItem(pkey("beat-timeline"), JSON.stringify(t));
  } catch {
    /* no disponible */
  }
}

export function newItemId(): string {
  return `bt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = String(m).padStart(2, "0");
  const sss = String(ss).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${sss}` : `${mm}:${sss}`;
}

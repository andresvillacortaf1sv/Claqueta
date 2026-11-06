/**
 * Análisis del guion. Dos modos:
 *  - Por métricas (sin IA): estima intensidad, atención y tensión por escena a
 *    partir de señales del texto, y reparte la estructura por proporciones.
 *  - Con IA (ver ai.ts): rellena emociones reales, colores y un resumen.
 */
import { Block } from "./serialize";

export interface SceneMetric {
  index: number;
  heading: string;
  lines: number;
  intensity: number; // 0-100
  attention: number; // 0-100
  tension: number; // 0-100
  emotion: string; // etiqueta
  color: string; // hex
}

export interface StructPart {
  etapa: string;
  from: number; // índice de escena inicial
  to: number; // índice de escena final (inclusive)
  color: string;
}

export interface Analysis {
  scenes: SceneMetric[];
  structure: StructPart[];
  summary: string;
  aiGenerated: boolean;
}

export interface ScriptStats {
  scenes: number;
  pages: number; // estimación (55 líneas/página)
  words: number;
  dialogueLines: number;
  actionLines: number;
  dialoguePct: number; // % de líneas que son diálogo
  intCount: number;
  extCount: number;
  dayCount: number;
  nightCount: number;
  avgSceneLines: number;
  longest: { heading: string; lines: number } | null;
  shortest: { heading: string; lines: number } | null;
  topCharacters: { name: string; lines: number }[];
}

function canonical(raw: string): string {
  return raw.replace(/\s*\(.*\)\s*$/, "").toUpperCase().trim();
}

export function scriptStats(blocks: Block[]): ScriptStats {
  const groups = groupScenes(blocks);
  let words = 0;
  let dialogueLines = 0;
  let actionLines = 0;
  let intCount = 0;
  let extCount = 0;
  let dayCount = 0;
  let nightCount = 0;
  let totalLines = 0;
  const charLines = new Map<string, number>();
  let speaker: string | null = null;

  let longest: { heading: string; lines: number } | null = null;
  let shortest: { heading: string; lines: number } | null = null;

  for (const b of blocks) {
    const txt = (b.text ?? "").trim();
    if (txt) words += txt.split(/\s+/).length;
    if (b.type === "dialogue" && txt) {
      dialogueLines++;
      if (speaker) charLines.set(speaker, (charLines.get(speaker) ?? 0) + 1);
    }
    if (b.type === "action" && txt) actionLines++;
    if (b.type === "character") speaker = canonical(b.text);
    if (b.type === "scene_heading") {
      const h = b.text.toUpperCase();
      if (/\bINT\b/.test(h)) intCount++;
      if (/\bEXT\b/.test(h)) extCount++;
      if (/\b(DÍA|DIA|DAY|MAÑANA|TARDE)\b/.test(h)) dayCount++;
      if (/\b(NOCHE|NIGHT|MADRUGADA)\b/.test(h)) nightCount++;
    }
  }

  for (const g of groups) {
    const lines = g.blocks.length;
    totalLines += lines;
    if (!longest || lines > longest.lines) longest = { heading: g.heading, lines };
    if (!shortest || lines < shortest.lines) shortest = { heading: g.heading, lines };
  }

  const topCharacters = [...charLines.entries()]
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 6);

  const nonEmpty = blocks.filter((b) => (b.text ?? "").trim()).length;

  return {
    scenes: groups.length,
    pages: Math.max(1, Math.round(totalLines / 55)),
    words,
    dialogueLines,
    actionLines,
    dialoguePct: nonEmpty ? Math.round((dialogueLines / nonEmpty) * 100) : 0,
    intCount,
    extCount,
    dayCount,
    nightCount,
    avgSceneLines: groups.length ? Math.round(totalLines / groups.length) : 0,
    longest,
    shortest,
    topCharacters,
  };
}

interface SceneGroup {
  heading: string;
  blocks: Block[];
}

export function groupScenes(blocks: Block[]): SceneGroup[] {
  const groups: SceneGroup[] = [];
  let current: SceneGroup | null = null;
  for (const b of blocks) {
    if (b.type === "scene_heading") {
      current = { heading: b.text.trim() || "(escena)", blocks: [b] };
      groups.push(current);
    } else if (current) {
      current.blocks.push(b);
    } else {
      current = { heading: "Apertura", blocks: [b] };
      groups.push(current);
    }
  }
  return groups;
}

function normalize(values: number[], lo = 15, hi = 90): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 1e-6) return values.map(() => Math.round((lo + hi) / 2));
  return values.map((v) => Math.round(lo + ((v - min) / (max - min)) * (hi - lo)));
}

export function intensityColor(v: number): string {
  // azul (calma) → ámbar → rojo (intenso)
  const stops = [
    [40, 108, 223],
    [200, 128, 58],
    [177, 34, 59],
  ];
  const t = Math.max(0, Math.min(1, v / 100));
  const seg = t < 0.5 ? 0 : 1;
  const local = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
  const a = stops[seg];
  const b = stops[seg + 1];
  const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * local);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}

const STRUCT = [
  { etapa: "Setup", end: 0.1, color: "#3a506b" },
  { etapa: "Detonante", end: 0.15, color: "#8a7a1a" },
  { etapa: "Desarrollo", end: 0.68, color: "#4a3b2a" },
  { etapa: "Giro", end: 0.8, color: "#5a3a6b" },
  { etapa: "Clímax", end: 0.92, color: "#7a2a3a" },
  { etapa: "Desenlace", end: 1.0, color: "#2e5a44" },
];

export function heuristicAnalysis(blocks: Block[]): Analysis {
  const groups = groupScenes(blocks);
  const N = groups.length;

  const intensityRaw: number[] = [];
  const attentionRaw: number[] = [];
  const tensionRaw: number[] = [];

  for (const g of groups) {
    const lines = g.blocks.length;
    const dialogue = g.blocks.filter((b) => b.type === "dialogue");
    const text = g.blocks.map((b) => b.text).join(" ");
    const exclaims = (text.match(/[!¡]/g) || []).length;
    const questions = (text.match(/[?¿]/g) || []).length;
    const capsWords = (text.match(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g) || []).length;
    const dialogueDensity = lines ? dialogue.length / lines : 0;
    const shortLines = dialogue.filter((d) => d.text.trim().split(/\s+/).length <= 5).length;
    const shortRatio = dialogue.length ? shortLines / dialogue.length : 0;

    intensityRaw.push(exclaims * 2 + capsWords * 1.2 + dialogueDensity * 10 + questions);
    attentionRaw.push(dialogueDensity * 50 + shortRatio * 40 + Math.max(0, 20 - lines));
    tensionRaw.push(exclaims * 1.5 + capsWords * 2 + questions * 1.2);
  }

  const intensity = normalize(intensityRaw);
  const attention = normalize(attentionRaw);
  const tension = normalize(tensionRaw);

  const scenes: SceneMetric[] = groups.map((g, i) => ({
    index: i,
    heading: g.heading,
    lines: g.blocks.length,
    intensity: intensity[i],
    attention: attention[i],
    tension: tension[i],
    emotion: "—",
    color: intensityColor(intensity[i]),
  }));

  const structure: StructPart[] = [];
  let prevEnd = 0;
  for (const s of STRUCT) {
    const to = Math.max(prevEnd, Math.round(s.end * N) - 1);
    if (to >= prevEnd) structure.push({ etapa: s.etapa, from: prevEnd, to, color: s.color });
    prevEnd = to + 1;
  }

  return {
    scenes,
    structure,
    summary: "",
    aiGenerated: false,
  };
}

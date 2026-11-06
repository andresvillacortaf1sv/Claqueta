/**
 * Elementos de producción del desglose, por escena, guardados localmente.
 * Cada categoría es texto libre separado por comas (una lista de elementos).
 */

import { pkey } from "./projects";
export type Category = "utileria" | "vestuario" | "vehiculos" | "extras" | "efectos" | "notas";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "utileria", label: "Utilería / Props" },
  { id: "vestuario", label: "Vestuario" },
  { id: "vehiculos", label: "Vehículos" },
  { id: "extras", label: "Extras / Figurantes" },
  { id: "efectos", label: "Efectos / SFX" },
  { id: "notas", label: "Notas de producción" },
];

export type SceneElements = Partial<Record<Category, string>>;
export type BreakdownData = Record<string, SceneElements>;


export function loadBreakdown(): BreakdownData {
  try {
    return JSON.parse(localStorage.getItem(pkey("desglose")) || "{}");
  } catch {
    return {};
  }
}

export function setBreakdownField(
  data: BreakdownData,
  sceneKey: string,
  category: Category,
  value: string,
): BreakdownData {
  const next: BreakdownData = { ...data, [sceneKey]: { ...(data[sceneKey] ?? {}), [category]: value } };
  try {
    localStorage.setItem(pkey("desglose"), JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible */
  }
  return next;
}

/** Separa un campo de texto por comas en una lista de elementos. */
export function splitItems(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

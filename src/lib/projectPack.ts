/**
 * Empaquetado de un proyecto completo a un archivo .claqueta (y de vuelta).
 *
 * Todo el contenido de un proyecto vive en localStorage bajo el prefijo
 * `claqueta:p:<id>:`. Aquí lo reunimos en un solo archivo de texto (JSON) que el
 * usuario puede guardar en una carpeta de su PC y volver a abrir —en esta o en
 * otra computadora— sin depender del almacenamiento del navegador/app.
 */

import { getActiveId, createProject, listProjects, ProjectMeta } from "./projects";

export interface ProjectPack {
  format: "claqueta-project";
  version: 1;
  name: string;
  savedAt: string;
  /** base (sin prefijo) -> valor crudo en localStorage (ya es JSON en texto). */
  data: Record<string, string>;
}

const PREFIX = (id: string) => `claqueta:p:${id}:`;

/** Reúne todas las claves del proyecto activo en un paquete serializable. */
export function buildProjectPack(): ProjectPack {
  const id = getActiveId();
  const prefix = PREFIX(id);
  const name = listProjects().find((p) => p.id === id)?.name ?? "Guion";
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      const base = k.slice(prefix.length);
      const v = localStorage.getItem(k);
      if (v !== null) data[base] = v;
    }
  }
  return {
    format: "claqueta-project",
    version: 1,
    name,
    savedAt: new Date().toISOString(),
    data,
  };
}

/** Serializa el proyecto activo a texto JSON para guardarlo en archivo. */
export function exportProjectPack(): string {
  return JSON.stringify(buildProjectPack(), null, 2);
}

/** Nombre de archivo sugerido a partir del nombre del proyecto. */
export function suggestFileName(): string {
  const id = getActiveId();
  const name = listProjects().find((p) => p.id === id)?.name ?? "guion";
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "guion";
  return `${slug}.claqueta`;
}

function parsePack(text: string): ProjectPack {
  const obj = JSON.parse(text);
  if (!obj || obj.format !== "claqueta-project" || typeof obj.data !== "object") {
    throw new Error("El archivo no es un proyecto de Claqueta válido.");
  }
  return obj as ProjectPack;
}

/**
 * Importa un paquete como PROYECTO NUEVO (no sobrescribe el actual). Devuelve el
 * meta del proyecto creado; el llamador debe activarlo y recargar el editor.
 */
export function importProjectPackAsNew(text: string): ProjectMeta {
  const pack = parsePack(text);
  const meta = createProject(pack.name || "Guion importado");
  const prefix = PREFIX(meta.id);
  for (const [base, value] of Object.entries(pack.data)) {
    try {
      localStorage.setItem(prefix + base, value);
    } catch {
      /* almacenamiento lleno o no disponible */
    }
  }
  return meta;
}

/**
 * Sobrescribe el proyecto activo con el contenido del paquete. Útil para
 * "recuperar" un guardado manual sobre el mismo documento.
 */
export function importProjectPackIntoActive(text: string): void {
  const pack = parsePack(text);
  const id = getActiveId();
  const prefix = PREFIX(id);
  // Borrar las claves actuales del proyecto para no mezclar restos.
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  for (const [base, value] of Object.entries(pack.data)) {
    try {
      localStorage.setItem(prefix + base, value);
    } catch {
      /* ignora */
    }
  }
}

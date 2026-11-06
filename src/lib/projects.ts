/**
 * Gestión de documentos (proyectos). Cada guion es un proyecto con su propio
 * espacio de almacenamiento: su documento, notas, dirección, desglose, plan,
 * personajes, versiones, etc. quedan separados por proyecto.
 *
 * `pkey(base)` devuelve la clave de localStorage del proyecto activo, de modo
 * que todos los módulos de almacenamiento comparten el mismo prefijo.
 */

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: string;
}

const INDEX_KEY = "claqueta:projects";
const ACTIVE_KEY = "claqueta:activeProject";

/** Bases de almacenamiento que son POR PROYECTO (se migran desde el legado). */
const PER_PROJECT_BASES = [
  "documento",
  "notas",
  "portada",
  "desarrollo",
  "desglose",
  "direccion",
  "departamentos",
  "plan-rodaje",
  "versiones",
  "personajes-manuales",
  "pizarras",
  "beat-timeline",
];

let activeId = "";

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function newProjectId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function listProjects(): ProjectMeta[] {
  return read<ProjectMeta[]>(INDEX_KEY, []);
}

function saveIndex(list: ProjectMeta[]): void {
  write(INDEX_KEY, list);
}

export function getActiveId(): string {
  return activeId;
}

/** Clave de almacenamiento del proyecto activo para una base dada. */
export function pkey(base: string): string {
  return `claqueta:p:${activeId}:${base}`;
}

export function setActiveProject(id: string): void {
  activeId = id;
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* no disponible */
  }
}

export function touchProject(id: string): void {
  const list = listProjects().map((p) => (p.id === id ? { ...p, updatedAt: new Date().toISOString() } : p));
  saveIndex(list);
}

export function renameProject(id: string, name: string): ProjectMeta[] {
  const list = listProjects().map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
  saveIndex(list);
  return list;
}

export function createProject(name: string): ProjectMeta {
  const meta: ProjectMeta = { id: newProjectId(), name: name.trim() || "Guion sin título", updatedAt: new Date().toISOString() };
  saveIndex([meta, ...listProjects()]);
  return meta;
}

export function deleteProject(id: string): ProjectMeta[] {
  // Borrar todas las claves del proyecto.
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`claqueta:p:${id}:`)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  const list = listProjects().filter((p) => p.id !== id);
  saveIndex(list);
  return list;
}

/**
 * Inicializa el sistema de proyectos. Si es la primera vez, crea un proyecto y
 * migra el guion y los datos "legado" (claves sin prefijo de proyecto) a él.
 * Devuelve el id del proyecto activo.
 */
export function initProjects(): string {
  let list = listProjects();

  if (list.length === 0) {
    const meta: ProjectMeta = { id: newProjectId(), name: "Mi guion", updatedAt: new Date().toISOString() };
    saveIndex([meta]);
    list = [meta];
    // Migrar datos legado al primer proyecto.
    const prefix = `claqueta:p:${meta.id}:`;
    for (const base of PER_PROJECT_BASES) {
      const legacy = localStorage.getItem(`claqueta:${base}`);
      if (legacy !== null) localStorage.setItem(prefix + base, legacy);
    }
    // Biografías legado: claqueta:bio:<NOMBRE>
    const bioKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("claqueta:bio:")) bioKeys.push(k);
    }
    for (const k of bioKeys) {
      const name = k.slice("claqueta:bio:".length);
      const v = localStorage.getItem(k);
      if (v !== null) localStorage.setItem(`${prefix}bio:${name}`, v);
    }
  }

  const stored = localStorage.getItem(ACTIVE_KEY);
  const active = stored && list.some((p) => p.id === stored) ? stored : list[0].id;
  activeId = active;
  setActiveProject(active);
  return active;
}

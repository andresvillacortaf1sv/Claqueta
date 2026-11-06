/**
 * Biblia de personaje: modelo de datos completo, opciones y persistencia local.
 * Cada personaje se guarda bajo la clave `claqueta:bio:<NOMBRE>`.
 */

import { pkey } from "./projects";
export interface Relationship {
  id: string;
  to: string; // nombre del otro personaje
  type: string; // id de RELATION_TYPES
  note: string;
}

export interface CharacterBio {
  name: string;
  photo: string; // dataURL
  alias: string;
  logline: string;
  actor: string;

  // Datos básicos
  rolNarrativo: string;
  importancia: string;
  tipoArco: string;
  estado: string;
  genero: string;
  identidad: string;
  edad: string;
  nacimiento: string;
  ocupacion: string;

  apariencia: string;

  // Biografía
  bioEtapa1: string;
  bioEtapa2: string;
  bioEtapa3: string;
  experienciaPrevia: string;
  eventoDesencadenante: string;
  miscelanea: Record<string, string>;

  // Núcleo dramático
  deseo: string;
  necesidad: string;
  psicologia: string;
  arco: string;
  autopercepcion: string;
  percepcionExterna: string;

  // Brújula
  funcionDramatica: string;
  energiaTono: string;
  perfilVoz: string;

  // Medidores y rasgos (1-100)
  medidores: Record<string, number>;
  rasgos: Record<string, number>;

  // Reacciones ante sentimientos
  sentimientos: Record<string, string>;

  relaciones: Relationship[];
}

// ---------- Opciones (opción múltiple) ----------
export const OPTIONS = {
  rolNarrativo: ["Protagonista", "Antagonista", "Deuteragonista", "Interés amoroso", "Mentor", "Aliado", "Secundario", "Comparsa", "Narrador"],
  importancia: ["Principal", "Secundario", "Terciario", "Episódico"],
  tipoArco: ["Crecimiento (positivo)", "Caída (negativo)", "Plano (catalizador)", "Redención", "Desilusión", "Circular"],
  estado: ["Vivo", "Muerto", "Desaparecido", "Desconocido"],
  genero: ["Femenino", "Masculino", "No binario", "Otro", "Sin especificar"],
  identidad: ["Cisgénero", "Transgénero", "No binario", "Género fluido", "Otro", "Sin especificar"],
  funcionDramatica: ["Héroe", "Sombra", "Mentor", "Aliado", "Guardián del umbral", "Heraldo", "Embaucador", "Figura cambiante"],
  energiaTono: ["Luminoso", "Cálido", "Sobrio", "Melancólico", "Tenso", "Oscuro", "Caótico", "Sereno"],
};

export const MEDIDORES = [
  { id: "iniciativa", label: "Iniciativa" },
  { id: "empatia", label: "Empatía" },
  { id: "ambiguedad", label: "Ambigüedad moral" },
  { id: "conflicto", label: "Conflicto interno" },
  { id: "volatilidad", label: "Volatilidad" },
  { id: "transformacion", label: "Transformación" },
  { id: "misterio", label: "Misterio" },
];

export const RASGOS = [
  { id: "perfeccionista", label: "Perfeccionista" },
  { id: "servicial", label: "Servicial" },
  { id: "triunfador", label: "Triunfador" },
  { id: "sensible", label: "Sensible" },
  { id: "pensador", label: "Pensador" },
  { id: "leal", label: "Leal" },
  { id: "entusiasta", label: "Entusiasta" },
  { id: "lider", label: "Líder" },
  { id: "conciliador", label: "Conciliador" },
];

export const SENTIMIENTOS = [
  { id: "tristeza", label: "Tristeza" },
  { id: "alegria", label: "Alegría" },
  { id: "enojo", label: "Enojo" },
  { id: "miedo", label: "Miedo" },
  { id: "amor", label: "Amor" },
  { id: "odio", label: "Odio" },
  { id: "deseo", label: "Deseo" },
  { id: "confusion", label: "Confusión" },
];

export const MISC_QUESTIONS = [
  { id: "m1", q: "¿Qué es lo que más teme perder?" },
  { id: "m2", q: "¿Cuál es su mayor secreto?" },
  { id: "m3", q: "¿Qué mentira se cuenta a sí mismo?" },
  { id: "m4", q: "¿Qué objeto lleva siempre consigo y por qué?" },
  { id: "m5", q: "¿Cómo quiere que lo recuerden?" },
  { id: "m6", q: "¿Cuál fue el mejor y el peor día de su vida?" },
  { id: "m7", q: "¿Qué haría si nadie lo estuviera mirando?" },
  { id: "m8", q: "¿A quién admira en secreto y por qué?" },
];

export const RELATION_TYPES = [
  { id: "familia", label: "Familia", color: "#2e9e5b" },
  { id: "romance", label: "Romance", color: "#e05aa0" },
  { id: "amistad", label: "Amistad", color: "#2d6cdf" },
  { id: "conflicto", label: "Conflicto", color: "#b1223b" },
  { id: "alianza", label: "Alianza", color: "#c8803a" },
  { id: "mentoria", label: "Mentoría", color: "#8a63d2" },
  { id: "rivalidad", label: "Rivalidad", color: "#d98a3d" },
  { id: "negocios", label: "Negocios", color: "#6b8f9c" },
];

export function relationColor(typeId: string): string {
  return RELATION_TYPES.find((t) => t.id === typeId)?.color ?? "#9a938a";
}


function emptyBio(name: string): CharacterBio {
  const fifty = (arr: { id: string }[]) => Object.fromEntries(arr.map((x) => [x.id, 50]));
  const blanks = (arr: { id: string }[]) => Object.fromEntries(arr.map((x) => [x.id, ""]));
  return {
    name,
    photo: "",
    alias: "",
    logline: "",
    actor: "",
    rolNarrativo: "",
    importancia: "",
    tipoArco: "",
    estado: "",
    genero: "",
    identidad: "",
    edad: "",
    nacimiento: "",
    ocupacion: "",
    apariencia: "",
    bioEtapa1: "",
    bioEtapa2: "",
    bioEtapa3: "",
    experienciaPrevia: "",
    eventoDesencadenante: "",
    miscelanea: blanks(MISC_QUESTIONS),
    deseo: "",
    necesidad: "",
    psicologia: "",
    arco: "",
    autopercepcion: "",
    percepcionExterna: "",
    funcionDramatica: "",
    energiaTono: "",
    perfilVoz: "",
    medidores: fifty(MEDIDORES),
    rasgos: fifty(RASGOS),
    sentimientos: blanks(SENTIMIENTOS),
    relaciones: [],
  };
}

export function loadBio(name: string): CharacterBio {
  try {
    const raw = localStorage.getItem(pkey("bio:") + name.toUpperCase());
    if (raw) return { ...emptyBio(name), ...JSON.parse(raw) };
  } catch {
    /* ignora */
  }
  return emptyBio(name);
}

export function saveBio(bio: CharacterBio): void {
  try {
    localStorage.setItem(pkey("bio:") + bio.name.toUpperCase(), JSON.stringify(bio));
  } catch {
    /* almacenamiento lleno (p. ej. foto muy grande) */
  }
}

export function loadAllBios(): CharacterBio[] {
  const out: CharacterBio[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(pkey("bio:"))) {
      try {
        out.push({ ...emptyBio(k.slice(pkey("bio:").length)), ...JSON.parse(localStorage.getItem(k)!) });
      } catch {
        /* ignora */
      }
    }
  }
  return out;
}

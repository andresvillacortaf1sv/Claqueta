/**
 * Módulo de Dirección: desglose técnico por departamentos, storyboard y lista
 * de planos. Todo se asocia a la escena por su clave (encabezado) y se guarda
 * localmente.
 */

export const DEPARTMENTS = [
  { id: "direccion", label: "Dirección" },
  { id: "arte", label: "Arte" },
  { id: "vestuario", label: "Vestuario" },
  { id: "maquillaje", label: "Maquillaje y peluquería" },
  { id: "sonido", label: "Sonido" },
  { id: "efectos", label: "Efectos (SFX)" },
  { id: "vfx", label: "VFX" },
  { id: "locacion", label: "Locación" },
  { id: "fotografia", label: "Fotografía" },
  { id: "iluminacion", label: "Iluminación" },
  { id: "edicion", label: "Edición" },
] as const;

export type DeptId = (typeof DEPARTMENTS)[number]["id"];

export const SHOT_TYPES = [
  "Gran plano general (EWS)",
  "Plano de establecimiento (EST.)",
  "Plano general (WS)",
  "Plano entero (FS)",
  "Plano americano (COWBOY)",
  "Plano general medio (MWS)",
  "Plano medio (MS)",
  "Plano medio corto (MCU)",
  "Primer plano (CU)",
  "Primerísimo primer plano (ECU)",
];
export const ANGLES = ["Normal", "Picado", "Contrapicado", "Cenital", "Nadir", "Holandés"];
export const MOVES = ["Fijo", "Paneo", "Tilt", "Travelling", "Dolly", "Grúa", "Steadicam", "Zoom", "Mano"];

export interface Shot {
  id: string;
  number: string;
  type: string;
  camera: string;
  lens: string;
  angle: string;
  move: string;
  duration: string;
  subject: string;
  description: string;
  shot: boolean; // filmado
}

export interface DirectionScene {
  notes: Partial<Record<DeptId, string>>;
  status: Partial<Record<DeptId, string>>;
  storyboard: string; // dataURL de la imagen
  storyNote: string;
  shots: Shot[];
}

export type DirectionData = Record<string, DirectionScene>;

const KEY = "claqueta:direccion";

export const STATUS_OPTIONS = ["Sin empezar", "En progreso", "Listo"];

export function loadDirection(): DirectionData {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveDirection(data: DirectionData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento lleno (p. ej. storyboards grandes) */
  }
}

export function emptyScene(): DirectionScene {
  return { notes: {}, status: {}, storyboard: "", storyNote: "", shots: [] };
}

export function getScene(data: DirectionData, key: string): DirectionScene {
  return data[key] ?? emptyScene();
}

export function newShotId(): string {
  return `shot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyShot(n: number): Shot {
  return {
    id: newShotId(),
    number: String(n),
    type: SHOT_TYPES[0],
    camera: "",
    lens: "",
    angle: "",
    move: "",
    duration: "",
    subject: "",
    description: "",
    shot: false,
  };
}

/**
 * Definición de los elementos de un guion y de su comportamiento inteligente.
 * Esta es la "gramática" del formato: qué tipos existen, cómo se ciclan con Tab
 * y qué elemento sigue de forma natural al pulsar Enter.
 */

export type ElementType =
  | "scene_heading"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition"
  | "shot";

/** Etiquetas legibles (para la barra de herramientas y el indicador). */
export const ELEMENT_LABELS: Record<ElementType, string> = {
  scene_heading: "Encabezado",
  action: "Acción",
  character: "Personaje",
  parenthetical: "Paréntesis",
  dialogue: "Diálogo",
  transition: "Transición",
  shot: "Plano",
};

/** Atajo que se muestra junto a cada elemento (sólo informativo). */
export const ELEMENT_HINTS: Record<ElementType, string> = {
  scene_heading: "Escribe INT. / EXT. para crearlo",
  action: "Texto descriptivo de la escena",
  character: "Nombre de quien habla",
  parenthetical: "Acotación breve del diálogo",
  dialogue: "Lo que dice el personaje",
  transition: "CORTE A:, FUNDE A:, etc.",
  shot: "Indicación de cámara",
};

/**
 * Orden del ciclo al pulsar Tab (hacia adelante) y Shift-Tab (hacia atrás).
 * Replica el flujo típico de escritura de un guion.
 */
export const TAB_CYCLE: ElementType[] = [
  "scene_heading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
  "shot",
];

/**
 * Qué elemento se crea al pulsar Enter al final de uno dado.
 * Ej.: tras un PERSONAJE viene un DIÁLOGO; tras una TRANSICIÓN, un ENCABEZADO.
 */
export const ENTER_NEXT: Record<ElementType, ElementType> = {
  scene_heading: "action",
  action: "action",
  character: "dialogue",
  parenthetical: "dialogue",
  dialogue: "action",
  transition: "scene_heading",
  shot: "action",
};

/** Elementos cuyo texto se muestra en MAYÚSCULAS (vía CSS). */
export const UPPERCASE_ELEMENTS: ElementType[] = [
  "scene_heading",
  "character",
  "transition",
  "shot",
];

export function isElementType(name: string): name is ElementType {
  return name in ELEMENT_LABELS;
}

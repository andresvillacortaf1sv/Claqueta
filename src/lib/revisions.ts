/**
 * Juego de colores de revisión en el orden estándar de la industria.
 * El `id` se usa como valor del atributo `revision` del bloque y en el CSS.
 */
export interface Revision {
  id: string;
  label: string;
  hex: string;
}

export const REVISIONS: Revision[] = [
  { id: "blue", label: "Azul", hex: "#2d6cdf" },
  { id: "pink", label: "Rosa", hex: "#e05aa0" },
  { id: "yellow", label: "Amarillo", hex: "#c9a21a" },
  { id: "green", label: "Verde", hex: "#2e9e5b" },
  { id: "goldenrod", label: "Dorado", hex: "#b8860b" },
  { id: "buff", label: "Beige", hex: "#9c8457" },
  { id: "salmon", label: "Salmón", hex: "#e8795a" },
  { id: "cherry", label: "Cereza", hex: "#b1223b" },
];

export function revisionById(id: string | null): Revision | undefined {
  return id ? REVISIONS.find((r) => r.id === id) : undefined;
}

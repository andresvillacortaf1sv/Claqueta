/** Documento de desarrollo: logline, tagline, sinopsis y tratamiento. Local. */

export interface Development {
  logline: string;
  tagline: string;
  sinopsis: string;
  tratamiento: string;
}

const KEY = "claqueta:desarrollo";

export const EMPTY_DEV: Development = { logline: "", tagline: "", sinopsis: "", tratamiento: "" };

export function loadDevelopment(): Development {
  try {
    return { ...EMPTY_DEV, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...EMPTY_DEV };
  }
}

export function saveDevelopment(dev: Development): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(dev));
  } catch {
    /* no disponible */
  }
}

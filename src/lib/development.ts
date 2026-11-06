/** Documento de desarrollo: logline, tagline, sinopsis y tratamiento. Local. */

import { pkey } from "./projects";
export interface Development {
  logline: string;
  tagline: string;
  sinopsis: string;
  tratamiento: string;
}


export const EMPTY_DEV: Development = { logline: "", tagline: "", sinopsis: "", tratamiento: "" };

export function loadDevelopment(): Development {
  try {
    return { ...EMPTY_DEV, ...JSON.parse(localStorage.getItem(pkey("desarrollo")) || "{}") };
  } catch {
    return { ...EMPTY_DEV };
  }
}

export function saveDevelopment(dev: Development): void {
  try {
    localStorage.setItem(pkey("desarrollo"), JSON.stringify(dev));
  } catch {
    /* no disponible */
  }
}

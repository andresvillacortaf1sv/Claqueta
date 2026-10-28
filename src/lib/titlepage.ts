/** Datos de la página de título (portada) del guion, guardados localmente. */

export interface TitlePage {
  title: string;
  author: string;
  basedOn: string;
  contact: string;
  draft: string;
}

const STORAGE_KEY = "claqueta:portada";

export const EMPTY_TITLE_PAGE: TitlePage = {
  title: "",
  author: "",
  basedOn: "",
  contact: "",
  draft: "",
};

export function loadTitlePage(): TitlePage {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return { ...EMPTY_TITLE_PAGE, ...JSON.parse(saved) };
    } catch {
      /* ignora y devuelve vacío */
    }
  }
  return { ...EMPTY_TITLE_PAGE };
}

export function saveTitlePage(tp: TitlePage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tp));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** ¿Tiene algún contenido como para dibujarla? */
export function hasTitlePage(tp: TitlePage): boolean {
  return Boolean(tp.title || tp.author || tp.basedOn || tp.contact || tp.draft);
}

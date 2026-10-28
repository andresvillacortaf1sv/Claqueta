/**
 * Creación del documento inicial y persistencia local (local-first).
 *
 * Por ahora guardamos el documento como JSON en localStorage. En una fase
 * posterior esto migrará a IndexedDB y a la File System Access API para abrir y
 * guardar archivos .claqueta / .fdx reales en el disco del usuario.
 */
import { Node as PMNode } from "prosemirror-model";
import { schema } from "./schema";

const STORAGE_KEY = "claqueta:documento";

/** Guion de ejemplo para la primera apertura. */
function documentoEjemplo(): PMNode {
  return schema.node("doc", null, [
    schema.node("scene_heading", null, [schema.text("INT. CAFÉ DE BARRIO - DÍA")]),
    schema.node("action", null, [
      schema.text(
        "La luz entra por un ventanal empañado. ANDRÉS, 30s, teclea en una laptop vieja mientras el vapor de su café sube en espiral.",
      ),
    ]),
    schema.node("character", null, [schema.text("ANDRÉS")]),
    schema.node("parenthetical", null, [schema.text("(sin levantar la vista)")]),
    schema.node("dialogue", null, [
      schema.text("Un día de estos escribo el guion. Hoy, al menos, escribo el editor."),
    ]),
    schema.node("transition", null, [schema.text("CORTE A:")]),
    schema.node("action", null, [
      schema.text(
        "Prueba el formato: pulsa Tab para cambiar de elemento y Enter para seguir al siguiente.",
      ),
    ]),
  ]);
}

export function cargarDocumento(): PMNode {
  const guardado = localStorage.getItem(STORAGE_KEY);
  if (guardado) {
    try {
      return schema.nodeFromJSON(JSON.parse(guardado));
    } catch (e) {
      console.warn("No se pudo leer el documento guardado; se usa el ejemplo.", e);
    }
  }
  return documentoEjemplo();
}

export function guardarDocumento(doc: PMNode): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc.toJSON()));
  } catch (e) {
    console.warn("No se pudo guardar el documento.", e);
  }
}

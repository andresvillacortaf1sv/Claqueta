/**
 * Comandos de formato inteligente: el comportamiento que hace que escribir un
 * guion se sienta como en un programa profesional.
 *
 *  - Enter  → crea el siguiente elemento lógico (PERSONAJE → DIÁLOGO, etc.).
 *  - Tab    → cicla el tipo del bloque actual hacia adelante.
 *  - Shift-Tab → cicla hacia atrás.
 *  - setElement(tipo) → lo usa la barra de herramientas.
 */
import { Command, EditorState, Transaction } from "prosemirror-state";
import { setBlockType } from "prosemirror-commands";
import { ElementType, TAB_CYCLE, ENTER_NEXT, isElementType } from "./elements";
import { nodeTypeFor } from "./schema";

function currentElement(state: EditorState): ElementType | null {
  const name = state.selection.$from.parent.type.name;
  return isElementType(name) ? name : null;
}

/** Cambia el tipo del/los bloque(s) seleccionado(s) a `type`. */
export function setElement(type: ElementType): Command {
  return (state, dispatch) =>
    setBlockType(nodeTypeFor(type))(state, dispatch);
}

/**
 * Enter: parte el bloque actual y asigna al nuevo bloque el tipo que sigue
 * de forma natural según ENTER_NEXT.
 *
 * Caso especial: si el bloque está vacío (p. ej. un DIÁLOGO sin texto) y no es
 * ACCIÓN, pulsar Enter lo convierte en ACCIÓN en lugar de crear otro vacío —
 * igual que el "salir del diálogo" de los editores profesionales.
 */
export const smartEnter: Command = (state, dispatch) => {
  const current = currentElement(state);
  if (!current) return false;

  const parent = state.selection.$from.parent;
  const isEmpty = parent.content.size === 0;

  // Bloque vacío que no es acción → convertir a acción y no partir.
  if (isEmpty && current !== "action" && state.selection.empty) {
    return setBlockType(nodeTypeFor("action"))(state, dispatch);
  }

  const nextName = ENTER_NEXT[current];
  const nextType = nodeTypeFor(nextName);

  if (dispatch) {
    const tr: Transaction = state.tr;
    if (!state.selection.empty) tr.deleteSelection();
    const pos = tr.selection.$from.pos;
    // split(pos, depth, typesAfter): el nodo creado tras el corte toma `nextType`.
    tr.split(pos, 1, [{ type: nextType }]);
    dispatch(tr.scrollIntoView());
  }
  return true;
};

function cycle(dir: 1 | -1): Command {
  return (state, dispatch) => {
    const current = currentElement(state);
    if (!current) return false;
    const idx = TAB_CYCLE.indexOf(current);
    const nextIdx = (idx + dir + TAB_CYCLE.length) % TAB_CYCLE.length;
    const nextType = nodeTypeFor(TAB_CYCLE[nextIdx]);
    return setBlockType(nextType)(state, dispatch);
  };
}

export const cycleForward = cycle(1);
export const cycleBackward = cycle(-1);

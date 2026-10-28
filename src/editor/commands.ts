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
import {
  ElementType,
  TAB_CYCLE,
  ENTER_NEXT,
  EMPTY_ENTER_CYCLE,
  isElementType,
} from "./elements";
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
 * Enter inteligente, con dos comportamientos:
 *
 *  a) Línea CON texto → parte el bloque y crea el siguiente elemento lógico
 *     según ENTER_NEXT (p. ej. tras un PERSONAJE, un DIÁLOGO).
 *
 *  b) Línea VACÍA → no crea líneas en blanco; en su lugar rota el tipo del
 *     bloque actual por EMPTY_ENTER_CYCLE. Dando Enter repetidamente, el usuario
 *     recorre acción → personaje → diálogo → … hasta el elemento que quiere.
 */
export const smartEnter: Command = (state, dispatch) => {
  const current = currentElement(state);
  if (!current) return false;

  const parent = state.selection.$from.parent;
  const isEmpty = parent.content.size === 0 && state.selection.empty;

  // (b) Línea vacía: rotar al siguiente tipo del ciclo.
  if (isEmpty) {
    const idx = EMPTY_ENTER_CYCLE.indexOf(current);
    const nextName = EMPTY_ENTER_CYCLE[(idx + 1) % EMPTY_ENTER_CYCLE.length];
    return setBlockType(nodeTypeFor(nextName))(state, dispatch);
  }

  // (a) Línea con texto: partir y crear el siguiente elemento lógico.
  const nextType = nodeTypeFor(ENTER_NEXT[current]);
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

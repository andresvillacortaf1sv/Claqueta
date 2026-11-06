/**
 * Modo revisión: cuando está activo, cada bloque que editas queda marcado con
 * la revisión actual (un color). En el margen derecho aparece un asterisco del
 * color de la revisión, como en el flujo de borradores de la industria.
 *
 * El estado (activo + revisión actual) vive en el propio plugin y se actualiza
 * desde React con `setRevisionMeta`.
 */
import { Plugin, PluginKey, EditorState, Transaction, Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "./schema";

/**
 * Resaltado inline por selección: aplica la marca `highlight` al texto
 * seleccionado (una palabra, una línea, un párrafo…). Si no hay selección,
 * resalta el bloque actual completo, como atajo.
 */
export function highlightSelection(color: string): Command {
  return (state, dispatch) => {
    let { from, to, empty } = state.selection;
    if (empty) {
      const $f = state.selection.$from;
      from = $f.start();
      to = $f.end();
    }
    if (from >= to) return false;
    if (dispatch) {
      const mark = schema.marks.highlight.create({ color });
      dispatch(state.tr.addMark(from, to, mark).removeStoredMark(schema.marks.highlight));
    }
    return true;
  };
}

/** Quita el resaltado de la selección (o del bloque actual si no hay selección). */
export const clearHighlightSelection: Command = (state, dispatch) => {
  let { from, to, empty } = state.selection;
  if (empty) {
    const $f = state.selection.$from;
    from = $f.start();
    to = $f.end();
  }
  if (from >= to) return false;
  if (dispatch) dispatch(state.tr.removeMark(from, to, schema.marks.highlight));
  return true;
};

export interface RevisionState {
  enabled: boolean;
  revId: string | null;
}

export const revisionKey = new PluginKey<RevisionState>("revisions");

export function revisionsPlugin(): Plugin<RevisionState> {
  return new Plugin<RevisionState>({
    key: revisionKey,
    state: {
      init: () => ({ enabled: false, revId: null }),
      apply(tr, old) {
        const meta = tr.getMeta(revisionKey) as Partial<RevisionState> | undefined;
        return meta ? { ...old, ...meta } : old;
      },
    },
    appendTransaction(trs, _oldState, newState) {
      const st = revisionKey.getState(newState);
      if (!st || !st.enabled || !st.revId) return null;
      if (!trs.some((t) => t.docChanged)) return null;
      if (trs.some((t) => t.getMeta(revisionKey))) return null; // evitar recursión

      const $from = newState.selection.$from;
      if ($from.depth < 1) return null;
      const node = $from.node(1);
      if (!node.isTextblock || node.attrs.revision === st.revId) return null;

      const pos = $from.before(1);
      const tr = newState.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        revision: st.revId,
      });
      tr.setMeta(revisionKey, {});
      tr.setMeta("addToHistory", false);
      return tr;
    },
  });
}

/** Actualiza el estado del modo revisión desde la interfaz. */
export function setRevisionMeta(view: EditorView, patch: Partial<RevisionState>): void {
  view.dispatch(view.state.tr.setMeta(revisionKey, patch));
}

/**
 * Marca con la revisión dada todos los bloques que toca la selección actual
 * (o el bloque del cursor si no hay selección). Es lo que hace que elegir un
 * color aplique el sombreado al texto seleccionado al instante.
 */
export function applyRevision(revId: string): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    let tr = state.tr;
    let changed = false;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isTextblock) {
        if (node.attrs.revision !== revId) {
          tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, revision: revId });
          changed = true;
        }
        return false;
      }
      return true;
    });
    if (changed && dispatch) {
      tr.setMeta(revisionKey, {});
      dispatch(tr);
    }
    return changed;
  };
}

/** Quita todas las marcas de revisión del documento. */
export function clearRevisions(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  let tr = state.tr;
  let changed = false;
  state.doc.descendants((node, pos) => {
    if (node.isTextblock && node.attrs.revision) {
      tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, revision: null });
      changed = true;
    }
    return true;
  });
  if (changed && dispatch) {
    tr.setMeta(revisionKey, {});
    dispatch(tr);
  }
  return changed;
}

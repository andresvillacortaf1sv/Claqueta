/**
 * Modo revisión: cuando está activo, cada bloque que editas queda marcado con
 * la revisión actual (un color). En el margen derecho aparece un asterisco del
 * color de la revisión, como en el flujo de borradores de la industria.
 *
 * El estado (activo + revisión actual) vive en el propio plugin y se actualiza
 * desde React con `setRevisionMeta`.
 */
import { Plugin, PluginKey, EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

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

/**
 * Buscar y reemplazar profesional: por tipo de elemento, con sensibilidad a
 * mayúsculas, palabra completa y expresiones regulares.
 */
import { EditorView } from "prosemirror-view";
import { EditorState, TextSelection } from "prosemirror-state";
import { ElementType } from "./elements";

export interface FindOptions {
  element: ElementType | "all";
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildRegex(query: string, opts: FindOptions): RegExp | null {
  if (!query) return null;
  let pattern = opts.regex ? query : escapeRegExp(query);
  if (opts.wholeWord && !opts.regex) pattern = `\\b${pattern}\\b`;
  const flags = "g" + (opts.caseSensitive ? "" : "i");
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

function matchesType(name: string, element: ElementType | "all"): boolean {
  return element === "all" || name === element;
}

export function countMatches(state: EditorState, query: string, opts: FindOptions): number {
  const re = buildRegex(query, opts);
  if (!re) return 0;
  let total = 0;
  state.doc.descendants((node) => {
    if (node.isTextblock) {
      if (matchesType(node.type.name, opts.element)) {
        const m = node.textContent.match(re);
        if (m) total += m.length;
      }
      return false;
    }
    return true;
  });
  return total;
}

/** Reemplaza todas las coincidencias. Devuelve cuántas cambió. */
export function replaceAll(view: EditorView, query: string, replacement: string, opts: FindOptions): number {
  const re = buildRegex(query, opts);
  if (!re) return 0;
  const { state } = view;

  const edits: { from: number; to: number; text: string }[] = [];
  let count = 0;

  state.doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (matchesType(node.type.name, opts.element)) {
        const text = node.textContent;
        const found = text.match(re);
        if (found && found.length) {
          const newText = text.replace(re, replacement);
          if (newText !== text) {
            edits.push({ from: pos + 1, to: pos + 1 + node.content.size, text: newText });
            count += found.length;
          }
        }
      }
      return false;
    }
    return true;
  });

  if (!edits.length) return 0;

  let tr = state.tr;
  // Aplicar de atrás hacia adelante para que las posiciones sigan siendo válidas.
  for (let i = edits.length - 1; i >= 0; i--) {
    const e = edits[i];
    if (e.text) tr = tr.replaceWith(e.from, e.to, state.schema.text(e.text));
    else tr = tr.delete(e.from, e.to);
  }
  view.dispatch(tr);
  return count;
}

/** Selecciona la siguiente coincidencia a partir del cursor. Devuelve si encontró. */
export function findNext(view: EditorView, query: string, opts: FindOptions): boolean {
  const re = buildRegex(query, opts);
  if (!re) return false;
  const { state } = view;
  const after = state.selection.to;

  const hits: { from: number; to: number }[] = [];
  state.doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (matchesType(node.type.name, opts.element)) {
        const text = node.textContent;
        let m: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((m = re.exec(text)) !== null) {
          hits.push({ from: pos + 1 + m.index, to: pos + 1 + m.index + m[0].length });
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      }
      return false;
    }
    return true;
  });
  if (!hits.length) return false;

  const next = hits.find((h) => h.from >= after) ?? hits[0];
  const sel = TextSelection.create(state.doc, next.from, next.to);
  view.dispatch(state.tr.setSelection(sel).scrollIntoView());
  view.focus();
  return true;
}

/**
 * Autocompletado de nombres de personaje. Mientras escribes en un bloque
 * PERSONAJE, sugiere nombres ya usados en el guion (y los añadidos a mano).
 * Navegación con ↑/↓, completar con Enter o Tab, cerrar con Esc; también con clic.
 */
import { Plugin, PluginKey, EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { loadManualCharacters } from "../lib/manualCharacters";

interface Suggest {
  items: string[];
  index: number;
  from: number; // inicio del texto del bloque
  to: number; // fin del texto del bloque
}

const shared: { current: Suggest | null } = { current: null };

function canonical(t: string): string {
  return t.replace(/\s*\(.*\)\s*$/i, "").toUpperCase().trim();
}

function knownNames(state: EditorState): string[] {
  const set = new Set<string>();
  state.doc.forEach((n) => {
    if (n.type.name === "character") {
      const name = canonical(n.textContent);
      if (name) set.add(name);
    }
  });
  for (const m of loadManualCharacters()) set.add(m.toUpperCase());
  return [...set];
}

function compute(state: EditorState): Suggest | null {
  const { $from, empty } = state.selection;
  if (!empty) return null;
  if ($from.parent.type.name !== "character") return null;
  const text = $from.parent.textContent;
  const prefix = text.toUpperCase().trim();
  if (prefix.length < 1) return null;
  const items = knownNames(state)
    .filter((n) => n.startsWith(prefix) && n !== prefix)
    .slice(0, 6);
  if (items.length === 0) return null;
  const start = $from.start();
  return { items, index: 0, from: start, to: start + $from.parent.content.size };
}

function complete(view: EditorView, name: string): void {
  const s = shared.current;
  if (!s) return;
  const tr = view.state.tr.insertText(name, s.from, s.to);
  view.dispatch(tr);
  shared.current = null;
  view.focus();
}

export const autocompleteKey = new PluginKey("autocomplete");

export function autocompletePlugin(): Plugin {
  return new Plugin({
    key: autocompleteKey,
    view(view) {
      const box = document.createElement("div");
      box.className = "autocomplete";
      box.style.display = "none";
      document.body.appendChild(box);

      const render = () => {
        const s = shared.current;
        if (!s) {
          box.style.display = "none";
          return;
        }
        try {
          const coords = view.coordsAtPos(view.state.selection.from);
          box.style.display = "block";
          box.style.left = `${coords.left}px`;
          box.style.top = `${coords.bottom + 2}px`;
        } catch {
          box.style.display = "none";
          return;
        }
        box.innerHTML = "";
        s.items.forEach((name, i) => {
          const item = document.createElement("div");
          item.className = "autocomplete-item" + (i === s.index ? " is-active" : "");
          item.textContent = name;
          item.addEventListener("mousedown", (e) => {
            e.preventDefault();
            complete(view, name);
            render();
          });
          box.appendChild(item);
        });
      };

      const update = () => {
        const prev = shared.current;
        const next = compute(view.state);
        // Si el conjunto de sugerencias no cambió, conservar el índice elegido.
        if (prev && next && prev.items.join("|") === next.items.join("|")) {
          next.index = prev.index;
        }
        shared.current = next;
        render();
      };
      update();

      return {
        update,
        destroy() {
          box.remove();
          shared.current = null;
        },
      };
    },
  });
}

/** Keymap de alta prioridad para navegar/cerrar el autocompletado. */
export const autocompleteKeymap = keymap({
  ArrowDown: (state, dispatch) => {
    if (!shared.current) return false;
    shared.current.index = (shared.current.index + 1) % shared.current.items.length;
    if (dispatch) dispatch(state.tr.setMeta(autocompleteKey, "nav")); // fuerza re-render
    return true;
  },
  ArrowUp: (state, dispatch) => {
    if (!shared.current) return false;
    const n = shared.current.items.length;
    shared.current.index = (shared.current.index - 1 + n) % n;
    if (dispatch) dispatch(state.tr.setMeta(autocompleteKey, "nav"));
    return true;
  },
  Enter: (_state, dispatch, view) => {
    if (!shared.current || !view) return false;
    const name = shared.current.items[shared.current.index];
    const tr = view.state.tr.insertText(name, shared.current.from, shared.current.to);
    if (dispatch) dispatch(tr);
    shared.current = null;
    return true;
  },
  Tab: (_state, dispatch, view) => {
    if (!shared.current || !view) return false;
    const name = shared.current.items[shared.current.index];
    const tr = view.state.tr.insertText(name, shared.current.from, shared.current.to);
    if (dispatch) dispatch(tr);
    shared.current = null;
    return true;
  },
  Escape: () => {
    if (!shared.current) return false;
    shared.current = null;
    return true;
  },
});

export type { Transaction };

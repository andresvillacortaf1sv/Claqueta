/** Operaciones de escena sobre el editor: saltar, editar resumen, reordenar. */
import { EditorView } from "prosemirror-view";
import { TextSelection } from "prosemirror-state";
import { Fragment } from "prosemirror-model";
import { sceneGroups } from "../lib/scenes";

/** Lleva el cursor al encabezado de una escena y la desplaza a la vista. */
export function jumpToScene(view: EditorView, pos: number): void {
  const target = Math.min(pos + 1, view.state.doc.content.size);
  const sel = TextSelection.create(view.state.doc, target);
  view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
  view.focus();
}

/** Guarda el resumen (beat) de una escena en el atributo del encabezado. */
export function setSceneSummary(view: EditorView, pos: number, text: string): void {
  const node = view.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "scene_heading") return;
  view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, summary: text }));
}

/** Reordena las escenas moviendo la escena `from` a la posición `to`. */
export function reorderScenes(view: EditorView, from: number, to: number): void {
  const { preamble, scenes } = sceneGroups(view.state.doc);
  if (from === to || from < 0 || to < 0 || from >= scenes.length || to >= scenes.length) return;

  const arr = scenes.slice();
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);

  const children = [...preamble, ...arr.flat()];
  const frag = Fragment.fromArray(children);
  view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, frag));
}

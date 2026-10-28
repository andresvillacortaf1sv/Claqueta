/**
 * Mapa de teclado del editor. Combina los comandos de formato inteligente con
 * los atajos estándar (deshacer/rehacer, negrita/cursiva/subrayado) y el
 * baseKeymap de ProseMirror para el resto.
 */
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { undo, redo } from "prosemirror-history";
import { smartEnter, cycleForward, cycleBackward } from "./commands";
import { schema } from "./schema";

/** Atajos propios del guion (tienen prioridad sobre el baseKeymap). */
export const screenplayKeymap = keymap({
  Enter: smartEnter,
  Tab: cycleForward,
  "Shift-Tab": cycleBackward,

  "Mod-z": undo,
  "Mod-y": redo,
  "Shift-Mod-z": redo,

  "Mod-b": toggleMark(schema.marks.strong),
  "Mod-i": toggleMark(schema.marks.em),
  "Mod-u": toggleMark(schema.marks.underline),
});

export const baseKeymapPlugin = keymap(baseKeymap);

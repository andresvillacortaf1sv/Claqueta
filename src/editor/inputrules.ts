/**
 * Reglas de entrada: convierten automáticamente el bloque según lo que escribes,
 * como hace Final Draft al teclear "INT." o "CORTE A:".
 */
import { inputRules, textblockTypeInputRule } from "prosemirror-inputrules";
import { nodeTypeFor } from "./schema";

/**
 * Encabezados de escena: INT. EXT. INT/EXT I/E EST. (y sus variantes en español).
 * Se dispara al teclear la abreviatura seguida de un punto o espacio.
 */
const sceneHeadingRule = textblockTypeInputRule(
  /^(int|ext|int\/ext|int\.\/ext|i\/e|est|interior|exterior)[.\s]$/i,
  nodeTypeFor("scene_heading"),
);

/**
 * Transiciones frecuentes en inglés y español. Se disparan al cerrar con ":".
 */
const transitionRule = textblockTypeInputRule(
  /^(cut to|fade in|fade out|fade to|dissolve to|smash cut to|match cut to|corte a|funde a|funde desde|disuelve a|fundido a negro)[:]$/i,
  nodeTypeFor("transition"),
);

export const screenplayInputRules = inputRules({
  rules: [sceneHeadingRule, transitionRule],
});

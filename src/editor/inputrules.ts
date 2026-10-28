/**
 * Reglas de entrada: convierten automáticamente el bloque según lo que escribes,
 * como hace Final Draft al teclear "INT." o "CORTE A:".
 *
 * OJO: la `textblockTypeInputRule` de ProseMirror está pensada para marcadores
 * tipo markdown y BORRA el texto que dispara la regla. En un guion queremos
 * conservar "INT." / "CORTE A:" (son parte del encabezado/transición), así que
 * usamos una regla propia que sólo cambia el tipo de bloque, sin borrar nada.
 */
import { InputRule, inputRules } from "prosemirror-inputrules";
import { NodeType } from "prosemirror-model";
import { nodeTypeFor } from "./schema";

function changeBlockKeepingText(regexp: RegExp, nodeType: NodeType): InputRule {
  return new InputRule(regexp, (state, match, start, end) => {
    const $start = state.doc.resolve(start);
    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) {
      return null;
    }
    // ProseMirror consume la pulsación que dispara la regla, así que la
    // reinsertamos (el "." o ":" tecleado) antes de cambiar el tipo de bloque.
    const typedLen = match[0].length - (end - start);
    const typed = typedLen > 0 ? match[0].slice(match[0].length - typedLen) : "";
    let tr = state.tr;
    if (typed) tr = tr.insertText(typed, end);
    // setBlockType con rango de longitud 0 cambia el bloque que contiene `start`
    // sin tocar su contenido.
    return tr.setBlockType(start, start, nodeType);
  });
}

const sceneHeadingRule = changeBlockKeepingText(
  /^(int|ext|int\/ext|int\.\/ext|i\/e|est|interior|exterior)[.\s]$/i,
  nodeTypeFor("scene_heading"),
);

const transitionRule = changeBlockKeepingText(
  /^(cut to|fade in|fade out|fade to|dissolve to|smash cut to|match cut to|corte a|funde a|funde desde|disuelve a|fundido a negro)[:]$/i,
  nodeTypeFor("transition"),
);

export const screenplayInputRules = inputRules({
  rules: [sceneHeadingRule, transitionRule],
});

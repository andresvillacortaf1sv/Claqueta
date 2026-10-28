/**
 * Esquema ProseMirror del guion.
 *
 * Cada tipo de línea del guion es un nodo de bloque propio. Modelarlos como
 * nodos distintos (en vez de un párrafo con un atributo) hace que el documento
 * tenga estructura estricta y que el mapeo a FDX/Fountain más adelante sea
 * directo y sin ambigüedad.
 */
import { Schema, NodeSpec } from "prosemirror-model";

function block(className: string, extra: Partial<NodeSpec> = {}): NodeSpec {
  const attrs = { revision: { default: null as string | null }, ...(extra.attrs ?? {}) };
  return {
    content: "text*",
    group: "block",
    parseDOM: [
      {
        tag: `p.${className}`,
        getAttrs: (dom) => {
          const rev = (dom as HTMLElement).getAttribute("data-rev");
          return rev ? { revision: rev } : {};
        },
      },
    ],
    toDOM: (node) => {
      const dom: Record<string, string> = { class: `sp-el ${className}` };
      if (node.attrs.revision) dom["data-rev"] = node.attrs.revision;
      return ["p", dom, 0];
    },
    ...extra,
    attrs,
  };
}

export const schema = new Schema({
  nodes: {
    doc: { content: "block+" },

    scene_heading: block("sp-scene-heading", {
      attrs: { sceneNumber: { default: null }, summary: { default: "" } },
      defining: true,
    }),
    action: block("sp-action", {
      // La acción es el bloque "por defecto": cualquier <p> sin clase cae aquí.
      parseDOM: [{ tag: "p.sp-action" }, { tag: "p" }],
    }),
    character: block("sp-character", { defining: true }),
    parenthetical: block("sp-parenthetical"),
    dialogue: block("sp-dialogue"),
    transition: block("sp-transition", { defining: true }),
    shot: block("sp-shot", { defining: true }),

    text: { group: "inline" },
  },

  marks: {
    strong: {
      parseDOM: [{ tag: "strong" }, { tag: "b" }],
      toDOM: () => ["strong", 0],
    },
    em: {
      parseDOM: [{ tag: "em" }, { tag: "i" }],
      toDOM: () => ["em", 0],
    },
    underline: {
      parseDOM: [{ tag: "u" }],
      toDOM: () => ["u", 0],
    },
    strikethrough: {
      parseDOM: [{ tag: "s" }, { tag: "strike" }, { style: "text-decoration=line-through" }],
      toDOM: () => ["s", 0],
    },
  },
});

/** Acceso tipado a los NodeType de elementos. */
export function nodeTypeFor(name: string) {
  const t = schema.nodes[name];
  if (!t) throw new Error(`Tipo de nodo desconocido: ${name}`);
  return t;
}

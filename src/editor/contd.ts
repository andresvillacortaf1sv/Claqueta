/**
 * CONT'D automático dentro del editor.
 *
 * Cuando un PERSONAJE vuelve a hablar sin que otro personaje haya hablado en
 * medio (p. ej. su diálogo se interrumpe con una línea de ACCIÓN y luego sigue),
 * se muestra "(CONT'D)" junto a su nombre. Es una decoración: no modifica el
 * texto del documento, sólo lo dibuja, así que no interfiere con la escritura.
 */
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";

const key = new PluginKey<DecorationSet>("contd");

/** Nombre canónico del personaje, sin extensiones tipo (V.O.) o (CONT'D). */
function canonical(text: string): string {
  return text.replace(/\s*\(.*\)\s*$/i, "").toUpperCase().trim();
}

function build(doc: PMNode): DecorationSet {
  const decos: Decoration[] = [];
  let lastSpeaker: string | null = null;
  let spokeSince = false; // ¿hubo diálogo desde que este personaje habló por última vez?

  doc.forEach((node, offset) => {
    const t = node.type.name;
    if (t === "scene_heading") {
      lastSpeaker = null;
      spokeSince = false;
      return;
    }
    if (t === "character") {
      const name = canonical(node.textContent);
      if (!name) return;
      const already = /\(cont'?d\)/i.test(node.textContent);
      // Mismo personaje que habló antes, con diálogo de por medio → CONT'D.
      if (name === lastSpeaker && spokeSince && !already) {
        const end = offset + node.nodeSize - 1; // posición al final del texto del bloque
        decos.push(
          Decoration.widget(
            end,
            () => {
              const span = document.createElement("span");
              span.className = "sp-contd";
              span.textContent = " (CONT'D)";
              span.setAttribute("contenteditable", "false");
              return span;
            },
            { side: 1, key: `contd-${offset}` },
          ),
        );
      }
      lastSpeaker = name;
      spokeSince = false;
    } else if (t === "dialogue" && node.textContent.trim()) {
      spokeSince = true;
    }
  });

  return DecorationSet.create(doc, decos);
}

export function contdPlugin(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key,
    state: {
      init: (_c, state) => build(state.doc),
      apply(tr, old) {
        return tr.docChanged ? build(tr.doc) : old;
      },
    },
    props: {
      decorations(state) {
        return key.getState(state);
      },
    },
  });
}

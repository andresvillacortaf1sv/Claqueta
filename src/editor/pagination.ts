/**
 * Saltos de página en vivo dentro del editor.
 *
 * ProseMirror edita texto corrido; aquí medimos el alto real de cada bloque y
 * pintamos una línea de "Página N" donde empieza cada página (US Letter: 9" de
 * texto = 864 px CSS). Los marcadores tienen alto 0 (se dibujan en el margen
 * entre líneas), así que no desplazan el texto y el cálculo es estable en una
 * sola pasada.
 *
 * Es sólo una guía visual; la paginación exacta vive en la vista previa y el PDF.
 */
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

const key = new PluginKey<DecorationSet>("pagination");

/** Altura del área de texto de una página, en px CSS (9 pulgadas · 96 px/in). */
const PAGE_CONTENT_PX = 9 * 96;

function pageBreakWidget(pos: number, pageNumber: number): Decoration {
  return Decoration.widget(
    pos,
    () => {
      const el = document.createElement("div");
      el.className = "pm-pagebreak";
      el.setAttribute("contenteditable", "false");
      const label = document.createElement("span");
      label.className = "pm-pagebreak-label";
      label.textContent = `Página ${pageNumber}`;
      el.appendChild(label);
      return el;
    },
    { side: -1, key: `pb-${pageNumber}`, marks: [] },
  );
}

function computeDecorations(view: EditorView): DecorationSet {
  const root = view.dom as HTMLElement;
  const children = Array.from(root.children) as HTMLElement[];
  if (children.length < 2) return DecorationSet.empty;

  const decos: Decoration[] = [];
  let pageStart = children[0].offsetTop;
  let pageNumber = 1;

  for (let i = 1; i < children.length; i++) {
    const el = children[i];
    const bottom = el.offsetTop + el.offsetHeight;
    if (bottom - pageStart > PAGE_CONTENT_PX) {
      pageNumber++;
      try {
        const inside = view.posAtDOM(el, 0);
        const blockPos = Math.max(0, inside - 1);
        decos.push(pageBreakWidget(blockPos, pageNumber));
      } catch {
        // posición no resoluble en este momento; se recalcula al siguiente cambio
      }
      pageStart = el.offsetTop;
    }
  }
  return DecorationSet.create(view.state.doc, decos);
}

function signature(set: DecorationSet): string {
  return set
    .find()
    .map((d) => d.from)
    .join(",");
}

export function paginationPlugin(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key,
    state: {
      init: () => DecorationSet.empty,
      apply(tr, old) {
        const meta = tr.getMeta(key) as DecorationSet | undefined;
        if (meta) return meta;
        return old.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return key.getState(state);
      },
    },
    view(view) {
      let raf = 0;
      const recompute = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const next = computeDecorations(view);
          const prev = key.getState(view.state) ?? DecorationSet.empty;
          if (signature(prev) !== signature(next)) {
            view.dispatch(view.state.tr.setMeta(key, next));
          }
        });
      };

      recompute();
      window.addEventListener("resize", recompute);
      // Courier Prime carga de forma asíncrona y cambia las métricas: recalcular.
      if (document.fonts?.ready) document.fonts.ready.then(recompute);

      return {
        update(v, prev) {
          if (v.state.doc !== prev.doc) recompute();
        },
        destroy() {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", recompute);
        },
      };
    },
  });
}

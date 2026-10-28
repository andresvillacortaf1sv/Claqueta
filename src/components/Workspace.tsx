import { useEffect, useRef, useState, useCallback } from "react";
import { EditorState, Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { screenplayKeymap, baseKeymapPlugin } from "../editor/keymap";
import { screenplayInputRules } from "../editor/inputrules";
import { cargarDocumento, guardarDocumento } from "../editor/document";
import { setElement } from "../editor/commands";
import {
  ElementType,
  ELEMENT_LABELS,
  ELEMENT_HINTS,
  TAB_CYCLE,
  isElementType,
} from "../editor/elements";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { Preview } from "./Preview";
import { docToBlocks, Block } from "../lib/serialize";

type SaveState = "guardado" | "guardando";

export function Workspace() {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const saveTimer = useRef<number | null>(null);

  const [current, setCurrent] = useState<ElementType>("action");
  const [emptyLine, setEmptyLine] = useState(false);
  const [save, setSave] = useState<SaveState>("guardado");
  const [previewBlocks, setPreviewBlocks] = useState<Block[] | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const state = EditorState.create({
      doc: cargarDocumento(),
      plugins: [
        history(),
        screenplayInputRules,
        screenplayKeymap,
        baseKeymapPlugin,
      ],
    });

    const view = new EditorView(mountRef.current, {
      state,
      dispatchTransaction(tr) {
        const next = view.state.apply(tr);
        view.updateState(next);

        const name = next.selection.$from.parent.type.name;
        if (isElementType(name)) setCurrent(name);
        setEmptyLine(next.selection.$from.parent.content.size === 0);

        if (tr.docChanged) {
          setSave("guardando");
          if (saveTimer.current) window.clearTimeout(saveTimer.current);
          saveTimer.current = window.setTimeout(() => {
            guardarDocumento(next.doc);
            setSave("guardado");
          }, 500);
        }
      },
    });

    viewRef.current = view;
    view.focus();

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  const run = useCallback((cmd: Command) => {
    const view = viewRef.current;
    if (!view) return;
    cmd(view.state, view.dispatch);
    view.focus();
  }, []);

  const applyElement = useCallback(
    (type: ElementType) => run(setElement(type)),
    [run],
  );

  const openPreview = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    setPreviewBlocks(docToBlocks(view.state.doc));
  }, []);

  // Atajos tipo Final Draft: Ctrl/Cmd + número para fijar el elemento.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const n = Number(e.key);
      if (Number.isNaN(n) || n < 1 || n > TAB_CYCLE.length) return;
      e.preventDefault();
      applyElement(TAB_CYCLE[n - 1]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyElement]);

  return (
    <div className="workspace">
      <Toolbar current={current} onPick={applyElement} onPreview={openPreview} />

      <div className="page-scroll">
        <div className="page">
          <div className="pm-mount" ref={mountRef} />
        </div>
      </div>

      <StatusBar
        current={current}
        label={ELEMENT_LABELS[current]}
        hint={ELEMENT_HINTS[current]}
        empty={emptyLine}
        save={save}
      />

      {previewBlocks && (
        <Preview blocks={previewBlocks} onClose={() => setPreviewBlocks(null)} />
      )}
    </div>
  );
}

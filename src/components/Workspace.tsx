import { useEffect, useRef, useState, useCallback } from "react";
import { EditorState, Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { screenplayKeymap, baseKeymapPlugin } from "../editor/keymap";
import { screenplayInputRules } from "../editor/inputrules";
import { paginationPlugin } from "../editor/pagination";
import { revisionsPlugin, setRevisionMeta, clearRevisions } from "../editor/revisions";
import { cargarDocumento, guardarDocumento, docFromBlocks } from "../editor/document";
import { setElement } from "../editor/commands";
import { Menu } from "./Menu";
import { downloadText, pickTextFile } from "../lib/files";
import { blocksToFdx, fdxToBlocks } from "../lib/fdx";
import { blocksToFountain, fountainToBlocks } from "../lib/fountain";
import { REVISIONS } from "../lib/revisions";
import { TitlePage, loadTitlePage, saveTitlePage } from "../lib/titlepage";
import { TitlePageModal } from "./TitlePageModal";
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
  const [titlePage, setTitlePage] = useState<TitlePage>(() => loadTitlePage());
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [revEnabled, setRevEnabled] = useState(false);
  const [revId, setRevId] = useState<string>(REVISIONS[0].id);

  useEffect(() => {
    if (!mountRef.current) return;

    const state = EditorState.create({
      doc: cargarDocumento(),
      plugins: [
        history(),
        screenplayInputRules,
        screenplayKeymap,
        baseKeymapPlugin,
        paginationPlugin(),
        revisionsPlugin(),
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

  const currentBlocks = useCallback(() => {
    const view = viewRef.current;
    return view ? docToBlocks(view.state.doc) : [];
  }, []);

  const replaceWithBlocks = useCallback((blocks: Block[]) => {
    const view = viewRef.current;
    if (!view || blocks.length === 0) return;
    const doc = docFromBlocks(blocks);
    const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
    view.dispatch(tr);
    view.focus();
  }, []);

  const importFdx = useCallback(async () => {
    const file = await pickTextFile(".fdx,application/xml,text/xml");
    if (file) replaceWithBlocks(fdxToBlocks(file.text));
  }, [replaceWithBlocks]);

  const importFountain = useCallback(async () => {
    const file = await pickTextFile(".fountain,.txt,text/plain");
    if (file) replaceWithBlocks(fountainToBlocks(file.text));
  }, [replaceWithBlocks]);

  const exportFdx = useCallback(() => {
    downloadText("guion.fdx", blocksToFdx(currentBlocks()), "application/xml");
  }, [currentBlocks]);

  const exportFountain = useCallback(() => {
    downloadText("guion.fountain", blocksToFountain(currentBlocks()), "text/plain");
  }, [currentBlocks]);

  const pickRevision = useCallback((id: string) => {
    const view = viewRef.current;
    if (!view) return;
    setRevEnabled(true);
    setRevId(id);
    setRevisionMeta(view, { enabled: true, revId: id });
    view.focus();
  }, []);

  const disableRevision = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    setRevEnabled(false);
    setRevisionMeta(view, { enabled: false });
    view.focus();
  }, []);

  const clearAllRevisions = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    clearRevisions(view.state, view.dispatch);
    view.focus();
  }, []);

  const saveTitle = useCallback((tp: TitlePage) => {
    setTitlePage(tp);
    saveTitlePage(tp);
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
      <Toolbar
        current={current}
        onPick={applyElement}
        actions={
          <>
            <Menu
              label="Archivo"
              items={[
                { label: "Importar FDX…", onClick: importFdx },
                { label: "Importar Fountain…", onClick: importFountain },
                { label: "Exportar FDX", onClick: exportFdx },
                { label: "Exportar Fountain", onClick: exportFountain },
              ]}
            />
            <Menu
              label={
                <span className="rev-label">
                  <span
                    className="rev-dot"
                    style={{
                      background: revEnabled
                        ? REVISIONS.find((r) => r.id === revId)?.hex
                        : "transparent",
                    }}
                  />
                  Revisión
                </span>
              }
              items={[
                ...(revEnabled
                  ? [{ label: "✓ Desactivar revisión", onClick: disableRevision }]
                  : []),
                ...REVISIONS.map((r) => ({
                  label: `${revEnabled && r.id === revId ? "● " : "○ "}${r.label}`,
                  onClick: () => pickRevision(r.id),
                })),
                { label: "Limpiar marcas", onClick: clearAllRevisions },
              ]}
            />
            <button className="btn-ghost" onClick={() => setShowTitleModal(true)}>
              Portada
            </button>
            <button className="btn-primary" onClick={openPreview} title="Vista paginada y PDF">
              Páginas / PDF
            </button>
          </>
        }
      />

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
        <Preview
          blocks={previewBlocks}
          titlePage={titlePage}
          onClose={() => setPreviewBlocks(null)}
        />
      )}

      {showTitleModal && (
        <TitlePageModal
          initial={titlePage}
          onSave={saveTitle}
          onClose={() => setShowTitleModal(false)}
        />
      )}
    </div>
  );
}

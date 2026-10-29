import { useEffect, useRef, useState, useCallback } from "react";
import { EditorState, Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history, undo, redo, undoDepth, redoDepth } from "prosemirror-history";
import { toggleMark } from "prosemirror-commands";
import { MarkType } from "prosemirror-model";
import { schema } from "../editor/schema";
import { screenplayKeymap, baseKeymapPlugin } from "../editor/keymap";
import { screenplayInputRules } from "../editor/inputrules";
import { paginationPlugin } from "../editor/pagination";
import { revisionsPlugin, setRevisionMeta, clearRevisions, applyRevision } from "../editor/revisions";
import { cargarDocumento, guardarDocumento, docFromBlocks } from "../editor/document";
import { setElement } from "../editor/commands";
import { downloadText, pickTextFile } from "../lib/files";
import { blocksToFdx, fdxToBlocks } from "../lib/fdx";
import { blocksToFountain, fountainToBlocks } from "../lib/fountain";
import { REVISIONS } from "../lib/revisions";
import { TitlePage, loadTitlePage, saveTitlePage } from "../lib/titlepage";
import { TitlePageModal } from "./TitlePageModal";
import { getScenes, Scene } from "../lib/scenes";
import { jumpToScene, setSceneSummary, reorderScenes } from "../editor/sceneOps";
import { SceneNavigator } from "./SceneNavigator";
import { BeatBoard } from "./BeatBoard";
import { getCharacters, CharacterStat } from "../lib/characters";
import { CharacterBoard } from "./CharacterBoard";
import { CharacterBio } from "./CharacterBio";
import { RelationMap } from "./RelationMap";
import { loadVersions, saveVersion, deleteVersion, Version } from "../lib/versions";
import { VersionsPanel } from "./VersionsPanel";
import { countMatches, replaceAll, findNext, FindOptions } from "../editor/findReplace";
import { FindReplace } from "./FindReplace";
import { getSceneBreakdown, SceneBreakdown } from "../lib/breakdown";
import { getLocations, LocationStat } from "../lib/locations";
import { loadBreakdown, setBreakdownField, BreakdownData, Category } from "../lib/breakdownStore";
import { Breakdown } from "./Breakdown";
import { buildGraph, Graph } from "../lib/graph";
import { NeuralMap } from "./NeuralMap";
import { AnalysisPanel } from "./AnalysisPanel";
import { ConceptBoard } from "./ConceptBoard";
import { Direction } from "./Direction";
import {
  ElementType,
  ELEMENT_LABELS,
  ELEMENT_HINTS,
  TAB_CYCLE,
  isElementType,
} from "../editor/elements";
import { Ribbon, MarkName, ActiveMarks } from "./Ribbon";
import { StatusBar } from "./StatusBar";
import { Preview } from "./Preview";
import { docToBlocks, Block } from "../lib/serialize";

type SaveState = "guardado" | "guardando";

function markActive(state: EditorState, type: MarkType): boolean {
  const { from, $from, to, empty } = state.selection;
  if (empty) return !!type.isInSet(state.storedMarks || $from.marks());
  return state.doc.rangeHasMark(from, to, type);
}

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
  const [activeMarks, setActiveMarks] = useState<ActiveMarks>({
    strong: false,
    em: false,
    underline: false,
    strikethrough: false,
  });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [showNav, setShowNav] = useState(false);
  const [showBeat, setShowBeat] = useState(false);
  const [showChars, setShowChars] = useState(false);
  const [chars, setChars] = useState<CharacterStat[]>([]);
  const [bioName, setBioName] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [night, setNight] = useState(() => localStorage.getItem("claqueta:tema") === "noche");
  const [spell, setSpell] = useState(() => localStorage.getItem("claqueta:ortografia") !== "off");
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showFind, setShowFind] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [bdScenes, setBdScenes] = useState<SceneBreakdown[]>([]);
  const [bdLocs, setBdLocs] = useState<LocationStat[]>([]);
  const [bdData, setBdData] = useState<BreakdownData>({});
  const [neuralGraph, setNeuralGraph] = useState<Graph | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showConcept, setShowConcept] = useState(false);
  const [dirScenes, setDirScenes] = useState<SceneBreakdown[] | null>(null);

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
        setActiveMarks({
          strong: markActive(next, schema.marks.strong),
          em: markActive(next, schema.marks.em),
          underline: markActive(next, schema.marks.underline),
          strikethrough: markActive(next, schema.marks.strikethrough),
        });
        setCanUndo(undoDepth(next) > 0);
        setCanRedo(redoDepth(next) > 0);

        if (tr.docChanged) {
          setScenes(getScenes(next.doc));
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
    view.dom.setAttribute("spellcheck", String(spell));
    setScenes(getScenes(view.state.doc));
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
    // Marca de inmediato lo que esté seleccionado (o el bloque del cursor).
    applyRevision(id)(view.state, view.dispatch);
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

  const toggleMarkByName = useCallback(
    (name: MarkName) => run(toggleMark(schema.marks[name])),
    [run],
  );

  const doCopy = useCallback(() => {
    viewRef.current?.focus();
    document.execCommand("copy");
  }, []);
  const doCut = useCallback(() => {
    viewRef.current?.focus();
    document.execCommand("cut");
  }, []);
  const doPaste = useCallback(async () => {
    const view = viewRef.current;
    if (!view) return;
    view.focus();
    try {
      const text = await navigator.clipboard.readText();
      if (text) view.dispatch(view.state.tr.insertText(text));
    } catch {
      /* el navegador puede bloquear la lectura del portapapeles */
    }
  }, []);

  const goToScene = useCallback((pos: number) => {
    const view = viewRef.current;
    if (view) jumpToScene(view, pos);
  }, []);

  const editSceneSummary = useCallback((pos: number, text: string) => {
    const view = viewRef.current;
    if (view) setSceneSummary(view, pos, text);
  }, []);

  const moveScene = useCallback((from: number, to: number) => {
    const view = viewRef.current;
    if (view) reorderScenes(view, from, to);
  }, []);

  const openCharacters = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    setChars(getCharacters(view.state.doc));
    setShowChars(true);
  }, []);

  const doUndo = useCallback(() => run(undo), [run]);
  const doRedo = useCallback(() => run(redo), [run]);

  const toggleNight = useCallback(() => {
    setNight((v) => {
      const next = !v;
      localStorage.setItem("claqueta:tema", next ? "noche" : "dia");
      return next;
    });
  }, []);

  const toggleSpell = useCallback(() => {
    setSpell((v) => {
      const next = !v;
      localStorage.setItem("claqueta:ortografia", next ? "on" : "off");
      viewRef.current?.dom.setAttribute("spellcheck", String(next));
      return next;
    });
  }, []);

  // --- Versiones ---
  const openVersions = useCallback(() => {
    setVersions(loadVersions());
    setShowVersions(true);
  }, []);
  const saveVer = useCallback(
    (name: string) => {
      saveVersion(name, currentBlocks());
      setVersions(loadVersions());
    },
    [currentBlocks],
  );
  const restoreVer = useCallback(
    (v: Version) => {
      if (window.confirm(`¿Restaurar «${v.name}»? Se reemplazará el guion actual.`)) {
        replaceWithBlocks(v.blocks);
        setShowVersions(false);
      }
    },
    [replaceWithBlocks],
  );
  const deleteVer = useCallback((id: string) => {
    deleteVersion(id);
    setVersions(loadVersions());
  }, []);

  // --- Buscar y reemplazar ---
  const doFindNext = useCallback((q: string, opts: FindOptions) => {
    const view = viewRef.current;
    return view ? findNext(view, q, opts) : false;
  }, []);
  const doReplaceAll = useCallback((q: string, r: string, opts: FindOptions) => {
    const view = viewRef.current;
    return view ? replaceAll(view, q, r, opts) : 0;
  }, []);
  const doCount = useCallback((q: string, opts: FindOptions) => {
    const view = viewRef.current;
    return view ? countMatches(view.state, q, opts) : 0;
  }, []);

  // --- Desglose ---
  const openBreakdown = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    setBdScenes(getSceneBreakdown(view.state.doc));
    setChars(getCharacters(view.state.doc));
    setBdLocs(getLocations(getScenes(view.state.doc).map((s) => s.heading)));
    setBdData(loadBreakdown());
    setShowBreakdown(true);
  }, []);
  const setBreakdown = useCallback((key: string, cat: Category, value: string) => {
    setBdData((prev) => setBreakdownField(prev, key, cat, value));
  }, []);
  const exportCsv = useCallback((filename: string, csv: string) => {
    downloadText(filename, "﻿" + csv, "text/csv");
  }, []);

  const openNeural = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    setNeuralGraph(buildGraph(view.state.doc, loadBreakdown()));
  }, []);

  const openDirection = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    setDirScenes(getSceneBreakdown(view.state.doc));
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
    <div className={"workspace" + (night ? " night" : "")}>
      <Ribbon
        current={current}
        onPickElement={applyElement}
        activeMarks={activeMarks}
        onToggleMark={toggleMarkByName}
        onCut={doCut}
        onCopy={doCopy}
        onPaste={doPaste}
        onPortada={() => setShowTitleModal(true)}
        onPreview={openPreview}
        onImportFdx={importFdx}
        onImportFountain={importFountain}
        onExportFdx={exportFdx}
        onExportFountain={exportFountain}
        revEnabled={revEnabled}
        revId={revId}
        onPickRevision={pickRevision}
        onDisableRevision={disableRevision}
        onClearRevisions={clearAllRevisions}
        navOpen={showNav}
        onToggleNav={() => setShowNav((v) => !v)}
        onBeatBoard={() => setShowBeat(true)}
        onCharacters={openCharacters}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={doUndo}
        onRedo={doRedo}
        night={night}
        onToggleNight={toggleNight}
        spell={spell}
        onToggleSpell={toggleSpell}
        onFindReplace={() => setShowFind(true)}
        onVersions={openVersions}
        onBreakdown={openBreakdown}
        onNeural={openNeural}
        onAnalysis={() => setShowAnalysis(true)}
        onConceptBoard={() => setShowConcept(true)}
        onDirection={openDirection}
      />

      <div className="editor-area">
        {showNav && (
          <SceneNavigator scenes={scenes} onJump={goToScene} onClose={() => setShowNav(false)} />
        )}
        <div className="page-scroll">
          <div className="page">
            <div className="pm-mount" ref={mountRef} />
          </div>
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

      {showBeat && (
        <BeatBoard
          scenes={scenes}
          onReorder={moveScene}
          onEditSummary={editSceneSummary}
          onJump={goToScene}
          onClose={() => setShowBeat(false)}
        />
      )}

      {showChars && (
        <CharacterBoard
          characters={chars}
          onOpenBio={(name) => setBioName(name)}
          onOpenMap={() => setShowMap(true)}
          onJump={goToScene}
          onClose={() => setShowChars(false)}
        />
      )}

      {bioName && (
        <CharacterBio
          name={bioName}
          allNames={chars.map((c) => c.name)}
          onClose={() => setBioName(null)}
        />
      )}

      {showMap && (
        <RelationMap
          names={chars.map((c) => c.name)}
          onOpenBio={(name) => setBioName(name)}
          onClose={() => setShowMap(false)}
        />
      )}

      {showFind && (
        <FindReplace
          onFindNext={doFindNext}
          onReplaceAll={doReplaceAll}
          onCount={doCount}
          onClose={() => setShowFind(false)}
        />
      )}

      {showVersions && (
        <VersionsPanel
          versions={versions}
          current={currentBlocks()}
          onSave={saveVer}
          onRestore={restoreVer}
          onDelete={deleteVer}
          onClose={() => setShowVersions(false)}
        />
      )}

      {showBreakdown && (
        <Breakdown
          scenes={bdScenes}
          characters={chars}
          locations={bdLocs}
          data={bdData}
          onSetField={setBreakdown}
          onJump={goToScene}
          onExport={exportCsv}
          onClose={() => setShowBreakdown(false)}
        />
      )}

      {neuralGraph && (
        <NeuralMap graph={neuralGraph} onJump={goToScene} onClose={() => setNeuralGraph(null)} />
      )}

      {showAnalysis && (
        <AnalysisPanel getBlocks={currentBlocks} onClose={() => setShowAnalysis(false)} />
      )}

      {showConcept && <ConceptBoard onClose={() => setShowConcept(false)} />}

      {dirScenes && (
        <Direction scenes={dirScenes} onJump={goToScene} onClose={() => setDirScenes(null)} />
      )}
    </div>
  );
}

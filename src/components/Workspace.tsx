import { useEffect, useRef, useState, useCallback } from "react";
import { EditorState, Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history, undo, redo, undoDepth, redoDepth } from "prosemirror-history";
import { toggleMark } from "prosemirror-commands";
import { MarkType } from "prosemirror-model";
import { schema } from "../editor/schema";
import { screenplayKeymap, baseKeymapPlugin } from "../editor/keymap";
import { screenplayInputRules } from "../editor/inputrules";
import { highlightSelection, clearHighlightSelection } from "../editor/revisions";
import { contdPlugin } from "../editor/contd";
import { autocompletePlugin, autocompleteKeymap } from "../editor/autocomplete";
import { notesPlugin, addNote, updateNote, removeNote, noteCoords, getNotes, noteColor, NOTE_CATEGORIES } from "../editor/notes";
import { NoteEditor } from "./NoteEditor";
import { NotesMargin, MarginNote } from "./NotesMargin";
import {
  listProjects,
  getActiveId,
  setActiveProject,
  createProject,
  renameProject,
  deleteProject,
  touchProject,
  ProjectMeta,
} from "../lib/projects";
import { ProjectModal } from "./ProjectModal";
import { cargarDocumento, guardarDocumento, docFromBlocks } from "../editor/document";
import { setElement, appendCharacterExtension } from "../editor/commands";
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
import { mergeCharacters, addManualCharacter } from "../lib/manualCharacters";
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
import { DevelopmentModal } from "./DevelopmentModal";
import { BeatTimeline } from "./BeatTimeline";
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
  const [showDev, setShowDev] = useState(false);
  const [showBeatTl, setShowBeatTl] = useState(false);
  const [openNote, setOpenNote] = useState<{ id: string; left: number; top: number; text: string; category?: string } | null>(null);
  const [marginNotes, setMarginNotes] = useState<MarginNote[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recomputeRef = useRef<() => void>(() => {});
  const [projects, setProjects] = useState<ProjectMeta[]>(() => listProjects());
  const [activeProj, setActiveProj] = useState<string>(() => getActiveId());
  const [projectVersion, setProjectVersion] = useState(0);
  const [projModal, setProjModal] = useState<{ mode: "new" | "rename"; name: string } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const state = EditorState.create({
      doc: cargarDocumento(),
      plugins: [
        history(),
        screenplayInputRules,
        autocompleteKeymap, // antes del keymap de guion: intercepta Enter/Tab si hay sugerencias
        screenplayKeymap,
        baseKeymapPlugin,
        contdPlugin(),
        autocompletePlugin(),
        notesPlugin(),
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

        // Reposicionar las notas del margen tras cada cambio.
        requestAnimationFrame(() => recomputeRef.current());

        if (tr.docChanged) {
          setScenes(getScenes(next.doc));
          setSave("guardando");
          if (saveTimer.current) window.clearTimeout(saveTimer.current);
          saveTimer.current = window.setTimeout(() => {
            guardarDocumento(next.doc);
            touchProject(getActiveId());
            setSave("guardado");
          }, 500);
        }
      },
    });

    viewRef.current = view;
    view.dom.setAttribute("spellcheck", String(spell));
    setScenes(getScenes(view.state.doc));
    view.focus();
    requestAnimationFrame(() => recomputeRef.current());

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      view.destroy();
      viewRef.current = null;
    };
    // Recrea el editor al cambiar de documento (proyecto).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectVersion]);

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

  const addDialogueExt = useCallback((ext: string) => run(appendCharacterExtension(ext)), [run]);

  // Recalcula la posición de cada nota en el margen oscuro, alineada con su línea.
  const recomputeNotes = useCallback(() => {
    const view = viewRef.current;
    const pageEl = mountRef.current?.parentElement; // .page (hoja blanca)
    if (!view || !pageEl) {
      setMarginNotes([]);
      return;
    }
    const pageRect = pageEl.getBoundingClientRect();
    const CARD = 150;
    const GAP = 14;
    // ¿Hay sitio a la izquierda? Si no, usar la derecha.
    const leftRoom = pageRect.left >= CARD + GAP + 6;
    const side: "left" | "right" = leftRoom ? "left" : "right";
    const left = leftRoom
      ? pageRect.left - CARD - GAP
      : Math.min(window.innerWidth - CARD - 6, pageRect.right + GAP);

    const out: MarginNote[] = [];
    for (const n of getNotes(view.state)) {
      const pos = Math.min(Math.max(1, n.pos), view.state.doc.content.size);
      let top: number;
      try {
        top = view.coordsAtPos(pos).top;
      } catch {
        continue;
      }
      // Sólo las que caen dentro del área visible del editor.
      if (top < 120 || top > window.innerHeight - 60) continue;
      const catLabel = NOTE_CATEGORIES.find((c) => c.id === n.category)?.label ?? "Nota";
      out.push({ id: n.id, text: n.text, top, left, side, color: noteColor(n.category), categoryLabel: catLabel });
    }
    setMarginNotes(out);
  }, []);

  // Mantener el ref al recálculo y escuchar scroll/resize.
  recomputeRef.current = recomputeNotes;
  useEffect(() => {
    const onChange = () => requestAnimationFrame(() => recomputeRef.current());
    const el = scrollRef.current;
    el?.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      el?.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  const openNoteById = useCallback((id: string) => {
    const view = viewRef.current;
    if (!view) return;
    const c = noteCoords(view, id);
    const note = getNotes(view.state).find((n) => n.id === id);
    if (c && note) setOpenNote({ id, left: c.left, top: c.top, text: note.text, category: note.category });
  }, []);

  const createNote = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    const id = addNote(view);
    const c = noteCoords(view, id);
    if (c) setOpenNote({ id, left: c.left, top: c.top, text: "" });
    view.focus();
  }, []);

  const saveNote = useCallback(
    (id: string, text: string, category: string) => {
      const view = viewRef.current;
      if (view) updateNote(view, id, text, category);
      setOpenNote(null);
      requestAnimationFrame(() => recomputeRef.current());
    },
    [],
  );

  const deleteNote = useCallback((id: string) => {
    const view = viewRef.current;
    if (view) removeNote(view, id);
    setOpenNote(null);
    requestAnimationFrame(() => recomputeRef.current());
  }, []);

  // --- Documentos (proyectos) ---
  const flushSave = useCallback(() => {
    const view = viewRef.current;
    if (view) {
      guardarDocumento(view.state.doc);
      touchProject(getActiveId());
    }
  }, []);

  const switchProject = useCallback(
    (id: string) => {
      if (id === getActiveId()) return;
      flushSave();
      setActiveProject(id);
      setActiveProj(id);
      setProjects(listProjects());
      setProjectVersion((v) => v + 1);
    },
    [flushSave],
  );

  const confirmProjectModal = useCallback(
    (name: string) => {
      if (projModal?.mode === "new") {
        flushSave();
        const meta = createProject(name);
        setActiveProject(meta.id);
        setActiveProj(meta.id);
        setProjects(listProjects());
        setProjectVersion((v) => v + 1);
      } else if (projModal?.mode === "rename") {
        setProjects(renameProject(getActiveId(), name));
      }
      setProjModal(null);
    },
    [projModal, flushSave],
  );

  const removeProject = useCallback((id: string) => {
    const remaining = deleteProject(id);
    setProjects(remaining);
    if (id === getActiveId() && remaining.length) {
      setActiveProject(remaining[0].id);
      setActiveProj(remaining[0].id);
      setProjectVersion((v) => v + 1);
    } else if (remaining.length === 0) {
      // No dejar la app sin documentos.
      const meta = createProject("Mi guion");
      setActiveProject(meta.id);
      setActiveProj(meta.id);
      setProjects(listProjects());
      setProjectVersion((v) => v + 1);
    }
  }, []);

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

  // Resalta la selección (o el bloque actual) con el color elegido.
  const pickRevision = useCallback((id: string) => {
    setRevId(id);
    run(highlightSelection(id));
  }, [run]);

  const clearAllRevisions = useCallback(() => {
    run(clearHighlightSelection);
  }, [run]);

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
    setChars(mergeCharacters(getCharacters(view.state.doc)));
    setShowChars(true);
  }, []);

  const addManual = useCallback((name: string) => {
    addManualCharacter(name);
    const view = viewRef.current;
    if (view) setChars(mergeCharacters(getCharacters(view.state.doc)));
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
        revId={revId}
        onPickRevision={pickRevision}
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
        onBeatTimeline={() => setShowBeatTl(true)}
        onDevelopment={() => setShowDev(true)}
        onAddNote={createNote}
        onDialogueExt={addDialogueExt}
        projects={projects}
        activeProject={activeProj}
        onOpenProject={switchProject}
        onNewProject={() => setProjModal({ mode: "new", name: "" })}
        onRenameProject={() => {
          const p = projects.find((x) => x.id === activeProj);
          setProjModal({ mode: "rename", name: p?.name ?? "" });
        }}
        onDeleteProject={() => removeProject(activeProj)}
      />

      <div className="editor-area">
        {showNav && (
          <SceneNavigator scenes={scenes} onJump={goToScene} onClose={() => setShowNav(false)} />
        )}
        <div className="page-scroll" ref={scrollRef}>
          <div className="page">
            <div className="pm-mount" ref={mountRef} />
          </div>
        </div>
      </div>

      <NotesMargin notes={marginNotes} onOpen={openNoteById} onDelete={deleteNote} />

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
          onAddManual={addManual}
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

      {showBeatTl && <BeatTimeline onClose={() => setShowBeatTl(false)} />}

      {dirScenes && (
        <Direction scenes={dirScenes} onJump={goToScene} onClose={() => setDirScenes(null)} />
      )}

      {showDev && <DevelopmentModal onClose={() => setShowDev(false)} />}

      {projModal && (
        <ProjectModal
          mode={projModal.mode}
          initialName={projModal.name}
          onConfirm={confirmProjectModal}
          onClose={() => setProjModal(null)}
        />
      )}

      {openNote && (
        <NoteEditor
          note={openNote}
          onSave={saveNote}
          onDelete={deleteNote}
          onClose={() => setOpenNote(null)}
        />
      )}
    </div>
  );
}

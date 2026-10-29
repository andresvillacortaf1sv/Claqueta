import { useState, useMemo } from "react";
import { FindOptions } from "../editor/findReplace";
import { ElementType, ELEMENT_LABELS, TAB_CYCLE } from "../editor/elements";

interface Props {
  onFindNext: (q: string, opts: FindOptions) => boolean;
  onReplaceAll: (q: string, r: string, opts: FindOptions) => number;
  onCount: (q: string, opts: FindOptions) => number;
  onClose: () => void;
}

export function FindReplace({ onFindNext, onReplaceAll, onCount, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [element, setElement] = useState<ElementType | "all">("all");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const [msg, setMsg] = useState("");

  const opts: FindOptions = { element, caseSensitive, wholeWord, regex };
  const count = useMemo(() => (query ? onCount(query, opts) : 0), [query, element, caseSensitive, wholeWord, regex]);

  return (
    <div className="findrep">
      <div className="findrep-head">
        <span>Buscar y reemplazar</span>
        <button className="findrep-x" onClick={onClose} title="Cerrar">
          ×
        </button>
      </div>

      <input
        className="findrep-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar…"
        autoFocus
      />
      <input
        className="findrep-input"
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
        placeholder="Reemplazar por…"
      />

      <div className="findrep-row">
        <select value={element} onChange={(e) => setElement(e.target.value as ElementType | "all")}>
          <option value="all">Todos los elementos</option>
          {TAB_CYCLE.map((t) => (
            <option key={t} value={t}>
              {ELEMENT_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="findrep-opts">
        <label>
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          May/min
        </label>
        <label>
          <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} disabled={regex} />
          Palabra completa
        </label>
        <label>
          <input type="checkbox" checked={regex} onChange={(e) => setRegex(e.target.checked)} />
          Regex
        </label>
      </div>

      <div className="findrep-count">{query ? `${count} coincidencia(s)` : " "}</div>

      <div className="findrep-actions">
        <button
          className="rb-btn"
          onClick={() => {
            const ok = onFindNext(query, opts);
            setMsg(ok ? "" : "Sin coincidencias");
          }}
        >
          Buscar siguiente
        </button>
        <button
          className="rb-btn rb-btn-primary"
          onClick={() => {
            const n = onReplaceAll(query, replacement, opts);
            setMsg(`${n} reemplazo(s)`);
          }}
        >
          Reemplazar todo
        </button>
      </div>
      {msg && <div className="findrep-msg">{msg}</div>}
    </div>
  );
}

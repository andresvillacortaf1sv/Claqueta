import { useEffect, useRef, useState, ReactNode } from "react";
import {
  CharacterBio as Bio,
  Relationship,
  loadBio,
  saveBio,
  OPTIONS,
  MEDIDORES,
  RASGOS,
  SENTIMIENTOS,
  MISC_QUESTIONS,
  RELATION_TYPES,
} from "../lib/characterBio";
import { fileToResizedDataURL } from "../lib/imageResize";

interface Props {
  name: string;
  allNames: string[];
  onClose: () => void;
}

/* ---------- Campos reutilizables ---------- */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="bio-field">
      <span className="bio-label">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select className="bio-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Area({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      className="bio-area"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="bio-slider">
      <div className="bio-slider-top">
        <span>{label}</span>
        <span className="bio-slider-val">{value}</span>
      </div>
      <input type="range" min={1} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bio-section">
      <h3 className="bio-section-title">{title}</h3>
      {children}
    </section>
  );
}

export function CharacterBio({ name, allNames, onClose }: Props) {
  const [bio, setBio] = useState<Bio>(() => loadBio(name));
  const fileRef = useRef<HTMLInputElement>(null);

  // Autoguardado
  useEffect(() => {
    const id = setTimeout(() => saveBio(bio), 400);
    return () => clearTimeout(id);
  }, [bio]);

  const set = (patch: Partial<Bio>) => setBio((b) => ({ ...b, ...patch }));
  const setMed = (id: string, v: number) => setBio((b) => ({ ...b, medidores: { ...b.medidores, [id]: v } }));
  const setRas = (id: string, v: number) => setBio((b) => ({ ...b, rasgos: { ...b.rasgos, [id]: v } }));
  const setSent = (id: string, v: string) => setBio((b) => ({ ...b, sentimientos: { ...b.sentimientos, [id]: v } }));
  const setMisc = (id: string, v: string) => setBio((b) => ({ ...b, miscelanea: { ...b.miscelanea, [id]: v } }));

  const addRel = () =>
    setBio((b) => ({
      ...b,
      relaciones: [...b.relaciones, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, to: "", type: "amistad", note: "" }],
    }));
  const updateRel = (id: string, patch: Partial<Relationship>) =>
    setBio((b) => ({ ...b, relaciones: b.relaciones.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const removeRel = (id: string) => setBio((b) => ({ ...b, relaciones: b.relaciones.filter((r) => r.id !== id) }));

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set({ photo: await fileToResizedDataURL(file) });
    } catch {
      /* imagen inválida */
    }
  }

  const others = allNames.filter((n) => n.toUpperCase() !== name.toUpperCase());

  return (
    <div className="bio-overlay" role="dialog" aria-label={`Biografía de ${name}`}>
      <div className="bio-bar">
        <span className="bio-bar-name">{name}</span>
        <span className="bio-bar-sub">Biblia de personaje · se guarda automáticamente</span>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="bio-body">
        {/* Cabecera: foto + identificación */}
        <div className="bio-head">
          <div className="bio-photo" onClick={() => fileRef.current?.click()} title="Cambiar foto">
            {bio.photo ? <img src={bio.photo} alt={name} /> : <span className="bio-photo-empty">＋ Foto</span>}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          </div>
          <div className="bio-head-fields">
            <Field label="Alias">
              <input className="bio-input" value={bio.alias} onChange={(e) => set({ alias: e.target.value })} />
            </Field>
            <Field label="Logline breve">
              <input className="bio-input" value={bio.logline} onChange={(e) => set({ logline: e.target.value })} placeholder="En una frase, ¿quién es?" />
            </Field>
            <Field label="Actor que lo interpretará">
              <input className="bio-input" value={bio.actor} onChange={(e) => set({ actor: e.target.value })} />
            </Field>
          </div>
        </div>

        <Section title="Datos básicos">
          <div className="bio-grid">
            <Field label="Rol narrativo"><Select value={bio.rolNarrativo} options={OPTIONS.rolNarrativo} onChange={(v) => set({ rolNarrativo: v })} /></Field>
            <Field label="Importancia"><Select value={bio.importancia} options={OPTIONS.importancia} onChange={(v) => set({ importancia: v })} /></Field>
            <Field label="Tipo de arco"><Select value={bio.tipoArco} options={OPTIONS.tipoArco} onChange={(v) => set({ tipoArco: v })} /></Field>
            <Field label="Estado"><Select value={bio.estado} options={OPTIONS.estado} onChange={(v) => set({ estado: v })} /></Field>
            <Field label="Sexo / género"><Select value={bio.genero} options={OPTIONS.genero} onChange={(v) => set({ genero: v })} /></Field>
            <Field label="Identidad"><Select value={bio.identidad} options={OPTIONS.identidad} onChange={(v) => set({ identidad: v })} /></Field>
            <Field label="Edad"><input className="bio-input" value={bio.edad} onChange={(e) => set({ edad: e.target.value })} /></Field>
            <Field label="Fecha de nacimiento"><input className="bio-input" value={bio.nacimiento} onChange={(e) => set({ nacimiento: e.target.value })} placeholder="dd/mm/aaaa o año" /></Field>
            <Field label="Ocupación"><input className="bio-input" value={bio.ocupacion} onChange={(e) => set({ ocupacion: e.target.value })} /></Field>
          </div>
        </Section>

        <Section title="Apariencia visual">
          <Area value={bio.apariencia} onChange={(v) => set({ apariencia: v })} rows={3} placeholder="Rasgos físicos, vestuario, lenguaje corporal…" />
        </Section>

        <Section title="Biografía">
          <Field label="Etapa 1 (origen)"><Area value={bio.bioEtapa1} onChange={(v) => set({ bioEtapa1: v })} /></Field>
          <Field label="Etapa 2 (formación)"><Area value={bio.bioEtapa2} onChange={(v) => set({ bioEtapa2: v })} /></Field>
          <Field label="Etapa 3 (presente)"><Area value={bio.bioEtapa3} onChange={(v) => set({ bioEtapa3: v })} /></Field>
          <Field label="Experiencia previa"><Area value={bio.experienciaPrevia} onChange={(v) => set({ experienciaPrevia: v })} /></Field>
          <Field label="Evento desencadenante"><Area value={bio.eventoDesencadenante} onChange={(v) => set({ eventoDesencadenante: v })} /></Field>

          <div className="bio-misc">
            <span className="bio-label">Miscelánea (respóndete a ti mismo)</span>
            {MISC_QUESTIONS.map((q) => (
              <Field key={q.id} label={q.q}>
                <Area value={bio.miscelanea[q.id] ?? ""} onChange={(v) => setMisc(q.id, v)} rows={2} />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Núcleo dramático">
          <div className="bio-grid-2">
            <Field label="Deseo (lo que quiere)"><Area value={bio.deseo} onChange={(v) => set({ deseo: v })} /></Field>
            <Field label="Necesidad (lo que realmente necesita)"><Area value={bio.necesidad} onChange={(v) => set({ necesidad: v })} /></Field>
          </div>
          <Field label="Psicología"><Area value={bio.psicologia} onChange={(v) => set({ psicologia: v })} /></Field>
          <Field label="Arco durante su historia"><Area value={bio.arco} onChange={(v) => set({ arco: v })} /></Field>
          <div className="bio-grid-2">
            <Field label="Autopercepción"><Area value={bio.autopercepcion} onChange={(v) => set({ autopercepcion: v })} /></Field>
            <Field label="Percepción externa"><Area value={bio.percepcionExterna} onChange={(v) => set({ percepcionExterna: v })} /></Field>
          </div>
        </Section>

        <Section title="Brújula del personaje">
          <div className="bio-grid">
            <Field label="Función dramática"><Select value={bio.funcionDramatica} options={OPTIONS.funcionDramatica} onChange={(v) => set({ funcionDramatica: v })} /></Field>
            <Field label="Energía y tono"><Select value={bio.energiaTono} options={OPTIONS.energiaTono} onChange={(v) => set({ energiaTono: v })} /></Field>
          </div>
          <Field label="Perfil de voz"><Area value={bio.perfilVoz} onChange={(v) => set({ perfilVoz: v })} rows={2} placeholder="Ritmo, vocabulario, muletillas, registro…" /></Field>
        </Section>

        <div className="bio-cols">
          <Section title="Medidores">
            {MEDIDORES.map((x) => (
              <Slider key={x.id} label={x.label} value={bio.medidores[x.id] ?? 50} onChange={(v) => setMed(x.id, v)} />
            ))}
          </Section>
          <Section title="Rasgos de personalidad">
            {RASGOS.map((x) => (
              <Slider key={x.id} label={x.label} value={bio.rasgos[x.id] ?? 50} onChange={(v) => setRas(x.id, v)} />
            ))}
          </Section>
        </div>

        <Section title="Cómo actúa ante…">
          <div className="bio-grid-2">
            {SENTIMIENTOS.map((s) => (
              <Field key={s.id} label={s.label}>
                <Area value={bio.sentimientos[s.id] ?? ""} onChange={(v) => setSent(s.id, v)} rows={2} />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Relaciones">
          <div className="bio-rels">
            {bio.relaciones.map((r) => (
              <div className="bio-rel" key={r.id} style={{ borderLeftColor: RELATION_TYPES.find((t) => t.id === r.type)?.color }}>
                <div className="bio-rel-row">
                  <select className="bio-select" value={r.to} onChange={(e) => updateRel(r.id, { to: e.target.value })}>
                    <option value="">¿Con quién?</option>
                    {others.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <select className="bio-select" value={r.type} onChange={(e) => updateRel(r.id, { type: e.target.value })}>
                    {RELATION_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button className="bio-rel-x" onClick={() => removeRel(r.id)} title="Quitar">
                    ×
                  </button>
                </div>
                <Area value={r.note} onChange={(v) => updateRel(r.id, { note: v })} rows={2} placeholder="Describe la relación…" />
              </div>
            ))}
            <button className="rb-btn" onClick={addRel}>
              + Añadir relación
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

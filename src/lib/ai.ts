/**
 * Cliente de IA "trae tu propia clave" (local-first). Soporta Anthropic y
 * cualquier endpoint compatible con OpenAI (OpenRouter, Ollama local, OpenAI,
 * o uno personalizado). La clave se guarda sólo en el dispositivo.
 *
 * Nota: por CORS, desde el navegador funcionan de forma fiable Anthropic (con su
 * cabecera de acceso directo), OpenRouter y Ollama local. OpenAI directo puede
 * bloquear llamadas del navegador.
 */
import { Block } from "./serialize";
import { Analysis, heuristicAnalysis, intensityColor } from "./analysis";

export type Provider = "anthropic" | "openrouter" | "openai" | "ollama" | "custom";

export interface AIConfig {
  provider: Provider;
  baseURL: string;
  apiKey: string;
  model: string;
  workspaceId?: string; // sólo Anthropic: para claves con ámbito de organización
  knowledge?: string; // base de conocimiento / criterios del usuario para el análisis
}

const KEY = "claqueta:ia";

export const PROVIDER_DEFAULTS: Record<Provider, { baseURL: string; model: string; label: string }> = {
  anthropic: { baseURL: "https://api.anthropic.com", model: "claude-3-5-sonnet-latest", label: "Anthropic" },
  openrouter: { baseURL: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini", label: "OpenRouter" },
  openai: { baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini", label: "OpenAI" },
  ollama: { baseURL: "http://localhost:11434/v1", model: "llama3.1", label: "Ollama (local)" },
  custom: { baseURL: "", model: "", label: "Personalizado (OpenAI-compatible)" },
};

export function loadAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAIConfig(cfg: AIConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* no disponible */
  }
}

function scenesText(blocks: Block[]): string {
  const LABEL: Record<string, string> = {
    scene_heading: "ESC",
    action: "ACC",
    character: "PER",
    parenthetical: "PAR",
    dialogue: "DIA",
    transition: "TRA",
    shot: "PLA",
  };
  let idx = -1;
  const lines: string[] = [];
  for (const b of blocks) {
    if (!b.text.trim()) continue;
    if (b.type === "scene_heading") {
      idx++;
      lines.push(`\n[ESCENA ${idx}] ${b.text.trim()}`);
    } else {
      lines.push(`${LABEL[b.type] ?? "ACC"}: ${b.text.trim()}`);
    }
  }
  if (idx < 0) lines.unshift("[ESCENA 0] (sin encabezados)");
  return lines.join("\n");
}

const SYSTEM_BASE = `Eres un analista de guion cinematográfico con formación en teoría narrativa. Analizas aplicando los marcos clásicos de estructura y personaje:
- Estructura en tres actos y el paradigma de Syd Field (planteamiento, confrontación, resolución; detonante ~10-15%, puntos de giro, punto medio, clímax).
- Los beats de la estructura (estilo "Save the Cat" de Blake Snyder): detonante, debate, ruptura hacia el segundo acto, punto medio, "todo está perdido", noche oscura del alma, clímax y cierre.
- Viaje del héroe (Campbell/Vogler) cuando aplique.
- Principios de Robert McKee (Story= valor en cambio por escena, conflicto, giro de valores, brecha entre expectativa y resultado).
- Arco de personaje: deseo vs. necesidad, mentira que el personaje cree, herida, transformación.
- Tema, premisa y tono.

Evalúa ritmo, causalidad, tensión, claridad de objetivos y coherencia del arco. Sé concreto y útil para un guionista.

Responde ÚNICAMENTE con un JSON válido (sin texto alrededor, sin markdown) con esta forma exacta:
{
  "resumen": "string, 4-6 frases: premisa, arco dramático, fortalezas y el principal problema estructural a resolver",
  "escenas": [ { "indice": 0, "emocion": "string corta", "color": "#rrggbb", "intensidad": 0-100, "atencion": 0-100, "tension": 0-100 } ],
  "estructura": [ { "etapa": "Setup|Detonante|Desarrollo|Giro|Clímax|Desenlace", "desde": 0, "hasta": 0 } ]
}
Incluye una entrada en "escenas" por cada [ESCENA n] del guion, con su mismo índice. El color debe representar la emoción dominante.`;

/** Construye el prompt de sistema, añadiendo el marco/criterios del usuario si los hay. */
function buildSystem(knowledge?: string): string {
  const extra = (knowledge ?? "").trim();
  if (!extra) return SYSTEM_BASE;
  return (
    SYSTEM_BASE +
    `\n\n--- MARCO Y CRITERIOS DEL USUARIO (tienen prioridad; úsalos como base del análisis) ---\n` +
    extra
  );
}

export function extractJson(text: string): any {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("La IA no devolvió JSON.");
  return JSON.parse(t.slice(start, end + 1));
}

async function callAnthropic(cfg: AIConfig, user: string, system: string): Promise<string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": cfg.apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };
  if (cfg.workspaceId?.trim()) headers["anthropic-workspace-id"] = cfg.workspaceId.trim();
  const res = await fetch(`${cfg.baseURL.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function callOpenAICompatible(cfg: AIConfig, user: string, system: string): Promise<string> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cfg.apiKey) headers["authorization"] = `Bearer ${cfg.apiKey}`;
  const res = await fetch(`${cfg.baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`${cfg.provider} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function analyzeWithAI(blocks: Block[], cfg: AIConfig): Promise<Analysis> {
  const base = heuristicAnalysis(blocks);
  const user = `Analiza este guion:\n${scenesText(blocks)}`;
  const system = buildSystem(cfg.knowledge);
  const raw = cfg.provider === "anthropic" ? await callAnthropic(cfg, user, system) : await callOpenAICompatible(cfg, user, system);
  const json = extractJson(raw);

  const byIndex = new Map<number, any>();
  (json.escenas ?? []).forEach((e: any) => byIndex.set(Number(e.indice), e));

  const scenes = base.scenes.map((s) => {
    const e = byIndex.get(s.index);
    if (!e) return s;
    const clamp = (v: any, d: number) => (Number.isFinite(+v) ? Math.max(0, Math.min(100, Math.round(+v))) : d);
    const intensity = clamp(e.intensidad, s.intensity);
    return {
      ...s,
      intensity,
      attention: clamp(e.atencion, s.attention),
      tension: clamp(e.tension, s.tension),
      emotion: typeof e.emocion === "string" ? e.emocion : s.emotion,
      color: /^#[0-9a-f]{6}$/i.test(e.color) ? e.color : intensityColor(intensity),
    };
  });

  let structure = base.structure;
  if (Array.isArray(json.estructura) && json.estructura.length) {
    structure = json.estructura.map((p: any, i: number) => ({
      etapa: String(p.etapa ?? `Parte ${i + 1}`),
      from: Math.max(0, Math.round(+p.desde) || 0),
      to: Math.max(0, Math.round(+p.hasta) || 0),
      color: base.structure[i]?.color ?? "#4a3b2a",
    }));
  }

  return {
    scenes,
    structure,
    summary: typeof json.resumen === "string" ? json.resumen : "",
    aiGenerated: true,
  };
}

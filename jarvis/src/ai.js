// @ts-check
// IA dentro del iPhone con WebLLM (WebGPU). Sin claves ni servidores: el modelo
// se descarga una vez y queda guardado en el teléfono. La IA solo interpreta la
// frase y conversa; las fechas, conflictos y cambios los hace el código.

import { INSTRUCTIONS, PERSONA } from './persona.js';

const WEBLLM_URL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm';
const LOADING_FLAG = 'jarvis.ai.loading';

/** Modelos verificados en el catálogo de @mlc-ai/web-llm 0.2.85. */
export const MODELS = {
  normal: { label: 'Normal (mejor español, ≈ 1 GB)', f16: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC' },
  ligero: { label: 'Ligero (más rápido, ≈ 400 MB)', f16: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC' },
};

/** @typedef {keyof typeof MODELS} ModelSize */
/** @typedef {{ tipo: 'orden' | 'charla', orden: string, respuesta: string }} AiReply */

const SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: ['orden', 'charla'] },
    orden: { type: 'string' },
    respuesta: { type: 'string' },
  },
  required: ['tipo', 'orden', 'respuesta'],
});

/** @type {any} */
let engine = null;
/** @type {string} */
let loadedId = '';

/** @returns {Promise<{ ok: boolean, f16: boolean }>} */
export async function webgpuSupport() {
  const gpu = /** @type {any} */ (navigator).gpu;
  if (!gpu) return { ok: false, f16: false };
  try {
    const adapter = await gpu.requestAdapter();
    return adapter ? { ok: true, f16: adapter.features.has('shader-f16') } : { ok: false, f16: false };
  } catch {
    return { ok: false, f16: false };
  }
}

/**
 * Si la última carga dejó la marca puesta, la app se cerró a mitad (normalmente
 * por falta de memoria). Devuelve el tamaño que falló y limpia la marca.
 * @returns {ModelSize | null}
 */
export function takeCrashedLoad() {
  try {
    const v = localStorage.getItem(LOADING_FLAG);
    localStorage.removeItem(LOADING_FLAG);
    return v === 'normal' || v === 'ligero' ? v : null;
  } catch {
    return null;
  }
}

export function isReady() {
  return engine !== null;
}

/**
 * @param {ModelSize} size
 * @param {(progress: number, text: string) => void} onProgress
 */
export async function loadModel(size, onProgress) {
  const support = await webgpuSupport();
  if (!support.ok) throw new Error('Este iPhone no tiene WebGPU activo.');
  const id = MODELS[size][support.f16 ? 'f16' : 'f32'];
  if (engine && loadedId === id) return;
  try { localStorage.setItem(LOADING_FLAG, size); } catch { /* sin almacenamiento: se carga igual */ }
  try {
    const webllm = await import(WEBLLM_URL);
    if (engine) await engine.unload();
    engine = await webllm.CreateMLCEngine(id, {
      initProgressCallback: (/** @type {{ progress: number, text: string }} */ r) => onProgress(r.progress, r.text),
    });
    loadedId = id;
  } finally {
    try { localStorage.removeItem(LOADING_FLAG); } catch { /* nada que limpiar */ }
  }
}

export async function unloadModel() {
  if (engine) await engine.unload();
  engine = null;
  loadedId = '';
}

/** Borra del teléfono los ficheros descargados de ambos tamaños. */
export async function deleteDownloadedModels() {
  await unloadModel();
  const webllm = await import(WEBLLM_URL);
  for (const m of Object.values(MODELS)) {
    for (const id of [m.f16, m.f32]) await webllm.deleteModelAllInfoInCache(id);
  }
}

const AI_TELLS = /\b(soy una ia|inteligencia artificial|modelo de lenguaje|como asistente|como ia)\b/i;

/**
 * @param {unknown} raw
 * @returns {AiReply | null}
 */
export function validateReply(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (o.tipo !== 'orden' && o.tipo !== 'charla') return null;
  const orden = typeof o.orden === 'string' ? o.orden.trim().slice(0, 200) : '';
  let respuesta = typeof o.respuesta === 'string' ? o.respuesta.trim().slice(0, 400) : '';
  respuesta = respuesta.replace(/^¡?(claro|por supuesto)[!,.]?\s*/i, '');
  if (AI_TELLS.test(respuesta)) respuesta = '';
  if (o.tipo === 'orden' && !orden) return null;
  if (o.tipo === 'charla' && !respuesta) return null;
  return { tipo: o.tipo, orden, respuesta };
}

/**
 * @param {string} text frase del usuario
 * @param {{ name: string, context: string, history: { role: 'user' | 'assistant', text: string }[] }} opts
 * @returns {Promise<AiReply | null>}
 */
export async function interpret(text, opts) {
  if (!engine) return null;
  const system = `${PERSONA.replaceAll('{NOMBRE}', opts.name)}\n\n${INSTRUCTIONS}\n\n${opts.context}`;
  const history = opts.history.slice(-4).map((m) => ({ role: m.role, content: m.text }));
  const res = await engine.chat.completions.create({
    messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: text }],
    temperature: 0.3,
    max_tokens: 200,
    response_format: { type: 'json_object', schema: SCHEMA },
  });
  const content = res?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return null;
  try {
    return validateReply(JSON.parse(content));
  } catch {
    return null;
  }
}

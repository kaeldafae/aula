// @ts-check
// Voz: lectura con las voces del propio iPhone y dictado con el reconocimiento
// del navegador cuando existe. Sin servicios externos ni claves.

/** @returns {SpeechSynthesisVoice[]} */
export function spanishVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('es'));
}

/**
 * Voz elegida o, si no hay, la mejor es-ES instalada (las "mejoradas" primero).
 * @param {string} uri
 */
export function pickVoice(uri) {
  const voices = spanishVoices();
  const chosen = voices.find((v) => v.voiceURI === uri);
  if (chosen) return chosen;
  /** @param {SpeechSynthesisVoice} v */
  const score = (v) => {
    let s = 0;
    if (/es[-_]es/i.test(v.lang)) s += 10;
    if (/mejorada|enhanced|premium|siri/i.test(`${v.name} ${v.voiceURI}`)) s += 5;
    if (v.localService) s += 1;
    return s;
  };
  return voices.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** @param {() => void} cb */
export function onVoicesChanged(cb) {
  if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', cb);
}

let unlocked = false;

/** iOS no deja hablar sin un toque previo: se llama dentro de un gesto. */
export function unlockAudio() {
  if (unlocked || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
  unlocked = true;
}

export function audioUnlocked() {
  return unlocked;
}

/**
 * @param {string} text
 * @param {string} voiceURI
 * @param {{ onStart?: () => void, onEnd?: () => void }} [cb]
 */
export function speak(text, voiceURI, cb = {}) {
  if (!('speechSynthesis' in window) || !text.trim()) {
    cb.onEnd?.();
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[«»·•*_#]/g, '').replace(/\n+/g, '. '));
  const voice = pickVoice(voiceURI);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'es-ES';
  u.rate = 1.03;
  u.onstart = () => cb.onStart?.();
  u.onend = () => cb.onEnd?.();
  u.onerror = () => cb.onEnd?.();
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/**
 * Reconocimiento de voz del navegador. En la app instalada de iOS puede no estar
 * disponible o fallar; en ese caso se devuelve null o se llama a onError y la app
 * propone el dictado del teclado.
 * @param {{ onFinal: (text: string) => void, onPartial: (text: string) => void, onError: (code: string) => void, onEnd: () => void }} cb
 */
export function createRecognizer(cb) {
  const w = /** @type {any} */ (window);
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'es-ES';
  rec.interimResults = true;
  rec.continuous = true;
  let finalText = '';
  let active = false;
  rec.onresult = (/** @type {any} */ e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    cb.onPartial((finalText + interim).trim());
  };
  rec.onerror = (/** @type {any} */ e) => cb.onError(String(e.error ?? 'error'));
  rec.onend = () => {
    const text = finalText.trim();
    finalText = '';
    active = false;
    cb.onEnd();
    if (text) cb.onFinal(text);
  };
  return {
    start() {
      if (active) return;
      finalText = '';
      active = true;
      try { rec.start(); } catch { active = false; cb.onError('start'); }
    },
    stop() {
      if (active) rec.stop();
    },
  };
}

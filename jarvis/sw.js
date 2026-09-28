// Service worker de Jarvis.
// Cambia VERSION en cada publicación: así el iPhone detecta la versión nueva y
// la app muestra el aviso «Nueva versión disponible» en vez de servir la antigua.
const VERSION = 'jarvis-v1.0.0';
const CDN_CACHE = 'jarvis-cdn';
const CDN_PREFIX = 'https://cdn.jsdelivr.net/npm/';

const SHELL = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'src/agenda.js',
  'src/ai.js',
  'src/app.js',
  'src/assistant.js',
  'src/ics.js',
  'src/nlu.js',
  'src/persona.js',
  'src/store.js',
  'src/time.js',
  'src/voice.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('jarvis-') && k !== VERSION && k !== CDN_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).catch(() => {
        if (req.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      })),
    );
    return;
  }

  // La librería de IA (versión fijada) se guarda para poder usarla sin conexión.
  // Los modelos los guarda la propia librería en su caché.
  if (req.url.startsWith(CDN_PREFIX)) {
    event.respondWith(
      caches.open(CDN_CACHE).then((cache) => cache.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }))),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => 'focus' in c);
      return open ? open.focus() : self.clients.openWindow('./');
    }),
  );
});

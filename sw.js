// =====================================================
// sw.js — El "service worker": un ayudante que vive en el teléfono
// y guarda una copia de todos los archivos de la app. Así la app
// abre aunque estés en el gym sin señal.
//
// Cómo se actualiza: cada vez que abres la app con internet, el
// ayudante descarga en segundo plano la versión nueva de cada archivo.
// La ves la SIGUIENTE vez que abras la app.
//
// Si agregas un archivo nuevo a la app, súmalo a la lista ARCHIVOS
// y cambia VERSION (v1 → v2) para que se borre la copia vieja.
// =====================================================

const VERSION = 'mi-gym-v1';

const ARCHIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/estilos.css',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/apple-touch-icon.png',
  'js/rutina.js',
  'js/datos.js',
  'js/progresion.js',
  'js/grafico.js',
  'js/musculos.js',
  'js/dibujos.js',
  'js/temporizador.js',
  'js/app.js',
  'js/historial.js',
  'js/peso.js',
  'js/comida.js',
  'js/calorias.js',
  'js/resumen.js',
  'js/copia.js',
  'js/arranque.js',
];

// 1) Al instalarse: guarda todos los archivos.
self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(ARCHIVOS)));
  self.skipWaiting(); // que empiece a trabajar sin esperar
});

// 2) Al activarse: borra las copias de versiones viejas.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// 3) Cada vez que la app pide un archivo: entrega la copia guardada
//    al instante y, de paso, busca la versión nueva en internet.
self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET' || !pedido.url.startsWith(self.location.origin)) return;

  const deInternet = fetch(pedido).then(async (respuesta) => {
    if (respuesta.ok) {
      const cache = await caches.open(VERSION);
      await cache.put(pedido, respuesta.clone());
    }
    return respuesta;
  });

  evento.respondWith(
    caches.match(pedido, { ignoreSearch: true }).then((guardada) => guardada || deInternet),
  );
  // Sin internet, la búsqueda falla en silencio: ya entregamos la copia guardada.
  evento.waitUntil(deInternet.catch(() => {}));
});

// =====================================================
// arranque.js — Lo último que se carga: enciende la app.
// =====================================================

// Si dejaste un entrenamiento a medias, la app vuelve directo a él.
if (datos.enCurso) {
  pintarInicio();
  abrirEntrenamiento();
} else {
  ir('pantalla-inicio');
}
Temporizador.restaurar();

// ---------- Funcionar sin internet ----------
// Registramos el "service worker" (sw.js): un ayudante que guarda
// una copia de la app en el teléfono. Solo funciona en páginas
// seguras (https) o en localhost; si abres el archivo con doble
// clic o desde la IP del PC, simplemente no se activa.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch((error) => console.warn('Sin modo offline:', error));
}

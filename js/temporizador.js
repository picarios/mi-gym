// =====================================================
// temporizador.js — El reloj de descanso.
//
// Truco clave: guardamos la HORA EN QUE TERMINA el descanso,
// no "cuántos segundos faltan". ¿Por qué? Porque el iPhone pausa
// las apps web cuando bloqueas la pantalla. Si contáramos segundos,
// el reloj se congelaría. Con la hora final, al volver la app
// simplemente resta: hora final − hora actual = lo que falta.
// =====================================================

const Temporizador = (() => {
  const CLAVE = 'gymapp-descanso';
  const caja = document.getElementById('temporizador');
  const textoTiempo = document.getElementById('temp-tiempo');
  const textoEtiqueta = document.getElementById('temp-etiqueta');
  const barra = document.getElementById('temp-progreso');

  let fin = 0;          // momento (en milisegundos) en que termina el descanso
  let total = 0;        // duración total, para dibujar la barra
  let etiqueta = '';
  let intervalo = null;
  let ocultarLuego = null;
  let audio = null;

  function formato(segundos) {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function iniciar(segundos, texto) {
    prepararAudio();
    total = segundos;
    fin = Date.now() + segundos * 1000;
    etiqueta = texto;
    guardar();
    arrancar();
  }

  function arrancar() {
    clearTimeout(ocultarLuego);
    clearInterval(intervalo);
    caja.hidden = false;
    caja.classList.remove('listo');
    textoEtiqueta.textContent = etiqueta;
    intervalo = setInterval(tic, 250); // revisa 4 veces por segundo
    tic();
  }

  function tic() {
    const restante = Math.ceil((fin - Date.now()) / 1000);
    if (restante <= 0) return terminar();
    textoTiempo.textContent = formato(restante);
    barra.style.width = `${(restante / total) * 100}%`;
  }

  function sumar(segundos) {
    if (!intervalo) return;
    fin += segundos * 1000;
    total = Math.max(total, Math.ceil((fin - Date.now()) / 1000));
    guardar();
    tic();
  }

  function terminar() {
    clearInterval(intervalo);
    intervalo = null;
    borrarGuardado();
    textoEtiqueta.textContent = 'Descanso terminado';
    textoTiempo.textContent = '¡Vamos!';
    barra.style.width = '0%';
    caja.classList.add('listo');
    pitido();
    if (navigator.vibrate) navigator.vibrate([300, 150, 300]); // en iPhone no existe, en Android sí
    ocultarLuego = setTimeout(detener, 5000);
  }

  function detener() {
    clearInterval(intervalo);
    clearTimeout(ocultarLuego);
    intervalo = null;
    borrarGuardado();
    caja.hidden = true;
    caja.classList.remove('listo');
  }

  // Guardamos el descanso para que sobreviva si el iPhone recarga la app.
  function guardar() {
    localStorage.setItem(CLAVE, JSON.stringify({ fin, total, etiqueta }));
  }
  function borrarGuardado() {
    localStorage.removeItem(CLAVE);
  }
  function restaurar() {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE));
      if (guardado && guardado.fin > Date.now()) {
        ({ fin, total, etiqueta } = guardado);
        arrancar();
      } else {
        borrarGuardado();
      }
    } catch (error) {
      borrarGuardado();
    }
  }

  // ---------- Sonido ----------
  // El iPhone solo deja sonar audio después de que tocas algo.
  // Por eso "preparamos" el audio justo cuando marcas una serie.
  function prepararAudio() {
    const ContextoAudio = window.AudioContext || window.webkitAudioContext;
    if (!audio && ContextoAudio) audio = new ContextoAudio();
    if (audio && audio.state === 'suspended') audio.resume();
  }

  // Tres pitidos cortos generados en el momento (no hace falta un archivo de sonido).
  function pitido() {
    if (!audio) return;
    [0, 0.3, 0.6].forEach((retraso) => {
      const oscilador = audio.createOscillator();
      const volumen = audio.createGain();
      const inicio = audio.currentTime + retraso;
      oscilador.frequency.value = 880;
      oscilador.connect(volumen);
      volumen.connect(audio.destination);
      volumen.gain.setValueAtTime(0.0001, inicio);
      volumen.gain.exponentialRampToValueAtTime(0.5, inicio + 0.02);
      volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.2);
      oscilador.start(inicio);
      oscilador.stop(inicio + 0.22);
    });
  }

  document.getElementById('temp-menos').addEventListener('click', () => sumar(-15));
  document.getElementById('temp-mas').addEventListener('click', () => sumar(15));
  document.getElementById('temp-saltar').addEventListener('click', detener);

  // Lo que el resto de la app puede usar:
  return { iniciar, detener, restaurar };
})();

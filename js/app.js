// =====================================================
// app.js — El "cerebro": conecta tus datos con la pantalla
// y decide qué pasa cuando tocas cada botón.
// =====================================================

let datos = cargarDatos();
let bloqueoPantalla = null;

// Atajo: $('#algo') busca un elemento de la página por su id o clase.
const $ = (selector) => document.querySelector(selector);

// ---------- Utilidades pequeñas ----------

function mmss(segundos) {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

// Convierte lo que escribes en un número. El teclado del iPhone en
// español pone coma ("62,5"), así que la cambiamos por punto.
function aNumero(texto) {
  const numero = parseFloat(String(texto).replace(',', '.'));
  return Number.isFinite(numero) ? numero : null;
}

function rango(min, max) {
  return min === max ? `${min}` : `${min}–${max}`;
}

// Tus reglas de descanso: pesado = 2 min, aislamiento = 60 s, el resto = 90 s.
function segundosDescanso(ej) {
  const def = EJERCICIOS[ej.id];
  if (def.descanso) return def.descanso;
  if (ej.pesado) return 120;
  return def.clase === 'aislamiento' ? 60 : 90;
}

// Tu regla: al fallo solo en máquinas o aislamientos.
function vaAlFallo(ej) {
  return EJERCICIOS[ej.id].clase !== 'libre';
}

function textoSerie(idEjercicio, serie) {
  if (EJERCICIOS[idEjercicio].tipo === 'tiempo') return `${serie.reps} s`;
  return serie.kg != null ? `${serie.kg}×${serie.reps}` : `${serie.reps} reps`;
}

// Números de una sesión terminada (los usan el resumen y el historial).
function duracionMinutos(sesion) {
  return Math.round((new Date(sesion.fin) - new Date(sesion.inicio)) / 60000);
}
function contarSeries(sesion) {
  return sesion.ejercicios.reduce((n, ej) => n + ej.series.length, 0);
}
// Volumen = suma de (kilos × repeticiones) de todas las series. Mide cuánto trabajo hiciste.
function volumenSesion(sesion) {
  return Math.round(sesion.ejercicios.reduce((total, ej) => {
    if (EJERCICIOS[ej.id].tipo === 'tiempo') return total;
    return total + ej.series.reduce((t, s) => t + (s.kg || 0) * s.reps, 0);
  }, 0));
}

// ---------- Moverse entre pantallas ----------
// Todas las pantallas están siempre en la página; solo mostramos una.
// El menú de abajo se ve siempre (el temporizador va justo encima),
// así puedes, por ejemplo, anotar comida entre series.

let scrollEntreno = 0; // dónde ibas en el entrenamiento, para volver al mismo lugar

function mostrarPantalla(id) {
  if (!$('#pantalla-entreno').hidden) scrollEntreno = window.scrollY;
  document.querySelectorAll('.pantalla').forEach((p) => { p.hidden = p.id !== id; });
  // El entrenamiento y su resumen se marcan como la pestaña "Entrenar".
  const pestana = ['pantalla-entreno', 'pantalla-resumen'].includes(id) ? 'pantalla-inicio' : id;
  document.querySelectorAll('#menu [data-ir]').forEach((boton) => {
    boton.classList.toggle('activo', boton.dataset.ir === pestana);
  });
  window.scrollTo(0, id === 'pantalla-entreno' ? scrollEntreno : 0);
}

// Ir a una pantalla del menú: primero se muestra y luego se dibuja
// (el gráfico necesita que la pantalla sea visible para medir su ancho).
function ir(id) {
  mostrarPantalla(id);
  if (id === 'pantalla-inicio') pintarInicio();
  if (id === 'pantalla-historial') pintarHistorial();
  if (id === 'pantalla-progreso') pintarProgreso();
  if (id === 'pantalla-comida') {
    diaComida = claveFecha(new Date()); // al entrar, siempre muestra hoy
    pintarComida();
  }
  if (id === 'pantalla-peso') pintarPeso();
  if (id === 'pantalla-semana') {
    lunesResumen = lunesDe(claveFecha(new Date())); // al entrar, siempre muestra esta semana
    pintarResumenSemanal();
  }
}

$('#menu').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-ir]');
  if (!boton) return;
  // Si tienes un entrenamiento a medias, "Entrenar" te devuelve a él.
  if (boton.dataset.ir === 'pantalla-inicio' && datos.enCurso && $('#pantalla-entreno').hidden) {
    abrirEntrenamiento();
  } else {
    ir(boton.dataset.ir);
  }
});

// ---------- PANTALLA 1: Inicio ----------

function pintarInicio() {
  document.querySelectorAll('[data-plan]').forEach((boton) => {
    boton.classList.toggle('activo', boton.dataset.plan === datos.plan);
  });

  $('#lista-dias').innerHTML = PLANES[datos.plan].map((idDia) => {
    const dia = DIAS[idDia];
    const ultima = ultimaSesionDelDia(datos, idDia);
    const paraSubir = dia.ejercicios.filter((it) => sugerenciaProgresion(datos, it.id)).length;
    return `
      <button class="tarjeta-dia" data-dia="${idDia}">
        <span class="dia-cuerpo">${svgCuerpo(musculosDeDia(idDia))}</span>
        <span class="dia-nombre">${dia.nombre}</span>
        <span class="dia-detalle">${dia.ejercicios.map((it) => EJERCICIOS[it.id].nombre).join(' · ')}</span>
        <span class="dia-ultima">${ultima ? 'Última vez: ' + fechaCorta(ultima.inicio) : 'Aún no lo has hecho'}</span>
        ${paraSubir ? `<span class="dia-subir">▲ Toca subir peso en ${paraSubir} ${paraSubir === 1 ? 'ejercicio' : 'ejercicios'}</span>` : ''}
      </button>`;
  }).join('');

  const n = datos.sesiones.length;
  $('#contador-sesiones').textContent = n === 1 ? '1 entrenamiento registrado' : `${n} entrenamientos registrados`;

  // Aviso arriba si dejaste un entrenamiento abierto.
  $('#banner-en-curso').hidden = !datos.enCurso;
  if (datos.enCurso) {
    const minutos = Math.round((Date.now() - new Date(datos.enCurso.inicio)) / 60000);
    $('#banner-texto').textContent = `${DIAS[datos.enCurso.dia].nombre} · hace ${minutos} min`;
  }
  pintarCopia();
}

$('#btn-continuar').addEventListener('click', abrirEntrenamiento);
$('#btn-atras').addEventListener('click', () => ir('pantalla-inicio'));

$('#selector-plan').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-plan]');
  if (!boton) return;
  datos.plan = boton.dataset.plan;
  guardarDatos(datos);
  pintarInicio();
});

$('#lista-dias').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-dia]');
  if (!boton) return;
  if (datos.enCurso && !confirm(`Ya tienes "${DIAS[datos.enCurso.dia].nombre}" sin terminar. ¿Descartarlo y empezar este?`)) return;
  empezarEntrenamiento(boton.dataset.dia);
});

// ---------- PANTALLA 2: Entrenamiento ----------

// Crea un entrenamiento nuevo con todas las series vacías.
// El peso viene rellenado con lo que usaste la última vez, para no reescribirlo.
// Si toca subir, viene rellenado directamente con el peso nuevo.
function empezarEntrenamiento(idDia) {
  datos.enCurso = {
    id: String(Date.now()),
    dia: idDia,
    inicio: new Date().toISOString(),
    ejercicios: DIAS[idDia].ejercicios.map((item) => {
      const anterior = ultimaVezEjercicio(datos, item.id);
      const sube = sugerenciaProgresion(datos, item.id);
      return {
        id: item.id,
        min: item.min,
        max: item.max,
        pesado: !!item.pesado,
        nota: item.nota || '',
        series: Array.from({ length: item.series }, (_, i) => ({
          kg: sube && sube.kg ? sube.kg : pesoSugerido(anterior, i),
          reps: null,
          hecha: false,
        })),
      };
    }),
  };
  guardarDatos(datos);
  scrollEntreno = 0;
  Temporizador.detener();
  abrirEntrenamiento();
}

function pesoSugerido(anterior, numeroSerie) {
  if (!anterior) return null;
  const serie = anterior.series[numeroSerie] || anterior.series[anterior.series.length - 1];
  return serie.kg;
}

function abrirEntrenamiento() {
  pintarEntrenamiento();
  mostrarPantalla('pantalla-entreno');
  mantenerPantallaEncendida();
}

function pintarEntrenamiento() {
  const sesion = datos.enCurso;
  $('#entreno-titulo').textContent = DIAS[sesion.dia].nombre;
  $('#lista-ejercicios').innerHTML = sesion.ejercicios.map(htmlEjercicio).join('');
  actualizarCronometro();
}

// Arma el HTML de la tarjeta de un ejercicio.
function htmlEjercicio(ej, i) {
  const def = EJERCICIOS[ej.id];
  const esTiempo = def.tipo === 'tiempo';
  const alFallo = vaAlFallo(ej);
  const anterior = ultimaVezEjercicio(datos, ej.id);

  const etiquetas = [
    ej.pesado ? '<span class="tag tag-pesado">Pesado</span>' : '',
    `<span class="tag">Descanso ${mmss(segundosDescanso(ej))}</span>`,
    alFallo ? '<span class="tag tag-fallo">Última serie al fallo</span>' : '',
  ].join('');

  const objetivo = `${ej.series.length} × ${rango(ej.min, ej.max)} ${esTiempo ? 'seg' : 'reps'} ${ej.nota}`;

  const ultimaVez = anterior
    ? `Última vez (${fechaCorta(anterior.fecha)}): ${anterior.series.map((s) => textoSerie(ej.id, s)).join(' · ')}`
    : 'Primera vez con este ejercicio';

  const sube = sugerenciaProgresion(datos, ej.id);

  const filas = ej.series.map((s, j) => `
    <div class="fila serie ${s.hecha ? 'hecha' : ''}" data-serie="${j}">
      <span class="num">${j + 1}${alFallo && j === ej.series.length - 1 ? '<small>fallo</small>' : ''}</span>
      ${esTiempo
        ? '<span class="sin-peso">—</span>'
        : `<input class="in-kg" inputmode="decimal" placeholder="kg" value="${s.kg ?? ''}">`}
      <input class="in-reps" inputmode="numeric" placeholder="${rango(ej.min, ej.max)}" value="${s.reps ?? ''}">
      <button class="btn-check" aria-label="Marcar serie ${j + 1} como hecha">✓</button>
    </div>`).join('');

  return `
    <article class="ejercicio ${ej.series.every((s) => s.hecha) ? 'completo' : ''}" data-ej="${i}">
      <h3>${i + 1}. ${def.nombre}</h3>
      <div class="etiquetas">${etiquetas}</div>
      <p class="objetivo">Objetivo: ${objetivo}</p>
      <button class="ej-visual" data-musculos="${ej.id}" aria-label="Ver en grande cómo se hace y qué músculos trabaja">
        <span class="ej-caja">${svgEjercicio(ej.id)}<small>Cómo se hace</small></span>
        <span class="ej-caja">${svgCuerpo(musculosDeEjercicio(ej.id))}<small>Músculos</small></span>
      </button>
      <p class="musculos-texto">${textoMusculos(musculosDeEjercicio(ej.id))}</p>
      <p class="ultima-vez">${ultimaVez}</p>
      ${sube ? `<p class="aviso-subir">▲ ${sube.mensaje}</p>` : ''}
      <div class="fila fila-cabeza"><span>Serie</span><span>kg</span><span>${esTiempo ? 'Seg' : 'Reps'}</span><span></span></div>
      ${filas}
    </article>`;
}

// Dada una fila de la pantalla, encuentra su ejercicio y su serie en los datos.
function buscarSerie(fila) {
  const ej = datos.enCurso.ejercicios[Number(fila.closest('.ejercicio').dataset.ej)];
  const numero = Number(fila.dataset.serie);
  return { ej, numero, serie: ej.series[numero] };
}

// Cada vez que escribes un número, se guarda al instante.
// Así, si el iPhone cierra la app a mitad del entrenamiento, no pierdes nada.
$('#lista-ejercicios').addEventListener('input', (evento) => {
  const campo = evento.target;
  const fila = campo.closest('.serie');
  if (!fila) return;
  const { serie } = buscarSerie(fila);
  if (campo.classList.contains('in-kg')) serie.kg = aNumero(campo.value);
  if (campo.classList.contains('in-reps')) serie.reps = aNumero(campo.value);
  guardarDatos(datos);
});

// Tocar los dibujos (ejercicio y cuerpo): los abre en grande.
$('#lista-ejercicios').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-musculos]');
  if (!boton) return;
  const id = boton.dataset.musculos;
  abrirMusculos(EJERCICIOS[id].nombre, musculosDeEjercicio(id), id);
});

// Tocar ✓: marca la serie como hecha y arranca el descanso.
// Tocarla otra vez la desmarca (por si te equivocaste).
$('#lista-ejercicios').addEventListener('click', (evento) => {
  const boton = evento.target.closest('.btn-check');
  if (!boton) return;
  const fila = boton.closest('.serie');
  const tarjeta = fila.closest('.ejercicio');
  const { ej, numero, serie } = buscarSerie(fila);

  if (serie.hecha) {
    serie.hecha = false;
    fila.classList.remove('hecha');
    tarjeta.classList.remove('completo');
    guardarDatos(datos);
    return;
  }

  if (serie.reps == null) {
    fila.classList.add('falta');
    setTimeout(() => fila.classList.remove('falta'), 600);
    fila.querySelector('.in-reps').focus();
    return;
  }

  serie.hecha = true;
  fila.classList.add('hecha');
  document.activeElement.blur(); // cierra el teclado

  // Si la siguiente serie no tiene peso, le copiamos este.
  const siguiente = ej.series[numero + 1];
  if (siguiente && siguiente.kg == null && serie.kg != null) {
    siguiente.kg = serie.kg;
    const campo = tarjeta.querySelector(`.serie[data-serie="${numero + 1}"] .in-kg`);
    if (campo) campo.value = serie.kg;
  }

  if (ej.series.every((s) => s.hecha)) tarjeta.classList.add('completo');
  guardarDatos(datos);
  Temporizador.iniciar(segundosDescanso(ej), textoSiguiente(ej, numero));
});

// Texto chico del temporizador: qué viene después del descanso.
function textoSiguiente(ej, numero) {
  if (numero + 1 < ej.series.length) {
    return `Siguiente: serie ${numero + 2} de ${ej.series.length} · ${EJERCICIOS[ej.id].nombre}`;
  }
  const lista = datos.enCurso.ejercicios;
  const proximo = lista[lista.indexOf(ej) + 1];
  return proximo ? `Siguiente: ${EJERCICIOS[proximo.id].nombre}` : 'Último ejercicio terminado';
}

// Cronómetro de la sesión (arriba, debajo del nombre del día).
function actualizarCronometro() {
  if (!datos.enCurso) return;
  $('#cronometro').textContent = mmss((Date.now() - new Date(datos.enCurso.inicio)) / 1000);
}
setInterval(actualizarCronometro, 1000);

$('#btn-terminar').addEventListener('click', () => {
  const sesion = datos.enCurso;
  const hechas = sesion.ejercicios.reduce((n, ej) => n + ej.series.filter((s) => s.hecha).length, 0);

  if (hechas === 0) {
    if (confirm('No marcaste ninguna serie. ¿Salir sin guardar?')) descartar();
    return;
  }
  if (!confirm(`¿Terminar el entrenamiento? Llevas ${hechas} series hechas.`)) return;

  // Al historial solo pasan las series marcadas con ✓.
  const terminada = {
    id: sesion.id,
    dia: sesion.dia,
    inicio: sesion.inicio,
    fin: new Date().toISOString(),
    ejercicios: sesion.ejercicios
      .map((ej) => ({
        id: ej.id,
        min: ej.min,
        max: ej.max,
        pesado: ej.pesado,
        planeadas: ej.series.length, // lo usaremos en la Etapa 2 para el aviso de subir peso
        series: ej.series.filter((s) => s.hecha).map((s) => ({ kg: s.kg, reps: s.reps })),
      }))
      .filter((ej) => ej.series.length > 0),
  };

  datos.sesiones.push(terminada);
  datos.enCurso = null;
  guardarDatos(datos);
  Temporizador.detener();
  soltarPantalla();
  pintarResumen(terminada);
  mostrarPantalla('pantalla-resumen');
});

$('#btn-descartar').addEventListener('click', () => {
  if (confirm('¿Descartar este entrenamiento? Se borra todo lo que anotaste hoy.')) descartar();
});

function descartar() {
  datos.enCurso = null;
  guardarDatos(datos);
  Temporizador.detener();
  soltarPantalla();
  pintarInicio();
  mostrarPantalla('pantalla-inicio');
}

// ---------- PANTALLA 3: Resumen ----------

function pintarResumen(sesion) {
  // Como la sesión ya está en el historial, esto revisa lo que hiciste HOY.
  const subir = sesion.ejercicios.filter((ej) => sugerenciaProgresion(datos, ej.id));

  $('#resumen-contenido').innerHTML = `
    <p class="objetivo">${DIAS[sesion.dia].nombre}</p>
    <div class="stats">
      <div class="stat"><strong>${duracionMinutos(sesion)}</strong><span>minutos</span></div>
      <div class="stat"><strong>${contarSeries(sesion)}</strong><span>series</span></div>
      <div class="stat"><strong>${volumenSesion(sesion)}</strong><span>kg movidos</span></div>
    </div>
    <div class="tarjeta">${htmlCalorias(sesion)}</div>
    ${subir.length ? `<p class="aviso-subir">▲ La próxima vez sube el peso en: ${subir.map((ej) => EJERCICIOS[ej.id].nombre).join(', ')}</p>` : ''}
    ${sesion.ejercicios.map((ej) => `
      <div class="resumen-ej">
        <h3>${EJERCICIOS[ej.id].nombre}</h3>
        <p>${ej.series.map((s) => textoSerie(ej.id, s)).join(' · ')}</p>
      </div>`).join('')}`;
}

// Marcar/desmarcar "Fui caminando" recalcula las calorías.
$('#resumen-contenido').addEventListener('change', (evento) => {
  if (!evento.target.matches('[data-caminata]') || !cambiarCaminata(evento.target)) return;
  pintarResumen(datos.sesiones.find((s) => s.id === evento.target.dataset.caminata));
});

$('#btn-volver').addEventListener('click', () => ir('pantalla-inicio'));

// ---------- Mantener la pantalla encendida ----------
// Para que el iPhone no se bloquee entre series. Si el teléfono
// no lo permite, simplemente no pasa nada.

async function mantenerPantallaEncendida() {
  try {
    if ('wakeLock' in navigator) bloqueoPantalla = await navigator.wakeLock.request('screen');
  } catch (error) { /* no soportado: seguimos igual */ }
}

function soltarPantalla() {
  if (bloqueoPantalla) bloqueoPantalla.release();
  bloqueoPantalla = null;
}

// El bloqueo se pierde al salir de la app; lo pedimos de nuevo al volver.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && datos.enCurso) mantenerPantallaEncendida();
});

// El arranque de la app está en arranque.js (se carga al final,
// cuando todas las funciones de todos los archivos ya existen).

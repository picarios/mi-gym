// =====================================================
// historial.js — Las pantallas de Historial y Progreso.
// =====================================================

function fechaLarga(iso) {
  const texto = new Date(iso).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1); // "domingo..." → "Domingo..."
}

// Número sin decimales raros: 62.50000001 → 62.5
function numero(valor) {
  return String(Math.round(valor * 10) / 10);
}

// ---------- HISTORIAL ----------
// Cada entrenamiento es un <details>: una caja que se abre y cierra
// sola al tocarla. Lo hace el navegador, sin código nuestro.

function pintarHistorial() {
  const lista = $('#lista-historial');
  if (datos.sesiones.length === 0) {
    lista.innerHTML = '<p class="vacio">Todavía no terminaste ningún entrenamiento. Cuando termines uno, aparece aquí.</p>';
    return;
  }

  // .slice() hace una copia y .reverse() la da vuelta: la más nueva primero.
  lista.innerHTML = datos.sesiones.slice().reverse().map((sesion) => `
    <details class="sesion">
      <summary>
        <span class="sesion-fecha">${fechaLarga(sesion.inicio)}</span>
        <span class="sesion-dia">${DIAS[sesion.dia] ? DIAS[sesion.dia].nombre : sesion.dia}</span>
        <span class="sesion-datos">${duracionMinutos(sesion)} min · ${contarSeries(sesion)} series · ~${caloriasSesion(sesion).total} kcal</span>
      </summary>
      <div class="sesion-calorias">${htmlCalorias(sesion)}</div>
      ${sesion.ejercicios.map((ej) => `
        <div class="sesion-ej">
          <strong>${EJERCICIOS[ej.id].nombre}</strong>
          <span>${ej.series.map((s) => textoSerie(ej.id, s)).join(' · ')}</span>
        </div>`).join('')}
      <button class="btn-texto" data-borrar="${sesion.id}">Borrar este entrenamiento</button>
    </details>`).join('');
}

$('#lista-historial').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-borrar]');
  if (!boton) return;
  if (!confirm('¿Borrar este entrenamiento del historial? No se puede deshacer.')) return;
  datos.sesiones = datos.sesiones.filter((s) => s.id !== boton.dataset.borrar);
  guardarDatos(datos);
  pintarHistorial();
});

// Cambiar la casilla de caminata: se redibuja y dejamos abierta esa sesión.
$('#lista-historial').addEventListener('change', (evento) => {
  if (!evento.target.matches('[data-caminata]') || !cambiarCaminata(evento.target)) return;
  const id = evento.target.dataset.caminata;
  pintarHistorial();
  $(`#lista-historial [data-caminata="${id}"]`).closest('details').open = true;
});

// ---------- PROGRESO ----------

let ejercicioElegido = null;
let medidaElegida = 'mejor'; // 'mejor' = mejor serie del día · 'volumen' = total del día

function pintarProgreso() {
  const selector = $('#selector-ejercicio');
  const botonesMedida = $('#selector-medida');
  const contenido = $('#progreso-contenido');

  // Solo los ejercicios que ya hiciste alguna vez, en el orden de la rutina.
  const conDatos = Object.keys(EJERCICIOS).filter((id) => ultimaVezEjercicio(datos, id));
  if (conDatos.length === 0) {
    selector.hidden = true;
    botonesMedida.hidden = true;
    contenido.innerHTML = '<p class="vacio">Aquí verás cómo subes de peso en cada ejercicio. Termina tu primer entrenamiento para empezar.</p>';
    return;
  }
  selector.hidden = false;
  botonesMedida.hidden = false;

  if (!conDatos.includes(ejercicioElegido)) ejercicioElegido = conDatos[0];
  selector.innerHTML = conDatos.map((id) =>
    `<option value="${id}" ${id === ejercicioElegido ? 'selected' : ''}>${EJERCICIOS[id].nombre}</option>`).join('');

  // Todas las veces que hiciste este ejercicio, de la más vieja a la más nueva.
  const registros = datos.sesiones
    .map((s) => ({ fecha: new Date(s.inicio), ej: s.ejercicios.find((e) => e.id === ejercicioElegido) }))
    .filter((r) => r.ej);

  // Si nunca le pusiste kilos (plancha, fondos con tu peso), medimos repeticiones o segundos.
  const def = EJERCICIOS[ejercicioElegido];
  const conPeso = def.tipo === 'reps' && registros.some((r) => r.ej.series.some((s) => s.kg > 0));
  const unidad = conPeso ? 'kg' : def.tipo === 'tiempo' ? 's' : 'reps';

  const nombres = {
    mejor: conPeso ? 'Peso máximo' : 'Mejor serie',
    volumen: conPeso ? 'Volumen' : def.tipo === 'tiempo' ? 'Tiempo total' : 'Reps totales',
  };
  document.querySelectorAll('[data-medida]').forEach((boton) => {
    boton.textContent = nombres[boton.dataset.medida];
    boton.classList.toggle('activo', boton.dataset.medida === medidaElegida);
  });

  const valorDelDia = (ej) => medidaElegida === 'mejor'
    ? Math.max(...ej.series.map((s) => (conPeso ? s.kg || 0 : s.reps)))
    : ej.series.reduce((total, s) => total + (conPeso ? (s.kg || 0) * s.reps : s.reps), 0);

  const puntos = registros.map((r) => ({ fecha: r.fecha, valor: valorDelDia(r.ej) }));
  const primero = puntos[0].valor;
  const ultimo = puntos[puntos.length - 1].valor;
  const record = Math.max(...puntos.map((p) => p.valor));
  const cambio = ultimo - primero;

  let textoCambio = 'Haz este ejercicio otra vez para ver la línea de progreso.';
  if (puntos.length > 1) {
    textoCambio = `${cambio >= 0 ? '+' : ''}${numero(cambio)} ${unidad} desde la primera vez`;
  }

  contenido.innerHTML = `
    <p class="medida-explica">${nombres[medidaElegida]} por sesión, en ${unidad}</p>
    <div class="stats">
      <div class="stat"><strong>${numero(primero)}</strong><span>primera vez</span></div>
      <div class="stat"><strong>${numero(ultimo)}</strong><span>última vez</span></div>
      <div class="stat"><strong>${numero(record)}</strong><span>récord</span></div>
    </div>
    <p class="cambio">${textoCambio}</p>
    <div class="grafico" id="grafico-progreso"></div>
    <h2 class="titulo-seccion">Todas las sesiones</h2>
    ${registros.slice().reverse().map((r) => `
      <div class="fila-historial">
        <span>${fechaCorta(r.fecha)}</span>
        <span>${r.ej.series.map((s) => textoSerie(ejercicioElegido, s)).join(' · ')}</span>
      </div>`).join('')}`;

  dibujarGrafico($('#grafico-progreso'), puntos, unidad);
}

$('#selector-ejercicio').addEventListener('change', (evento) => {
  ejercicioElegido = evento.target.value;
  pintarProgreso();
});

$('#selector-medida').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-medida]');
  if (!boton) return;
  medidaElegida = boton.dataset.medida;
  pintarProgreso();
});

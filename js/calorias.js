// =====================================================
// calorias.js — Estimación de calorías gastadas.
//
// Usamos la fórmula de los "MET" (equivalentes metabólicos), la que
// usan los relojes deportivos y las tablas científicas:
//
//     calorías = MET × tu peso (kg) × horas
//
// El MET dice qué tan intensa es una actividad comparada con estar
// sentado (1 MET). Los valores salen del "Compendio de Actividades
// Físicas". Es una ESTIMACIÓN: dos personas del mismo peso pueden
// gastar distinto. Tómalo como una guía (±20–30 %), no como dato exacto.
//
// Cómo contamos cada serie que marcaste con ✓:
//   1) Trabajo:  repeticiones × 4 segundos, con el MET de ESE ejercicio.
//      Más repeticiones = más calorías. Una sentadilla gasta más que
//      un curl de bíceps porque mueve músculos mucho más grandes.
//   2) Descanso: los segundos de descanso de esa serie (2 min, 90 s o
//      60 s según tus reglas). Descansando el cuerpo sigue acelerado,
//      así que también gasta, pero menos.
// Y al final sumamos la caminata de ida y la de vuelta al gym.
// =====================================================

// MET mientras haces la serie. Piernas y ejercicios grandes = más alto.
const MET_SERIE = {
  // Pierna, compuestos (los que más gastan)
  sentadilla: 8, peso_muerto_rumano: 8, prensa: 7, zancadas: 7, hip_thrust: 6,
  // Torso, compuestos
  press_banca: 6, press_militar: 6, press_inclinado: 6, remo_sentado: 6,
  fondos_press_frances: 5.5, jalon_pecho: 5, remo_maquina: 5, jalon_cerrado: 5,
  // Aislamientos de pierna
  ext_cuadriceps: 4.5, curl_femoral: 4.5, curl_femoral_sentado: 4.5, gemelos_pie: 4.5, gemelos_sentado: 3.5,
  // Aislamientos de torso
  ext_triceps_polea: 3.5, curl_biceps: 3.5, elevaciones_laterales: 3.5, deltoide_posterior: 3.5,
  // Core
  plancha: 4,
};
const MET_SERIE_OTRO = 5;       // por si agregas un ejercicio y olvidas ponerlo arriba
const MET_DESCANSO = 2;         // entre series: de pie, recuperando el aliento
const SEGUNDOS_POR_REP = 4;     // ~2 s bajando + ~2 s subiendo
const POR_LADO = { zancadas: 2 }; // anotas las reps de UNA pierna: el tiempo es el doble

const MET_CAMINATA = 3.5;       // caminar a paso normal (~5 km/h)
const IDA_INICIAL = 15;         // minutos, hasta que pongas los tuyos
const VUELTA_INICIAL = 15;

// Tu peso en esa fecha: el último pesaje de ese día o antes.
// Si no te habías pesado todavía, usamos los 94 kg iniciales.
function pesoEnFecha(clave) {
  let peso = datos.perfil.pesoInicial;
  datos.pesos.forEach((p) => { if (p.fecha <= clave) peso = p.kg; });
  return peso;
}

function kcal(met, kg, segundos) {
  return met * kg * (segundos / 3600);
}

// Los minutos que usaste la última vez quedan como los de siempre.
function caminataPorDefecto() {
  const p = datos.perfil;
  return {
    ida: p.caminataIda != null ? p.caminataIda : IDA_INICIAL,
    vuelta: p.caminataVuelta != null ? p.caminataVuelta : VUELTA_INICIAL,
  };
}

// Minutos de caminata de una sesión. Las sesiones de antes de este cambio
// guardaban true/false ("fui caminando o no"): las traducimos.
function caminataDeSesion(sesion) {
  if (sesion.caminata === false) return { ida: 0, vuelta: 0 };
  if (sesion.caminata && typeof sesion.caminata === 'object') return sesion.caminata;
  return { ida: IDA_INICIAL, vuelta: VUELTA_INICIAL };
}

function caloriasEjercicio(ej, kg) {
  const met = MET_SERIE[ej.id] || MET_SERIE_OTRO;
  const lados = POR_LADO[ej.id] || 1;
  const esTiempo = EJERCICIOS[ej.id].tipo === 'tiempo';
  let total = 0;
  ej.series.forEach((s) => {
    const trabajo = esTiempo ? s.reps : s.reps * SEGUNDOS_POR_REP * lados;
    total += kcal(met, kg, trabajo) + kcal(MET_DESCANSO, kg, segundosDescanso(ej));
  });
  return total;
}

function caloriasSesion(sesion) {
  const kg = pesoEnFecha(claveFecha(new Date(sesion.inicio)));
  const ejercicios = sesion.ejercicios.map((ej) => ({ id: ej.id, kcal: caloriasEjercicio(ej, kg) }));
  const pesas = ejercicios.reduce((t, e) => t + e.kcal, 0);
  const min = caminataDeSesion(sesion);
  const ida = kcal(MET_CAMINATA, kg, min.ida * 60);
  const vuelta = kcal(MET_CAMINATA, kg, min.vuelta * 60);

  return {
    ejercicios: ejercicios.map((e) => ({ id: e.id, kcal: Math.round(e.kcal) })),
    pesas: Math.round(pesas),
    ida: Math.round(ida),
    vuelta: Math.round(vuelta),
    minutos: min,
    total: Math.round(pesas + ida + vuelta),
  };
}

function textoRepsTotales(ej) {
  const suma = ej.series.reduce((t, s) => t + (s.reps || 0), 0);
  const unidad = EJERCICIOS[ej.id].tipo === 'tiempo' ? 's' : 'reps';
  return `${ej.series.length} series · ${suma} ${unidad}`;
}

// Bloque de calorías con el detalle por ejercicio y la caminata
// (el resumen y el historial lo usan).
function htmlCalorias(sesion) {
  const cal = caloriasSesion(sesion);
  return `
    <div class="calorias">
      <p class="calorias-total"><strong>~${cal.total} kcal</strong> gastadas en total <span class="estimacion">(estimación)</span></p>
      <table class="tabla-kcal">
        ${sesion.ejercicios.map((ej, i) => `
          <tr>
            <td>${EJERCICIOS[ej.id].nombre}<small>${textoRepsTotales(ej)}</small></td>
            <td>${cal.ejercicios[i].kcal} kcal</td>
          </tr>`).join('')}
        <tr class="subtotal"><td>Pesas</td><td>${cal.pesas} kcal</td></tr>
        <tr>
          <td>Caminata de ida
            <label class="minutos"><input type="number" inputmode="numeric" min="0" max="180" value="${cal.minutos.ida}" data-caminata="${sesion.id}" data-tramo="ida"> min</label>
          </td>
          <td>${cal.ida} kcal</td>
        </tr>
        <tr>
          <td>Caminata de vuelta
            <label class="minutos"><input type="number" inputmode="numeric" min="0" max="180" value="${cal.minutos.vuelta}" data-caminata="${sesion.id}" data-tramo="vuelta"> min</label>
          </td>
          <td>${cal.vuelta} kcal</td>
        </tr>
        <tr class="total"><td>Total</td><td>${cal.total} kcal</td></tr>
      </table>
      <p class="calorias-detalle">Si no fuiste caminando, pon 0. Los minutos que pongas quedan guardados para la próxima vez.</p>
    </div>`;
}

// Cambia los minutos de ida o de vuelta de una sesión. Devuelve true si cambió algo.
function cambiarCaminata(campo) {
  const sesion = datos.sesiones.find((s) => s.id === campo.dataset.caminata);
  if (!sesion) return false;
  const minutos = Math.max(0, Math.min(180, Math.round(aNumero(campo.value) || 0)));
  sesion.caminata = { ...caminataDeSesion(sesion), [campo.dataset.tramo]: minutos };
  // Lo recordamos como "lo de siempre" para las sesiones nuevas.
  datos.perfil.caminataIda = sesion.caminata.ida;
  datos.perfil.caminataVuelta = sesion.caminata.vuelta;
  guardarDatos(datos);
  return true;
}

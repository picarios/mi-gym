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
// =====================================================

const MET_ENTRENAMIENTO = {
  torso: 3.5,    // pesas, varios ejercicios de 8–15 repeticiones
  pierna: 5.0,   // músculos más grandes → más gasto
  completo: 4.5, // mitad y mitad
};
const MET_CAMINATA = 3.5;     // caminar a paso normal (~5 km/h)
const MINUTOS_CAMINATA = 30;  // tu ida y vuelta al gym
const MINUTOS_MAXIMOS = 120;  // si olvidas tocar "Terminar", no contamos más de 2 horas

// Tu peso en esa fecha: el último pesaje de ese día o antes.
// Si no te habías pesado todavía, usamos los 94 kg iniciales.
function pesoEnFecha(clave) {
  let peso = datos.perfil.pesoInicial;
  datos.pesos.forEach((p) => { if (p.fecha <= clave) peso = p.kg; });
  return peso;
}

function caloriasSesion(sesion) {
  const kg = pesoEnFecha(claveFecha(new Date(sesion.inicio)));
  const minutosReales = duracionMinutos(sesion);
  const minutos = Math.min(minutosReales, MINUTOS_MAXIMOS);
  const met = MET_ENTRENAMIENTO[DIAS[sesion.dia] ? DIAS[sesion.dia].tipo : 'completo'];

  const entreno = met * kg * (minutos / 60);
  // Las sesiones viejas no tienen el dato: asumimos que fuiste caminando.
  const caminata = sesion.caminata === false ? 0 : MET_CAMINATA * kg * (MINUTOS_CAMINATA / 60);

  return {
    entreno: Math.round(entreno),
    caminata: Math.round(caminata),
    total: Math.round(entreno + caminata),
    recortado: minutosReales > MINUTOS_MAXIMOS,
  };
}

// Bloque de calorías con la casilla de caminata (resumen e historial lo usan).
function htmlCalorias(sesion) {
  const cal = caloriasSesion(sesion);
  return `
    <div class="calorias">
      <p><strong>~${cal.total} kcal</strong> gastadas <span class="estimacion">(estimación)</span></p>
      <p class="calorias-detalle">Entrenamiento ${cal.entreno} kcal · Caminata ${cal.caminata} kcal</p>
      ${cal.recortado ? `<p class="calorias-detalle">La sesión duró más de ${MINUTOS_MAXIMOS / 60} h; solo contamos ${MINUTOS_MAXIMOS / 60} h.</p>` : ''}
      <label class="check">
        <input type="checkbox" data-caminata="${sesion.id}" ${sesion.caminata === false ? '' : 'checked'}>
        Fui caminando al gym (ida y vuelta, ~${MINUTOS_CAMINATA} min)
      </label>
    </div>`;
}

// Marca o desmarca la caminata de una sesión. Devuelve true si cambió algo.
function cambiarCaminata(casilla) {
  const sesion = datos.sesiones.find((s) => s.id === casilla.dataset.caminata);
  if (!sesion) return false;
  sesion.caminata = casilla.checked;
  guardarDatos(datos);
  return true;
}

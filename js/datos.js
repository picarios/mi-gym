// =====================================================
// datos.js — Guardar y leer tus datos en el teléfono.
//
// Usamos "localStorage": un cajón pequeño que el navegador le da
// a cada página web. Solo guarda texto, así que convertimos los
// datos a texto con JSON.stringify y de vuelta con JSON.parse.
// Todo queda en TU teléfono; no se manda a ningún servidor.
// =====================================================

const CLAVE_DATOS = 'gymapp-datos-v1';

// Tu lista rápida de comida al empezar. Los valores son aproximados:
// cámbialos en la app (Comida → Editar lista) según tus porciones reales.
const ALIMENTOS_INICIALES = [
  { id: 'huevo',        nombre: 'Huevo',          porcion: '1 unidad',               kcal: 70,  proteina: 6 },
  { id: 'pecho_pollo',  nombre: 'Pecho de pollo', porcion: '100 g cocido',           kcal: 165, proteina: 31 },
  { id: 'pierna_pollo', nombre: 'Pierna de pollo', porcion: '100 g cocida, sin piel', kcal: 170, proteina: 25 },
  { id: 'atun',         nombre: 'Atún en lata',   porcion: '1 lata en agua, escurrida', kcal: 140, proteina: 30 },
  { id: 'pan',          nombre: 'Pan',            porcion: '1 pan francés',          kcal: 110, proteina: 3.5 },
  { id: 'palta',        nombre: 'Palta',          porcion: '½ palta (~100 g)',       kcal: 160, proteina: 2 },
];

// Cómo se ven los datos la primera vez que abres la app.
function datosIniciales() {
  return {
    version: 1,
    plan: '4',       // cuántos días por semana: '4', '3' o '2'
    sesiones: [],    // entrenamientos terminados
    enCurso: null,   // el entrenamiento que estás haciendo ahora
    perfil: { pesoInicial: 94, proteinaMin: 150, proteinaMax: 170 },
    pesos: [],       // [{ fecha: '2026-11-02', kg: 94 }, ...] ordenados por fecha
    alimentos: ALIMENTOS_INICIALES.map((a) => ({ ...a })), // copia, para no tocar la original
    comidas: {},     // { '2026-11-02': [lo que comiste ese día], ... }
  };
}

// ---------- Fechas ----------
// Guardamos los días como texto "2026-11-02" según la hora de TU teléfono.
// (Ojo: toISOString() usa la hora de Londres; a las 8 pm en Perú ya
// sería "mañana". Por eso armamos la fecha a mano.)
function claveFecha(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Y al revés: de "2026-11-02" a una fecha. Usamos el mediodía
// para que ningún cambio de hora nos mueva al día anterior.
function fechaDeClave(clave) {
  return new Date(`${clave}T12:00:00`);
}

function sumarDias(clave, dias) {
  const fecha = fechaDeClave(clave);
  fecha.setDate(fecha.getDate() + dias);
  return claveFecha(fecha);
}

// El lunes de la semana de ese día (las semanas empiezan en lunes).
function lunesDe(clave) {
  const fecha = fechaDeClave(clave);
  fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7));
  return claveFecha(fecha);
}

// Si escribes un nombre de comida con símbolos como < o &, esto evita
// que el navegador los confunda con código de la página.
function escaparHTML(texto) {
  const reemplazos = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(texto).replace(/[&<>"']/g, (c) => reemplazos[c]);
}

function cargarDatos() {
  try {
    const texto = localStorage.getItem(CLAVE_DATOS);
    if (!texto) return datosIniciales();
    // Mezclamos con los iniciales por si en una etapa futura agregamos campos nuevos.
    return { ...datosIniciales(), ...JSON.parse(texto) };
  } catch (error) {
    console.warn('No se pudieron leer los datos guardados', error);
    return datosIniciales();
  }
}

function guardarDatos(datos) {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
  } catch (error) {
    alert('No se pudo guardar. Puede que el teléfono esté sin espacio.');
  }
}

// Busca la última sesión en la que hiciste este ejercicio
// (en cualquier día: la prensa del Día 2 y la del Día 4 comparten historial).
// Recorre las sesiones de la más nueva a la más vieja.
function ultimaVezEjercicio(datos, idEjercicio) {
  for (let i = datos.sesiones.length - 1; i >= 0; i--) {
    const sesion = datos.sesiones[i];
    const ejercicio = sesion.ejercicios.find((ej) => ej.id === idEjercicio);
    if (ejercicio && ejercicio.series.length > 0) {
      return {
        fecha: sesion.inicio,
        series: ejercicio.series,
        min: ejercicio.min,
        max: ejercicio.max,
        planeadas: ejercicio.planeadas || ejercicio.series.length,
      };
    }
  }
  return null;
}

function ultimaSesionDelDia(datos, idDia) {
  for (let i = datos.sesiones.length - 1; i >= 0; i--) {
    if (datos.sesiones[i].dia === idDia) return datos.sesiones[i];
  }
  return null;
}

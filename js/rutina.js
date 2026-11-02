// =====================================================
// rutina.js — Aquí vive TU rutina. Solo datos, nada de lógica.
// Si un día quieres cambiar un ejercicio, las series o las
// repeticiones, este es el único archivo que tienes que tocar.
// =====================================================

// Catálogo de ejercicios. Cada uno tiene un "id" (el nombre corto
// a la izquierda) que la app usa por dentro para encontrar tu historial.
//
//   nombre:   lo que se ve en pantalla
//   tipo:     'reps'   → registras kilos y repeticiones
//             'tiempo' → registras segundos (sin peso), como la plancha
//   clase:    'libre'       → peso libre compuesto: descanso 90 s, nunca al fallo
//             'maquina'     → compuesto en máquina: descanso 90 s, última serie al fallo
//             'aislamiento' → un solo músculo: descanso 60 s, última serie al fallo
//   descanso: (opcional) segundos fijos, si quieres saltarte la regla
//   subir:    (opcional) cuántos kg sugerir subir cuando toca progresar.
//             Si no lo pones: 1 kg en aislamientos y 2,5 kg en el resto.
//
// Si el ejercicio va marcado como "pesado" en el día, el descanso
// sube a 120 s (2 min) sin importar la clase.
const EJERCICIOS = {
  // Torso
  press_banca:          { nombre: 'Press de banca con barra',                   tipo: 'reps', clase: 'libre' },
  jalon_pecho:          { nombre: 'Jalón al pecho',                             tipo: 'reps', clase: 'maquina' },
  press_militar:        { nombre: 'Press militar',                              tipo: 'reps', clase: 'libre' },
  remo_maquina:         { nombre: 'Remo en máquina',                            tipo: 'reps', clase: 'maquina' },
  ext_triceps_polea:    { nombre: 'Extensión de tríceps en polea',              tipo: 'reps', clase: 'aislamiento' },
  curl_biceps:          { nombre: 'Curl de bíceps',                             tipo: 'reps', clase: 'aislamiento' },
  press_inclinado:      { nombre: 'Press inclinado con mancuernas',             tipo: 'reps', clase: 'libre' },
  remo_sentado:         { nombre: 'Remo sentado o con barra',                   tipo: 'reps', clase: 'libre' },
  jalon_cerrado:        { nombre: 'Jalón agarre cerrado o dominadas asistidas', tipo: 'reps', clase: 'maquina' },
  elevaciones_laterales:{ nombre: 'Elevaciones laterales',                      tipo: 'reps', clase: 'aislamiento' },
  deltoide_posterior:   { nombre: 'Deltoide posterior en máquina',              tipo: 'reps', clase: 'aislamiento' },
  fondos_press_frances: { nombre: 'Fondos o press francés',                     tipo: 'reps', clase: 'libre' },

  // Pierna (las piernas aguantan saltos más grandes, por eso subir: 5)
  sentadilla:           { nombre: 'Sentadilla',                                 tipo: 'reps', clase: 'libre', subir: 5 },
  peso_muerto_rumano:   { nombre: 'Peso muerto rumano',                         tipo: 'reps', clase: 'libre', subir: 5 },
  prensa:               { nombre: 'Prensa',                                     tipo: 'reps', clase: 'maquina', subir: 5 },
  curl_femoral:         { nombre: 'Curl femoral',                               tipo: 'reps', clase: 'aislamiento' },
  gemelos_pie:          { nombre: 'Gemelos de pie',                             tipo: 'reps', clase: 'aislamiento' },
  plancha:              { nombre: 'Plancha',                                    tipo: 'tiempo', clase: 'libre', descanso: 60 },
  zancadas:             { nombre: 'Zancadas o búlgaras',                        tipo: 'reps', clase: 'libre' },
  hip_thrust:           { nombre: 'Hip thrust (o abducción)',                   tipo: 'reps', clase: 'libre', subir: 5 },
  ext_cuadriceps:       { nombre: 'Extensión de cuádriceps',                    tipo: 'reps', clase: 'aislamiento' },
  curl_femoral_sentado: { nombre: 'Curl femoral sentado',                       tipo: 'reps', clase: 'aislamiento' },
  gemelos_sentado:      { nombre: 'Gemelos sentado',                            tipo: 'reps', clase: 'aislamiento' },
};

// Qué músculos trabaja cada ejercicio (para el dibujo del cuerpo).
//   principales: los que más trabajan → verde fuerte
//   secundarios: los que ayudan       → verde suave
// Nombres posibles: pecho, hombro_frontal, hombro_lateral, hombro_posterior,
// biceps, triceps, antebrazo, abdomen, oblicuos, trapecio, dorsal,
// espalda_media, lumbar, gluteos, cuadriceps, aductores, isquios, gemelos
const MUSCULOS = {
  press_banca:           { principales: ['pecho'],                         secundarios: ['hombro_frontal', 'triceps'] },
  jalon_pecho:           { principales: ['dorsal'],                        secundarios: ['biceps', 'espalda_media'] },
  press_militar:         { principales: ['hombro_frontal', 'hombro_lateral'], secundarios: ['triceps', 'trapecio'] },
  remo_maquina:          { principales: ['espalda_media', 'dorsal'],       secundarios: ['biceps', 'hombro_posterior'] },
  ext_triceps_polea:     { principales: ['triceps'],                       secundarios: [] },
  curl_biceps:           { principales: ['biceps'],                        secundarios: ['antebrazo'] },
  press_inclinado:       { principales: ['pecho', 'hombro_frontal'],       secundarios: ['triceps'] },
  remo_sentado:          { principales: ['espalda_media', 'dorsal'],       secundarios: ['biceps', 'hombro_posterior', 'lumbar'] },
  jalon_cerrado:         { principales: ['dorsal'],                        secundarios: ['biceps', 'espalda_media'] },
  elevaciones_laterales: { principales: ['hombro_lateral'],                secundarios: ['trapecio'] },
  deltoide_posterior:    { principales: ['hombro_posterior'],              secundarios: ['espalda_media'] },
  fondos_press_frances:  { principales: ['triceps'],                       secundarios: ['pecho', 'hombro_frontal'] },
  sentadilla:            { principales: ['cuadriceps', 'gluteos'],         secundarios: ['aductores', 'lumbar', 'abdomen'] },
  peso_muerto_rumano:    { principales: ['isquios', 'gluteos'],            secundarios: ['lumbar'] },
  prensa:                { principales: ['cuadriceps', 'gluteos'],         secundarios: ['aductores'] },
  curl_femoral:          { principales: ['isquios'],                       secundarios: ['gemelos'] },
  gemelos_pie:           { principales: ['gemelos'],                       secundarios: [] },
  plancha:               { principales: ['abdomen'],                       secundarios: ['oblicuos', 'hombro_frontal'] },
  zancadas:              { principales: ['cuadriceps', 'gluteos'],         secundarios: ['isquios', 'aductores'] },
  hip_thrust:            { principales: ['gluteos'],                       secundarios: ['isquios'] },
  ext_cuadriceps:        { principales: ['cuadriceps'],                    secundarios: [] },
  curl_femoral_sentado:  { principales: ['isquios'],                       secundarios: [] },
  gemelos_sentado:       { principales: ['gemelos'],                       secundarios: [] },
};

// Los días de entrenamiento. "tipo" ('torso', 'pierna' o 'completo')
// se usa para estimar las calorías gastadas. Cada ejercicio dice:
//   id: cuál del catálogo de arriba
//   series, min, max: "4×10–15" se escribe series: 4, min: 10, max: 15
//   pesado: true si es de los pesados (descanso de 2 min)
//   nota: texto extra opcional
const DIAS = {
  d1: {
    nombre: 'Día 1 — Torso (fuerza)',
    tipo: 'torso',
    ejercicios: [
      { id: 'press_banca',       series: 4, min: 10, max: 15, pesado: true },
      { id: 'jalon_pecho',       series: 4, min: 10, max: 15 },
      { id: 'press_militar',     series: 4, min: 10, max: 15, pesado: true },
      { id: 'remo_maquina',      series: 4, min: 10, max: 15 },
      { id: 'ext_triceps_polea', series: 4, min: 10, max: 15 },
      { id: 'curl_biceps',       series: 4, min: 10, max: 15 },
    ],
  },
  d2: {
    nombre: 'Día 2 — Pierna (fuerza)',
    tipo: 'pierna',
    ejercicios: [
      { id: 'sentadilla',         series: 4, min: 10, max: 15, pesado: true },
      { id: 'peso_muerto_rumano', series: 4, min: 10, max: 15, pesado: true },
      { id: 'prensa',             series: 4, min: 10, max: 15, pesado: true },
      { id: 'curl_femoral',       series: 4, min: 10, max: 15 },
      { id: 'gemelos_pie',        series: 4, min: 10, max: 15 },
      { id: 'plancha',            series: 4, min: 30, max: 45 }, // la plancha va en segundos
    ],
  },
  d3: {
    nombre: 'Día 3 — Torso (volumen)',
    tipo: 'torso',
    ejercicios: [
      { id: 'press_inclinado',       series: 4, min: 10, max: 15 },
      { id: 'remo_sentado',          series: 4, min: 10, max: 15 },
      { id: 'jalon_cerrado',         series: 4, min: 10, max: 15 },
      { id: 'elevaciones_laterales', series: 4, min: 10, max: 15 },
      { id: 'deltoide_posterior',    series: 4, min: 10, max: 15 },
      { id: 'fondos_press_frances',  series: 4, min: 10, max: 15 },
    ],
  },
  d4: {
    nombre: 'Día 4 — Pierna (volumen)',
    tipo: 'pierna',
    ejercicios: [
      { id: 'prensa',               series: 4, min: 10, max: 15 },
      { id: 'zancadas',             series: 4, min: 10, max: 15, nota: 'por pierna' },
      { id: 'hip_thrust',           series: 4, min: 10, max: 15 },
      { id: 'ext_cuadriceps',       series: 4, min: 10, max: 15 },
      { id: 'curl_femoral_sentado', series: 4, min: 10, max: 15 },
      { id: 'gemelos_sentado',      series: 4, min: 10, max: 15 },
    ],
  },
  // Variante de 3 días: el tercer día es cuerpo completo.
  cc3: {
    nombre: 'Cuerpo completo',
    tipo: 'completo',
    ejercicios: [
      { id: 'press_inclinado',       series: 4, min: 10, max: 15 },
      { id: 'remo_sentado',          series: 4, min: 10, max: 15 },
      { id: 'prensa',                series: 4, min: 10, max: 15 },
      { id: 'curl_femoral',          series: 4, min: 10, max: 15 },
      { id: 'elevaciones_laterales', series: 4, min: 10, max: 15 },
      { id: 'ext_triceps_polea',     series: 4, min: 10, max: 15 },
    ],
  },
};

// Variante de 2 días: se arma sola con los 3 primeros ejercicios de
// otros días. ".slice(0, 3)" significa "dame los elementos 0, 1 y 2".
// Si cambias el Día 1, el Cuerpo completo A cambia solo.
DIAS.ccA = {
  nombre: 'Cuerpo completo A',
  tipo: 'completo',
  ejercicios: [...DIAS.d1.ejercicios.slice(0, 3), ...DIAS.d2.ejercicios.slice(0, 3)],
};
DIAS.ccB = {
  nombre: 'Cuerpo completo B',
  tipo: 'completo',
  ejercicios: [...DIAS.d3.ejercicios.slice(0, 3), ...DIAS.d4.ejercicios.slice(0, 3)],
};

// Qué días se muestran según cuántos días entrenas por semana.
const PLANES = {
  '4': ['d1', 'd2', 'd3', 'd4'],
  '3': ['d1', 'd2', 'cc3'],
  '2': ['ccA', 'ccB'],
};

// =====================================================
// musculos.js — El dibujo del cuerpo, hecho a mano en SVG.
//
// Cómo funciona:
// - Cada figura mide 100 de ancho × 212 de alto (en "unidades SVG").
// - Solo dibujamos la MITAD IZQUIERDA del cuerpo. La mitad derecha
//   es la misma copiada en espejo (transform="matrix(-1 0 0 1 100 0)"
//   significa "dale la vuelta horizontal sobre la línea del medio").
// - Cada músculo es un "path": una forma descrita con coordenadas.
//   M = mover el lápiz a un punto, L = línea recta hasta un punto,
//   C = curva, Z = cerrar la forma.
// =====================================================

const NOMBRES_MUSCULOS = {
  pecho: 'Pecho',
  hombro_frontal: 'Hombro frontal',
  hombro_lateral: 'Hombro lateral',
  hombro_posterior: 'Hombro posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazo: 'Antebrazo',
  abdomen: 'Abdomen',
  oblicuos: 'Oblicuos',
  trapecio: 'Trapecio',
  dorsal: 'Dorsal',
  espalda_media: 'Espalda media',
  lumbar: 'Lumbar',
  gluteos: 'Glúteos',
  cuadriceps: 'Cuádriceps',
  aductores: 'Aductores',
  isquios: 'Femorales',
  gemelos: 'Gemelos',
};

// La silueta gris de fondo (media figura): brazo y torso+pierna por separado,
// para que quede un espacio entre el brazo y el cuerpo.
const SILUETA = [
  // brazo
  'M36,34 C30,35 26,38 24,44 L21,56 L20,66 L19,74 L17,88 L16,98 C15,104 16,108 18,110 C20,111 22,110 22,106 L23,98 L25,90 L27,80 L29,72 L30,62 L31,52 L33,44 Z',
  // torso y pierna
  'M50,24 L45,25 L45,31 C42,33 39,33 36,34 L34,44 L34,56 L35,70 L35,82 L33,96 L31,110 L31,128 L33,146 L31,160 L32,176 L35,198 C33,202 32,206 34,208 L45,208 L45,200 L44,186 L45,170 L45,158 L46,146 L47,130 L48,120 L50,112 Z',
];

// Los músculos. "m" dice a qué músculo(s) pertenece la forma: el hombro
// de la vista de frente se pinta tanto si trabaja el frontal como el lateral.
const FORMAS_FRENTE = [
  { m: 'hombro_frontal hombro_lateral', d: 'M36,34 C30,35 26,38 24,45 C25,49 29,50 32,47 C33,42 35,38 38,36 Z' },
  { m: 'pecho',      d: 'M49,36 L38,36 C35,40 34,44 34,48 C38,53 45,53 49,51 Z' },
  { m: 'biceps',     d: 'M25,50 C22,56 22,63 23,68 L28,68 C30,62 31,56 30,50 Z' },
  { m: 'antebrazo',  d: 'M20,74 C18,82 17,90 17,95 L23,95 C25,88 27,80 28,74 Z' },
  { m: 'abdomen',    d: 'M49,54 L42,54 C41,64 41,78 42,92 C45,95 48,96 49,96 Z' },
  { m: 'oblicuos',   d: 'M41,55 L35,58 C35.5,70 35.5,80 34,90 L41,93 C40,80 40,66 41,55 Z' },
  { m: 'cuadriceps', d: 'M33,100 C31,112 31,128 34,142 L43,142 C44.5,130 44.5,118 43.5,108 C40,103 37,101 33,100 Z' },
  { m: 'aductores',  d: 'M44.5,106 C47,109 49,112 49.5,115 L48,124 L46,136 C46,126 45.8,116 44.5,106 Z' },
];
// Rayitas del "six pack" (solo decoración)
const DETALLES_FRENTE = 'M42,64 L49,64 M42,74 L49,74 M42,84 L49,84';

const FORMAS_ESPALDA = [
  { m: 'trapecio',      d: 'M50,25 L45,27 L45,31 C42,33 39,34 37,35 C42,38 46,43 50,50 Z' },
  { m: 'hombro_posterior hombro_lateral', d: 'M36,34 C30,35 26,38 24,45 C25,49 29,50 32,47 C33,42 35,38 38,36 Z' },
  { m: 'espalda_media', d: 'M49,52 C46,46 42,41 38,38 C37,42 37,46 38,49 C42,55 46,61 49,65 Z' },
  { m: 'dorsal',        d: 'M36,46 C35,56 36,68 39,80 C43,83 46,84 49,84 L49,70 C45,64 41,58 37.5,52 Z' },
  { m: 'triceps',       d: 'M25,50 C22,56 22,63 23,68 L28,68 C30,62 31,56 30,50 Z' },
  { m: 'antebrazo',     d: 'M20,74 C18,82 17,90 17,95 L23,95 C25,88 27,80 28,74 Z' },
  { m: 'lumbar',        d: 'M49,86 C45,86 42,85 39,84 C39,89 40,93 42,96 L49,96 Z' },
  { m: 'gluteos',       d: 'M49,98 L42,97 C36,98 33,104 33,111 C35,117 42,118 48,114 Z' },
  { m: 'isquios',       d: 'M33,117 C32,128 33,138 35,144 L44,144 C46,136 47,128 47,120 C42,122 37,121 33,117 Z' },
  { m: 'gemelos',       d: 'M33,150 C30,158 31,168 35,176 L44,176 C46,168 46,158 45,150 C41,148 36,148 33,150 Z' },
];

// Dibuja una figura (frente o espalda) movida "x" unidades a la derecha.
function figuraCuerpo(formas, detalles, x, principales, secundarios) {
  const clase = (m) => {
    const ids = m.split(' ');
    if (ids.some((id) => principales.includes(id))) return 'm-principal';
    if (ids.some((id) => secundarios.includes(id))) return 'm-secundario';
    return 'm-libre';
  };
  const mitad = SILUETA.map((d) => `<path class="m-base" d="${d}"/>`).join('')
    + formas.map((f) => `<path class="${clase(f.m)}" d="${f.d}"/>`).join('')
    + (detalles ? `<path class="m-detalle" d="${detalles}"/>` : '');

  return `
    <g transform="translate(${x},0)">
      <circle class="m-base" cx="50" cy="14" r="9.5"/>
      ${mitad}
      <g transform="matrix(-1 0 0 1 100 0)">${mitad}</g>
    </g>`;
}

// El dibujo completo: frente a la izquierda, espalda a la derecha.
function svgCuerpo({ principales, secundarios }, conTitulos = false) {
  const alto = conTitulos ? 228 : 212;
  const titulos = conTitulos
    ? '<text class="m-titulo" x="50" y="226">Frente</text><text class="m-titulo" x="160" y="226">Espalda</text>'
    : '';
  const nombres = principales.map((m) => NOMBRES_MUSCULOS[m]).join(', ');
  return `
    <svg class="cuerpo" viewBox="0 0 210 ${alto}" role="img" aria-label="Músculos principales: ${nombres || 'ninguno'}">
      ${figuraCuerpo(FORMAS_FRENTE, DETALLES_FRENTE, 0, principales, secundarios)}
      ${figuraCuerpo(FORMAS_ESPALDA, '', 110, principales, secundarios)}
      ${titulos}
    </svg>`;
}

function musculosDeEjercicio(idEjercicio) {
  return MUSCULOS[idEjercicio] || { principales: [], secundarios: [] };
}

// Junta los músculos de todos los ejercicios de un día.
// Un Set es una lista que no permite repetidos.
function musculosDeDia(idDia) {
  const principales = new Set();
  const secundarios = new Set();
  DIAS[idDia].ejercicios.forEach((item) => {
    const m = musculosDeEjercicio(item.id);
    m.principales.forEach((x) => principales.add(x));
    m.secundarios.forEach((x) => secundarios.add(x));
  });
  return {
    principales: [...principales],
    secundarios: [...secundarios].filter((x) => !principales.has(x)),
  };
}

// "Pecho · Hombro frontal · Tríceps", con los principales en negrita.
function textoMusculos({ principales, secundarios }) {
  return [
    ...principales.map((m) => `<strong>${NOMBRES_MUSCULOS[m]}</strong>`),
    ...secundarios.map((m) => NOMBRES_MUSCULOS[m]),
  ].join(' · ');
}

// ---------- Ventana con el dibujo en grande ----------
// <dialog> es una ventana emergente que ya trae el navegador.

// Si le pasas el id de un ejercicio, arriba muestra también cómo se hace.
function abrirMusculos(titulo, musculos, idEjercicio = null) {
  $('#vm-titulo').textContent = titulo;
  $('#vm-ejercicio').innerHTML = idEjercicio ? svgEjercicio(idEjercicio) : '';
  $('#vm-ejercicio').hidden = !idEjercicio;
  $('#vm-cuerpo').innerHTML = svgCuerpo(musculos, true);
  $('#vm-lista').innerHTML = textoMusculos(musculos);
  $('#ventana-musculos').showModal();
}

// (Aquí usamos document.getElementById y no $ porque este archivo
// se carga antes que app.js, que es donde se crea $.)
document.getElementById('vm-cerrar').addEventListener('click', () => {
  document.getElementById('ventana-musculos').close();
});
// Tocar fuera de la ventana (en la parte oscura) también la cierra.
document.getElementById('ventana-musculos').addEventListener('click', (evento) => {
  if (evento.target.id === 'ventana-musculos') evento.target.close();
});

// =====================================================
// dibujos.js — Un monito haciendo cada ejercicio, con su máquina.
//
// Cada dibujo mide 100 × 100 y el suelo está en y = 92.
// El monito está hecho de "articulaciones" (cabeza, hombro, codo,
// mano, cadera, rodilla, pie) unidas con líneas, como un esqueleto.
// Cada ejercicio tiene DOS posturas:
//   a = posición inicial,  b = posición final
// y la app alterna entre las dos para que veas el movimiento.
//
// Casi siempre lo vemos de perfil. Si una postura tiene "hombro2",
// es una vista de frente (o de espaldas) con los dos brazos y piernas.
// =====================================================

// ---------- Piezas de equipo (devuelven texto SVG) ----------
const banco = (x1, x2, y) => `
  <rect class="e-equipo" x="${x1}" y="${y}" width="${x2 - x1}" height="4" rx="2"/>
  <line class="e-pata" x1="${x1 + 5}" y1="${y + 4}" x2="${x1 + 5}" y2="92"/>
  <line class="e-pata" x1="${x2 - 5}" y1="${y + 4}" x2="${x2 - 5}" y2="92"/>`;
const asiento = (x1, x2, y) => `
  <rect class="e-equipo" x="${x1}" y="${y}" width="${x2 - x1}" height="4" rx="2"/>
  <line class="e-pata" x1="${(x1 + x2) / 2}" y1="${y + 4}" x2="${(x1 + x2) / 2}" y2="92"/>`;
const torre = (x, y = 4) => `<rect class="e-equipo" x="${x}" y="${y}" width="6" height="${92 - y}" rx="2"/>`;
const polea = (x, y) => `<circle class="e-polea" cx="${x}" cy="${y}" r="2.5"/>`;
const cable = (de, a) => `<line class="e-cable" x1="${de[0]}" y1="${de[1]}" x2="${a[0]}" y2="${a[1]}"/>`;
const disco = (x, y) => `<circle class="e-peso" cx="${x}" cy="${y}" r="6"/>`;       // barra vista de costado
const mancuerna = (x, y) => `<circle class="e-peso" cx="${x}" cy="${y}" r="4"/>`;
const rodillo = (x, y) => `<circle class="e-peso" cx="${x}" cy="${y}" r="4"/>`;     // almohadilla de máquina
const barra = (x1, x2, y) => `<line class="e-barra" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
const asa = (x, y) => `<line class="e-barra" x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}"/>`;

// Postura de pie, brazos abajo: la base de muchos ejercicios.
// (El brazo va un poquito adelante del cuerpo; si no, de perfil se esconde.)
const DE_PIE = {
  cabeza: [50, 14], hombro: [50, 25], cadera: [50, 52], rodilla: [50, 71], pie: [50, 90],
  codo: [54, 38], mano: [56, 51],
};

// Jalón al pecho y agarre cerrado son iguales; cambia el ancho del agarre.
function dibujoJalon(cerrado) {
  const agarre = (y) => (cerrado
    ? `<path class="e-barra" d="M41,${y} L45,${y + 5} L49,${y}" fill="none"/>`
    : barra(32, 58, y));
  const sentado = { cabeza: [43, 24], hombro: [42, 35], cadera: [40, 62], rodilla: [60, 60], pie: [62, 90] };
  return {
    equipo: `${asiento(30, 52, 64)}<rect class="e-equipo" x="52" y="53" width="14" height="4" rx="2"/>
      ${torre(80)}<line class="e-cable" x1="46" y1="5" x2="83" y2="5"/>${polea(46, 6)}`,
    a: { ...sentado, codo: [44, 22], mano: [45, 10], atras: cable([46, 6], [45, 10]), adelante: agarre(10) },
    b: { ...sentado, codo: [36, 46], mano: [45, 32], atras: cable([46, 6], [45, 32]), adelante: agarre(32) },
  };
}

const DIBUJOS = {
  press_banca: (() => {
    const echado = { cabeza: [21, 54], hombro: [30, 57], cadera: [56, 57], rodilla: [72, 58], pie: [78, 90] };
    return {
      equipo: banco(16, 80, 62),
      a: { ...echado, codo: [24, 67], mano: [32, 50], adelante: disco(32, 50) },
      b: { ...echado, codo: [31, 44], mano: [32, 31], adelante: disco(32, 31) },
    };
  })(),

  jalon_pecho: dibujoJalon(false),
  jalon_cerrado: dibujoJalon(true),

  press_militar: (() => {
    const parado = { cabeza: [50, 22], hombro: [50, 32], cadera: [50, 58], rodilla: [51, 75], pie: [50, 91] };
    return {
      equipo: '',
      a: { ...parado, codo: [58, 42], mano: [58, 30], adelante: disco(59, 29) },
      b: { ...parado, codo: [52, 19], mano: [52, 7], adelante: disco(52, 7) },
    };
  })(),

  remo_maquina: (() => {
    const sentado = { cabeza: [42, 25], hombro: [40, 36], cadera: [36, 62], rodilla: [56, 60], pie: [60, 90] };
    return {
      equipo: `${asiento(26, 46, 64)}${torre(80, 20)}`,
      a: { ...sentado, codo: [52, 39], mano: [64, 41], atras: cable([64, 41], [80, 30]), adelante: asa(64, 41) },
      b: { ...sentado, codo: [28, 42], mano: [41, 41], atras: cable([41, 41], [80, 30]), adelante: asa(41, 41) },
    };
  })(),

  ext_triceps_polea: {
    equipo: `${torre(80)}${polea(78, 9)}`,
    a: { ...DE_PIE, cabeza: [46, 14], hombro: [45, 25], cadera: [44, 52], rodilla: [44, 71], pie: [44, 90],
      codo: [50, 38], mano: [61, 31], atras: cable([78, 9], [61, 31]), adelante: barra(58, 64, 31) },
    b: { ...DE_PIE, cabeza: [46, 14], hombro: [45, 25], cadera: [44, 52], rodilla: [44, 71], pie: [44, 90],
      codo: [50, 38], mano: [57, 51], atras: cable([78, 9], [57, 51]), adelante: barra(54, 60, 51) },
  },

  curl_biceps: {
    equipo: '',
    a: { ...DE_PIE, adelante: mancuerna(57, 52) },
    b: { ...DE_PIE, mano: [64, 28], adelante: mancuerna(65, 27) },
  },

  press_inclinado: (() => {
    const recostado = { cabeza: [31, 26], hombro: [36, 37], cadera: [50, 62], rodilla: [68, 60], pie: [70, 90] };
    return {
      equipo: `<line class="e-respaldo" x1="31" y1="31" x2="47" y2="66"/>${asiento(46, 64, 65)}
        <line class="e-pata" x1="38" y1="50" x2="34" y2="92"/>`,
      a: { ...recostado, codo: [30, 50], mano: [40, 36], adelante: mancuerna(41, 35) },
      b: { ...recostado, codo: [44, 25], mano: [48, 12], adelante: mancuerna(48, 12) },
    };
  })(),

  remo_sentado: (() => {
    const sentado = { cabeza: [35, 33], hombro: [33, 44], cadera: [30, 70], rodilla: [48, 62], pie: [63, 74] };
    return {
      equipo: `${banco(18, 40, 72)}<rect class="e-equipo" x="64" y="62" width="4" height="30" rx="2"/>
        ${torre(84, 40)}${polea(82, 74)}`,
      a: { ...sentado, codo: [46, 48], mano: [58, 52], atras: cable([82, 74], [58, 52]), adelante: asa(58, 52) },
      b: { ...sentado, codo: [21, 50], mano: [34, 53], atras: cable([82, 74], [34, 53]), adelante: asa(34, 53) },
    };
  })(),

  // Vista de frente
  elevaciones_laterales: (() => {
    const frente = {
      cabeza: [50, 13], hombro: [41, 25], hombro2: [59, 25], cadera: [45, 52], cadera2: [55, 52],
      rodilla: [44, 71], pie: [43, 90], rodilla2: [56, 71], pie2: [57, 90],
    };
    return {
      equipo: '',
      a: { ...frente, codo: [39, 39], mano: [38, 52], codo2: [61, 39], mano2: [62, 52],
        adelante: mancuerna(38, 54) + mancuerna(62, 54) },
      b: { ...frente, codo: [29, 26], mano: [16, 27], codo2: [71, 26], mano2: [84, 27],
        adelante: mancuerna(16, 27) + mancuerna(84, 27) },
    };
  })(),

  // Vista de espaldas, sentado en la máquina
  deltoide_posterior: (() => {
    const espalda = {
      cabeza: [50, 15], hombro: [41, 27], hombro2: [59, 27], cadera: [45, 58], cadera2: [55, 58],
      rodilla: [42, 72], pie: [41, 90], rodilla2: [58, 72], pie2: [59, 90],
    };
    return {
      equipo: `${asiento(34, 66, 60)}${torre(10, 12)}${torre(84, 12)}`,
      a: { ...espalda, codo: [44, 30], mano: [47, 31], codo2: [56, 30], mano2: [53, 31],
        atras: cable([16, 22], [47, 31]) + cable([84, 22], [53, 31]), adelante: asa(47, 31) + asa(53, 31) },
      b: { ...espalda, codo: [29, 28], mano: [18, 29], codo2: [71, 28], mano2: [82, 29],
        atras: cable([16, 22], [18, 29]) + cable([84, 22], [82, 29]), adelante: asa(18, 29) + asa(82, 29) },
    };
  })(),

  // Fondos en paralelas, vista de frente (de perfil el brazo tapa el cuerpo)
  fondos_press_frances: {
    equipo: `${torre(27, 54)}${torre(67, 54)}`,
    a: { cabeza: [50, 14], hombro: [41, 26], hombro2: [59, 26], cadera: [45, 54], cadera2: [55, 54],
      rodilla: [44, 70], pie: [45, 82], rodilla2: [56, 70], pie2: [55, 82],
      codo: [35, 40], mano: [30, 54], codo2: [65, 40], mano2: [70, 54] },
    b: { cabeza: [50, 26], hombro: [41, 38], hombro2: [59, 38], cadera: [45, 64], cadera2: [55, 64],
      rodilla: [44, 78], pie: [45, 89], rodilla2: [56, 78], pie2: [55, 89],
      codo: [27, 41], mano: [30, 54], codo2: [73, 41], mano2: [70, 54] },
  },

  sentadilla: {
    equipo: '',
    a: { ...DE_PIE, rodilla: [51, 71], codo: [41, 31], mano: [47, 23], atras: disco(51, 22) },
    b: { cabeza: [53, 28], hombro: [48, 38], cadera: [36, 62], rodilla: [58, 68], pie: [50, 90],
      codo: [39, 44], mano: [45, 36], atras: disco(49, 35) },
  },

  peso_muerto_rumano: {
    equipo: '',
    a: { ...DE_PIE, adelante: disco(57, 55) },
    b: { cabeza: [73, 35], hombro: [64, 40], cadera: [42, 52], rodilla: [47, 71], pie: [48, 90],
      codo: [64, 54], mano: [63, 67], adelante: disco(63, 70) },
  },

  prensa: (() => {
    const sentado = { cabeza: [15, 40], hombro: [21, 50], cadera: [34, 72], codo: [22, 63], mano: [32, 70] };
    const plataforma = (p) => `<line class="e-plataforma" x1="${p[0] - 7}" y1="${p[1] - 7}" x2="${p[0] + 7}" y2="${p[1] + 7}"/>`;
    return {
      equipo: `<line class="e-cable" x1="40" y1="90" x2="94" y2="36"/>
        <line class="e-respaldo" x1="14" y1="42" x2="31" y2="78"/>
        <rect class="e-equipo" x="12" y="78" width="38" height="4" rx="2"/>
        <line class="e-pata" x1="18" y1="82" x2="18" y2="92"/><line class="e-pata" x1="44" y1="82" x2="44" y2="92"/>`,
      a: { ...sentado, rodilla: [44, 48], pie: [58, 58], adelante: plataforma([60, 60]) + disco(68, 50) },
      b: { ...sentado, rodilla: [54, 58], pie: [74, 42], adelante: plataforma([76, 44]) + disco(84, 34) },
    };
  })(),

  curl_femoral: (() => {
    const boca_abajo = { cabeza: [18, 53], hombro: [27, 56], cadera: [52, 56], rodilla: [70, 56], codo: [26, 67], mano: [18, 66] };
    return {
      equipo: banco(14, 76, 62),
      a: { ...boca_abajo, pie: [88, 57], adelante: rodillo(88, 52) },
      b: { ...boca_abajo, pie: [78, 38], adelante: rodillo(73, 38) },
    };
  })(),

  gemelos_pie: {
    equipo: '',
    a: { ...DE_PIE, pie: [49, 90], punta: [60, 90], adelante: mancuerna(57, 54) },
    b: { cabeza: [51, 7], hombro: [51, 18], cadera: [51, 45], rodilla: [51, 64], pie: [52, 83], punta: [61, 90],
      codo: [55, 31], mano: [57, 44], adelante: mancuerna(58, 47) },
  },

  // La plancha no se mueve: una sola postura.
  plancha: {
    equipo: '',
    a: { cabeza: [20, 67], hombro: [28, 72], cadera: [58, 80], rodilla: [72, 85], pie: [86, 89],
      codo: [28, 90], mano: [40, 90] },
  },

  zancadas: {
    equipo: '',
    a: { ...DE_PIE, rodilla2: [50, 71], pie2: [50, 90], adelante: mancuerna(57, 54) },
    b: { cabeza: [46, 24], hombro: [46, 35], cadera: [46, 62], rodilla: [62, 66], pie: [62, 90],
      rodilla2: [36, 86], pie2: [22, 88], codo: [46, 49], mano: [46, 62], adelante: mancuerna(46, 65) },
  },

  hip_thrust: {
    equipo: banco(8, 26, 52),
    a: { cabeza: [18, 43], hombro: [24, 52], cadera: [38, 76], rodilla: [58, 62], pie: [62, 90],
      codo: [30, 66], mano: [38, 70], adelante: disco(39, 70) },
    b: { cabeza: [13, 49], hombro: [24, 52], cadera: [46, 52], rodilla: [62, 58], pie: [62, 90],
      codo: [36, 44], mano: [45, 46], adelante: disco(46, 46) },
  },

  ext_cuadriceps: (() => {
    const sentado = { cabeza: [38, 23], hombro: [37, 34], cadera: [40, 62], rodilla: [60, 62], codo: [36, 48], mano: [46, 62] };
    return {
      equipo: `${asiento(28, 58, 64)}<rect class="e-equipo" x="25" y="30" width="5" height="36" rx="2"/>`,
      a: { ...sentado, pie: [60, 88], adelante: rodillo(64, 86) },
      b: { ...sentado, pie: [84, 58], adelante: rodillo(84, 54) },
    };
  })(),

  curl_femoral_sentado: (() => {
    const sentado = { cabeza: [38, 23], hombro: [37, 34], cadera: [40, 62], rodilla: [60, 62], codo: [36, 48], mano: [46, 62] };
    return {
      equipo: `${asiento(28, 58, 64)}<rect class="e-equipo" x="25" y="30" width="5" height="36" rx="2"/>
        <rect class="e-equipo" x="44" y="54" width="16" height="4" rx="2"/>`,
      a: { ...sentado, pie: [84, 60], adelante: rodillo(84, 64) },
      b: { ...sentado, pie: [54, 84], adelante: rodillo(50, 82) },
    };
  })(),

  gemelos_sentado: {
    equipo: `${asiento(26, 50, 64)}<rect class="e-equipo" x="60" y="84" width="14" height="8" rx="1"/>`,
    a: { cabeza: [38, 23], hombro: [38, 34], cadera: [38, 62], rodilla: [58, 60], pie: [60, 88], punta: [68, 84],
      codo: [44, 46], mano: [54, 56], adelante: '<rect class="e-peso" x="50" y="52" width="16" height="4" rx="2"/>' },
    b: { cabeza: [38, 23], hombro: [38, 34], cadera: [38, 62], rodilla: [58, 55], pie: [60, 80], punta: [68, 84],
      codo: [44, 43], mano: [54, 51], adelante: '<rect class="e-peso" x="50" y="47" width="16" height="4" rx="2"/>' },
  },
};

// Dibuja el monito en una postura.
function dibujarPostura(p) {
  const linea = (a, b) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
  const deFrente = !!p.hombro2;
  let lejos = '';   // brazo/pierna del otro lado (de perfil se ve más oscuro)
  let cuerpo = '';

  if (deFrente) {
    const medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    cuerpo += linea(p.hombro, p.hombro2) + linea(p.cadera, p.cadera2) + linea(medio(p.hombro, p.hombro2), medio(p.cadera, p.cadera2));
    cuerpo += linea(p.hombro2, p.codo2) + linea(p.codo2, p.mano2) + linea(p.cadera2, p.rodilla2) + linea(p.rodilla2, p.pie2);
  } else {
    cuerpo += linea(p.hombro, p.cadera);
    if (p.rodilla2) lejos += linea(p.cadera, p.rodilla2) + linea(p.rodilla2, p.pie2);
  }
  cuerpo += linea(p.cadera, p.rodilla) + linea(p.rodilla, p.pie) + linea(p.hombro, p.codo) + linea(p.codo, p.mano);
  if (p.punta) cuerpo += linea(p.pie, p.punta);

  return `
    ${p.atras || ''}
    <g class="e-lejos">${lejos}</g>
    <g class="e-cuerpo">${cuerpo}</g>
    <circle class="e-cabeza" cx="${p.cabeza[0]}" cy="${p.cabeza[1]}" r="6"/>
    ${p.adelante || ''}`;
}

// El dibujo completo de un ejercicio, con las dos posturas alternándose.
function svgEjercicio(idEjercicio) {
  const d = DIBUJOS[idEjercicio];
  if (!d) return '';
  const posturas = d.b
    ? `<g class="pose-a">${dibujarPostura(d.a)}</g><g class="pose-b">${dibujarPostura(d.b)}</g>`
    : dibujarPostura(d.a);
  return `
    <svg class="ejercicio-dibujo" viewBox="0 0 100 100" role="img" aria-label="Cómo se hace: ${EJERCICIOS[idEjercicio].nombre}">
      <line class="e-suelo" x1="4" y1="92.5" x2="96" y2="92.5"/>
      ${d.equipo}
      ${posturas}
    </svg>`;
}

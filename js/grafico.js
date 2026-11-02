// =====================================================
// grafico.js — Dibuja un gráfico de línea, hecho a mano en SVG.
//
// SVG es un "dibujo hecho con texto": le dices "línea de aquí a
// allá", "círculo en este punto", y el navegador lo dibuja.
// No usamos ninguna librería de internet, así funciona sin conexión.
// Lo usan Progreso (peso por ejercicio) y Peso corporal.
// =====================================================

// Elige números redondos para las rayas del eje (50, 55, 60...
// en vez de 51.3, 54.7...). Devuelve la lista de valores.
function ticksBonitos(min, max, cantidad = 4) {
  if (min === max) { min -= 1; max += 1; }
  const pasoCrudo = (max - min) / cantidad;
  const potencia = Math.pow(10, Math.floor(Math.log10(pasoCrudo)));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= pasoCrudo);
  const ticks = [];
  for (let v = Math.floor(min / paso) * paso; v <= Math.ceil(max / paso) * paso + paso / 2; v += paso) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

// puntos: [{ fecha: Date, valor: número, etiqueta?: texto }, ...] de la más vieja a la más nueva.
//         Es la línea principal; "etiqueta" es lo que sale al tocar el punto.
// opciones.fondo: otros puntos [{ fecha, valor }] que se dibujan como
//         puntitos grises detrás de la línea (ej.: cada pesaje diario).
function dibujarGrafico(contenedor, puntos, unidad, opciones = {}) {
  const fondo = opciones.fondo || [];
  const ancho = contenedor.clientWidth || 340;
  const alto = 220;
  const margen = { izq: 40, der: 16, arr: 24, aba: 26 };

  // ---- Escalas: convierten "fecha" y "valor" en posiciones en pixeles ----
  // Miramos los puntos de la línea Y los del fondo para que todos quepan.
  const todos = [...puntos, ...fondo];
  const todosTiempos = todos.map((p) => p.fecha.getTime());
  const todosValores = todos.map((p) => p.valor);
  const ticks = ticksBonitos(Math.min(...todosValores), Math.max(...todosValores));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const tMin = Math.min(...todosTiempos);
  const tMax = Math.max(...todosTiempos);

  const posX = (t) => (tMax === tMin
    ? (margen.izq + ancho - margen.der) / 2 // todo el mismo día: al centro
    : margen.izq + ((t - tMin) / (tMax - tMin)) * (ancho - margen.izq - margen.der));
  const posY = (v) => margen.arr + (1 - (v - yMin) / (yMax - yMin)) * (alto - margen.arr - margen.aba);

  const valores = puntos.map((p) => p.valor);
  const xs = puntos.map((p) => posX(p.fecha.getTime()));
  const ys = valores.map(posY);
  const fecha = (d) => d.toLocaleDateString('es', { day: 'numeric', month: 'short' });

  // ---- Partes del dibujo ----
  const rayas = ticks.map((v) => `
    <line class="g-rejilla" x1="${margen.izq}" x2="${ancho - margen.der}" y1="${posY(v)}" y2="${posY(v)}"/>
    <text class="g-eje" x="${margen.izq - 6}" y="${posY(v) + 4}" text-anchor="end">${numero(v)}</text>`).join('');

  // Fecha más vieja a la izquierda y más nueva a la derecha.
  const unSoloDia = tMax === tMin;
  const fechas = `
    <text class="g-eje" x="${posX(tMin)}" y="${alto - 6}" text-anchor="${unSoloDia ? 'middle' : 'start'}">${fecha(new Date(tMin))}</text>
    ${unSoloDia ? '' : `<text class="g-eje" x="${posX(tMax)}" y="${alto - 6}" text-anchor="end">${fecha(new Date(tMax))}</text>`}`;

  const puntosFondo = fondo.map((p) => `<circle class="g-fondo" cx="${posX(p.fecha.getTime())}" cy="${posY(p.valor)}" r="2.5"/>`).join('');

  // "M x,y L x,y L x,y" = muévete al primer punto y traza líneas a los siguientes
  const trazo = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const circulos = xs.map((x, i) => `<circle class="g-punto" cx="${x}" cy="${ys[i]}" r="4"/>`).join('');

  // Solo etiquetamos el último valor (poner número en cada punto ensucia).
  const ultimoX = xs[xs.length - 1];
  const ultimoY = ys[ys.length - 1];
  const etiquetaFinal = `<text class="g-valor" x="${ultimoX}" y="${ultimoY - 10}" text-anchor="${ultimoX > ancho / 2 ? 'end' : 'middle'}">${numero(valores[valores.length - 1])} ${unidad}</text>`;

  contenedor.innerHTML = `
    <svg viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img"
         aria-label="Gráfico, de ${numero(valores[0])} a ${numero(valores[valores.length - 1])} ${unidad}">
      ${rayas}
      ${fechas}
      ${puntosFondo}
      <line class="g-guia" x1="0" x2="0" y1="${margen.arr}" y2="${alto - margen.aba}" visibility="hidden"/>
      <path class="g-linea" d="${trazo}"/>
      ${circulos}
      ${etiquetaFinal}
      <circle class="g-foco" r="6" visibility="hidden"/>
      <rect class="g-toque" x="0" y="0" width="${ancho}" height="${alto}"/>
    </svg>
    <div class="g-tip" hidden></div>`;

  // ---- Tocar el gráfico: muestra el valor del punto más cercano ----
  const svg = contenedor.querySelector('svg');
  const guia = svg.querySelector('.g-guia');
  const foco = svg.querySelector('.g-foco');
  const tip = contenedor.querySelector('.g-tip');

  function mostrar(evento) {
    const caja = svg.getBoundingClientRect();
    const x = (evento.clientX - caja.left) * (ancho / caja.width);
    let i = 0;
    xs.forEach((px, j) => { if (Math.abs(px - x) < Math.abs(xs[i] - x)) i = j; });

    guia.setAttribute('x1', xs[i]);
    guia.setAttribute('x2', xs[i]);
    guia.setAttribute('visibility', 'visible');
    foco.setAttribute('cx', xs[i]);
    foco.setAttribute('cy', ys[i]);
    foco.setAttribute('visibility', 'visible');

    tip.innerHTML = `<span>${puntos[i].etiqueta || fecha(puntos[i].fecha)}</span><strong>${numero(valores[i])} ${unidad}</strong>`;
    tip.hidden = false;
    // Que la cajita no se salga por los lados
    const izquierda = Math.min(Math.max(xs[i] - tip.offsetWidth / 2, 0), ancho - tip.offsetWidth);
    tip.style.left = `${izquierda}px`;
  }

  function ocultar() {
    guia.setAttribute('visibility', 'hidden');
    foco.setAttribute('visibility', 'hidden');
    tip.hidden = true;
  }

  const capa = svg.querySelector('.g-toque');
  capa.addEventListener('pointerdown', mostrar);
  capa.addEventListener('pointermove', mostrar);
  // Con mouse se oculta al salir; con el dedo se queda hasta el siguiente toque.
  capa.addEventListener('pointerleave', (evento) => { if (evento.pointerType === 'mouse') ocultar(); });
}

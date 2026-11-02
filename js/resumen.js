// =====================================================
// resumen.js — Resumen de la semana (de lunes a domingo).
// =====================================================

let lunesResumen = lunesDe(claveFecha(new Date())); // la semana que estás mirando

function promedio(lista) {
  return lista.length ? lista.reduce((t, x) => t + x, 0) / lista.length : 0;
}

function pintarResumenSemanal() {
  const hoy = claveFecha(new Date());
  // Los 7 días de la semana como claves "2026-11-02"
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunesResumen, i));
  const domingo = dias[6];
  const fechaCortaClave = (clave) => fechaCorta(fechaDeClave(clave));

  $('#resumen-semana').textContent = lunesResumen === lunesDe(hoy)
    ? 'Esta semana'
    : `${fechaCortaClave(lunesResumen)} – ${fechaCortaClave(domingo)}`;
  $('#resumen-siguiente').disabled = lunesResumen >= lunesDe(hoy);

  // ---- Entrenamiento ----
  const sesiones = datos.sesiones.filter((s) => {
    const dia = claveFecha(new Date(s.inicio));
    return dia >= lunesResumen && dia <= domingo;
  });
  const diasEntrenados = new Set(sesiones.map((s) => claveFecha(new Date(s.inicio))));
  const gastadasSemana = sesiones.reduce((t, s) => t + caloriasSesion(s).total, 0);
  // En la semana actual dividimos solo por los días que ya pasaron.
  const diasTranscurridos = dias.filter((d) => d <= hoy).length || 1;
  const gastadasPorDia = gastadasSemana / diasTranscurridos;

  // ---- Comida (solo cuenta los días en que anotaste algo) ----
  const diasConComida = dias.filter((d) => comidasDelDia(d).length > 0);
  const totales = diasConComida.map(totalesDelDia);
  const consumidasPorDia = promedio(totales.map((t) => t.kcal));
  const proteinaPorDia = promedio(totales.map((t) => t.proteina));
  const diasEnMeta = totales.filter((t) => t.proteina >= datos.perfil.proteinaMin).length;

  // ---- Peso: promedio de esta semana contra el de la anterior ----
  const semanasPeso = promediosSemanales(datos.pesos);
  const pesoEsta = semanasPeso.find((s) => s.lunes === lunesResumen);
  const pesoAnterior = semanasPeso.find((s) => s.lunes === sumarDias(lunesResumen, -7));
  let textoPeso = 'Sin pesajes esta semana';
  let valorPeso = '—';
  if (pesoEsta) {
    valorPeso = `${numero(pesoEsta.promedio)} kg`;
    if (pesoAnterior) {
      const cambio = pesoEsta.promedio - pesoAnterior.promedio;
      if (Math.abs(cambio) < 0.1) textoPeso = 'Estable respecto a la semana anterior';
      else textoPeso = `${cambio < 0 ? '▼ Bajaste' : '▲ Subiste'} ${numero(Math.abs(cambio))} kg vs. la semana anterior`;
    } else {
      textoPeso = 'Promedio de la semana (no hay semana anterior para comparar)';
    }
  }

  // ---- Tira de 7 días: verde = entrenaste, puntito = anotaste comida ----
  const letras = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const tira = dias.map((d, i) => `
    <div class="dia-semana ${diasEntrenados.has(d) ? 'entreno' : ''} ${d === hoy ? 'hoy' : ''} ${d > hoy ? 'futuro' : ''}">
      <span>${letras[i]}</span>
      <strong>${fechaDeClave(d).getDate()}</strong>
      <i class="${comidasDelDia(d).length ? 'con-comida' : ''}"></i>
    </div>`).join('');

  $('#resumen-semanal').innerHTML = `
    <div class="tira-semana">${tira}</div>
    <div class="leyenda-semana">
      <span><i class="muestra m-principal"></i>Entrenaste</span>
      <span><i class="punto-comida"></i>Anotaste comida</span>
    </div>

    <div class="cuadros">
      <div class="cuadro">
        <span>Días entrenados</span>
        <strong>${diasEntrenados.size}</strong>
        <small>${sesiones.length ? sesiones.map((s) => DIAS[s.dia] ? DIAS[s.dia].nombre.split(' — ')[0] : s.dia).join(', ') : 'Ninguno todavía'}</small>
      </div>
      <div class="cuadro">
        <span>Gastadas con ejercicio</span>
        <strong>~${Math.round(gastadasPorDia)}</strong>
        <small>kcal por día · ${gastadasSemana} en la semana</small>
      </div>
      <div class="cuadro">
        <span>Consumidas</span>
        <strong>${diasConComida.length ? Math.round(consumidasPorDia) : '—'}</strong>
        <small>${diasConComida.length ? `kcal por día · promedio de ${diasConComida.length} ${diasConComida.length === 1 ? 'día anotado' : 'días anotados'}` : 'No anotaste comida'}</small>
      </div>
      <div class="cuadro">
        <span>Proteína</span>
        <strong>${diasConComida.length ? `${Math.round(proteinaPorDia)} g` : '—'}</strong>
        <small>${diasConComida.length ? `por día · ${diasEnMeta} de ${diasConComida.length} días en meta (${datos.perfil.proteinaMin} g)` : 'No anotaste comida'}</small>
      </div>
      <div class="cuadro cuadro-ancho">
        <span>Peso</span>
        <strong>${valorPeso}</strong>
        <small>${textoPeso}</small>
      </div>
    </div>

    <p class="nota">Las calorías gastadas son una estimación: incluyen tus entrenamientos
      y la caminata al gym, no lo que tu cuerpo gasta solo por vivir. Úsalas para comparar
      semanas entre sí, no como número exacto.</p>`;
}

$('#resumen-anterior').addEventListener('click', () => {
  lunesResumen = sumarDias(lunesResumen, -7);
  pintarResumenSemanal();
});
$('#resumen-siguiente').addEventListener('click', () => {
  lunesResumen = sumarDias(lunesResumen, 7);
  pintarResumenSemanal();
});

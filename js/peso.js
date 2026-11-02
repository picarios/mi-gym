// =====================================================
// peso.js — Pantalla de peso corporal.
//
// ¿Por qué promedio semanal? Tu peso de un día a otro sube y baja
// 1–2 kg por agua, sal o lo que comiste anoche. Eso no es grasa.
// El promedio de la semana borra ese ruido y muestra la tendencia real.
// =====================================================

// El peso más reciente que anotaste (o 94 kg si todavía no anotas nada).
// Lo usaremos en la Etapa 5 para calcular calorías gastadas.
function pesoActual() {
  return datos.pesos.length ? datos.pesos[datos.pesos.length - 1].kg : datos.perfil.pesoInicial;
}

// Agrupa los pesajes por semana (de lunes a domingo) y saca el promedio de cada una.
function promediosSemanales(pesos) {
  const semanas = {};
  pesos.forEach((p) => {
    const lunes = lunesDe(p.fecha);
    if (!semanas[lunes]) semanas[lunes] = [];
    semanas[lunes].push(p);
  });

  return Object.keys(semanas).sort().map((lunes) => {
    const lista = semanas[lunes];
    const promedio = lista.reduce((total, p) => total + p.kg, 0) / lista.length;
    // El punto del promedio va en el "centro" de los días que te pesaste esa semana.
    const centro = lista.reduce((total, p) => total + fechaDeClave(p.fecha).getTime(), 0) / lista.length;
    return { lunes, promedio, cantidad: lista.length, fecha: new Date(centro) };
  });
}

function pintarPeso() {
  $('#peso-fecha').value = claveFecha(new Date());
  $('#peso-fecha').max = claveFecha(new Date()); // no se puede anotar un día futuro
  $('#peso-kg').placeholder = String(pesoActual());

  const contenido = $('#peso-contenido');
  if (datos.pesos.length === 0) {
    contenido.innerHTML = `<p class="vacio">Anota tu peso para empezar. Lo ideal: en ayunas,
      después de ir al baño, 3 o más veces por semana.</p>`;
    return;
  }

  const semanas = promediosSemanales(datos.pesos);
  const ultimo = datos.pesos[datos.pesos.length - 1];
  const estaSemana = semanas[semanas.length - 1];
  const anterior = semanas[semanas.length - 2];

  let cambio = '—';
  if (anterior) {
    const diferencia = estaSemana.promedio - anterior.promedio;
    cambio = `${diferencia > 0 ? '+' : ''}${numero(diferencia)}`;
  }

  contenido.innerHTML = `
    <div class="stats">
      <div class="stat"><strong>${numero(ultimo.kg)}</strong><span>último pesaje</span></div>
      <div class="stat"><strong>${numero(estaSemana.promedio)}</strong><span>promedio semana</span></div>
      <div class="stat"><strong>${cambio}</strong><span>vs. semana anterior</span></div>
    </div>
    <div class="grafico" id="grafico-peso"></div>
    <div class="leyenda-grafico">
      <span><i class="muestra-punto"></i>Cada pesaje</span>
      <span><i class="muestra-linea"></i>Promedio semanal</span>
    </div>
    <h2 class="titulo-seccion">Registros</h2>
    ${datos.pesos.slice().reverse().map((p) => `
      <div class="fila-peso">
        <span>${fechaLarga(fechaDeClave(p.fecha))}</span>
        <strong>${numero(p.kg)} kg</strong>
        <button class="btn-borrar" data-borrar-peso="${p.fecha}" aria-label="Borrar">×</button>
      </div>`).join('')}`;

  dibujarGrafico(
    $('#grafico-peso'),
    semanas.map((s) => ({
      fecha: s.fecha,
      valor: s.promedio,
      etiqueta: `Semana del ${fechaCorta(fechaDeClave(s.lunes))} (${s.cantidad} ${s.cantidad === 1 ? 'pesaje' : 'pesajes'})`,
    })),
    'kg',
    { fondo: datos.pesos.map((p) => ({ fecha: fechaDeClave(p.fecha), valor: p.kg })) },
  );
}

$('#btn-guardar-peso').addEventListener('click', () => {
  const kg = aNumero($('#peso-kg').value);
  const fecha = $('#peso-fecha').value;
  if (kg == null || kg < 30 || kg > 300) {
    alert('Escribe tu peso en kilos, por ejemplo 93,5');
    return;
  }
  if (!fecha) return;

  // Un solo peso por día: si ya había uno ese día, lo reemplaza.
  datos.pesos = datos.pesos.filter((p) => p.fecha !== fecha);
  datos.pesos.push({ fecha, kg });
  // Ordenar por fecha. Como son textos "2026-11-02", el orden alfabético sirve.
  datos.pesos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  guardarDatos(datos);

  $('#peso-kg').value = '';
  $('#peso-kg').blur();
  pintarPeso();
});

$('#peso-contenido').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-borrar-peso]');
  if (!boton) return;
  if (!confirm('¿Borrar este pesaje?')) return;
  datos.pesos = datos.pesos.filter((p) => p.fecha !== boton.dataset.borrarPeso);
  guardarDatos(datos);
  pintarPeso();
});

// =====================================================
// comida.js — Pantalla de comida: lo que comes, calorías y
// la barra de proteína.
//
// Cada vez que agregas algo, guardamos una COPIA de sus valores
// en ese día. Así, si después cambias la lista rápida (por ejemplo,
// corriges las calorías del pan), los días pasados no se alteran.
// =====================================================

let diaComida = claveFecha(new Date()); // el día que estás mirando
let editandoLista = false;
let modoVentana = 'otro';               // 'otro' | 'editar' | 'nuevo'
let alimentoEditando = null;

function comidasDelDia(clave) {
  return datos.comidas[clave] || [];
}

// Suma calorías y proteína de un día (porción × cantidad).
function totalesDelDia(clave) {
  return comidasDelDia(clave).reduce((total, c) => ({
    kcal: total.kcal + c.kcal * c.cantidad,
    proteina: total.proteina + c.proteina * c.cantidad,
  }), { kcal: 0, proteina: 0 });
}

function nombreDelDia(clave) {
  const hoy = claveFecha(new Date());
  if (clave === hoy) return 'Hoy';
  if (clave === sumarDias(hoy, -1)) return 'Ayer';
  return fechaLarga(fechaDeClave(clave));
}

function pintarComida() {
  $('#comida-dia').textContent = nombreDelDia(diaComida);
  $('#comida-siguiente').disabled = diaComida >= claveFecha(new Date());
  pintarProteina();
  pintarRapidos();
  pintarLoQueComi();
}

// ---------- Barra de proteína ----------

function pintarProteina() {
  const { proteina, kcal } = totalesDelDia(diaComida);
  const { proteinaMin: min, proteinaMax: max } = datos.perfil;
  const tope = max * 1.15; // la barra llega un poco más allá de 170 para que se vea el rango
  const porcentaje = (valor) => `${Math.min(valor / tope, 1) * 100}%`;

  let mensaje;
  if (proteina < min) {
    mensaje = `Te faltan <strong>${Math.ceil(min - proteina)} g</strong> para tu mínimo de ${min} g.`;
  } else if (proteina <= max) {
    mensaje = '<strong>¡Meta cumplida!</strong> Estás dentro de tu rango.';
  } else {
    mensaje = `Pasaste tu rango por ${Math.round(proteina - max)} g. No pasa nada; solo que no hace falta más.`;
  }

  $('#tarjeta-proteina').innerHTML = `
    <div class="prot-cifras">
      <strong>${Math.round(proteina)} g</strong>
      <span>de proteína · meta ${min}–${max} g</span>
    </div>
    <div class="prot-barra" role="img" aria-label="${Math.round(proteina)} de ${min} gramos">
      <div class="prot-rango" style="left:${porcentaje(min)}; width:calc(${porcentaje(max)} - ${porcentaje(min)})"></div>
      <div class="prot-relleno" style="width:${porcentaje(proteina)}"></div>
    </div>
    <p class="prot-mensaje">${mensaje}</p>
    <p class="prot-kcal"><strong>${Math.round(kcal)}</strong> kcal consumidas</p>`;
}

// ---------- Lista rápida ----------

function pintarRapidos() {
  $('#btn-editar-lista').textContent = editandoLista ? 'Listo' : 'Editar lista';
  $('#lista-rapida').innerHTML = datos.alimentos.map((a) => `
    <button class="rapido ${editandoLista ? 'editando' : ''}" data-alimento="${a.id}">
      <strong>${escaparHTML(a.nombre)}</strong>
      <span>${escaparHTML(a.porcion)}</span>
      <span class="rapido-valores">${numero(a.proteina)} g prot · ${Math.round(a.kcal)} kcal</span>
      ${editandoLista ? '<em>Editar</em>' : ''}
    </button>`).join('')
    + (editandoLista ? '<button class="rapido rapido-nuevo" data-nuevo>+ Nuevo alimento</button>' : '');
}

$('#btn-editar-lista').addEventListener('click', () => {
  editandoLista = !editandoLista;
  pintarRapidos();
});

$('#lista-rapida').addEventListener('click', (evento) => {
  if (evento.target.closest('[data-nuevo]')) return abrirVentanaAlimento('nuevo');
  const boton = evento.target.closest('[data-alimento]');
  if (!boton) return;
  const alimento = datos.alimentos.find((a) => a.id === boton.dataset.alimento);
  if (editandoLista) return abrirVentanaAlimento('editar', alimento);

  agregarComida(alimento);
  // Un destello en el botón para que sepas que se agregó.
  const nuevoBoton = $(`#lista-rapida [data-alimento="${alimento.id}"]`);
  nuevoBoton.classList.add('agregado');
  setTimeout(() => nuevoBoton.classList.remove('agregado'), 400);
});

// Agrega 1 porción. Si ese alimento ya estaba en el día, suma 1 a la cantidad.
function agregarComida(alimento) {
  if (!datos.comidas[diaComida]) datos.comidas[diaComida] = [];
  const lista = datos.comidas[diaComida];
  const yaEsta = alimento.id && lista.find((c) => c.alimentoId === alimento.id);
  if (yaEsta) {
    yaEsta.cantidad += 1;
  } else {
    lista.push({
      id: String(Date.now()),
      alimentoId: alimento.id || null,
      nombre: alimento.nombre,
      porcion: alimento.porcion,
      kcal: alimento.kcal,
      proteina: alimento.proteina,
      cantidad: 1,
    });
  }
  guardarDatos(datos);
  pintarComida();
}

// ---------- Lo que comí ----------

function pintarLoQueComi() {
  const lista = comidasDelDia(diaComida);
  if (lista.length === 0) {
    $('#lo-que-comi').innerHTML = '<p class="vacio vacio-chico">Todavía nada. Toca un alimento de arriba para sumarlo.</p>';
    return;
  }
  $('#lo-que-comi').innerHTML = lista.map((c) => `
    <div class="comida-item" data-comida="${c.id}">
      <div class="comida-texto">
        <strong>${escaparHTML(c.nombre)}</strong>
        <span>${numero(c.cantidad)} × ${escaparHTML(c.porcion)}</span>
        <span>${numero(c.proteina * c.cantidad)} g prot · ${Math.round(c.kcal * c.cantidad)} kcal</span>
      </div>
      <div class="cantidad">
        <button data-cambiar="-0.5" aria-label="Quitar media porción">−</button>
        <span>${numero(c.cantidad)}</span>
        <button data-cambiar="0.5" aria-label="Sumar media porción">+</button>
      </div>
    </div>`).join('');
}

// Los botones − y + cambian de media en media porción (por si comes 150 g de pollo).
$('#lo-que-comi').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-cambiar]');
  if (!boton) return;
  const id = boton.closest('[data-comida]').dataset.comida;
  const lista = datos.comidas[diaComida];
  const item = lista.find((c) => c.id === id);
  item.cantidad += Number(boton.dataset.cambiar);
  if (item.cantidad <= 0) datos.comidas[diaComida] = lista.filter((c) => c.id !== id);
  guardarDatos(datos);
  pintarComida();
});

// ---------- Cambiar de día ----------

$('#comida-anterior').addEventListener('click', () => {
  diaComida = sumarDias(diaComida, -1);
  pintarComida();
});
$('#comida-siguiente').addEventListener('click', () => {
  diaComida = sumarDias(diaComida, 1);
  pintarComida();
});

// ---------- Ventana para agregar / editar un alimento ----------
// La misma ventana sirve para 3 cosas:
//   'otro'   → anotar algo que no está en tu lista (y opcionalmente guardarlo)
//   'editar' → cambiar o borrar un alimento de la lista rápida
//   'nuevo'  → agregar un alimento a la lista rápida

function abrirVentanaAlimento(modo, alimento = null) {
  modoVentana = modo;
  alimentoEditando = alimento;
  const titulos = { otro: 'Otro alimento', editar: 'Editar alimento', nuevo: 'Nuevo alimento' };
  const botones = { otro: 'Agregar', editar: 'Guardar cambios', nuevo: 'Guardar en la lista' };
  $('#va-titulo').textContent = titulos[modo];
  $('#va-ok').textContent = botones[modo];
  $('#va-nombre').value = alimento ? alimento.nombre : '';
  $('#va-porcion').value = alimento ? alimento.porcion : '';
  $('#va-kcal').value = alimento ? alimento.kcal : '';
  $('#va-proteina').value = alimento ? alimento.proteina : '';
  $('#va-guardar').checked = false;
  $('#va-guardar-fila').hidden = modo !== 'otro';
  $('#va-borrar').hidden = modo !== 'editar';
  $('#ventana-alimento').showModal();
}

$('#btn-otro-alimento').addEventListener('click', () => abrirVentanaAlimento('otro'));
$('#va-cancelar').addEventListener('click', () => $('#ventana-alimento').close());

$('#va-ok').addEventListener('click', () => {
  const alimento = {
    nombre: $('#va-nombre').value.trim(),
    porcion: $('#va-porcion').value.trim() || '1 porción',
    kcal: aNumero($('#va-kcal').value) || 0,
    proteina: aNumero($('#va-proteina').value) || 0,
  };
  if (!alimento.nombre) {
    $('#va-nombre').focus();
    return;
  }

  if (modoVentana === 'editar') {
    Object.assign(alimentoEditando, alimento); // copia los campos nuevos encima del viejo
  } else if (modoVentana === 'nuevo' || $('#va-guardar').checked) {
    alimento.id = `a${Date.now()}`;
    datos.alimentos.push(alimento);
  }
  if (modoVentana === 'otro') agregarComida(alimento);

  guardarDatos(datos);
  $('#ventana-alimento').close();
  pintarComida();
});

$('#va-borrar').addEventListener('click', () => {
  if (!confirm(`¿Quitar "${alimentoEditando.nombre}" de tu lista rápida?`)) return;
  datos.alimentos = datos.alimentos.filter((a) => a !== alimentoEditando);
  guardarDatos(datos);
  $('#ventana-alimento').close();
  pintarComida();
});

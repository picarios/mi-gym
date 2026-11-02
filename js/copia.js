// =====================================================
// copia.js — Copia de seguridad: exportar e importar tus datos.
//
// ¿Por qué? Tus datos viven solo dentro de la app en tu iPhone.
// Si borras la app, cambias de teléfono o iOS limpia el espacio,
// se pierden. La copia es un archivo .json (texto con todos tus
// datos) que guardas en Archivos, iCloud o te mandas por WhatsApp.
// =====================================================

const DIAS_PARA_RECORDAR = 7;

function diasDesdeUltimaCopia() {
  if (!datos.ultimaCopia) return null;
  return Math.floor((Date.now() - new Date(datos.ultimaCopia)) / 86400000);
}

function tienesDatos() {
  return datos.sesiones.length > 0 || datos.pesos.length > 0 || Object.keys(datos.comidas).length > 0;
}

function pintarCopia() {
  const dias = diasDesdeUltimaCopia();
  let texto = 'Todavía no hiciste ninguna copia.';
  if (dias === 0) texto = 'Última copia: hoy.';
  else if (dias === 1) texto = 'Última copia: ayer.';
  else if (dias !== null) texto = `Última copia: hace ${dias} días.`;
  $('#copia-estado').textContent = texto;

  // Aviso arriba en el inicio si toca hacer copia.
  const toca = tienesDatos() && (dias === null || dias >= DIAS_PARA_RECORDAR);
  $('#tarjeta-copia').classList.toggle('alerta', toca);
  $('#aviso-copia').hidden = !toca;
}

function exportarDatos() {
  datos.ultimaCopia = new Date().toISOString();
  guardarDatos(datos);

  const nombre = `mi-gym-${claveFecha(new Date())}.json`;
  // JSON.stringify(datos, null, 2) = convertir a texto, con sangría para que se pueda leer.
  const archivo = new File([JSON.stringify(datos, null, 2)], nombre, { type: 'application/json' });

  // En el celular abrimos el menú "Compartir" (ahí eliges "Guardar en Archivos").
  // En la computadora, simplemente se descarga.
  const esCelular = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (esCelular && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    navigator.share({ files: [archivo], title: 'Copia de Mi Gym' }).catch(() => { /* cerraste el menú */ });
  } else {
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  }
  pintarCopia();
}

async function importarDatos(archivo) {
  try {
    const nuevos = JSON.parse(await archivo.text());
    if (!Array.isArray(nuevos.sesiones)) throw new Error('No es una copia de Mi Gym');

    const contenido = `${nuevos.sesiones.length} entrenamientos, ${(nuevos.pesos || []).length} pesajes `
      + `y ${Object.keys(nuevos.comidas || {}).length} días de comida`;
    if (!confirm(`El archivo tiene ${contenido}.\n\nEsto REEMPLAZA todo lo que hay ahora en la app. ¿Continuar?`)) return;

    datos = { ...datosIniciales(), ...nuevos };
    guardarDatos(datos);
    alert('Listo: tus datos se recuperaron.');
    location.reload(); // recargamos para que todas las pantallas lean los datos nuevos
  } catch (error) {
    alert('Ese archivo no es una copia de Mi Gym (o está dañado).');
  }
}

$('#btn-exportar').addEventListener('click', exportarDatos);
// El botón "Importar" abre el selector de archivos escondido.
$('#btn-importar').addEventListener('click', () => $('#input-importar').click());
$('#input-importar').addEventListener('change', (evento) => {
  const archivo = evento.target.files[0];
  evento.target.value = ''; // para poder elegir el mismo archivo otra vez
  if (archivo) importarDatos(archivo);
});
$('#aviso-copia').addEventListener('click', () => {
  $('#tarjeta-copia').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

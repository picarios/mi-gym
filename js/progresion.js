// =====================================================
// progresion.js — ¿Toca subir el peso?
//
// Tu regla: si la última vez completaste TODAS las series
// llegando al tope del rango (por ejemplo 4 series de 15 en un
// rango de 10–15), hoy toca subir el peso.
// =====================================================

// Cuántos kilos subir: lo que diga el ejercicio en rutina.js,
// o si no dice nada, 1 kg en aislamientos y 2,5 kg en el resto.
function incrementoKg(idEjercicio) {
  const def = EJERCICIOS[idEjercicio];
  if (def.subir) return def.subir;
  return def.clase === 'aislamiento' ? 1 : 2.5;
}

// Devuelve null si no toca subir, o un objeto con:
//   kg:      el peso sugerido para hoy (null si no aplica)
//   mensaje: el texto que se muestra en la tarjeta
function sugerenciaProgresion(datos, idEjercicio) {
  const ultima = ultimaVezEjercicio(datos, idEjercicio);
  if (!ultima) return null;

  // .every() = "¿TODAS cumplen?". Si una sola serie quedó corta, no toca subir.
  const completas = ultima.series.length >= ultima.planeadas
    && ultima.series.every((s) => s.reps >= ultima.max);
  if (!completas) return null;

  if (EJERCICIOS[idEjercicio].tipo === 'tiempo') {
    return { kg: null, mensaje: `La última vez aguantaste ${ultima.max} s en todas. Súbele: más segundos o un disco encima.` };
  }

  // Si usaste pesos distintos en cada serie, tomamos el más alto.
  const pesoUsado = Math.max(...ultima.series.map((s) => s.kg || 0));
  if (pesoUsado === 0) {
    return { kg: null, mensaje: `Completaste ${ultima.planeadas}×${ultima.max} sin peso. Toca agregar peso.` };
  }

  const nuevo = pesoUsado + incrementoKg(idEjercicio);
  return {
    kg: nuevo,
    mensaje: `Completaste ${ultima.planeadas}×${ultima.max} con ${pesoUsado} kg. Hoy prueba ${nuevo} kg.`,
  };
}

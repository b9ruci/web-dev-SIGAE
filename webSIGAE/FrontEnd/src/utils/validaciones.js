const DOMINIO_INSTITUCIONAL = "@jacquescousteau.edu";

// Elimina espacios y puntos del RUT (acepta "12.345.678-9 " → "12345678-9")
export function normalizarRut(rut) {
  return rut.replace(/[\s.]/g, "");
}

// Quita tildes, pasa a minúsculas y recorta espacios extremos
export function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function validarRut(rutCompleto) {
  const rut = normalizarRut(rutCompleto);
  if (!/^\d{7,8}-[\dkK]$/.test(rut)) return false;
  const [cuerpo, dvIngresado] = rut.split("-");
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const dvEsperado = 11 - (suma % 11);
  const dv = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "k" : String(dvEsperado);
  return dv === dvIngresado.toLowerCase();
}

export function validarNombreCompleto(nombre) {
  return /\S+\s+\S+/.test(nombre.trim());
}

export function validarCorreoInstitucional(correo) {
  const normalizado = correo.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado) && normalizado.endsWith(DOMINIO_INSTITUCIONAL);
}

export function validarCorreo(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

export { DOMINIO_INSTITUCIONAL };

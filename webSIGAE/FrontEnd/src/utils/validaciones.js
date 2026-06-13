const DOMINIO_INSTITUCIONAL = "@jacquescousteau.edu";

export function validarRut(rutCompleto) {
  if (!/^\d{7,8}-[\dkK]$/.test(rutCompleto)) return false;
  const [cuerpo, dvIngresado] = rutCompleto.split("-");
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

export function validarCorreoInstitucional(correo) {
  return correo.toLowerCase().endsWith(DOMINIO_INSTITUCIONAL);
}

export function validarCorreo(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export { DOMINIO_INSTITUCIONAL };

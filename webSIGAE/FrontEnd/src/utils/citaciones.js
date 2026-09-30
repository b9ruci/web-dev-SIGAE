// Utilidades compartidas del módulo de citaciones (CU74–CU79 / RF48–RF53)

export const MODALIDADES = ["Presencial", "Online"];

// Tramos de 30 minutos en el formato que guarda citacion.Citacion_Tramo_Horario ("17:00 - 17:30")
function generarTramos(inicio = 8, fin = 18) {
  const pad = (n) => String(n).padStart(2, "0");
  const tramos = [];
  for (let h = inicio; h < fin; h++) {
    tramos.push(`${pad(h)}:00 - ${pad(h)}:30`);
    tramos.push(`${pad(h)}:30 - ${pad(h + 1)}:00`);
  }
  return tramos;
}

export const TRAMOS_HORARIOS = generarTramos();

export const MAX_MOTIVO = 500;
export const MIN_MOTIVO = 5;

// Estados tal como se almacenan en citacion.Citacion_Estado
export const ESTADO_PENDIENTE = "Pendiente de confirmación";
export const ESTADO_CONFIRMADA = "Confirmada";
export const ESTADO_CANCELADA = "Cancelada";

export const esPendiente = (c) => String(c?.Citacion_Estado || "").toLowerCase().startsWith("pendiente");
export const esConfirmada = (c) => String(c?.Citacion_Estado || "").toLowerCase().startsWith("confirmada");
export const esCancelada = (c) => String(c?.Citacion_Estado || "").toLowerCase().startsWith("cancelada");

// Fecha local de hoy en formato YYYY-MM-DD (evita el desfase de toISOString con UTC)
export function hoyISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Normaliza la fecha que llega del backend ("2026-06-20" o "2026-06-20T04:00:00.000Z") a YYYY-MM-DD
export function fechaISO(fecha) {
  if (!fecha) return "";
  return String(fecha).slice(0, 10);
}

export function formatearFecha(fecha, opciones = {}) {
  const iso = fechaISO(fecha);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fecha || "—";
  const [y, m, d] = iso.split("-").map(Number);
  const texto = new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    weekday: opciones.corta ? undefined : "long",
    day: "numeric",
    month: opciones.corta ? "short" : "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatearFechaHora(fecha, hora) {
  const base = formatearFecha(fecha, { corta: true });
  return hora ? `${base}, ${String(hora).slice(0, 5)} h` : base;
}

// Inicio del tramo en minutos, para ordenar cronológicamente dentro del mismo día
function minutosInicioTramo(tramo) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(tramo || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

export function ordenarCronologicamente(citaciones, ascendente = true) {
  const factor = ascendente ? 1 : -1;
  return [...citaciones].sort((a, b) => {
    const porFecha = fechaISO(a.Citacion_Fecha).localeCompare(fechaISO(b.Citacion_Fecha));
    if (porFecha !== 0) return porFecha * factor;
    return (minutosInicioTramo(a.Citacion_Tramo_Horario) - minutosInicioTramo(b.Citacion_Tramo_Horario)) * factor;
  });
}

// CU78: clasificación de la agenda en pendiente, futura, confirmada o cancelada.
// "Futura" = confirmada y aún por realizarse; "Confirmada" = confirmada cuya fecha ya pasó.
export const CATEGORIAS_AGENDA = [
  { clave: "todas", etiqueta: "Todas" },
  { clave: "pendiente", etiqueta: "Pendientes" },
  { clave: "futura", etiqueta: "Futuras" },
  { clave: "confirmada", etiqueta: "Confirmadas" },
  { clave: "cancelada", etiqueta: "Canceladas" },
];

export function categoriaCitacion(c) {
  if (esCancelada(c)) return "cancelada";
  if (esPendiente(c)) return "pendiente";
  if (esConfirmada(c)) return fechaISO(c.Citacion_Fecha) >= hoyISO() ? "futura" : "confirmada";
  return "pendiente";
}

const ETIQUETAS_CATEGORIA = {
  pendiente: "Pendiente",
  futura: "Futura",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export function etiquetaCategoria(c) {
  return ETIQUETAS_CATEGORIA[categoriaCitacion(c)];
}

// Una citación admite cancelación o reprogramación mientras no esté cancelada ni haya pasado su fecha
export function esEditable(c) {
  return !esCancelada(c) && fechaISO(c.Citacion_Fecha) >= hoyISO();
}

// CU75/CU77: tras una reprogramación la confirmación le corresponde a la contraparte.
// Si el backend no informa quién debe confirmar, se asume el flujo base (el apoderado confirma).
export function puedeConfirmar(c, rol) {
  if (!esPendiente(c)) return false;
  const responsable = c.Requiere_Confirmacion_De || "Apoderado";
  return responsable === rol;
}

function esDiaHabil(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dia = new Date(y, m - 1, d).getDay();
  return dia !== 0 && dia !== 6;
}

// Valida fecha y tramo (compartido por CU74 y CU77). Devuelve { campo: mensaje } con los inválidos.
export function validarFechaTramo({ fecha = "", tramo = "" }) {
  const errores = {};
  if (!fecha) errores.fecha = "La fecha es obligatoria";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) errores.fecha = "Formato de fecha inválido";
  else if (fecha < hoyISO()) errores.fecha = "La fecha no puede ser anterior a hoy";
  else if (!esDiaHabil(fecha)) errores.fecha = "La citación debe agendarse en un día hábil (lunes a viernes)";

  if (!tramo) errores.tramo = "El tramo horario es obligatorio";
  else if (!TRAMOS_HORARIOS.includes(tramo)) errores.tramo = "Tramo horario inválido";
  return errores;
}

// CU74 - Excepción 1: datos incompletos o inválidos en el formulario de citación
export function validarDatosCitacion({ estudianteId = "", fecha = "", tramo = "", motivo = "", modalidad = "" }) {
  const errores = validarFechaTramo({ fecha, tramo });
  if (!estudianteId) errores.estudianteId = "Selecciona el estudiante (y su apoderado) a citar";
  const motivoLimpio = motivo.trim();
  if (!motivoLimpio) errores.motivo = "El motivo de la citación es obligatorio";
  else if (motivoLimpio.length < MIN_MOTIVO) errores.motivo = `El motivo debe tener al menos ${MIN_MOTIVO} caracteres`;
  else if (motivoLimpio.length > MAX_MOTIVO) errores.motivo = `Máximo ${MAX_MOTIVO} caracteres`;
  if (!modalidad) errores.modalidad = "La modalidad es obligatoria";
  else if (!MODALIDADES.includes(modalidad)) errores.modalidad = "Modalidad inválida";
  return errores;
}

// CU76 - Excepción 2: el actor no ingresa un motivo de cancelación válido
export function validarMotivoCancelacion(motivo = "") {
  const limpio = motivo.trim();
  if (!limpio) return "Debe ingresar un motivo de cancelación válido";
  if (limpio.length < MIN_MOTIVO) return `El motivo debe tener al menos ${MIN_MOTIVO} caracteres`;
  if (limpio.length > MAX_MOTIVO) return `Máximo ${MAX_MOTIVO} caracteres`;
  return "";
}

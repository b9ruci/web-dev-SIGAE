// Utilidades compartidas por las vistas de horario semanal (docente / estudiante)

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export function aMinutos(hora) {
  if (!hora) return 0;
  const [h, m] = String(hora).split(":").map(Number);
  return h * 60 + (m || 0);
}

export function hhmm(hora) {
  return hora ? String(hora).slice(0, 5) : "";
}

export function minutosAHHMM(min) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function seSolapan(a, b) {
  return aMinutos(a.horaInicio) < aMinutos(b.horaFin) && aMinutos(b.horaInicio) < aMinutos(a.horaFin);
}

/**
 * Topes de horario: pares de clases activas del mismo día cuyos horarios se
 * solapan (ej. un docente con dos clases al mismo tiempo en cursos distintos).
 * Las clases suspendidas o inactivas no generan tope.
 */
export function detectarTopes(clases) {
  const activas = clases.filter((c) => !c.estado || c.estado === "Activo");
  const topes = [];

  for (let i = 0; i < activas.length; i++) {
    for (let j = i + 1; j < activas.length; j++) {
      const a = activas[i];
      const b = activas[j];
      if (a.dia === b.dia && seSolapan(a, b)) {
        topes.push({ dia: a.dia, clases: [a, b] });
      }
    }
  }

  return topes;
}

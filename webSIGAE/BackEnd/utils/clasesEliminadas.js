// Clases eliminadas desde el creador de horarios.
//
// Eliminar una clase no borra la fila de horario_asignatura: la marca con el
// estado 'Eliminado'. Así deja de ocupar su bloque (no aparece en la grilla ni
// cuenta para choques, horas o cargas docentes) pero sigue figurando en el
// listado de clases del curso, desde donde puede restaurarse.
//
// Toda consulta que trate a las clases como programadas debe excluirlas con
// claseVigente(); las que ya filtran por estado = 'Activo' no lo necesitan.

const ESTADO_ELIMINADO = 'Eliminado';

/** Condición SQL: la clase con alias `ha` no fue eliminada. */
const claseVigente = (ha = 'ha') => `${ha}.Horario_Asignatura_Estado <> '${ESTADO_ELIMINADO}'`;

/**
 * Antes de borrar bloques horarios se descartan definitivamente las clases
 * eliminadas que aún los referencian (la FK impediría borrar el bloque).
 */
async function purgarClasesEliminadas(conn, bloqueIds) {
  const ids = [].concat(bloqueIds);
  if (ids.length === 0) return;
  await conn.query(
    `DELETE FROM horario_asignatura WHERE Bloque_Horario_Id IN (?) AND Horario_Asignatura_Estado = ?`,
    [ids, ESTADO_ELIMINADO]
  );
}

module.exports = { ESTADO_ELIMINADO, claseVigente, purgarClasesEliminadas };

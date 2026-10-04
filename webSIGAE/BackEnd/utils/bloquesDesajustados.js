// Bloques horarios desajustados tras redefinir la jornada o los bloques.
//
// No se guarda ningún estado: se calcula a partir de lo que hay en la base,
// así que todos los administradores ven lo mismo. Un bloque queda
// desajustado cuando:
//   1. cae (total o parcialmente) fuera de la jornada institucional vigente, o
//   2. se superpone con un bloque más nuevo de la misma jornada, es decir,
//      fue reemplazado (ej. la clase de 9:15 cuando se crea el bloque 8:30–10:00).
// Las clases de un bloque desajustado quedan pendientes de reubicar: el
// administrador decide si migrarlas a otro bloque o eliminarlas.

const fueraDeJornada = (b) => `(
    ${b}.Bloque_Horario_Hora_Inicio < (SELECT pj.Parametro_Institucional_Inicio_Jornada FROM parametro_institucional pj
                                         WHERE pj.Parametro_Institucional_Id = ${b}.Parametro_Institucional_Id)
    OR ${b}.Bloque_Horario_Hora_Fin > (SELECT pj.Parametro_Institucional_Fin_Jornada FROM parametro_institucional pj
                                         WHERE pj.Parametro_Institucional_Id = ${b}.Parametro_Institucional_Id)
  )`;

const reemplazado = (b) => `EXISTS (
    SELECT 1 FROM bloque_horario reemplazo
     WHERE reemplazo.Bloque_Horario_Jornada = ${b}.Bloque_Horario_Jornada
       AND reemplazo.Bloque_Horario_Id > ${b}.Bloque_Horario_Id
       AND reemplazo.Bloque_Horario_Hora_Inicio < ${b}.Bloque_Horario_Hora_Fin
       AND reemplazo.Bloque_Horario_Hora_Fin > ${b}.Bloque_Horario_Hora_Inicio
  )`;

/** Condición SQL (booleana) para el bloque con alias `b`. */
const condicionDesajustado = (b = 'bh') => `(${fueraDeJornada(b)} OR ${reemplazado(b)})`;

/** Expresión SQL con el motivo legible, o NULL si el bloque está vigente. */
const motivoDesajuste = (b = 'bh') => `CASE
    WHEN ${fueraDeJornada(b)} THEN 'Fuera de la jornada'
    WHEN ${reemplazado(b)} THEN 'Bloque reemplazado'
    ELSE NULL
  END`;

module.exports = { condicionDesajustado, motivoDesajuste };

const horarioController = require('../controllers/horarioController');
const pool = require('../config/db');

jest.mock('../config/db');

function crearConnMock() {
  return {
    beginTransaction: jest.fn().mockResolvedValue(),
    execute: jest.fn(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
  };
}

const CLASE_ELIMINADA = {
  estado: 'Eliminado', Curso_Id: 222, Usuario_Id: 3, Asignatura_Id: 2222,
  Bloque_Horario_Id: 11111111, dia: 'Lunes', Nivel_Educativo_Id: 24,
  maximo_diario: 8, duracion: 1.5,
};

describe('Eliminar clases desde el creador de horarios', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: '222222' }, query: {}, user: { id: 1, roles: ['Administrador'] } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Marca la clase como Eliminado en lugar de borrarla', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ Horario_Asignatura_Estado: 'Activo' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await horarioController.eliminarHorario(req, res);

    expect(pool.execute.mock.calls[1][0]).toContain('UPDATE horario_asignatura SET Horario_Asignatura_Estado = ?');
    expect(pool.execute.mock.calls[1][1]).toEqual(['Eliminado', '222222']);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringContaining('eliminada') }));
  });

  test('Retorna 404 si la clase no existe', async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.eliminarHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Retorna 409 si la clase ya estaba eliminada', async () => {
    pool.execute.mockResolvedValueOnce([[{ Horario_Asignatura_Estado: 'Eliminado' }]]);

    await horarioController.eliminarHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  test('El horario excluye las clases eliminadas por defecto', async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.getHorarios(req, res);

    expect(pool.execute.mock.calls[0][0]).toContain("ha.Horario_Asignatura_Estado <> 'Eliminado'");
  });

  test('Un administrador puede pedir el horario con las clases eliminadas (listado)', async () => {
    req.query = { curso_id: '222', incluir_eliminadas: '1' };
    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.getHorarios(req, res);

    expect(pool.execute.mock.calls[0][0]).not.toContain("<> 'Eliminado'");
  });

  test('Un docente no recibe clases eliminadas aunque las pida', async () => {
    req.user = { id: 3, roles: ['Docente'] };
    req.query = { incluir_eliminadas: '1' };
    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.getHorarios(req, res);

    expect(pool.execute.mock.calls[0][0]).toContain("ha.Horario_Asignatura_Estado <> 'Eliminado'");
  });

  test('No se puede editar ni cambiar el estado de una clase eliminada', async () => {
    req.body = { estado: 'Activo' };
    pool.execute.mockResolvedValueOnce([[{ Horario_Asignatura_Id: 222222, Horario_Asignatura_Estado: 'Eliminado' }]]);

    await horarioController.cambiarEstado(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  test('La edición no acepta el estado Eliminado', async () => {
    req.body = { Horario_Asignatura_Estado: 'Eliminado' };

    await horarioController.updateHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.execute).not.toHaveBeenCalled();
  });
});

describe('Restaurar clases eliminadas', () => {
  let req;
  let res;
  let conn;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: '222222' }, user: { id: 1, roles: ['Administrador'] } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    conn = crearConnMock();
    pool.getConnection.mockResolvedValue(conn);
  });

  test('Restaura la clase como Activo si su bloque sigue libre', async () => {
    conn.execute
      .mockResolvedValueOnce([[CLASE_ELIMINADA]])                  // clase FOR UPDATE
      .mockResolvedValueOnce([[]])                                  // bloque libre para el curso
      .mockResolvedValueOnce([[]])                                  // bloque libre para el docente
      .mockResolvedValueOnce([[{ total_dia: 2 }]])                  // bloques del día
      .mockResolvedValueOnce([[{ Horas_Semanales_Requeridas: 6 }]]) // plan
      .mockResolvedValueOnce([[{ horas: 3 }]])                      // horas ya programadas
      .mockResolvedValueOnce([{ affectedRows: 1 }]);                // UPDATE

    await horarioController.restaurarHorario(req, res);

    expect(conn.execute.mock.calls[6][0]).toContain("SET Horario_Asignatura_Estado = 'Activo'");
    expect(conn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Clase restaurada en el horario' });
    expect(conn.release).toHaveBeenCalled();
  });

  test('Retorna 409 si la clase no está eliminada', async () => {
    conn.execute.mockResolvedValueOnce([[{ ...CLASE_ELIMINADA, estado: 'Activo' }]]);

    await horarioController.restaurarHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(conn.rollback).toHaveBeenCalled();
  });

  test('Retorna 409 si el curso ya ocupó ese bloque con otra clase', async () => {
    conn.execute
      .mockResolvedValueOnce([[CLASE_ELIMINADA]])
      .mockResolvedValueOnce([[{ Horario_Asignatura_Id: 999 }]]);

    await horarioController.restaurarHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El curso ya tiene otra clase en ese día y bloque horario' });
    expect(conn.commit).not.toHaveBeenCalled();
  });

  test('Retorna 422 si restaurarla excede las horas semanales del plan', async () => {
    conn.execute
      .mockResolvedValueOnce([[CLASE_ELIMINADA]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total_dia: 2 }]])
      .mockResolvedValueOnce([[{ Horas_Semanales_Requeridas: 6 }]])
      .mockResolvedValueOnce([[{ horas: 5 }]]);

    await horarioController.restaurarHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(conn.commit).not.toHaveBeenCalled();
  });
});

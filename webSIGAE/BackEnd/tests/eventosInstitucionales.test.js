const bloquesController = require('../controllers/bloquesController');
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

const EVENTO_VALIDO = {
  Evento_Institucional_Nombre: 'Feriado Regional',
  Evento_Institucional_Fecha: '2026-09-18',
  Evento_Institucional_Descripcion: 'Feriado por aniversario regional',
  Evento_Institucional_Impacto_Clases: 'Suspensión total',
};

describe('Pruebas Unitarias - CU70: Registrando Eventos Institucionales', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Excepción "Datos incompletos o inválidos": retorna 400 si faltan campos obligatorios', async () => {
    req.body = { Evento_Institucional_Nombre: 'Feriado' };

    await bloquesController.createEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Datos incompletos o inválidos en el formulario' });
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test('Excepción "Datos incompletos o inválidos": retorna 400 si el impacto en clases es inválido', async () => {
    req.body = { ...EVENTO_VALIDO, Evento_Institucional_Impacto_Clases: 'Impacto inventado' };

    await bloquesController.createEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Datos incompletos o inválidos en el formulario' });
  });

  test('Excepción "Conflicto con planificación": retorna 409 si ya existe un evento en esa fecha', async () => {
    req.body = EVENTO_VALIDO;
    const conn = crearConnMock();
    conn.execute.mockResolvedValueOnce([[{ Evento_Institucional_Id: 3 }]]); // SELECT conflicto: ya existe

    pool.getConnection.mockResolvedValueOnce(conn);

    await bloquesController.createEvento(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El evento genera conflictos con la planificación' });
  });

  test('Debe crear el evento sin marcar bloques cuando el impacto es "Sin impacto"', async () => {
    req.body = { ...EVENTO_VALIDO, Evento_Institucional_Impacto_Clases: 'Sin impacto' };
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[]]) // SELECT conflicto: sin coincidencias
      .mockResolvedValueOnce([{ insertId: 10 }]); // INSERT evento_institucional
    pool.getConnection.mockResolvedValueOnce(conn);

    await bloquesController.createEvento(req, res);

    expect(conn.execute).toHaveBeenCalledTimes(2); // no consulta bloques ni inserta en `afecta`
    expect(conn.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Evento registrado correctamente', id: 10, bloques_afectados: [] })
    );
  });

  test('Debe crear el evento y marcar los bloques de tipo Clase como afectados en "Suspensión total"', async () => {
    req.body = EVENTO_VALIDO;
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[]]) // SELECT conflicto: sin coincidencias
      .mockResolvedValueOnce([{ insertId: 11 }]) // INSERT evento_institucional
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 1 }, { Bloque_Horario_Id: 2 }]]) // SELECT bloques Clase
      .mockResolvedValueOnce([{}]); // INSERT INTO afecta
    pool.getConnection.mockResolvedValueOnce(conn);

    await bloquesController.createEvento(req, res);

    expect(conn.execute).toHaveBeenCalledTimes(4);
    expect(conn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ bloques_afectados: [1, 2] })
    );
  });

  test('Retorna 500 y revierte la transacción ante un error', async () => {
    req.body = EVENTO_VALIDO;
    const conn = crearConnMock();
    conn.execute.mockRejectedValueOnce(new Error('Fallo de conexión'));
    pool.getConnection.mockResolvedValueOnce(conn);

    await bloquesController.createEvento(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Pruebas Unitarias - CU71: Modificando Eventos Institucionales', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: '10' }, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Excepción 1: retorna 400 si faltan campos obligatorios', async () => {
    req.body = {};

    await bloquesController.updateEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test('Excepción "Evento no existe": el evento seleccionado no existe', async () => {
    req.body = EVENTO_VALIDO;
    const conn = crearConnMock();
    conn.execute.mockResolvedValueOnce([[]]); // SELECT existe: vacío
    pool.getConnection.mockResolvedValueOnce(conn);

    await bloquesController.updateEvento(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'El evento no existe o fue eliminado' });
  });

  test('Excepción "Cambios generan conflictos": otro evento ya está registrado en la nueva fecha', async () => {
    req.body = EVENTO_VALIDO;
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Evento_Institucional_Id: 10 }]]) // SELECT existe: encontrado
      .mockResolvedValueOnce([[{ Evento_Institucional_Id: 99 }]]); // SELECT conflicto: otro evento
    pool.getConnection.mockResolvedValueOnce(conn);

    await bloquesController.updateEvento(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El evento genera conflictos con la planificación' });
  });

  test('Debe actualizar el evento y recalcular los bloques afectados', async () => {
    req.body = EVENTO_VALIDO;
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Evento_Institucional_Id: 10 }]]) // SELECT existe: encontrado
      .mockResolvedValueOnce([[]])                  // SELECT conflicto: sin coincidencias
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE evento_institucional
      .mockResolvedValueOnce([{}])                  // DELETE FROM afecta (previos)
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 3 }]]) // SELECT bloques Clase
      .mockResolvedValueOnce([{}]);                 // INSERT INTO afecta
    pool.getConnection.mockResolvedValueOnce(conn);

    await bloquesController.updateEvento(req, res);

    expect(conn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Evento actualizado correctamente', bloques_afectados: [3] })
    );
  });
});

describe('Pruebas Unitarias - CU72: Eliminando Eventos Institucionales', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: '10' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Excepción "Evento no existe": retorna 404 si el evento no existe o ya fue eliminado', async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    await bloquesController.deleteEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'El evento no existe o ya fue eliminado' });
  });

  test('Debe eliminar el evento exitosamente (los bloques afectados se liberan por CASCADE)', async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await bloquesController.deleteEvento(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Evento eliminado correctamente. Los bloques afectados fueron liberados.',
    });
  });

  test('Retorna 500 ante un error técnico', async () => {
    pool.execute.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await bloquesController.deleteEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

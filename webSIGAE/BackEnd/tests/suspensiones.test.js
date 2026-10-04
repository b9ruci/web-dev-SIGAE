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

function crearRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

describe('Pruebas Unitarias - CU65: Suspendiendo bloques horarios por evento institucional', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = crearRes();
  });

  test('Excepción 1: retorna 400 si no se seleccionan bloques', async () => {
    req.body = { bloques_id: [], evento_id: 5 };
    await horarioController.suspenderBloques(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Seleccione bloques y un evento institucional' });
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test('Excepción 1: retorna 400 si no se especifica el evento', async () => {
    req.body = { bloques_id: [11111111] };
    await horarioController.suspenderBloques(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test('Excepción 2: retorna 409 si algún bloque no existe o no es de clase', async () => {
    req.body = { bloques_id: [11111111, 99999999], evento_id: 5 };
    const conn = crearConnMock();
    conn.execute.mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }]]); // solo 1 de 2 existe
    pool.getConnection.mockResolvedValueOnce(conn);

    await horarioController.suspenderBloques(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Los bloques no existen o no pueden ser suspendidos' }));
  });

  test('Excepción 2: retorna 409 si los bloques ya están suspendidos por el evento', async () => {
    req.body = { bloques_id: [11111111], evento_id: 5 };
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }]]) // bloques válidos
      .mockResolvedValueOnce([[{ Evento_Institucional_Id: 5 }]]) // evento existe
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }]]); // ya está en afecta
    pool.getConnection.mockResolvedValueOnce(conn);

    await horarioController.suspenderBloques(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('Flujo correcto: suspende los bloques con un evento existente', async () => {
    req.body = { bloques_id: [11111111, 11111112], evento_id: 5 };
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }, { Bloque_Horario_Id: 11111112 }]])
      .mockResolvedValueOnce([[{ Evento_Institucional_Id: 5 }]])
      .mockResolvedValueOnce([[]]) // sin suspensiones vigentes
      .mockResolvedValueOnce([{ affectedRows: 2 }]) // INSERT afecta
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE impacto
    pool.getConnection.mockResolvedValueOnce(conn);

    await horarioController.suspenderBloques(req, res);

    expect(conn.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Bloques suspendidos por evento institucional',
      evento_id: 5,
      bloques_suspendidos: [11111111, 11111112],
    });
    const sqlInsert = conn.execute.mock.calls[3][0];
    expect(sqlInsert).toContain('INSERT INTO afecta');
  });

  test('Flujo correcto: registra un evento nuevo y suspende los bloques', async () => {
    req.body = {
      bloques_id: [11111111],
      evento: { nombre: 'Simulacro', fecha: '2026-10-20', descripcion: 'Simulacro de evacuación' },
    };
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }]])
      .mockResolvedValueOnce([[]]) // sin eventos en la fecha
      .mockResolvedValueOnce([{ insertId: 77 }]) // INSERT evento
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    pool.getConnection.mockResolvedValueOnce(conn);

    await horarioController.suspenderBloques(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ evento_id: 77 }));
  });

  test('Retorna 500 y revierte la transacción ante un error', async () => {
    req.body = { bloques_id: [11111111], evento_id: 5 };
    const conn = crearConnMock();
    conn.execute.mockRejectedValueOnce(new Error('DB caída'));
    pool.getConnection.mockResolvedValueOnce(conn);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await horarioController.suspenderBloques(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(conn.release).toHaveBeenCalled();
  });
});

describe('Pruebas Unitarias - CU66: Suspendiendo jornada completa por evento institucional', () => {
  let req;
  let res;
  const VALIDO = { fecha: '2026-10-21', jornada: 'Mañana', nombre: 'Corte de agua', descripcion: 'Corte programado' };

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = crearRes();
  });

  test('Excepción 1: retorna 400 si no se especifica la jornada', async () => {
    req.body = { ...VALIDO, jornada: '' };
    await horarioController.suspenderJornadaCompleta(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Complete la jornada y el evento institucional' });
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test('Excepción 2: retorna 409 si la jornada no tiene bloques de clase', async () => {
    req.body = VALIDO;
    const conn = crearConnMock();
    conn.execute.mockResolvedValueOnce([[]]);
    pool.getConnection.mockResolvedValueOnce(conn);

    await horarioController.suspenderJornadaCompleta(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'La jornada no existe o tiene restricciones críticas activas' }));
  });

  test('Excepción 2: retorna 409 si ya existe un evento en la fecha', async () => {
    req.body = VALIDO;
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }]])
      .mockResolvedValueOnce([[{ Evento_Institucional_Id: 3 }]]);
    pool.getConnection.mockResolvedValueOnce(conn);

    await horarioController.suspenderJornadaCompleta(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('Flujo correcto: crea el evento y suspende los bloques de la jornada', async () => {
    req.body = VALIDO;
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }, { Bloque_Horario_Id: 11111112 }]]) // bloques de la jornada
      .mockResolvedValueOnce([[]]) // sin eventos en la fecha
      .mockResolvedValueOnce([{ insertId: 90 }]) // INSERT evento
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }, { Bloque_Horario_Id: 11111112 }]]) // registrarBloquesAfectados SELECT
      .mockResolvedValueOnce([{ affectedRows: 2 }]); // INSERT afecta
    pool.getConnection.mockResolvedValueOnce(conn);

    await horarioController.suspenderJornadaCompleta(req, res);

    expect(conn.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Jornada suspendida correctamente',
      evento_id: 90,
      impacto: 'Suspensión jornada mañana',
      bloques_suspendidos: [11111111, 11111112],
    });
  });
});

describe('Pruebas Unitarias - CU71 con eventos de CU65: "Suspensión parcial"', () => {
  const bloquesController = require('../controllers/bloquesController');

  test('Conserva los bloques elegidos manualmente al editar un evento con "Suspensión parcial"', async () => {
    jest.clearAllMocks();
    const req = {
      params: { id: 5 },
      body: {
        Evento_Institucional_Nombre: 'Simulacro',
        Evento_Institucional_Fecha: '2026-10-20',
        Evento_Institucional_Descripcion: 'Simulacro de evacuación',
        Evento_Institucional_Impacto_Clases: 'Suspensión parcial',
      },
    };
    const res = crearRes();
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Evento_Institucional_Id: 5 }]]) // existe
      .mockResolvedValueOnce([[]]) // sin conflictos de fecha
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE evento
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }]]); // bloques actuales en afecta
    pool.getConnection.mockResolvedValueOnce(conn);

    await bloquesController.updateEvento(req, res);

    const sqls = conn.execute.mock.calls.map((c) => c[0]);
    expect(sqls.some((q) => q.includes('DELETE FROM afecta'))).toBe(false);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Evento actualizado correctamente', bloques_afectados: [11111111] });
  });
});

describe('Pruebas Unitarias - RF42: bloques suspendidos identificados en el horario', () => {
  beforeEach(() => jest.clearAllMocks());

  test('CU65 - Excepción 2: la suspensión vigente se valida por la fecha del evento', async () => {
    const req = { body: { bloques_id: [11111111], evento_id: 5 } };
    const res = crearRes();
    const conn = crearConnMock();
    conn.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }]])
      .mockResolvedValueOnce([[{ Evento_Institucional_Id: 5 }]])
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 11111111 }]]);
    pool.getConnection.mockResolvedValueOnce(conn);

    await horarioController.suspenderBloques(req, res);

    const sqlVigentes = conn.execute.mock.calls[2][0];
    expect(sqlVigentes).toContain('Evento_Institucional_Fecha');
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('getHorarios informa la próxima suspensión por evento de cada bloque', async () => {
    const req = { query: {}, user: { id: 1, roles: ['Administrador'] } };
    const res = crearRes();
    pool.execute.mockResolvedValueOnce([[
      { Horario_Asignatura_Id: 1, suspension_evento: '2026-10-20|Simulacro' },
      { Horario_Asignatura_Id: 2, suspension_evento: null },
    ]]);

    await horarioController.getHorarios(req, res);

    expect(pool.execute.mock.calls[0][0]).toContain('FROM afecta af');
    expect(res.json).toHaveBeenCalledWith([
      { Horario_Asignatura_Id: 1, suspension_evento: { fecha: '2026-10-20', nombre: 'Simulacro' } },
      { Horario_Asignatura_Id: 2, suspension_evento: null },
    ]);
  });
});

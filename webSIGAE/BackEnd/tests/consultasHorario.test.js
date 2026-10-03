const horarioController = require('../controllers/horarioController');
const pool = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU67, CU68, CU69: Consultas y filtros de horario', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, query: {}, body: {}, user: { id: 1, roles: ['Administrador'] } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    pool.execute = jest.fn();
  });

  // ── CU68 ──
  test('CU68: aplica los filtros recibidos como parámetros de la consulta', async () => {
    req.query = { docente_id: '3', dia_semana: 'Lunes', jornada: 'Mañana' };
    pool.execute.mockResolvedValueOnce([[{ Horario_Asignatura_Id: 222222 }]]);

    await horarioController.filtrarHorarios(req, res);

    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).toContain('ha.Usuario_Id = ?');
    expect(sql).toContain('bh.Bloque_Horario_Jornada = ?');
    expect(sql).toContain('ha.Horario_Asignatura_Dia_Semana = ?');
    expect(params).toEqual(['Activo', '3', 'Mañana', 'Lunes']);
    expect(res.json).toHaveBeenCalledWith([{ Horario_Asignatura_Id: 222222 }]);
  });

  test('CU68 Excepción 2: sin resultados responde 200 con mensaje informativo', async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.filtrarHorarios(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ horarios: [] }));
  });

  // ── CU67 ──
  test('CU67: sin curso ni docente considera las asignaciones de toda la institución', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ bloqueId: 1, tipo: 'Clase' }, { bloqueId: 2, tipo: 'Clase' }]])
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 1, Horario_Asignatura_Dia_Semana: 'Lunes' }]]);
    req.query = { dia_semana: 'Lunes' };

    await horarioController.getBloquesLibres(req, res);

    expect(pool.execute.mock.calls[1][0]).not.toContain('Curso_Id = ?');
    expect(res.json).toHaveBeenCalledWith([{ dia: 'Lunes', bloqueId: 2, tipo: 'Clase' }]);
  });

  test('CU67: con curso y docente, un bloque usado por cualquiera de los dos queda ocupado', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ bloqueId: 1, tipo: 'Clase' }]])
      .mockResolvedValueOnce([[]]);
    req.query = { curso_id: '222', docente_id: '3' };

    await horarioController.getBloquesLibres(req, res);

    const [sql, params] = pool.execute.mock.calls[1];
    expect(sql).toContain('(Curso_Id = ? OR Usuario_Id = ?)');
    expect(params).toEqual(['222', '3']);
  });

  test('CU67 Excepción 1: sin bloques libres responde con mensaje informativo', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ bloqueId: 1, tipo: 'Clase' }]])
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 1, Horario_Asignatura_Dia_Semana: 'Lunes' }]]);
    req.query = { curso_id: '222', dia_semana: 'Lunes' };

    await horarioController.getBloquesLibres(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bloquesLibres: [] }));
  });

  // ── CU69 ──
  test('CU69 Excepción 1: bloque inexistente responde 404', async () => {
    req.params.id = '999';
    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.getDetalleBloqueHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('CU69 Excepción 1: identificador inválido responde 404 sin consultar la BD', async () => {
    req.params.id = 'abc';

    await horarioController.getDetalleBloqueHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(pool.execute).not.toHaveBeenCalled();
  });

  test('CU69: el detalle incluye eventos institucionales y observaciones', async () => {
    req.params.id = '222227';
    pool.execute
      .mockResolvedValueOnce([[{
        horarioId: 222227, dia: 'Lunes', estado: 'Suspendido', bloqueId: 11111112, docenteId: 10,
      }]])
      .mockResolvedValueOnce([[{
        eventoId: 7, nombre: 'Acto', fecha: '2026-12-14', impacto: 'Suspensión total', estadoBloque: 'Suspendido',
      }]]);

    await horarioController.getDetalleBloqueHorario(req, res);

    expect(pool.execute.mock.calls[1][1]).toEqual([11111112, 'Lunes']);
    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta.eventos).toHaveLength(1);
    expect(respuesta.observaciones).toEqual([
      'El bloque se encuentra suspendido en el horario semanal del curso.',
      'Suspendido el 2026-12-14 por el evento institucional "Acto" (Suspensión total).',
    ]);
  });

  test('CU69 Excepción 2: error de base de datos responde 500', async () => {
    req.params.id = '222227';
    pool.execute.mockRejectedValueOnce(new Error('Fallo de conexión'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await horarioController.getDetalleBloqueHorario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

const horarioController = require('../controllers/horarioController');
const pool = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU42: Cursos y Asignaturas Asignadas a un Docente', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Debe agrupar por curso y asignatura sumando horas semanales (docente viendo lo propio)', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.docenteId = '5';

    pool.execute.mockResolvedValueOnce([[
      {
        nivelEducativo: '1ero Básico', cursoId: 222, curso: '1ero Básico A',
        asignaturaId: 2222, asignatura: 'Matemáticas',
        dia: 'Lunes', horaInicio: '09:15:00', horaFin: '10:00:00', estado: 'Activo',
      },
      {
        nivelEducativo: '1ero Básico', cursoId: 222, curso: '1ero Básico A',
        asignaturaId: 2222, asignatura: 'Matemáticas',
        dia: 'Miércoles', horaInicio: '10:00:00', horaFin: '10:45:00', estado: 'Suspendido',
      },
    ]]);

    await horarioController.getAsignacionesDocente(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        cursoId: 222,
        asignaturaId: 2222,
        horasSemanales: 1.5,
        estadoVigencia: 'Activo',
        bloques: expect.arrayContaining([
          expect.objectContaining({ dia: 'Lunes' }),
          expect.objectContaining({ dia: 'Miércoles' }),
        ]),
      }),
    ]);
    // Un docente sin rol Administrador no debe validarse contra la tabla usuario (usa su propio id)
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  test('Excepción 1: retorna 200 con mensaje informativo si el docente no tiene asignaciones', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.docenteId = '5';

    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.getAsignacionesDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'No existen asignaciones registradas',
      asignaciones: [],
    });
  });

  test('Retorna 403 si el actor no es Docente ni Administrador', async () => {
    req.user = { id: 8, roles: ['Apoderado'] };
    req.params.docenteId = '5';

    await horarioController.getAsignacionesDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tienes permiso para consultar esta información' });
    expect(pool.execute).not.toHaveBeenCalled();
  });

  test('Excepción 2: Admin consulta un docente que no existe', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.params.docenteId = '999';

    pool.execute.mockResolvedValueOnce([[undefined]]);

    await horarioController.getAsignacionesDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El docente no fue encontrado' });
  });

  test('Excepción 3: retorna 500 ante un error técnico en la consulta', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.docenteId = '5';

    pool.execute.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await horarioController.getAsignacionesDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'No fue posible cargar las asignaciones académicas, reintente más tarde',
    });
  });
});

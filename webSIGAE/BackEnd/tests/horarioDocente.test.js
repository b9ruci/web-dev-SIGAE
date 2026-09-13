const horarioController = require('../controllers/horarioController');
const pool = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU43: Horario Semanal de un Docente a partir de sus Cursos Asociados', () => {
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

  test('Flujo correcto: un Docente ve su propio horario semanal ordenado por día y bloque', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.docenteId = '5';

    const filas = [
      { curso: '1ero Básico A', asignatura: 'Matemáticas', dia: 'Lunes', horaInicio: '09:15:00', horaFin: '10:00:00', estado: 'Activo' },
      { curso: '1ero Básico B', asignatura: 'Matemáticas', dia: 'Miércoles', horaInicio: '10:00:00', horaFin: '10:45:00', estado: 'Suspendido' },
    ];
    pool.execute.mockResolvedValueOnce([filas]);

    await horarioController.getHorarioDocente(req, res);

    expect(res.json).toHaveBeenCalledWith(filas);
    // Un docente sin rol Administrador no debe validarse contra la tabla usuario (usa su propio id)
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  test('Un Administrador puede consultar el horario de otro docente', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.params.docenteId = '5';

    pool.execute
      .mockResolvedValueOnce([[{ Usuario_Id: 5 }]])
      .mockResolvedValueOnce([[
        { curso: '1ero Básico A', asignatura: 'Matemáticas', dia: 'Lunes', horaInicio: '09:15:00', horaFin: '10:00:00', estado: 'Activo' },
      ]]);

    await horarioController.getHorarioDocente(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ curso: '1ero Básico A' }),
    ]);
  });

  test('Retorna 403 si el actor no es Docente ni Administrador (ej. Apoderado)', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };
    req.params.docenteId = '5';

    await horarioController.getHorarioDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tienes permiso para consultar esta información' });
    expect(pool.execute).not.toHaveBeenCalled();
  });

  test('Excepción "Horario sin planificar": retorna 200 con mensaje informativo si no hay bloques', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.docenteId = '5';

    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.getHorarioDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'El horario aún no ha sido planificado',
      horario: [],
    });
  });

  test('Excepción "Docente no existe": un Administrador consulta un docente inexistente', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.params.docenteId = '999';

    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.getHorarioDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El docente no fue encontrado' });
  });

  test('Excepción "Error técnico": retorna 500 si la consulta falla', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.docenteId = '5';

    pool.execute.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await horarioController.getHorarioDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No fue posible cargar el horario, reintente más tarde' });
  });
});

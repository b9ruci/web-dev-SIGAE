const horarioController = require('../controllers/horarioController');
const pool = require('../config/db');

jest.mock('../config/db');

const FILA_HORARIO = {
  Horario_Asignatura_Id: 1,
  dia: 'Lunes',
  Curso_Id: 10,
  curso: '1° Básico',
  seccion: 'A',
  Bloque_Horario_Id: 5,
  hora_inicio: '09:00:00',
  hora_fin: '09:45:00',
  jornada: 'Mañana',
  Asignatura_Id: 3,
  asignatura: 'Matemáticas',
  Usuario_Id: 7,
  docente: 'Carlos Docente',
};

describe('Pruebas Unitarias - CU57: Visualizando Horario Maestro', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Flujo correcto: retorna todos los bloques, cursos y docentes', async () => {
    pool.execute.mockResolvedValueOnce([[FILA_HORARIO]]);

    await horarioController.getHorarioMaestro(req, res);

    expect(res.json).toHaveBeenCalledWith([FILA_HORARIO]);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('Excepción "No existen datos suficientes": retorna 404 cuando no hay resultados', async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await horarioController.getHorarioMaestro(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No es posible generar el horario maestro' });
  });

  test('Retorna 500 si ocurre un error de base de datos', async () => {
    pool.execute.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await horarioController.getHorarioMaestro(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No fue posible generar el horario maestro, reintente más tarde' });
  });
});

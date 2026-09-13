const estudianteController = require('../controllers/estudianteController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU34: Listado Completo de Estudiantes Registrados', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Un Administrador ve el listado completo sin filtrar por curso', async () => {
    req.user = { id: 1, roles: ['Administrador'] };

    db.query.mockResolvedValueOnce([[
      { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Estudiante_RUT: '1-9', Estudiante_Estado_Academico: 'Regular', Curso_Id: 222, Apoderado_Usuario_Id: 4, Curso_Nombre: '1ero Básico A' },
    ]]);

    await estudianteController.getEstudiantes(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ Estudiante_Nombre_Completo: 'Diego Perez', Apoderado_Usuario_Id: 4 }),
    ]);
    // Un Administrador no debe pasar por la consulta de cursos del docente
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('Un Docente ve solo los estudiantes de sus propios cursos', async () => {
    req.user = { id: 5, roles: ['Docente'] };

    db.query
      .mockResolvedValueOnce([[{ Curso_Id: 222 }, { Curso_Id: 223 }]])
      .mockResolvedValueOnce([[
        { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Estudiante_RUT: '1-9', Estudiante_Estado_Academico: 'Regular', Curso_Id: 222, Apoderado_Usuario_Id: 4, Curso_Nombre: '1ero Básico A' },
      ]]);

    await estudianteController.getEstudiantes(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ Estudiante_Nombre_Completo: 'Diego Perez' }),
    ]);
  });

  test('Retorna 403 si el actor no es Administrador ni Docente (ej. Apoderado)', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };

    await estudianteController.getEstudiantes(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tienes permiso para consultar esta información' });
    expect(db.query).not.toHaveBeenCalled();
  });

  test('Excepción: Docente sin cursos asignados', async () => {
    req.user = { id: 5, roles: ['Docente'] };

    db.query.mockResolvedValueOnce([[]]);

    await estudianteController.getEstudiantes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'No existen estudiantes disponibles para su perfil',
      estudiantes: [],
    });
  });

  test('Excepción: no hay estudiantes registrados', async () => {
    req.user = { id: 1, roles: ['Administrador'] };

    db.query.mockResolvedValueOnce([[]]);

    await estudianteController.getEstudiantes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'No hay estudiantes registrados',
      estudiantes: [],
    });
  });

  test('Excepción: error técnico retorna 500', async () => {
    req.user = { id: 1, roles: ['Administrador'] };

    db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await estudianteController.getEstudiantes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No fue posible recuperar los registros' });
  });
});

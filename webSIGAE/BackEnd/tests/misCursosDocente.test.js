const estudianteController = require('../controllers/estudianteController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Mis Cursos: estudiantes de un curso del docente', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { cursoId: '222' }, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    db.query = jest.fn();
  });

  test('El docente ve los estudiantes de un curso donde hace clases, sin RUT ni dirección', async () => {
    req.user = { id: 3, roles: ['Docente'] };
    const estudiantes = [
      { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Estudiante_Estado_Academico: 'Regular', Apoderado_Nombre: 'Pedro Fernandez' },
    ];
    db.query
      .mockResolvedValueOnce([[{ Curso_Id: 222, Curso_Nombre: '1ero Básico A' }]])
      .mockResolvedValueOnce([[{ 1: 1 }]])
      .mockResolvedValueOnce([estudiantes]);

    await estudianteController.getEstudiantesCursoDocente(req, res);

    expect(db.query.mock.calls[1][1]).toEqual([3, 222]);
    const sqlEstudiantes = db.query.mock.calls[2][0];
    expect(sqlEstudiantes).not.toMatch(/RUT|Calle|Numero|Depto|Comuna/);
    expect(res.json).toHaveBeenCalledWith({
      curso: { id: 222, nombre: '1ero Básico A' },
      estudiantes,
    });
  });

  test('Un docente no puede ver un curso en el que no hace clases (403)', async () => {
    req.user = { id: 3, roles: ['Docente'] };
    db.query
      .mockResolvedValueOnce([[{ Curso_Id: 222, Curso_Nombre: '1ero Básico A' }]])
      .mockResolvedValueOnce([[]]);

    await estudianteController.getEstudiantesCursoDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test('Un administrador puede ver cualquier curso sin validar asignación', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    db.query
      .mockResolvedValueOnce([[{ Curso_Id: 222, Curso_Nombre: '1ero Básico A' }]])
      .mockResolvedValueOnce([[]]);

    await estudianteController.getEstudiantesCursoDocente(req, res);

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ curso: { id: 222, nombre: '1ero Básico A' }, estudiantes: [] });
  });

  test('Un apoderado recibe 403', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };

    await estudianteController.getEstudiantesCursoDocente(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('Curso inexistente responde 404 y ID inválido 400', async () => {
    req.user = { id: 3, roles: ['Docente'] };
    db.query.mockResolvedValueOnce([[]]);
    await estudianteController.getEstudiantesCursoDocente(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    req.params.cursoId = 'x';
    await estudianteController.getEstudiantesCursoDocente(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

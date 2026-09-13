const estudianteController = require('../controllers/estudianteController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU34 y CU35: Listado y Filtros de Estudiantes', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: {}, query: {} };
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

  // CU35: Filtro por curso y estado académico
  describe('CU35 - Filtro por curso y estado académico', () => {
    test('Flujo correcto: un Administrador filtra por curso y estado', async () => {
      req.user = { id: 1, roles: ['Administrador'] };
      req.query = { curso: '1ero Básico A', estado: 'Regular' };

      const mockFiltrados = [
        { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Estudiante_Estado_Academico: 'Regular', Curso_Nombre: '1ero Básico A' },
      ];
      db.query.mockResolvedValueOnce([mockFiltrados]);

      await estudianteController.getEstudiantes(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND c.Curso_Nombre = ?'),
        expect.arrayContaining(['1ero Básico A', 'Regular'])
      );
      expect(res.json).toHaveBeenCalledWith(mockFiltrados);
    });

    test('Un Docente que filtra queda restringido a sus propios cursos', async () => {
      req.user = { id: 5, roles: ['Docente'] };
      req.query = { curso: '1ero Básico A' };

      db.query
        .mockResolvedValueOnce([[{ Curso_Id: 222 }]])
        .mockResolvedValueOnce([[
          { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Curso_Nombre: '1ero Básico A' },
        ]]);

      await estudianteController.getEstudiantes(req, res);

      expect(db.query).toHaveBeenLastCalledWith(
        expect.stringContaining('WHERE e.Curso_Id IN (?)'),
        expect.arrayContaining([[222], '1ero Básico A'])
      );
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ Estudiante_Nombre_Completo: 'Diego Perez' }),
      ]);
    });

    test('Excepción "Sin resultados coincidentes" (CU37): retorna mensaje distinto al de CU34', async () => {
      req.user = { id: 1, roles: ['Administrador'] };
      req.query = { estado: 'Retirado' };
      db.query.mockResolvedValueOnce([[]]);

      await estudianteController.getEstudiantes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'No existen estudiantes que cumplan las condiciones',
        estudiantes: [],
      });
    });

    test('Excepción "Error técnico" (CU37): con filtros aplicados retorna un mensaje distinto al de CU34', async () => {
      req.user = { id: 1, roles: ['Administrador'] };
      req.query = { curso: '1ero Básico A' };
      db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

      await estudianteController.getEstudiantes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'No fue posible completar la consulta, reintente más tarde' });
    });
  });
});

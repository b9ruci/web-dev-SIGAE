const estudianteController = require('../controllers/estudianteController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU36: Buscando estudiantes por nombre completo o RUT', () => {
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

  test('Flujo correcto: un Administrador busca por nombre o RUT', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.query = { criterio: 'Diego' };

    const mockEstudiantes = [
      { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Estudiante_RUT: '1-9', Curso_Nombre: '1ero Básico A' },
    ];
    db.query.mockResolvedValueOnce([mockEstudiantes]);

    await estudianteController.buscarEstudiantes(req, res);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('Estudiante_Nombre_Completo LIKE ? OR e.Estudiante_RUT LIKE ?'),
      expect.arrayContaining(['%Diego%', '%Diego%'])
    );
    expect(res.json).toHaveBeenCalledWith(mockEstudiantes);
  });

  test('Un Docente queda restringido a sus propios cursos al buscar', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.query = { criterio: '1-9' };

    db.query
      .mockResolvedValueOnce([[{ Curso_Id: 222 }]])
      .mockResolvedValueOnce([[
        { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Estudiante_RUT: '1-9' },
      ]]);

    await estudianteController.buscarEstudiantes(req, res);

    expect(db.query).toHaveBeenLastCalledWith(
      expect.stringContaining('WHERE e.Curso_Id IN (?)'),
      expect.arrayContaining([[222], '%1-9%', '%1-9%'])
    );
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ Estudiante_Nombre_Completo: 'Diego Perez' }),
    ]);
  });

  test('Retorna 403 si el actor no es Administrador ni Docente (ej. Apoderado)', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };
    req.query = { criterio: 'Diego' };

    await estudianteController.buscarEstudiantes(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tienes permiso para consultar esta información' });
    expect(db.query).not.toHaveBeenCalled();
  });

  test('Excepción "Criterio vacío o solo espacios": rechaza sin consultar la base de datos', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.query = { criterio: '   ' };

    await estudianteController.buscarEstudiantes(req, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Ingrese al menos un carácter para realizar la búsqueda' });
  });

  test('Excepción "Docente sin cursos asignados"', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.query = { criterio: 'Diego' };
    db.query.mockResolvedValueOnce([[]]);

    await estudianteController.buscarEstudiantes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'No existen estudiantes disponibles para su perfil',
      estudiantes: [],
    });
  });

  test('Excepción "Sin coincidencias"', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.query = { criterio: 'Inexistente' };
    db.query.mockResolvedValueOnce([[]]);

    await estudianteController.buscarEstudiantes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'No se encontraron estudiantes con el criterio ingresado',
      estudiantes: [],
    });
  });

  test('Excepción "Error técnico": retorna 500 si la consulta falla', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.query = { criterio: 'Diego' };
    db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await estudianteController.buscarEstudiantes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No fue posible completar la consulta, reintente más tarde' });
  });
});

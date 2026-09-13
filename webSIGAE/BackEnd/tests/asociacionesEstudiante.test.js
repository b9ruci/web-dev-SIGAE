const estudianteController = require('../controllers/estudianteController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU40: Estudiantes Asociados a un Apoderado', () => {
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

  test('El apoderado ve su propia lista de estudiantes asociados', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };
    req.params.apoderadoId = '4';

    db.query.mockResolvedValueOnce([[
      { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Estudiante_RUT: '1-9', Estudiante_Estado_Academico: 'Regular', Curso_Nombre: '1ero Básico A' },
    ]]);

    await estudianteController.getEstudiantesAsociados(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ Estudiante_Nombre_Completo: 'Diego Perez' }),
    ]);
    // No debe validar existencia del apoderado en `usuario`: usa su propio id directamente
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('Un Administrador puede consultar los estudiantes de otro apoderado', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.params.apoderadoId = '4';

    db.query
      .mockResolvedValueOnce([[{ Usuario_Id: 4 }]]) // validación de existencia del apoderado
      .mockResolvedValueOnce([[
        { Estudiante_Id: 1, Estudiante_Nombre_Completo: 'Diego Perez', Estudiante_RUT: '1-9', Estudiante_Estado_Academico: 'Regular', Curso_Nombre: '1ero Básico A' },
      ]]);

    await estudianteController.getEstudiantesAsociados(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ Estudiante_Nombre_Completo: 'Diego Perez' }),
    ]);
  });

  test('Retorna 403 si el actor no es Apoderado ni Administrador', async () => {
    req.user = { id: 3, roles: ['Docente'] };
    req.params.apoderadoId = '4';

    await estudianteController.getEstudiantesAsociados(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tienes permiso para consultar esta información' });
    expect(db.query).not.toHaveBeenCalled();
  });

  test('Excepción 1: retorna 200 con mensaje informativo si no hay estudiantes asociados', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };
    req.params.apoderadoId = '4';

    db.query.mockResolvedValueOnce([[]]);

    await estudianteController.getEstudiantesAsociados(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'No existen estudiantes asociados a la cuenta',
      estudiantes: [],
    });
  });

  test('Excepción 2: Admin consulta un apoderado que no existe', async () => {
    req.user = { id: 1, roles: ['Administrador'] };
    req.params.apoderadoId = '999';

    db.query.mockResolvedValueOnce([[]]);

    await estudianteController.getEstudiantesAsociados(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El apoderado no fue encontrado' });
  });

  test('Excepción 3: retorna 500 ante un error técnico en la consulta', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };
    req.params.apoderadoId = '4';

    db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await estudianteController.getEstudiantesAsociados(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No fue posible cargar estudiantes, reintente más tarde' });
  });
});

describe('Pruebas Unitarias - CU39: Editar Asociaciones de un Estudiante', () => {
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

  test('Debe reasignar el apoderado exitosamente', async () => {
    req.params.estudianteId = 1;
    req.body = { apoderadoId: 7 };

    db.query
      .mockResolvedValueOnce([[{ Estudiante_Id: 1, Apoderado_Usuario_Id: 4 }]])
      .mockResolvedValueOnce([[{ Usuario_Id: 7, Usuario_Estado_Cuenta: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await estudianteController.editarAsociaciones(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Asociaciones actualizadas correctamente' });
  });

  test('Debe eliminar la asociación (apoderadoId: null) cuando el frontend ya confirmó', async () => {
    req.params.estudianteId = 1;
    req.body = { apoderadoId: null };

    db.query
      .mockResolvedValueOnce([[{ Estudiante_Id: 1, Apoderado_Usuario_Id: 4 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await estudianteController.editarAsociaciones(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Asociaciones actualizadas correctamente' });
  });

  test('Retorna 404 si la ficha de estudiante no existe', async () => {
    req.params.estudianteId = 999;
    req.body = { apoderadoId: 7 };

    db.query.mockResolvedValueOnce([[]]);

    await estudianteController.editarAsociaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Ficha de estudiante no encontrada' });
  });

  test('Excepción: retorna 400 si el apoderado ya se encuentra vinculado (evita duplicar)', async () => {
    req.params.estudianteId = 1;
    req.body = { apoderadoId: 4 };

    db.query.mockResolvedValueOnce([[{ Estudiante_Id: 1, Apoderado_Usuario_Id: 4 }]]);

    await estudianteController.editarAsociaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'La asociación ya existe, no se duplicará el registro' });
  });

  test('Retorna 404 si el nuevo apoderado indicado no existe', async () => {
    req.params.estudianteId = 1;
    req.body = { apoderadoId: 999 };

    db.query
      .mockResolvedValueOnce([[{ Estudiante_Id: 1, Apoderado_Usuario_Id: 4 }]])
      .mockResolvedValueOnce([[]]);

    await estudianteController.editarAsociaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Apoderado no encontrado' });
  });

  test('Retorna 400 si el nuevo apoderado está inactivo', async () => {
    req.params.estudianteId = 1;
    req.body = { apoderadoId: 7 };

    db.query
      .mockResolvedValueOnce([[{ Estudiante_Id: 1, Apoderado_Usuario_Id: 4 }]])
      .mockResolvedValueOnce([[{ Usuario_Id: 7, Usuario_Estado_Cuenta: 0 }]]);

    await estudianteController.editarAsociaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El apoderado seleccionado está inactivo' });
  });

  test('Retorna 400 si no se indica apoderadoId en el cuerpo', async () => {
    req.params.estudianteId = 1;
    req.body = {};

    await estudianteController.editarAsociaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });
});

const usuarioController = require('../controllers/usuarioController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU28: Buscando usuarios por nombre completo, RUT o correo electrónico', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, user: { id: 1, administradorTipo: 'Administrador Normal' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Flujo correcto: busca por nombre, RUT o correo y retorna coincidencias', async () => {
    req.body = { correo: 'carlos' };
    const mockUsuarios = [
      { Usuario_Id: 5, Usuario_Nombre_Completo: 'Carlos Ruiz', Es_Docente: 1, Docente_Correo_Institucional: 'carlos@colegio.cl' },
    ];
    db.query.mockResolvedValueOnce([mockUsuarios]);

    await usuarioController.buscarUsuario(req, res);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('Docente_Correo_Institucional LIKE ?'),
      expect.arrayContaining(['%carlos%'])
    );
    expect(res.json).toHaveBeenCalledWith(mockUsuarios);
  });

  test('Excepción "Campos inválidos o incompletos": rechaza sin consultar la base de datos', async () => {
    req.body = {};

    await usuarioController.buscarUsuario(req, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Ingrese datos válidos' });
  });

  test('Excepción "Sin coincidencias": no existe ningún usuario que coincida', async () => {
    req.body = { rut: '99999999-9' };
    db.query.mockResolvedValueOnce([[]]);

    await usuarioController.buscarUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'No se encontraron usuarios', usuarios: [] })
    );
  });

  test('Excepción "Búsqueda fuera de alcance": el usuario existe pero es Super Admin y el solicitante es Administrador normal', async () => {
    req.body = { nombre: 'Ana' };
    req.user = { id: 2, administradorTipo: 'Administrador Normal' };
    db.query.mockResolvedValueOnce([[
      { Usuario_Id: 1, Usuario_Nombre_Completo: 'Ana Superadmin', Es_Administrador: 1, Administrador_Tipo: 'Super Admin' },
    ]]);

    await usuarioController.buscarUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Usuario fuera de su alcance' });
  });

  test('Un Super Admin sí puede ver coincidencias que son Super Admin', async () => {
    req.body = { nombre: 'Ana' };
    req.user = { id: 1, administradorTipo: 'Super Admin' };
    const mockUsuarios = [
      { Usuario_Id: 1, Usuario_Nombre_Completo: 'Ana Superadmin', Es_Administrador: 1, Administrador_Tipo: 'Super Admin' },
    ];
    db.query.mockResolvedValueOnce([mockUsuarios]);

    await usuarioController.buscarUsuario(req, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(mockUsuarios);
  });

  test('Excepción "Problema técnico": retorna 500 si la consulta falla', async () => {
    req.body = { rut: '11111111-1' };
    db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await usuarioController.buscarUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al buscar usuario' });
  });
});

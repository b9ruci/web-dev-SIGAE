const usuarioController = require('../controllers/usuarioController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU17 y CU18: Visualizar Perfil Propio y de Otro Usuario', () => {
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

  test('CU17 - Flujo correcto: un usuario ve su propio perfil', async () => {
    req.user = { id: 5, roles: ['Docente'], administradorTipo: null };
    req.params.id = '5';

    db.query.mockResolvedValueOnce([[
      { Usuario_Id: 5, Usuario_Nombre_Completo: 'Carlos Docente', Usuario_Contraseña: 'hash', Es_Docente: 1 },
    ]]);

    await usuarioController.getUsuarioById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ Usuario_Id: 5, Usuario_Nombre_Completo: 'Carlos Docente' })
    );
    // La contraseña nunca debe salir en la respuesta
    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta.Usuario_Contraseña).toBeUndefined();
  });

  test('CU18 - Flujo correcto: un Administrador ve el perfil de otro usuario', async () => {
    req.user = { id: 1, roles: ['Administrador'], administradorTipo: 'Administrador Normal' };
    req.params.id = '5';

    db.query.mockResolvedValueOnce([[
      { Usuario_Id: 5, Usuario_Nombre_Completo: 'Carlos Docente', Es_Docente: 1 },
    ]]);

    await usuarioController.getUsuarioById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ Usuario_Nombre_Completo: 'Carlos Docente' })
    );
  });

  test('Retorna 403 si el actor no es Administrador ni el propio usuario', async () => {
    req.user = { id: 4, roles: ['Apoderado'], administradorTipo: null };
    req.params.id = '5';

    await usuarioController.getUsuarioById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tienes permiso para ver este perfil' });
    expect(db.query).not.toHaveBeenCalled();
  });

  test('CU18 - Excepción "Falta de permisos": un Administrador normal no puede ver el perfil de un Super Admin', async () => {
    req.user = { id: 1, roles: ['Administrador'], administradorTipo: 'Administrador Normal' };
    req.params.id = '2';

    db.query.mockResolvedValueOnce([[
      { Usuario_Id: 2, Usuario_Nombre_Completo: 'Ana Superadmin', Es_Administrador: 1, Administrador_Tipo: 'Super Admin' },
    ]]);

    await usuarioController.getUsuarioById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No está autorizado' });
  });

  test('Un Super Admin sí puede ver el perfil de otro Super Admin', async () => {
    req.user = { id: 1, roles: ['Administrador'], administradorTipo: 'Super Admin' };
    req.params.id = '2';

    db.query.mockResolvedValueOnce([[
      { Usuario_Id: 2, Usuario_Nombre_Completo: 'Ana Superadmin', Es_Administrador: 1, Administrador_Tipo: 'Super Admin' },
    ]]);

    await usuarioController.getUsuarioById(req, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ Usuario_Nombre_Completo: 'Ana Superadmin' })
    );
  });

  test('Un usuario viendo su propio perfil de Super Admin no se bloquea a sí mismo', async () => {
    req.user = { id: 2, roles: ['Administrador'], administradorTipo: 'Super Admin' };
    req.params.id = '2';

    db.query.mockResolvedValueOnce([[
      { Usuario_Id: 2, Usuario_Nombre_Completo: 'Ana Superadmin', Es_Administrador: 1, Administrador_Tipo: 'Super Admin' },
    ]]);

    await usuarioController.getUsuarioById(req, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ Usuario_Nombre_Completo: 'Ana Superadmin' })
    );
  });

  test('Retorna 404 si el usuario objetivo no existe', async () => {
    req.user = { id: 1, roles: ['Administrador'], administradorTipo: 'Super Admin' };
    req.params.id = '999';

    db.query.mockResolvedValueOnce([[]]);

    await usuarioController.getUsuarioById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Usuario no encontrado' });
  });

  test('Excepción: error técnico retorna 500', async () => {
    req.user = { id: 1, roles: ['Administrador'], administradorTipo: 'Super Admin' };
    req.params.id = '5';

    db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await usuarioController.getUsuarioById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener el usuario' });
  });
});

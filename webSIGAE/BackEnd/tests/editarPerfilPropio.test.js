const usuarioController = require('../controllers/usuarioController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU19: Editando Datos Personales del Propio Perfil', () => {
  let req;
  let res;

  const docenteActual = {
    Usuario_Id: 5, Usuario_Nombre_Completo: 'Carlos Docente', Usuario_RUT: '55555555-5',
    Usuario_Telefono: '911111111', Es_Administrador: 0, Es_Docente: 1, Es_Apoderado: 0,
    Docente_Correo_Institucional: 'carlos@jacquescousteau.edu',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { id: 5 }, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Flujo correcto: actualiza correo institucional y teléfono', async () => {
    req.body = { correo: 'carlos.nuevo@jacquescousteau.edu', telefono: '922222222' };

    db.query
      .mockResolvedValueOnce([[docenteActual]]) // SELECT actual
      .mockResolvedValueOnce([[]]) // SELECT duplicado -> ninguno
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE
      .mockResolvedValueOnce([[{ ...docenteActual, Docente_Correo_Institucional: 'carlos.nuevo@jacquescousteau.edu', Usuario_Telefono: '922222222' }]]); // SELECT actualizado

    await usuarioController.editarPerfilPropio(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        mensaje: 'Cambios guardados correctamente',
        usuario: expect.objectContaining({ Docente_Correo_Institucional: 'carlos.nuevo@jacquescousteau.edu' }),
      })
    );
  });

  test('Un Apoderado puede actualizar su dirección', async () => {
    req.user = { id: 4 };
    req.body = { direccion: 'Calle Nueva 456' };

    const apoderadoActual = {
      Usuario_Id: 4, Usuario_Nombre_Completo: 'Maria Apoderada', Usuario_RUT: '44444444-4',
      Es_Administrador: 0, Es_Docente: 0, Es_Apoderado: 1, Apoderado_Direccion: 'Calle Vieja 123',
    };
    db.query
      .mockResolvedValueOnce([[apoderadoActual]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ ...apoderadoActual, Apoderado_Direccion: 'Calle Nueva 456' }]]);

    await usuarioController.editarPerfilPropio(req, res);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('Apoderado_Direccion = ?'),
      expect.arrayContaining(['Calle Nueva 456', 4])
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Cambios guardados correctamente' })
    );
  });

  test('Excepción "Intento modificación campo protegido": rechaza sin tocar la base de datos', async () => {
    req.body = { Usuario_Nombre_Completo: 'Otro Nombre', telefono: '922222222' };

    await usuarioController.editarPerfilPropio(req, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No está permitido modificar el nombre o el RUT desde tu perfil' });
  });

  test('Excepción "Intento modificación campo protegido": también rechaza un intento de cambiar el RUT', async () => {
    req.body = { Usuario_RUT: '99999999-9' };

    await usuarioController.editarPerfilPropio(req, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Excepción "Formato de datos incorrecto": teléfono inválido rechazado sin tocar la BD', async () => {
    req.body = { telefono: '123' };

    await usuarioController.editarPerfilPropio(req, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Datos no cumplen con el formato' });
  });

  test('Excepción "Formato de datos incorrecto": correo institucional inválido para un Docente', async () => {
    req.body = { correo: 'carlos@gmail.com' };

    db.query.mockResolvedValueOnce([[docenteActual]]);

    await usuarioController.editarPerfilPropio(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Datos no cumplen con el formato' });
    // No debe haber llegado a consultar duplicados ni actualizar
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('Excepción "Correo ya registrado": otro usuario ya usa ese correo', async () => {
    req.body = { correo: 'ocupado@jacquescousteau.edu' };

    db.query
      .mockResolvedValueOnce([[docenteActual]])
      .mockResolvedValueOnce([[{ Usuario_Id: 9 }]]); // ya existe en otro usuario

    await usuarioController.editarPerfilPropio(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El correo ingresado ya se encuentra registrado' });
  });

  test('Excepción: error técnico retorna 500', async () => {
    req.body = { telefono: '922222222' };

    db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await usuarioController.editarPerfilPropio(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No fue posible actualizar tu perfil, reintente más tarde' });
  });
});

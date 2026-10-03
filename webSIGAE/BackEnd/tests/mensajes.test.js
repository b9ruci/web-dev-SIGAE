const mensajeController = require('../controllers/mensajeController');
const pool = require('../config/db');

jest.mock('../config/db');

const conversacion = (extra = {}) => ({
  Conversacion_Id: 1112,
  Docente_Usuario_Id: 5,
  Apoderado_Usuario_Id: 4,
  Conversacion_Estado: 1,
  ...extra,
});

describe('Pruebas Unitarias - CU73: Mensajería docente-apoderado', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, query: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    pool.query = jest.fn();
  });

  // ── Conversaciones ──
  test('Un administrador (sin rol Docente/Apoderado) no puede listar conversaciones', async () => {
    req.user = { id: 1, roles: ['Administrador'] };

    await mensajeController.obtenerConversaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('Lista las conversaciones según el rol activo y muestra a la contraparte', async () => {
    req.user = { id: 4, roles: ['Docente', 'Apoderado'] };
    req.query.rol = 'Apoderado';
    pool.query.mockResolvedValueOnce([[{
      Conversacion_Id: 1112,
      Docente_Nombre: 'Juan Pérez',
      Apoderado_Nombre: 'Pedro Fernandez',
      No_Leidos: '2',
    }]]);

    await mensajeController.obtenerConversaciones(req, res);

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('WHERE c.Apoderado_Usuario_Id = ?');
    expect(params).toEqual(['Apoderado', 'Apoderado', 4]);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ Contacto_Nombre: 'Juan Pérez', No_Leidos: 2 }),
    ]);
  });

  // ── Mensajes ──
  test('Un usuario que no participa en la conversación recibe 404', async () => {
    req.user = { id: 9, roles: ['Docente'] };
    req.params.id = '1112';
    pool.query.mockResolvedValueOnce([[]]);

    await mensajeController.obtenerMensajes(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Devuelve los mensajes junto con el rol del usuario en la conversación', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };
    req.params.id = '1112';
    pool.query
      .mockResolvedValueOnce([[conversacion()]])
      .mockResolvedValueOnce([[{ Mensaje_Id: 1, Mensaje_Remitente_Rol: 'Docente' }]]);

    await mensajeController.obtenerMensajes(req, res);

    expect(res.json).toHaveBeenCalledWith({
      conversacion: expect.objectContaining({ Mi_Rol: 'Apoderado' }),
      mensajes: [{ Mensaje_Id: 1, Mensaje_Remitente_Rol: 'Docente' }],
    });
  });

  test('Enviar: el contenido vacío se rechaza con 400', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };
    req.params.id = '1112';
    req.body.contenido = '   ';

    await mensajeController.enviarMensaje(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('Enviar: un usuario Docente y Apoderado responde como Apoderado en su conversación de apoderado', async () => {
    req.user = { id: 4, roles: ['Docente', 'Apoderado'] };
    req.params.id = '1112';
    req.body.contenido = 'Hola profesor';
    pool.query
      .mockResolvedValueOnce([[conversacion()]])
      .mockResolvedValueOnce([{ insertId: 777 }]);

    await mensajeController.enviarMensaje(req, res);

    const [sql, params] = pool.query.mock.calls[1];
    expect(sql).toContain('CURDATE(), CURTIME()');
    expect(params).toEqual(['Hola profesor', 'Apoderado', 1112]);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Enviar: una conversación cerrada responde 409', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.id = '1111';
    req.body.contenido = 'Hola';
    pool.query.mockResolvedValueOnce([[conversacion({ Conversacion_Estado: 0 })]]);

    await mensajeController.enviarMensaje(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('Enviar - Excepción 2: error al guardar el mensaje responde 500', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.id = '1112';
    req.body.contenido = 'Hola';
    pool.query
      .mockResolvedValueOnce([[conversacion()]])
      .mockRejectedValueOnce(new Error('Fallo de conexión'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await mensajeController.enviarMensaje(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('Marcar leídos usa el rol del usuario dentro de la conversación', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.params.id = '1112';
    pool.query
      .mockResolvedValueOnce([[conversacion()]])
      .mockResolvedValueOnce([{ affectedRows: 3 }]);

    await mensajeController.marcarMensajesLeidos(req, res);

    expect(pool.query.mock.calls[1][1]).toEqual([1112, 'Docente']);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Mensajes marcados como leídos', actualizados: 3 });
  });

  // ── Contactos ──
  test('Contactos del docente: agrupa a cada apoderado con sus estudiantes', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    pool.query.mockResolvedValueOnce([[
      { Contacto_Id: 4, Contacto_Nombre: 'Pedro', Estudiante_Nombre_Completo: 'Valentina', Curso_Nombre: '1A' },
      { Contacto_Id: 4, Contacto_Nombre: 'Pedro', Estudiante_Nombre_Completo: 'Tomás', Curso_Nombre: '2A' },
    ]]);

    await mensajeController.obtenerContactos(req, res);

    expect(res.json).toHaveBeenCalledWith([{
      Contacto_Id: 4,
      Contacto_Nombre: 'Pedro',
      Contacto_Rol: 'Apoderado',
      Estudiantes: ['Valentina (1A)', 'Tomás (2A)'],
    }]);
  });

  // ── Iniciar conversación ──
  test('Iniciar: sin relación válida docente-apoderado responde 403', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.body = { contactoId: 99, rol: 'Docente' };
    pool.query.mockResolvedValueOnce([[]]);

    await mensajeController.iniciarConversacion(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('Iniciar: si ya existe una conversación abierta se reutiliza', async () => {
    req.user = { id: 4, roles: ['Apoderado'] };
    req.body = { contactoId: 5 };
    pool.query
      .mockResolvedValueOnce([[{ Contacto_Id: 5, Contacto_Nombre: 'Juan', Estudiante_Nombre_Completo: 'Valentina' }]])
      .mockResolvedValueOnce([[{ Conversacion_Id: 1112 }]]);

    await mensajeController.iniciarConversacion(req, res);

    expect(pool.query.mock.calls[1][1]).toEqual([5, 4]);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ conversacionId: 1112, nueva: false }));
  });

  test('Iniciar - Excepción 1: sin historial previo se crea una nueva conversación', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.body = { contactoId: 8, rol: 'Docente' };
    pool.query
      .mockResolvedValueOnce([[{ Contacto_Id: 8, Contacto_Nombre: 'Ana', Estudiante_Nombre_Completo: 'Matías' }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 1200 }]);

    await mensajeController.iniciarConversacion(req, res);

    expect(pool.query.mock.calls[2][1]).toEqual([5, 8]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ conversacionId: 1200, nueva: true }));
  });

  test('Iniciar: contacto inválido responde 400', async () => {
    req.user = { id: 5, roles: ['Docente'] };
    req.body = { contactoId: 'abc' };

    await mensajeController.iniciarConversacion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

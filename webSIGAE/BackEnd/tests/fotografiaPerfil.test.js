const usuarioController = require('../controllers/usuarioController');
const db = require('../config/db');
const fs = require('fs');

jest.mock('../config/db');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  unlink: jest.fn((_path, cb) => cb && cb()),
}));

describe('Pruebas Unitarias - CU20: Editando Fotografía de Perfil Mediante Carga de Archivo', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 5 },
      file: { filename: 'usuario-5-123456.jpg', path: '/tmp/usuario-5-123456.jpg' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Flujo correcto: guarda la ruta de la nueva fotografía y elimina la anterior', async () => {
    db.query
      .mockResolvedValueOnce([[{ Usuario_Foto_Perfil: '/uploads/perfiles/usuario-5-000000.jpg' }]]) // SELECT anterior
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

    await usuarioController.actualizarFotografiaPerfil(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Fotografía actualizada correctamente',
      Usuario_Foto_Perfil: '/uploads/perfiles/usuario-5-123456.jpg',
    });
    expect(fs.unlink).toHaveBeenCalled();
  });

  test('Flujo correcto: no intenta eliminar nada si el usuario no tenía fotografía previa', async () => {
    db.query
      .mockResolvedValueOnce([[{ Usuario_Foto_Perfil: null }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await usuarioController.actualizarFotografiaPerfil(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Fotografía actualizada correctamente' })
    );
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  test('Retorna 400 si no llega ningún archivo', async () => {
    req.file = undefined;

    await usuarioController.actualizarFotografiaPerfil(req, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Debes seleccionar un archivo de imagen' });
  });

  test('Excepción "Error técnico de almacenamiento": retorna 500 si la consulta falla', async () => {
    db.query.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await usuarioController.actualizarFotografiaPerfil(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No fue posible guardar la fotografía, reintente más tarde' });
  });
});

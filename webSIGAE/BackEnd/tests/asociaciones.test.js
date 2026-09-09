const estudianteController = require('../controllers/estudianteController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU9 y CU10: Gestión de Asociaciones Apoderado-Estudiante', () => {
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

  // CU9: Eliminar todas las asociaciones activas
  describe('CU9 - eliminarTodasAsociacionesApoderado', () => {
    test('Debe eliminar todas las asociaciones exitosamente', async () => {
      req.params.apoderadoId = 5;

      db.query.mockResolvedValueOnce([
        [{ Usuario_Id: 5, Usuario_Nombre_Completo: 'Juan Perez', Usuario_Estado_Cuenta: 1, Es_Apoderado: 1 }]
      ]);
      db.query.mockResolvedValueOnce([
        [{ Estudiante_Id: 1 }, { Estudiante_Id: 2 }]
      ]);
      db.query.mockResolvedValueOnce([{ affectedRows: 2 }]);

      await estudianteController.eliminarTodasAsociacionesApoderado(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Todas las asociaciones activas fueron eliminadas exitosamente',
          eliminadas: 2,
        })
      );
    });

    test('Excepción 1: Retorna 400 si el apoderado no tiene asociaciones activas', async () => {
      req.params.apoderadoId = 5;

      db.query.mockResolvedValueOnce([
        [{ Usuario_Id: 5, Usuario_Nombre_Completo: 'Juan Perez', Usuario_Estado_Cuenta: 1, Es_Apoderado: 1 }]
      ]);
      db.query.mockResolvedValueOnce([[]]);

      await estudianteController.eliminarTodasAsociacionesApoderado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'El apoderado seleccionado no posee asociaciones activas con estudiantes',
      });
    });

    test('Retorna 404 si el apoderado no existe', async () => {
      req.params.apoderadoId = 999;
      db.query.mockResolvedValueOnce([[]]);

      await estudianteController.eliminarTodasAsociacionesApoderado(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Apoderado no encontrado' });
    });
  });

  // CU10: Eliminar asociación específica
  describe('CU10 - eliminarAsociacionEspecifica', () => {
    test('Debe eliminar la asociación del estudiante exitosamente', async () => {
      req.params.estudianteId = 10;

      db.query.mockResolvedValueOnce([
        [{ Estudiante_Id: 10, Estudiante_Nombre_Completo: 'Lucas Silva', Apoderado_Usuario_Id: 5 }]
      ]);
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await estudianteController.eliminarAsociacionEspecifica(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Asociación eliminada exitosamente para el estudiante Lucas Silva',
        })
      );
    });

    test('Excepción 1: Retorna 400 si el estudiante no tenía apoderado asociado', async () => {
      req.params.estudianteId = 10;

      db.query.mockResolvedValueOnce([
        [{ Estudiante_Id: 10, Estudiante_Nombre_Completo: 'Lucas Silva', Apoderado_Usuario_Id: null }]
      ]);

      await estudianteController.eliminarAsociacionEspecifica(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'La asociación seleccionada ya no se encuentra disponible o activa',
      });
    });

    test('Retorna 404 si el estudiante no existe', async () => {
      req.params.estudianteId = 999;
      db.query.mockResolvedValueOnce([[]]);

      await estudianteController.eliminarAsociacionEspecifica(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Ficha de estudiante no encontrada' });
    });
  });
});
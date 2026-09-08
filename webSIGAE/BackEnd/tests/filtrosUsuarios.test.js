const usuarioController = require('../controllers/usuarioController');
const db = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU30 a CU33: Listados y Filtros de Docentes y Apoderados', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // CU30 y CU31: Listado y filtro de Docentes
  describe('CU30 y CU31 - getDocentes', () => {
    test('CU30: Debe retornar el listado completo de docentes', async () => {
      const mockDocentes = [
        {
          Usuario_Id: 1,
          Usuario_Nombre_Completo: 'Carlos Ruiz',
          Docente_Especialidad: 'Matemáticas',
          Usuario_Estado_Cuenta: 1,
          Es_Docente: 1,
        },
      ];

      db.query.mockResolvedValueOnce([mockDocentes]);

      await usuarioController.getDocentes(req, res);

      expect(res.json).toHaveBeenCalledWith(mockDocentes);
    });

    test('CU31: Debe filtrar docentes por especialidad y estado de cuenta', async () => {
      req.query = { especialidad: 'Historia', estado: '1' };

      const mockDocentesFiltrados = [
        {
          Usuario_Id: 2,
          Usuario_Nombre_Completo: 'Ana Rojas',
          Docente_Especialidad: 'Historia',
          Usuario_Estado_Cuenta: 1,
        },
      ];

      db.query.mockResolvedValueOnce([mockDocentesFiltrados]);

      await usuarioController.getDocentes(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('AND Docente_Especialidad LIKE ?'),
        expect.arrayContaining(['%Historia%', 1])
      );
      expect(res.json).toHaveBeenCalledWith(mockDocentesFiltrados);
    });

    test('Excepción 1: Retorna mensaje si no hay coincidencias de docentes', async () => {
      req.query = { especialidad: 'Inexistente' };
      db.query.mockResolvedValueOnce([[]]);

      await usuarioController.getDocentes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'No existen docentes asociados a los criterios ingresados',
          docentes: [],
        })
      );
    });
  });

  // CU32 y CU33: Listado y filtro de Apoderados
  describe('CU32 y CU33 - getApoderados', () => {
    test('CU32: Debe retornar el listado completo de apoderados', async () => {
      const mockApoderados = [
        {
          Usuario_Id: 10,
          Usuario_Nombre_Completo: 'Pedro Morales',
          Total_Estudiantes_Asociados: 2,
          Es_Apoderado: 1,
        },
      ];

      db.query.mockResolvedValueOnce([mockApoderados]);

      await usuarioController.getApoderados(req, res);

      expect(res.json).toHaveBeenCalledWith(mockApoderados);
    });

    test('CU33: Debe filtrar apoderados por cantidad de estudiantes asociados', async () => {
      req.query = { cantidadEstudiantes: '2' };

      const mockFiltrados = [
        {
          Usuario_Id: 10,
          Usuario_Nombre_Completo: 'Pedro Morales',
          Total_Estudiantes_Asociados: 2,
        },
      ];

      db.query.mockResolvedValueOnce([mockFiltrados]);

      await usuarioController.getApoderados(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('HAVING Total_Estudiantes_Asociados = ?'),
        expect.arrayContaining([2])
      );
      expect(res.json).toHaveBeenCalledWith(mockFiltrados);
    });

    test('Excepción 1: Retorna mensaje si no hay coincidencias de apoderados', async () => {
      req.query = { cantidadEstudiantes: '99' };
      db.query.mockResolvedValueOnce([[]]);

      await usuarioController.getApoderados(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'No existen apoderados asociados a los criterios ingresados',
          apoderados: [],
        })
      );
    });
  });
});
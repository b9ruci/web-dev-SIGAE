// puppeteer se distribuye como ESM puro; se mockea con una factory para
// evitar que Jest intente parsear su código fuente (no se ejercita la
// generación real de PNG en estas pruebas, solo la lógica de autorización
// y las excepciones de CU60-CU62).
jest.mock('puppeteer', () => ({ launch: jest.fn() }));

const exportController = require('../controllers/exportController');
const pool = require('../config/db');

jest.mock('../config/db');

describe('Pruebas Unitarias - CU60-CU62: Exportación de Horarios', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, query: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('CU60 - exportarMaestro', () => {
    test('Excepción 1: retorna 404 si no existe horario maestro disponible', async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      await exportController.exportarMaestro(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No existe horario maestro disponible para exportar' });
    });

    test('Retorna 400 si el formato solicitado no es válido', async () => {
      req.query.formato = 'docx';
      pool.execute.mockResolvedValueOnce([[
        { dia: 'Lunes', hora_inicio: '09:00:00', hora_fin: '09:45:00', curso: '1ero A', asignatura: 'Matemáticas', docente: 'Juan Perez' },
      ]]);

      await exportController.exportarMaestro(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Formato inválido. Use: pdf, excel o png' });
    });
  });

  describe('CU61 - exportarPorDocente', () => {
    test('Un Administrador puede exportar el horario de cualquier docente', async () => {
      req.user = { id: 1, roles: ['Administrador'] };
      req.params.usuarioId = '5';
      req.query.formato = 'docx'; // fuerza el corte antes de renderizar

      pool.execute
        .mockResolvedValueOnce([[{ Usuario_Nombre_Completo: 'Juan Perez' }]])
        .mockResolvedValueOnce([[{ dia: 'Lunes', hora_inicio: '09:00:00', hora_fin: '09:45:00', curso: '1ero A', asignatura: 'Matemáticas' }]]);

      await exportController.exportarPorDocente(req, res);

      expect(res.status).not.toHaveBeenCalledWith(403);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Un Docente puede exportar su propio horario', async () => {
      req.user = { id: 5, roles: ['Docente'] };
      req.params.usuarioId = '5';
      req.query.formato = 'docx';

      pool.execute
        .mockResolvedValueOnce([[{ Usuario_Nombre_Completo: 'Juan Perez' }]])
        .mockResolvedValueOnce([[{ dia: 'Lunes', hora_inicio: '09:00:00', hora_fin: '09:45:00', curso: '1ero A', asignatura: 'Matemáticas' }]]);

      await exportController.exportarPorDocente(req, res);

      expect(res.status).not.toHaveBeenCalledWith(403);
    });

    test('Retorna 403 si un Docente intenta exportar el horario de otro docente', async () => {
      req.user = { id: 5, roles: ['Docente'] };
      req.params.usuarioId = '999';

      await exportController.exportarPorDocente(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No tienes permiso para exportar este horario' });
      expect(pool.execute).not.toHaveBeenCalled();
    });

    test('Retorna 403 si el actor es Apoderado', async () => {
      req.user = { id: 8, roles: ['Apoderado'] };
      req.params.usuarioId = '5';

      await exportController.exportarPorDocente(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(pool.execute).not.toHaveBeenCalled();
    });

    test('Retorna 404 si el docente no existe', async () => {
      req.user = { id: 1, roles: ['Administrador'] };
      req.params.usuarioId = '999';

      pool.execute.mockResolvedValueOnce([[]]);

      await exportController.exportarPorDocente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Docente no encontrado' });
    });

    test('Excepción 1: retorna 404 si el docente no posee asignaciones horarias', async () => {
      req.user = { id: 1, roles: ['Administrador'] };
      req.params.usuarioId = '5';

      pool.execute
        .mockResolvedValueOnce([[{ Usuario_Nombre_Completo: 'Juan Perez' }]])
        .mockResolvedValueOnce([[]]);

      await exportController.exportarPorDocente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'El docente no posee asignaciones horarias registradas' });
    });
  });

  describe('CU62 - exportarPorCurso', () => {
    test('Retorna 404 si el curso no existe', async () => {
      req.params.cursoId = '999';
      pool.execute.mockResolvedValueOnce([[]]);

      await exportController.exportarPorCurso(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Curso no encontrado' });
    });

    test('Excepción 1: retorna 404 si el curso no posee asignaciones horarias', async () => {
      req.params.cursoId = '222';
      pool.execute
        .mockResolvedValueOnce([[{ Curso_Nombre: '1ero Básico A' }]])
        .mockResolvedValueOnce([[]]);

      await exportController.exportarPorCurso(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'El curso no posee asignaciones horarias registradas' });
    });

    test('Retorna 400 si el formato solicitado no es válido', async () => {
      req.params.cursoId = '222';
      req.query.formato = 'docx';
      pool.execute
        .mockResolvedValueOnce([[{ Curso_Nombre: '1ero Básico A' }]])
        .mockResolvedValueOnce([[{ dia: 'Lunes', hora_inicio: '09:00:00', hora_fin: '09:45:00', asignatura: 'Matemáticas', docente: 'Juan Perez' }]]);

      await exportController.exportarPorCurso(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Formato inválido. Use: pdf, excel o png' });
    });
  });
});

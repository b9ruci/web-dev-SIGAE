const bloquesController = require('../controllers/bloquesController');
const pool = require('../config/db');

jest.mock('../config/db');

const BLOQUE_VALIDO = {
  Bloque_Horario_Hora_Inicio: '09:00',
  Bloque_Horario_Hora_Fin: '09:45',
  Bloque_Horario_Jornada: 'Mañana',
  Bloque_Horario_Tipo: 'Clase',
};

const PARAMETRO_INSTITUCIONAL = {
  Parametro_Institucional_Id: 1,
  Parametro_Institucional_Inicio_Jornada: '08:00:00',
  Parametro_Institucional_Fin_Jornada: '17:00:00',
};

describe('Pruebas Unitarias - CU49: Modificando Bloques Horarios', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: '3' }, body: { ...BLOQUE_VALIDO } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Flujo correcto: actualiza el bloque y retorna el mensaje de éxito', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 3, Parametro_Institucional_Id: 1 }]]) // existe
      .mockResolvedValueOnce([[PARAMETRO_INSTITUCIONAL]]) // parametro_institucional
      .mockResolvedValueOnce([[]]) // conflicto
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

    await bloquesController.updateBloque(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Bloque actualizado correctamente' });
  });

  test('Excepción "Datos inválidos o fuera de rango": faltan campos obligatorios', async () => {
    req.body = { Bloque_Horario_Hora_Inicio: '09:00' };

    await bloquesController.updateBloque(req, res);

    expect(pool.execute).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Datos inválidos o fuera de rango' });
  });

  test('Excepción "Datos inválidos o fuera de rango": hora de inicio posterior o igual a la de fin', async () => {
    req.body = { ...BLOQUE_VALIDO, Bloque_Horario_Hora_Inicio: '10:00', Bloque_Horario_Hora_Fin: '09:00' };

    await bloquesController.updateBloque(req, res);

    expect(pool.execute).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Datos inválidos o fuera de rango' });
  });

  test('Excepción "Datos inválidos o fuera de rango": fuera del rango institucional', async () => {
    req.body = { ...BLOQUE_VALIDO, Bloque_Horario_Hora_Inicio: '07:00', Bloque_Horario_Hora_Fin: '07:45' };
    pool.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 3, Parametro_Institucional_Id: 1 }]]) // existe
      .mockResolvedValueOnce([[PARAMETRO_INSTITUCIONAL]]); // parametro_institucional

    await bloquesController.updateBloque(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Datos inválidos o fuera de rango' });
  });

  test('Excepción "Conflicto con bloque existente"', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 3, Parametro_Institucional_Id: 1 }]]) // existe
      .mockResolvedValueOnce([[PARAMETRO_INSTITUCIONAL]]) // parametro_institucional
      .mockResolvedValueOnce([[{ Bloque_Horario_Id: 9 }]]); // conflicto

    await bloquesController.updateBloque(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conflicto con bloque existente' });
  });

  test('Retorna 404 si el bloque a modificar no existe', async () => {
    pool.execute.mockResolvedValueOnce([[]]); // existe: vacío

    await bloquesController.updateBloque(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bloque no encontrado' });
  });

  test('Retorna 500 si ocurre un error de base de datos', async () => {
    pool.execute.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await bloquesController.updateBloque(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('Pruebas Unitarias - CU50: Eliminando Bloques Horarios Individuales', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: '3' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Flujo correcto: elimina el bloque y retorna el mensaje de éxito', async () => {
    pool.execute
      .mockResolvedValueOnce([[]]) // horario_asignatura: sin uso
      .mockResolvedValueOnce([[]]) // afecta: sin uso
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE

    await bloquesController.deleteBloque(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Bloque eliminado exitosamente' });
  });

  test('Excepción "Bloque horario no existe"', async () => {
    pool.execute
      .mockResolvedValueOnce([[]]) // horario_asignatura: sin uso
      .mockResolvedValueOnce([[]]) // afecta: sin uso
      .mockResolvedValueOnce([{ affectedRows: 0 }]); // DELETE: no encontrado

    await bloquesController.deleteBloque(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'El bloque horario no existe' });
  });

  test('Retorna 409 si el bloque está asignado a un horario de curso', async () => {
    pool.execute.mockResolvedValueOnce([[{ Horario_Asignatura_Id: 1 }]]); // horario_asignatura: en uso

    await bloquesController.deleteBloque(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se puede eliminar: el bloque está asignado a un horario de curso' });
  });

  test('Retorna 409 si el bloque está asociado a un evento institucional', async () => {
    pool.execute
      .mockResolvedValueOnce([[]]) // horario_asignatura: sin uso
      .mockResolvedValueOnce([[{ Afecta_Id: 1 }]]); // afecta: en uso

    await bloquesController.deleteBloque(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se puede eliminar: el bloque está asociado a un evento institucional' });
  });

  test('Retorna 500 si ocurre un error de base de datos', async () => {
    pool.execute.mockRejectedValueOnce(new Error('Fallo de conexión'));

    await bloquesController.deleteBloque(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

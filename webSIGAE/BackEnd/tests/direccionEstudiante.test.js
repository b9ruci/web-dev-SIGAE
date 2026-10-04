const estudianteController = require('../controllers/estudianteController');
const db = require('../config/db');

jest.mock('../config/db');

function crearRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

describe('Incremento 3 - Dirección estructurada del estudiante', () => {
  const fichaValida = {
    Estudiante_Nombre_Completo: 'Diego Perez Castro',
    Estudiante_RUT: '5738925-7',
    Curso_Id: 222,
    Estudiante_Estado_Academico: 'Regular',
    Estudiante_Calle: 'Pasaje Las Rosas',
    Estudiante_Numero: '77',
    Estudiante_Depto: '',
    Estudiante_Comuna: 'Maipú',
  };

  beforeEach(() => jest.clearAllMocks());

  test.each([
    [{ Estudiante_Calle: '' }, 'La calle es obligatoria'],
    [{ Estudiante_Numero: 'sin número' }, 'El número de la dirección debe ser numérico (ej: 134 o 134B)'],
    [{ Estudiante_Comuna: undefined }, 'La comuna es obligatoria'],
  ])('registrar ficha rechaza la dirección %p sin tocar la BD', async (cambio, mensaje) => {
    const res = crearRes();
    await estudianteController.createEstudiante({ body: { ...fichaValida, ...cambio } }, res);
    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje });
  });

  test('registrar ficha guarda la dirección separada (depto vacío como NULL)', async () => {
    const res = crearRes();
    db.query
      .mockResolvedValueOnce([[]]) // RUT no duplicado
      .mockResolvedValueOnce([[{ Curso_Id: 222 }]]) // curso existe
      .mockResolvedValueOnce([{ insertId: 300 }]) // INSERT
      .mockResolvedValueOnce([[{ Estudiante_Id: 300 }]]);

    await estudianteController.createEstudiante({ body: fichaValida }, res);

    const [sql, valores] = db.query.mock.calls[2];
    expect(sql).toContain('Estudiante_Calle');
    expect(sql).toContain('Estudiante_Comuna');
    expect(valores.slice(-4)).toEqual(['Pasaje Las Rosas', '77', null, 'Maipú']);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('editar ficha actualiza solo los campos de dirección enviados', async () => {
    const res = crearRes();
    const actual = { Estudiante_Id: 300, Estudiante_Calle: 'Pasaje Las Rosas', Estudiante_Comuna: 'Maipú' };
    db.query
      .mockResolvedValueOnce([[actual]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ ...actual, Estudiante_Comuna: 'Ñuñoa' }]]);

    await estudianteController.updateEstudiante({ params: { id: 300 }, body: { Estudiante_Comuna: ' Ñuñoa ' } }, res);

    const [sql, valores] = db.query.mock.calls[1];
    expect(sql).toBe('UPDATE estudiante SET Estudiante_Comuna = ? WHERE Estudiante_Id = ?');
    expect(valores).toEqual(['Ñuñoa', 300]);
  });

  test('editar ficha rechaza una comuna inválida', async () => {
    const res = crearRes();
    await estudianteController.updateEstudiante({ params: { id: 300 }, body: { Estudiante_Comuna: '123' } }, res);
    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

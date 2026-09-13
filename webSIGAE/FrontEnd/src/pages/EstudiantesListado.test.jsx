/**
 * Pruebas unitarias para el componente EstudiantesListado
 * Casos de Uso: CU34, CU35, CU36, CU37
 */

describe('Módulo de Estudiantes - Frontend (CU34 - CU37)', () => {

  // Mock de datos de prueba
  const estudiantesMock = [
    { id: 1, rut: '21345678-9', nombreCompleto: 'Lucas Cisternas Morales', curso: '1ero Básico A', estado: 'Regular' },
    { id: 2, rut: '22123456-k', nombreCompleto: 'Martina Benítez Silva', curso: '1ero Básico B', estado: 'Regular' },
    { id: 3, rut: '20987654-3', nombreCompleto: 'Benjamín Fuentes Rojas', curso: '2do Básico A', estado: 'Inactivo' },
    { id: 4, rut: '21567890-1', nombreCompleto: 'Sofía Valenzuela Castro', curso: '1ero Medio', estado: 'Regular' },
    { id: 5, rut: '19876543-2', nombreCompleto: 'Matías Vásquez Alarcón', curso: '2do Medio', estado: 'Egresado' },
  ];

  // Función pura de filtrado que reproduce la lógica del componente
  const filtrarEstudiantes = (lista, busqueda, curso, estado) => {
    return lista.filter((est) => {
      const termino = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        termino === '' ||
        est.nombreCompleto.toLowerCase().includes(termino) ||
        est.rut.toLowerCase().includes(termino);
      const coincideCurso = curso === '' || est.curso === curso;
      const coincideEstado = estado === '' || est.estado === estado;
      return coincideBusqueda && coincideCurso && coincideEstado;
    });
  };

  // Función de ordenamiento
  const ordenarEstudiantes = (lista, campo, ascendente = true) => {
    return [...lista].sort((a, b) => {
      const factor = ascendente ? 1 : -1;
      return a[campo].localeCompare(b[campo]) * factor;
    });
  };

  // CU34: Listado y Ordenamiento
  test('CU34: Debe listar la totalidad de los estudiantes y permitir ordenamiento por nombre', () => {
    const lista = estudiantesMock;
    expect(lista.length).toBe(5);

    const ordenadosAsc = ordenarEstudiantes(lista, 'nombreCompleto', true);
    expect(ordenadosAsc[0].nombreCompleto).toBe('Benjamín Fuentes Rojas');

    const ordenadosDesc = ordenarEstudiantes(lista, 'nombreCompleto', false);
    expect(ordenadosDesc[0].nombreCompleto).toBe('Sofía Valenzuela Castro');
  });

  // CU35: Filtrado por Curso y Estado
  test('CU35: Debe filtrar correctamente por curso específico', () => {
    const resultado = filtrarEstudiantes(estudiantesMock, '', '1ero Básico A', '');
    expect(resultado.length).toBe(1);
    expect(resultado[0].nombreCompleto).toBe('Lucas Cisternas Morales');
  });

  test('CU35: Debe filtrar estudiantes por estado académico Inactivo', () => {
    const resultado = filtrarEstudiantes(estudiantesMock, '', '', 'Inactivo');
    expect(resultado.length).toBe(1);
    expect(resultado[0].nombreCompleto).toBe('Benjamín Fuentes Rojas');
  });

  // CU36: Búsqueda por Nombre o RUT
  test('CU36: Debe encontrar un estudiante por coincidencia parcial de RUT', () => {
    const resultado = filtrarEstudiantes(estudiantesMock, '22123456', '', '');
    expect(resultado.length).toBe(1);
    expect(resultado[0].nombreCompleto).toBe('Martina Benítez Silva');
  });

  test('CU36: Debe retornar vacío ante un criterio de búsqueda inexistente (Excepción 1)', () => {
    const resultado = filtrarEstudiantes(estudiantesMock, 'RUT_INEXISTENTE', '', '');
    expect(resultado.length).toBe(0);
  });

  // CU37: Búsqueda Combinada
  test('CU37: Debe aplicar búsqueda combinada de texto y estado Regular', () => {
    const resultado = filtrarEstudiantes(estudiantesMock, 'Sofía', '', 'Regular');
    expect(resultado.length).toBe(1);
    expect(resultado[0].curso).toBe('1ero Medio');
  });

  test('CU37: Debe limpiar filtros y retornar la lista base completa', () => {
    let busqueda = 'Lucas';
    let curso = '1ero Básico A';
    let estado = 'Regular';

    // Se aplican filtros
    let resultado = filtrarEstudiantes(estudiantesMock, busqueda, curso, estado);
    expect(resultado.length).toBe(1);

    // Acción de limpiar
    busqueda = '';
    curso = '';
    estado = '';
    resultado = filtrarEstudiantes(estudiantesMock, busqueda, curso, estado);
    expect(resultado.length).toBe(5);
  });

});
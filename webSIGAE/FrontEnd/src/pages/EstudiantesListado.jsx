import React, { useState, useMemo } from 'react';

const ESTUDIANTES_INICIALES = [
  { id: 1, rut: '21345678-9', nombreCompleto: 'Lucas Cisternas Morales', curso: '1ero Básico A', estado: 'Regular' },
  { id: 2, rut: '22123456-k', nombreCompleto: 'Martina Benítez Silva', curso: '1ero Básico B', estado: 'Regular' },
  { id: 3, rut: '20987654-3', nombreCompleto: 'Benjamín Fuentes Rojas', curso: '2do Básico A', estado: 'Inactivo' },
  { id: 4, rut: '21567890-1', nombreCompleto: 'Sofía Valenzuela Castro', curso: '1ero Medio', estado: 'Regular' },
  { id: 5, rut: '19876543-2', nombreCompleto: 'Matías Vásquez Alarcón', curso: '2do Medio', estado: 'Egresado' },
];

export default function EstudiantesListado() {
  const [estudiantes] = useState(ESTUDIANTES_INICIALES);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [orden, setOrden] = useState({ campo: 'nombreCompleto', ascendente: true });

  const cursosDisponibles = useMemo(() => {
    return [...new Set(estudiantes.map((e) => e.curso))];
  }, [estudiantes]);

  const alternarOrden = (campo) => {
    setOrden((prev) => ({
      campo,
      ascendente: prev.campo === campo ? !prev.ascendente : true,
    }));
  };

  const estudiantesFiltrados = useMemo(() => {
    return estudiantes
      .filter((est) => {
        const termino = busqueda.trim().toLowerCase();
        const coincideBusqueda =
          termino === '' ||
          est.nombreCompleto.toLowerCase().includes(termino) ||
          est.rut.toLowerCase().includes(termino);

        const coincideCurso = filtroCurso === '' || est.curso === filtroCurso;
        const coincideEstado = filtroEstado === '' || est.estado === filtroEstado;

        return coincideBusqueda && coincideCurso && coincideEstado;
      })
      .sort((a, b) => {
        const factor = orden.ascendente ? 1 : -1;
        return a[orden.campo].localeCompare(b[orden.campo]) * factor;
      });
  }, [estudiantes, busqueda, filtroCurso, filtroEstado, orden]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCurso('');
    setFiltroEstado('');
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Encabezado */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 6px 0' }}>
            Gestión de Estudiantes
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
            Listado general, búsqueda y consulta de fichas estudiantiles
          </p>
        </div>

        {/* Tarjeta de Contenedor */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          {/* Barra de Filtros */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                flex: '1 1 300px',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />

            <select
              value={filtroCurso}
              onChange={(e) => setFiltroCurso(e.target.value)}
              style={{
                flex: '1 1 180px',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#fff',
                outline: 'none'
              }}
            >
              <option value="">Todos los cursos</option>
              {cursosDisponibles.map((curso) => (
                <option key={curso} value={curso}>{curso}</option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                flex: '1 1 180px',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#fff',
                outline: 'none'
              }}
            >
              <option value="">Todos los estados</option>
              <option value="Regular">Regular</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Egresado">Egresado</option>
            </select>

            <button
              onClick={limpiarFiltros}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Limpiar
            </button>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => alternarOrden('rut')}>
                    RUT {orden.campo === 'rut' ? (orden.ascendente ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => alternarOrden('nombreCompleto')}>
                    Nombre Completo {orden.campo === 'nombreCompleto' ? (orden.ascendente ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => alternarOrden('curso')}>
                    Curso {orden.campo === 'curso' ? (orden.ascendente ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => alternarOrden('estado')}>
                    Estado {orden.campo === 'estado' ? (orden.ascendente ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.length > 0 ? (
                  estudiantesFiltrados.map((est) => (
                    <tr key={est.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 16px', color: '#4b5563', fontFamily: 'monospace' }}>{est.rut}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '500', color: '#111827' }}>{est.nombreCompleto}</td>
                      <td style={{ padding: '14px 16px', color: '#374151' }}>{est.curso}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: est.estado === 'Regular' ? '#dcfce7' : est.estado === 'Inactivo' ? '#fee2e2' : '#fef3c7',
                          color: est.estado === 'Regular' ? '#166534' : est.estado === 'Inactivo' ? '#991b1b' : '#92400e'
                        }}>
                          {est.estado}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => alert(`Accediendo a CU38 (Edición/Ficha) para ${est.nombreCompleto}`)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af' }}>
                      No se encontraron estudiantes asociados al criterio ingresado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', fontSize: '13px', color: '#6b7280' }}>
            Mostrando {estudiantesFiltrados.length} de {estudiantes.length} estudiantes registrados
          </div>

        </div>
      </div>
    </div>
  );
}
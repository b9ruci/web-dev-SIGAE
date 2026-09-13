import { useEffect, useState } from "react";
import { getEstudiantes } from "../../services/api";

function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [estadosDisponibles, setEstadosDisponibles] = useState([]);
  const [orden, setOrden] = useState({ campo: "Estudiante_Nombre_Completo", ascendente: true });
  const [mensajeInfo, setMensajeInfo] = useState("");
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    cargarEstudiantes({}, true);
  }, []);

  // CU34 y CU35: listado con filtros opcionales de curso y estado académico, resueltos en el backend
  const cargarEstudiantes = async (filtros, esInicial = false) => {
    setLoading(true);
    setErrorCarga("");
    setMensajeInfo("");
    try {
      const data = await getEstudiantes(filtros);
      if (Array.isArray(data)) {
        setEstudiantes(data);
        // Las opciones de los selects se fijan solo en la carga inicial (sin filtros),
        // para que no se reduzcan a medida que se aplican filtros posteriores.
        if (esInicial) {
          setCursosDisponibles([...new Set(data.map((e) => e.Curso_Nombre).filter(Boolean))].sort());
          setEstadosDisponibles([...new Set(data.map((e) => e.Estudiante_Estado_Academico).filter(Boolean))].sort());
        }
      } else {
        // Excepciones: sin estudiantes registrados / sin coincidencias / docente sin cursos asignados
        setEstudiantes(data.estudiantes || []);
        setMensajeInfo(data.mensaje || "No hay estudiantes registrados.");
      }
    } catch (error) {
      // Error técnico en la consulta
      setErrorCarga(error.message || "No fue posible recuperar los registros");
    } finally {
      setLoading(false);
    }
  };

  const alternarOrden = (campo) => {
    setOrden((prev) => ({
      campo,
      ascendente: prev.campo === campo ? !prev.ascendente : true,
    }));
  };

  const aplicarFiltros = () => cargarEstudiantes({ curso: filtroCurso, estado: filtroEstado });

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroCurso("");
    setFiltroEstado("");
    cargarEstudiantes({});
  };

  // El filtro por curso/estado ya lo resuelve el backend (CU35); acá solo queda la búsqueda de texto libre
  const estudiantesFiltrados = estudiantes
    .filter((e) => {
      const texto = busqueda.toLowerCase();
      return (
        !busqueda ||
        e.Estudiante_Nombre_Completo?.toLowerCase().includes(texto) ||
        e.Estudiante_RUT?.toLowerCase().includes(texto)
      );
    })
    .sort((a, b) => {
      const factor = orden.ascendente ? 1 : -1;
      const valorA = a[orden.campo] ?? "";
      const valorB = b[orden.campo] ?? "";
      return String(valorA).localeCompare(String(valorB)) * factor;
    });

  const flechaOrden = (campo) => (orden.campo === campo ? (orden.ascendente ? " ↑" : " ↓") : "");

  if (loading) {
    return (
      <div className="usuarios-container">
        <p>Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Estudiantes</h1>
        <p>Listado de estudiantes registrados en el sistema</p>
      </div>

      <div className="usuarios-filtros">
        <input
          type="text"
          className="usuarios-search"
          placeholder="Buscar por nombre o RUT..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="usuarios-select"
          value={filtroCurso}
          onChange={(e) => setFiltroCurso(e.target.value)}
        >
          <option value="">Todos los cursos</option>
          {cursosDisponibles.map((curso) => (
            <option key={curso} value={curso}>{curso}</option>
          ))}
        </select>
        <select
          className="usuarios-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {estadosDisponibles.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
        <button type="button" className="btn-roles" onClick={aplicarFiltros}>
          Filtrar
        </button>
        <button type="button" className="btn-roles" onClick={limpiarFiltros}>
          Limpiar
        </button>
      </div>

      {errorCarga && (
        <div className="usuarios-empty" style={{ color: "#dc2626" }}>
          {errorCarga}
        </div>
      )}

      {!errorCarga && mensajeInfo && (
        <div className="usuarios-empty">{mensajeInfo}</div>
      )}

      {!errorCarga && !mensajeInfo && (
        <>
          {estudiantesFiltrados.length === 0 ? (
            <div className="usuarios-empty">No se encontraron estudiantes</div>
          ) : (
            <table className="tabla-usuarios">
              <thead>
                <tr>
                  <th>#</th>
                  <th style={{ cursor: "pointer" }} onClick={() => alternarOrden("Estudiante_Nombre_Completo")}>
                    Nombre{flechaOrden("Estudiante_Nombre_Completo")}
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => alternarOrden("Estudiante_RUT")}>
                    RUT{flechaOrden("Estudiante_RUT")}
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => alternarOrden("Curso_Nombre")}>
                    Curso{flechaOrden("Curso_Nombre")}
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => alternarOrden("Estudiante_Estado_Academico")}>
                    Estado{flechaOrden("Estudiante_Estado_Academico")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map((e, idx) => (
                  <tr key={e.Estudiante_Id}>
                    <td>{idx + 1}</td>
                    <td>{e.Estudiante_Nombre_Completo}</td>
                    <td>{e.Estudiante_RUT}</td>
                    <td>{e.Curso_Nombre}</td>
                    <td>
                      {e.Estudiante_Estado_Academico === "Regular" ? (
                        <span className="badge-activo">Regular</span>
                      ) : (
                        <span className="badge-inactivo">{e.Estudiante_Estado_Academico}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default Estudiantes;

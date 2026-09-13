import { useEffect, useState } from "react";
import { getEstudiantes } from "../../services/api";

function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mensajeInfo, setMensajeInfo] = useState("");
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    setLoading(true);
    setErrorCarga("");
    setMensajeInfo("");
    try {
      const data = await getEstudiantes();
      if (Array.isArray(data)) {
        setEstudiantes(data);
      } else {
        // Excepciones: sin estudiantes registrados / docente sin cursos asignados
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

  const estudiantesFiltrados = estudiantes.filter((e) => {
    const texto = busqueda.toLowerCase();
    return (
      !busqueda ||
      e.Estudiante_Nombre_Completo?.toLowerCase().includes(texto) ||
      e.Estudiante_RUT?.toLowerCase().includes(texto) ||
      e.Curso_Nombre?.toLowerCase().includes(texto)
    );
  });

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
          <div className="usuarios-filtros">
            <input
              type="text"
              className="usuarios-search"
              placeholder="Buscar por nombre, RUT o curso..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {estudiantesFiltrados.length === 0 ? (
            <div className="usuarios-empty">No se encontraron estudiantes</div>
          ) : (
            <table className="tabla-usuarios">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Curso</th>
                  <th>Estado</th>
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

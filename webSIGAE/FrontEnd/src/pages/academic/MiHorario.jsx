import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getHorarioDocente, getListaDocentes } from "../../services/api";

function MiHorario() {
  const { usuario, rolActivo } = useAuth();
  const esAdmin =
    (rolActivo || usuario?.roles?.[0]) === "Administrador" ||
    usuario?.administradorTipo === "Super Admin";

  const [docentes, setDocentes] = useState([]);
  const [docenteId, setDocenteId] = useState(esAdmin ? "" : usuario?.id ?? "");
  const [horario, setHorario] = useState([]);
  const [loading, setLoading] = useState(!esAdmin);
  const [mensajeInfo, setMensajeInfo] = useState("");
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    if (esAdmin) {
      getListaDocentes().then(setDocentes).catch(() => {});
    } else {
      cargarHorario(usuario?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CU43: horario semanal a partir de sus cursos asociados
  const cargarHorario = async (id) => {
    if (!id) return;
    setLoading(true);
    setErrorCarga("");
    setMensajeInfo("");
    try {
      const data = await getHorarioDocente(id);
      if (Array.isArray(data)) {
        setHorario(data);
      } else {
        // Excepción "Horario sin planificar"
        setHorario(data.horario || []);
        setMensajeInfo(data.mensaje || "No hay horario disponible para mostrar");
      }
    } catch (error) {
      // Excepciones "Docente no existe" y "Error técnico"
      setErrorCarga(error.message || "No fue posible cargar el horario, reintente más tarde");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarDocente = (id) => {
    setDocenteId(id);
    setHorario([]);
    setMensajeInfo("");
    setErrorCarga("");
    if (id) cargarHorario(id);
  };

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>{esAdmin ? "Horario de Docente" : "Mi Horario"}</h1>
        <p>Horario semanal a partir de los cursos y asignaturas asociados</p>
      </div>

      {esAdmin && (
        <div className="usuarios-filtros">
          <select
            className="usuarios-select"
            value={docenteId}
            onChange={(e) => seleccionarDocente(e.target.value)}
          >
            <option value="">Selecciona un docente...</option>
            {docentes.map((d) => (
              <option key={d.Usuario_Id} value={d.Usuario_Id}>{d.Usuario_Nombre_Completo}</option>
            ))}
          </select>
        </div>
      )}

      {loading && <p>Cargando horario...</p>}

      {!loading && esAdmin && !docenteId && (
        <div className="usuarios-empty">Selecciona un docente para ver su horario</div>
      )}

      {!loading && errorCarga && (
        <div className="usuarios-empty" style={{ color: "#dc2626" }}>
          {errorCarga}
        </div>
      )}

      {!loading && !errorCarga && mensajeInfo && (
        <div className="usuarios-empty">{mensajeInfo}</div>
      )}

      {!loading && !errorCarga && !mensajeInfo && (esAdmin ? docenteId : true) && horario.length > 0 && (
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>Día</th>
              <th>Horario</th>
              <th>Curso</th>
              <th>Asignatura</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {horario.map((h, idx) => (
              <tr key={idx}>
                <td>{h.dia}</td>
                <td>{h.horaInicio?.slice(0, 5)} - {h.horaFin?.slice(0, 5)}</td>
                <td>{h.curso}</td>
                <td>{h.asignatura}</td>
                <td>
                  {h.estado === "Activo" ? (
                    <span className="badge-activo">Activo</span>
                  ) : (
                    <span className="badge-inactivo">{h.estado}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MiHorario;

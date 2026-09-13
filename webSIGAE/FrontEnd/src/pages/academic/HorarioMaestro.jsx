import { useState } from "react";
import { getHorarioMaestro } from "../../services/api";

function hhmm(t) {
  return t ? String(t).slice(0, 5) : "";
}

// CU57: Visualizando horario maestro — vista consolidada de todos los
// bloques, cursos y docentes de la institución (solo Super Admin/Admin).
function HorarioMaestro() {
  const [solicitado, setSolicitado] = useState(false);
  const [horario, setHorario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensajeInfo, setMensajeInfo] = useState("");
  const [errorCarga, setErrorCarga] = useState("");

  const cargarHorarioMaestro = async () => {
    setSolicitado(true);
    setLoading(true);
    setMensajeInfo("");
    setErrorCarga("");
    try {
      const data = await getHorarioMaestro();
      setHorario(Array.isArray(data) ? data : []);
    } catch (error) {
      // Excepción "No existen datos suficientes" y errores técnicos
      setErrorCarga(error.message || "No es posible generar el horario maestro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Horario Maestro</h1>
        <p>Vista consolidada de todos los bloques, cursos y docentes de la institución</p>
      </div>

      {!solicitado && (
        <div className="usuarios-empty" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
          <p>Genera la vista consolidada del horario de toda la institución.</p>
          <button className="btn-primary" onClick={cargarHorarioMaestro}>
            Ver horario maestro
          </button>
        </div>
      )}

      {loading && <p>Generando horario maestro...</p>}

      {solicitado && !loading && errorCarga && (
        <div className="usuarios-empty" style={{ color: "#dc2626" }}>
          {errorCarga}
        </div>
      )}

      {solicitado && !loading && !errorCarga && mensajeInfo && (
        <div className="usuarios-empty">{mensajeInfo}</div>
      )}

      {solicitado && !loading && !errorCarga && horario.length > 0 && (
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>Día</th>
              <th>Horario</th>
              <th>Jornada</th>
              <th>Curso</th>
              <th>Asignatura</th>
              <th>Docente</th>
            </tr>
          </thead>
          <tbody>
            {horario.map((h) => (
              <tr key={h.Horario_Asignatura_Id}>
                <td>{h.dia}</td>
                <td>{hhmm(h.hora_inicio)} - {hhmm(h.hora_fin)}</td>
                <td>{h.jornada}</td>
                <td>{h.curso}{h.seccion ? ` ${h.seccion}` : ""}</td>
                <td>{h.asignatura}</td>
                <td>{h.docente || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default HorarioMaestro;

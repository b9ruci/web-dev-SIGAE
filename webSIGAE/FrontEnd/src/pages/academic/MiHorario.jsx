import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getHorarioDocente, getListaDocentes } from "../../services/api";
import ExportMenu from "../../components/ExportMenu";
import HorarioSemanal from "../../components/horarios/HorarioSemanal";
import AvisoTopes from "../../components/horarios/AvisoTopes";
import { detectarTopes } from "../../utils/horarios";

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
  const [avisoCerrado, setAvisoCerrado] = useState(false);

  // CU43: horario semanal a partir de sus cursos asociados
  const cargarHorario = async (id) => {
    if (!id) return;
    setLoading(true);
    setErrorCarga("");
    setMensajeInfo("");
    setAvisoCerrado(false);
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

  useEffect(() => {
    if (esAdmin) {
      getListaDocentes().then(setDocentes).catch(() => {});
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarHorario(usuario?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seleccionarDocente = (id) => {
    setDocenteId(id);
    setHorario([]);
    setMensajeInfo("");
    setErrorCarga("");
    if (id) cargarHorario(id);
  };

  const clases = horario.map((h, idx) => ({
    id: h.id ?? idx,
    dia: h.dia,
    horaInicio: h.horaInicio,
    horaFin: h.horaFin,
    titulo: h.asignatura,
    lineas: [h.curso],
    colorKey: h.asignaturaId ?? h.asignatura,
    estado: h.estado,
  }));
  const topes = detectarTopes(clases);

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>{esAdmin ? "Horario de Docente" : "Mi Horario"}</h1>
        <p>Horario semanal a partir de los cursos y asignaturas asociados</p>
      </div>

      {esAdmin && (
        <div className="usuarios-filtros" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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

          {/* CU61: exportar el horario del docente seleccionado */}
          {docenteId && (
            <ExportMenu
              label="Exportar horario"
              url={`/api/horarios/exportar/docente/${docenteId}`}
              filenameBase={`horario_docente_${docenteId}`}
            />
          )}
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
        <HorarioSemanal clases={clases} />
      )}

      {!loading && !avisoCerrado && (
        <AvisoTopes topes={topes} onCerrar={() => setAvisoCerrado(true)} />
      )}
    </div>
  );
}

export default MiHorario;

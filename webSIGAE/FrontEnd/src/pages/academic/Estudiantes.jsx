import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getEstudiantes, buscarEstudiantes, getCursos, editarEstudiante } from "../../services/api";

const ESTADOS_ACADEMICOS = ["Regular", "Irregular", "Retirado", "Egresado"];

function Estudiantes() {
  const { usuario } = useAuth();
  const esAdmin =
    usuario?.roles?.includes("Administrador") || usuario?.administradorTipo === "Super Admin";

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

  // CU38: edición de curso asociado y estado académico — exclusivo de Administrador/Super Admin
  const [cursosOpciones, setCursosOpciones] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ Curso_Id: "", Estudiante_Estado_Academico: "" });
  const [guardando, setGuardando] = useState(false);
  const [msgErrorForm, setMsgErrorForm] = useState("");
  const [msgExitoForm, setMsgExitoForm] = useState("");

  useEffect(() => {
    cargarEstudiantes({}, true);
    if (esAdmin) {
      getCursos().then(setCursosOpciones).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // CU36: búsqueda por nombre completo o RUT, resuelta en el backend (independiente del filtro de CU35)
  const buscarPorCriterio = async () => {
    setLoading(true);
    setErrorCarga("");
    setMensajeInfo("");
    try {
      const data = await buscarEstudiantes(busqueda);
      if (Array.isArray(data)) {
        setEstudiantes(data);
      } else {
        // Excepciones: sin coincidencias / docente sin cursos asignados
        setEstudiantes(data.estudiantes || []);
        setMensajeInfo(data.mensaje || "No se encontraron estudiantes con el criterio ingresado");
      }
    } catch (error) {
      // Excepciones: criterio vacío o solo espacios / error técnico
      setErrorCarga(error.message || "No fue posible completar la consulta, reintente más tarde");
    } finally {
      setLoading(false);
    }
  };

  // El filtro por curso/estado y la búsqueda por criterio ya los resuelve el backend (CU35/CU36)
  const estudiantesFiltrados = [...estudiantes].sort((a, b) => {
    const factor = orden.ascendente ? 1 : -1;
    const valorA = a[orden.campo] ?? "";
    const valorB = b[orden.campo] ?? "";
    return String(valorA).localeCompare(String(valorB)) * factor;
  });

  const flechaOrden = (campo) => (orden.campo === campo ? (orden.ascendente ? " ↑" : " ↓") : "");

  // CU38: editar curso asociado y estado académico
  const abrirEdicion = (estudiante) => {
    setEditando(estudiante);
    setForm({
      Curso_Id: estudiante.Curso_Id ?? "",
      Estudiante_Estado_Academico: estudiante.Estudiante_Estado_Academico ?? "",
    });
    setMsgErrorForm("");
    setMsgExitoForm("");
  };

  const cerrarEdicion = () => setEditando(null);

  const handleSubmitEdicion = async (e) => {
    e.preventDefault();
    setMsgErrorForm("");
    setMsgExitoForm("");
    setGuardando(true);
    try {
      const data = await editarEstudiante(editando.Estudiante_Id, {
        Curso_Id: Number(form.Curso_Id),
        Estudiante_Estado_Academico: form.Estudiante_Estado_Academico,
      });
      // CU38 - Excepción "Sin modificaciones": el backend responde sin objeto "estudiante"
      setMsgExitoForm(data.mensaje || "Ficha actualizada correctamente");
      await cargarEstudiantes({ curso: filtroCurso, estado: filtroEstado });
    } catch (error) {
      // CU38 - Excepción "Curso no existe o inactivo"
      setMsgErrorForm(error.message || "No fue posible actualizar la ficha");
    } finally {
      setGuardando(false);
    }
  };

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

      {/* CU36: búsqueda por nombre completo o RUT */}
      <form
        className="usuarios-filtros"
        onSubmit={(e) => { e.preventDefault(); buscarPorCriterio(); }}
      >
        <input
          type="text"
          className="usuarios-search"
          placeholder="Buscar por nombre o RUT..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button type="submit" className="btn-roles">Buscar</button>
      </form>

      {/* CU35: filtro por curso y estado académico */}
      <div className="usuarios-filtros">
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
                  {esAdmin && <th>Acciones</th>}
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
                    {esAdmin && (
                      <td>
                        <button className="btn-roles" onClick={() => abrirEdicion(e)}>
                          Editar ficha
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* CU38: modal de edición de curso asociado y estado académico */}
      {editando && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div className="form-card" style={{ width: "460px", maxWidth: "95vw" }}>
            <h2 style={{ marginBottom: "4px" }}>Editar ficha del estudiante</h2>
            <p style={{ color: "#64748b", marginBottom: "20px" }}>
              <strong>{editando.Estudiante_Nombre_Completo}</strong>
            </p>

            <form onSubmit={handleSubmitEdicion} className="cambiar-pwd-form">
              <div className="campo-pwd">
                <label>Curso asociado</label>
                <select
                  className="usuarios-select"
                  value={form.Curso_Id}
                  onChange={(e) => setForm((f) => ({ ...f, Curso_Id: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  <option value="">Selecciona un curso...</option>
                  {cursosOpciones.map((c) => (
                    <option key={c.Curso_Id} value={c.Curso_Id}>{c.Curso_Nombre}</option>
                  ))}
                </select>
              </div>

              <div className="campo-pwd">
                <label>Estado académico</label>
                <select
                  className="usuarios-select"
                  value={form.Estudiante_Estado_Academico}
                  onChange={(e) => setForm((f) => ({ ...f, Estudiante_Estado_Academico: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  {ESTADOS_ACADEMICOS.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>

              {msgExitoForm && <div className="msg-exito">{msgExitoForm}</div>}
              {msgErrorForm && <div className="msg-error-form">{msgErrorForm}</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" className="btn-primario" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="btn-desactivar"
                  onClick={cerrarEdicion}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Estudiantes;

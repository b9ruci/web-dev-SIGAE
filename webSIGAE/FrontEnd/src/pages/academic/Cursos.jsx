import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function ModalAsignarAsignaturas({ curso, token, onClose, onExito }) {
  const [disponibles, setDisponibles] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState({});
  const [estadoSeleccion, setEstadoSeleccion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`/api/cursos/${curso.Curso_Id}/asignaturas/disponibles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Error al cargar asignaturas disponibles");
        } else {
          setDisponibles(data);
        }
      } catch {
        setError("Error al conectar con el servidor");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [curso.Curso_Id, token]);

  const toggleSeleccion = (asigId) => {
    setSeleccionadas((prev) => {
      const next = { ...prev };
      if (next[asigId]) delete next[asigId];
      else next[asigId] = true;
      return next;
    });
  };

  const handleEstado = (asigId, valor) => {
    setEstadoSeleccion((prev) => ({ ...prev, [asigId]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const ids = Object.keys(seleccionadas).map(Number);
    if (ids.length === 0) {
      setError("Debe seleccionar al menos una asignatura");
      return;
    }

    const asignaturas = ids.map((id) => ({
      asignatura_id: id,
      estado: estadoSeleccion[id] || "Vigente",
    }));

    setEnviando(true);
    try {
      const res = await fetch(`/api/cursos/${curso.Curso_Id}/asignaturas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ asignaturas }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        onExito(data.mensaje);
        onClose();
      }
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Asignar asignaturas a {curso.Curso_Nombre}</h2>
          <button className="btn-cerrar" onClick={onClose}>✕</button>
        </div>

        {cargando ? (
          <p>Cargando asignaturas disponibles...</p>
        ) : error && disponibles.length === 0 ? (
          <p className="msg-error">{error}</p>
        ) : disponibles.length === 0 ? (
          <p className="empty-state-text">No hay asignaturas disponibles para asociar a este curso. Todas las del plan educativo ya están asignadas.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="msg-error">{error}</p>}
            <p className="modal-subtitulo">Seleccione las asignaturas del plan educativo a asociar:</p>
            <div className="asignaturas-lista">
              {disponibles.map((a) => (
                <div key={a.Asignatura_Id} className={`asignatura-item ${seleccionadas[a.Asignatura_Id] ? "seleccionada" : ""}`}>
                  <label className="asignatura-check">
                    <input
                      type="checkbox"
                      checked={!!seleccionadas[a.Asignatura_Id]}
                      onChange={() => toggleSeleccion(a.Asignatura_Id)}
                    />
                    <span className="asig-nombre">{a.Asignatura_Nombre}</span>
                    <span className="asig-tipo">{a.Tipo}</span>
                    <span className="asig-horas">{a.Horas_Semanales_Requeridas}h/sem</span>
                  </label>
                  {seleccionadas[a.Asignatura_Id] && (
                    <div className="asig-estado-select">
                      <label>Estado:</label>
                      <select
                        value={estadoSeleccion[a.Asignatura_Id] || "Vigente"}
                        onChange={(e) => handleEstado(a.Asignatura_Id, e.target.value)}
                      >
                        <option value="Activa">Activa</option>
                        <option value="Inactiva">Inactiva</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secundario" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={enviando}>
                {enviando ? "Registrando..." : "Confirmar asignación"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PanelAsignaturasCurso({ curso, token, esAdmin, onVolver }) {
  const [asignadas, setAsignadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/cursos/${curso.Curso_Id}/asignaturas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Error al cargar");
      else setAsignadas(data);
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [curso.Curso_Id]);

  const handleExito = (msg) => {
    setExito(msg);
    cargar();
    setTimeout(() => setExito(""), 4000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn-volver" onClick={onVolver}>← Volver a cursos</button>
          <h2 style={{ marginTop: "0.5rem" }}>Asignaturas del curso: {curso.Curso_Nombre}</h2>
        </div>
        {esAdmin && (
          <button className="btn-primary" onClick={() => { setError(""); setMostrarModal(true); }}>
            + Asignar asignatura
          </button>
        )}
      </div>

      {exito && <p className="msg-exito">{exito}</p>}
      {error && <p className="msg-error">{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : asignadas.length === 0 ? (
        <div className="empty-state">
          <p>Este curso no tiene asignaturas asociadas aún.</p>
        </div>
      ) : (
        <table className="tabla-asignaturas">
          <thead>
            <tr>
              <th>Asignatura</th>
              <th>Prioridad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asignadas.map((a) => (
              <tr key={a.Curso_Asignatura_Id}>
                <td>{a.Asignatura_Nombre}</td>
                <td>{a.Asignatura_Prioridad_Academica}</td>
                  <td>
                    <span className={`badge-estado ${a.Estado_Asignacion === "Activa" ? "badge-vigente" : "badge-inactiva"}`}>
                    {a.Estado_Asignacion}
                  </span>
                </td>
                <td>{new Date(a.Curso_Asignatura_Fecha_Creacion).toLocaleDateString("es-CL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {mostrarModal && (
        <ModalAsignarAsignaturas
          curso={curso}
          token={token}
          onClose={() => setMostrarModal(false)}
          onExito={handleExito}
        />
      )}
    </div>
  );
}

function Cursos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles?.some(r => r === 'Administrador' || r === 'Super Admin');

  const [cursos, setCursos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [modoForm, setModoForm] = useState("nuevo"); // "nuevo" | "clonar"
  const [nivelId, setNivelId] = useState("");
  const [cursoBaseId, setCursoBaseId] = useState("");
  const [seccion, setSeccion] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(true);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);

  const token = localStorage.getItem("token");

  const cargarDatos = async () => {
    try {
      const [resCursos, resNiveles] = await Promise.all([
        fetch("/api/cursos", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/cursos/niveles", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCursos(await resCursos.json());
      setNiveles(await resNiveles.json());
    } catch {
      setError("Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const resetForm = () => {
    setNivelId("");
    setCursoBaseId("");
    setSeccion("");
    setError("");
  };

  const toggleForm = () => {
    setMostrarForm((v) => !v);
    setModoForm("nuevo");
    setExito("");
    resetForm();
  };

  const switchModo = (modo) => {
    setModoForm(modo);
    resetForm();
  };

  const cursoBase = cursos.find((c) => c.Curso_Id === Number(cursoBaseId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    const nivelEfectivo = modoForm === "clonar" ? cursoBase?.Nivel_Educativo_Id : nivelId;

    if (!nivelEfectivo) {
      setError(modoForm === "clonar" ? "Debe seleccionar el curso base" : "Debe seleccionar el nivel educativo");
      return;
    }

    const res = await fetch("/api/cursos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nivel_educativo_id: nivelEfectivo, seccion }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setExito(data.mensaje);
    setMostrarForm(false);
    setModoForm("nuevo");
    resetForm();
    cargarDatos();
  };

  const cursosAgrupados = cursos.reduce((acc, curso) => {
    const nivel = curso.Nivel_Educativo_Nombre;
    if (!acc[nivel]) acc[nivel] = [];
    acc[nivel].push(curso);
    return acc;
  }, {});

  if (cargando) return <div className="page-container"><p>Cargando cursos...</p></div>;

  if (cursoSeleccionado) {
    return (
      <div className="page-container">
        <PanelAsignaturasCurso
          curso={cursoSeleccionado}
          token={token}
          esAdmin={esAdmin}
          onVolver={() => setCursoSeleccionado(null)}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Cursos</h1>
          <p>Gestión de cursos por nivel educativo</p>
        </div>
        {esAdmin && (
          <button className="btn-primary" onClick={toggleForm}>
            {mostrarForm ? "Cancelar" : "+ Registrar Curso"}
          </button>
        )}
      </div>

      {exito && <p className="msg-exito">{exito}</p>}
      {error && <p className="msg-error">{error}</p>}

      {mostrarForm && (
        <div className="form-card">
          <h2>{modoForm === "clonar" ? "Clonar Curso Existente" : "Nuevo Curso"}</h2>

          {/* Selector de modo */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <button
              type="button"
              className={modoForm === "nuevo" ? "btn-primary" : "btn-secundario"}
              style={{ flex: 1 }}
              onClick={() => switchModo("nuevo")}
            >
              Nuevo
            </button>
            <button
              type="button"
              className={modoForm === "clonar" ? "btn-primary" : "btn-secundario"}
              style={{ flex: 1 }}
              onClick={() => switchModo("clonar")}
            >
              Clonar curso existente
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {modoForm === "nuevo" ? (
              <>
                <label>Nivel Educativo</label>
                <select value={nivelId} onChange={(e) => setNivelId(e.target.value)} required>
                  <option value="">Seleccionar nivel...</option>
                  {niveles.map((n) => (
                    <option key={n.Nivel_Educativo_Id} value={n.Nivel_Educativo_Id}>
                      {n.Nivel_Educativo_Nombre}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label>Curso base</label>
                <select
                  value={cursoBaseId}
                  onChange={(e) => { setCursoBaseId(e.target.value); setSeccion(""); setError(""); }}
                  required
                >
                  <option value="">Seleccionar curso existente...</option>
                  {Object.entries(cursosAgrupados).map(([nivel, lista]) => (
                    <optgroup key={nivel} label={nivel}>
                      {lista.map((c) => (
                        <option key={c.Curso_Id} value={c.Curso_Id}>
                          {c.Curso_Nombre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {cursoBase && (
                  <div style={{
                    marginTop: "0.5rem",
                    padding: "0.6rem 0.85rem",
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    color: "#0369a1",
                  }}>
                    Nivel educativo heredado: <strong>{cursoBase.Nivel_Educativo_Nombre}</strong>
                  </div>
                )}
              </>
            )}

            <label style={{ marginTop: "1rem" }}>Sección (letra A-Z)</label>
            <input
              type="text"
              maxLength={1}
              placeholder="Ej: A"
              value={seccion}
              onChange={(e) => setSeccion(e.target.value.toUpperCase())}
              required
            />

            {modoForm === "clonar" && cursoBase && seccion && (
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.35rem 0 0" }}>
                Se creará el curso: <strong>{cursoBase.Nivel_Educativo_Nombre} {seccion}</strong>
              </p>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }}>
              {modoForm === "clonar" ? "Clonar y registrar" : "Registrar"}
            </button>
          </form>
        </div>
      )}

      {Object.keys(cursosAgrupados).length === 0 ? (
        <div className="empty-state">
          <p>No hay cursos registrados aún.</p>
        </div>
      ) : (
        Object.entries(cursosAgrupados).map(([nivel, lista]) => (
          <div key={nivel} className="cursos-grupo">
            <h3>{nivel}</h3>
            <div className="cursos-grid">
              {lista.map((c) => (
                <div
                  key={c.Curso_Id}
                  className="curso-card curso-card-clickable"
                  onClick={() => setCursoSeleccionado(c)}
                  title="Ver asignaturas del curso"
                >
                  <span className="curso-nombre">{c.Curso_Nombre}</span>
                  <span className="curso-link">Ver asignaturas →</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Cursos;

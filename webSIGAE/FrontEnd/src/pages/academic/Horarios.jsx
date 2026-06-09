import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = "/api";
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const ESTADOS = ["Activo", "Suspendido"];

const EMPTY_FORM = {
  Horario_Asignatura_Dia_Semana: "",
  Horario_Asignatura_Estado: "Activo",
  Curso_Id: "",
  Bloque_Horario_Id: "",
  Asignatura_Id: "",
  Usuario_Id: "",
};

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export default function Horarios() {
  const { rolActivo, usuario } = useAuth();
  const esAdmin = rolActivo === "Administrador";

  // ── Datos maestros ────────────────────────────────────────────
  const [cursos,      setCursos]      = useState([]);
  const [bloques,     setBloques]     = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [docentes,    setDocentes]    = useState([]);

  // ── Estado de la vista ────────────────────────────────────────
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [horarios,          setHorarios]          = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState("");

  // ── Modal ─────────────────────────────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion,  setModoEdicion]  = useState(false);
  const [idEditando,   setIdEditando]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [guardando,    setGuardando]    = useState(false);
  const [errorModal,   setErrorModal]   = useState("");

  // ── Carga de datos maestros ───────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const [rC, rB, rA, rD] = await Promise.all([
          fetch(`${API}/horarios/cursos`,      { headers: authHeaders() }),
          fetch(`${API}/horarios/bloques`,     { headers: authHeaders() }),
          fetch(`${API}/horarios/asignaturas`, { headers: authHeaders() }),
          esAdmin
            ? fetch(`${API}/horarios/docentes`, { headers: authHeaders() })
            : Promise.resolve(null),
        ]);
        setCursos(     await rC.json());
        setBloques(    await rB.json());
        setAsignaturas(await rA.json());
        if (rD) setDocentes(await rD.json());
      } catch {
        setError("Error al cargar datos de configuración.");
      }
    };
    cargar();
  }, [esAdmin]);

  // ── Carga de horarios ─────────────────────────────────────────
  const cargarHorarios = useCallback(async (cursoId) => {
    setLoading(true);
    setError("");
    try {
      const url = cursoId
        ? `${API}/horarios?curso_id=${cursoId}`
        : `${API}/horarios`;
      const res  = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHorarios(data);
    } catch (e) {
      setError(e.message || "Error al cargar horarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!esAdmin) {
      // Docente: carga su propio horario sin filtro de curso
      cargarHorarios("");
    }
  }, [esAdmin, cargarHorarios]);

  const handleCursoChange = (e) => {
    const id = e.target.value;
    setCursoSeleccionado(id);
    if (id) cargarHorarios(id);
    else setHorarios([]);
  };

  // ── Agrupar por día para la vista tipo grilla ─────────────────
  const horariosPorDia = DIAS.reduce((acc, dia) => {
    acc[dia] = horarios.filter((h) => h.dia === dia);
    return acc;
  }, {});

  // ── Modal helpers ─────────────────────────────────────────────
  const abrirCrear = () => {
    setForm({ ...EMPTY_FORM, Curso_Id: cursoSeleccionado });
    setModoEdicion(false);
    setIdEditando(null);
    setErrorModal("");
    setModalAbierto(true);
  };

  const abrirEditar = (h) => {
    setForm({
      Horario_Asignatura_Dia_Semana: h.dia,
      Horario_Asignatura_Estado:     h.estado,
      Curso_Id:                      h.Curso_Id,
      Bloque_Horario_Id:             h.Bloque_Horario_Id,
      Asignatura_Id:                 h.Asignatura_Id,
      Usuario_Id:                    h.Usuario_Id || "",
    });
    setModoEdicion(true);
    setIdEditando(h.Horario_Asignatura_Id);
    setErrorModal("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setErrorModal("");
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Guardar (crear o editar) ──────────────────────────────────
  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorModal("");

    const body = {
      ...form,
      Curso_Id:         Number(form.Curso_Id),
      Bloque_Horario_Id: Number(form.Bloque_Horario_Id),
      Asignatura_Id:    Number(form.Asignatura_Id),
      Usuario_Id:       form.Usuario_Id ? Number(form.Usuario_Id) : null,
    };

    try {
      const url    = modoEdicion ? `${API}/horarios/${idEditando}` : `${API}/horarios`;
      const method = modoEdicion ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error);
      cerrarModal();
      cargarHorarios(cursoSeleccionado);
    } catch (e) {
      setErrorModal(e.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  // ── Cambiar estado desde la grilla ────────────────────────────
  const handleCambiarEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Suspendido" : "Activo";
    try {
      const res  = await fetch(`${API}/horarios/${id}/estado`, {
        method:  "PATCH",
        headers: authHeaders(),
        body:    JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      cargarHorarios(cursoSeleccionado);
    } catch (e) {
      setError(e.message || "Error al cambiar estado");
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ padding: "1.5rem" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>
          {esAdmin ? "Gestión de Horarios" : `Mi Horario — ${usuario?.nombre}`}
        </h1>
        {esAdmin && cursoSeleccionado && (
          <button className="btn-primary" onClick={abrirCrear}>
            + Agregar bloque
          </button>
        )}
      </div>

      {/* Selector de curso (solo admin) */}
      {esAdmin && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="cursoSelect" style={{ marginRight: "0.5rem", fontWeight: 600 }}>
            Curso:
          </label>
          <select
            id="cursoSelect"
            value={cursoSeleccionado}
            onChange={handleCursoChange}
            style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">— Selecciona un curso —</option>
            {cursos.map((c) => (
              <option key={c.Curso_Id} value={c.Curso_Id}>
                {c.Curso_Nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error global */}
      {error && (
        <p style={{ color: "#dc2626", background: "#fee2e2", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      {/* Mensaje inicial */}
      {esAdmin && !cursoSeleccionado && !loading && (
        <p style={{ color: "#6b7280" }}>Selecciona un curso para ver su horario.</p>
      )}

      {/* Loading */}
      {loading && <p style={{ color: "#6b7280" }}>Cargando horarios...</p>}

      {/* Grilla semanal */}
      {!loading && horarios.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: "#1e3a5f", color: "#fff" }}>
                <th style={thStyle}>Día</th>
                <th style={thStyle}>Bloque</th>
                <th style={thStyle}>Asignatura</th>
                <th style={thStyle}>Docente</th>
                <th style={thStyle}>Estado</th>
                {esAdmin && <th style={thStyle}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {DIAS.map((dia) =>
                horariosPorDia[dia].length === 0 ? null : (
                  horariosPorDia[dia].map((h, idx) => (
                    <tr
                      key={h.Horario_Asignatura_Id}
                      style={{
                        background: idx % 2 === 0 ? "#f9fafb" : "#fff",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {idx === 0 ? (
                        <td
                          rowSpan={horariosPorDia[dia].length}
                          style={{ ...tdStyle, fontWeight: 700, background: "#dbeafe", textAlign: "center" }}
                        >
                          {dia}
                        </td>
                      ) : null}
                      <td style={tdStyle}>
                        {h.hora_inicio?.slice(0, 5)} – {h.hora_fin?.slice(0, 5)}
                        <br />
                        <small style={{ color: "#6b7280" }}>{h.jornada} · {h.tipo_bloque}</small>
                      </td>
                      <td style={tdStyle}>{h.asignatura}</td>
                      <td style={tdStyle}>{h.docente || <span style={{ color: "#9ca3af" }}>Sin asignar</span>}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background: h.estado === "Activo" ? "#dcfce7" : "#fee2e2",
                          color:      h.estado === "Activo" ? "#166534" : "#991b1b",
                        }}>
                          {h.estado}
                        </span>
                      </td>
                      {esAdmin && (
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => abrirEditar(h)}
                            style={btnSecundario}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleCambiarEstado(h.Horario_Asignatura_Id, h.estado)}
                            style={{ ...btnSecundario, marginLeft: "0.4rem", background: h.estado === "Activo" ? "#fee2e2" : "#dcfce7" }}
                          >
                            {h.estado === "Activo" ? "Suspender" : "Activar"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sin datos */}
      {!loading && horarios.length === 0 && (cursoSeleccionado || !esAdmin) && (
        <p style={{ color: "#6b7280" }}>No hay bloques horarios registrados{cursoSeleccionado ? " para este curso" : ""}.</p>
      )}

      {/* ── Modal crear / editar ── */}
      {modalAbierto && (
        <div style={overlayStyle} onClick={cerrarModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{modoEdicion ? "Editar bloque" : "Agregar bloque"}</h2>

            <form onSubmit={handleGuardar}>

              {/* Día */}
              <label style={labelStyle}>Día *</label>
              <select name="Horario_Asignatura_Dia_Semana" value={form.Horario_Asignatura_Dia_Semana} onChange={handleFormChange} style={inputStyle} required>
                <option value="">— Selecciona —</option>
                {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Bloque horario */}
              <label style={labelStyle}>Bloque horario *</label>
              <select name="Bloque_Horario_Id" value={form.Bloque_Horario_Id} onChange={handleFormChange} style={inputStyle} required>
                <option value="">— Selecciona —</option>
                {bloques.map((b) => (
                  <option key={b.Bloque_Horario_Id} value={b.Bloque_Horario_Id}>
                    {b.Bloque_Horario_Hora_Inicio?.slice(0, 5)} – {b.Bloque_Horario_Hora_Fin?.slice(0, 5)} ({b.Bloque_Horario_Jornada})
                  </option>
                ))}
              </select>

              {/* Asignatura */}
              <label style={labelStyle}>Asignatura *</label>
              <select name="Asignatura_Id" value={form.Asignatura_Id} onChange={handleFormChange} style={inputStyle} required>
                <option value="">— Selecciona —</option>
                {asignaturas.map((a) => (
                  <option key={a.Asignatura_Id} value={a.Asignatura_Id}>{a.Asignatura_Nombre}</option>
                ))}
              </select>

              {/* Docente */}
              <label style={labelStyle}>Docente</label>
              <select name="Usuario_Id" value={form.Usuario_Id} onChange={handleFormChange} style={inputStyle}>
                <option value="">— Sin asignar —</option>
                {docentes.map((d) => (
                  <option key={d.Usuario_Id} value={d.Usuario_Id}>
                    {d.Usuario_Nombre_Completo}{d.Docente_Especialidad ? ` (${d.Docente_Especialidad})` : ""}
                  </option>
                ))}
              </select>

              {/* Curso (solo si no hay curso seleccionado previamente) */}
              {!cursoSeleccionado && (
                <>
                  <label style={labelStyle}>Curso *</label>
                  <select name="Curso_Id" value={form.Curso_Id} onChange={handleFormChange} style={inputStyle} required>
                    <option value="">— Selecciona —</option>
                    {cursos.map((c) => (
                      <option key={c.Curso_Id} value={c.Curso_Id}>{c.Curso_Nombre}</option>
                    ))}
                  </select>
                </>
              )}

              {/* Estado */}
              <label style={labelStyle}>Estado *</label>
              <select name="Horario_Asignatura_Estado" value={form.Horario_Asignatura_Estado} onChange={handleFormChange} style={inputStyle} required>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>

              {errorModal && (
                <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" }}>{errorModal}</p>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={cerrarModal} style={btnSecundario} disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Agregar"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Estilos inline ─────────────────────────────────────────────
const thStyle = { padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 };
const tdStyle = { padding: "0.65rem 1rem", verticalAlign: "middle" };
const labelStyle = { display: "block", fontWeight: 600, marginBottom: "0.25rem", marginTop: "0.75rem", fontSize: "0.875rem" };
const inputStyle = { width: "100%", padding: "0.45rem 0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", boxSizing: "border-box" };
const btnSecundario = { padding: "0.4rem 0.9rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: "0.875rem" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalStyle  = { background: "#fff", borderRadius: "10px", padding: "2rem", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" };

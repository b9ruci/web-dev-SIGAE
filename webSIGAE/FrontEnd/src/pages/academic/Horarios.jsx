import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = "/api";
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DUR_EVENTO_ACADEMICO = 90;

const TIPOS_BLOQUE = ["Clase", "Recreo", "Evento Académico"];

const EMPTY_FORM = {
  Horario_Asignatura_Dia_Semana: "",
  Horario_Asignatura_Estado: "Activo",
  Curso_Id: "",
  tipo: "Clase",
  hora_inicio: "",
  hora_fin: "",
  Asignatura_Id: "",
  Usuario_Id: "",
};

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

function sumarMinutos(horaHHMM, minutos) {
  if (!horaHHMM || !minutos) return "";
  const [h, m] = horaHHMM.split(":").map(Number);
  const total = h * 60 + (m || 0) + minutos;
  if (total >= 24 * 60) return "";
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function encontrarBloque(bloques, horaInicio, horaFin, tipo) {
  if (!horaInicio || !horaFin || !tipo) return null;
  return (
    bloques.find(
      (b) =>
        b.Bloque_Horario_Hora_Inicio?.slice(0, 5) === horaInicio &&
        b.Bloque_Horario_Hora_Fin?.slice(0, 5) === horaFin &&
        b.Bloque_Horario_Tipo === tipo
    ) || null
  );
}

/* ── Badge de estado ───────────────────────────────────────────── */
function EstadoBadge({ estado }) {
  const esActivo = estado === "Activo";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "12px",
        fontSize: "0.78rem",
        fontWeight: 700,
        background: esActivo ? "#dcfce7" : "#fee2e2",
        color: esActivo ? "#166534" : "#991b1b",
        border: `1px solid ${esActivo ? "#bbf7d0" : "#fecaca"}`,
      }}
    >
      {estado}
    </span>
  );
}

/* ── Panel de acceso denegado (Apoderado) ──────────────────────── */
function AccesoDenegado({ rol }) {
  return (
    <div style={styles.accessDenied}>
      <div style={styles.accessDeniedIcon}>🔒</div>
      <h2 style={{ margin: "0 0 0.5rem 0", color: "#1e3a5f" }}>
        Sección no disponible
      </h2>
      <p style={{ margin: 0, color: "#6b7280", maxWidth: 380 }}>
        El rol <strong>{rol}</strong> no tiene acceso al módulo de Horarios en
        el Incremento 1. Si necesitas información sobre el horario de tu alumno,
        consulta con la administración.
      </p>
    </div>
  );
}

/* ── Componente principal ──────────────────────────────────────── */
export default function Horarios() {
  const { rolActivo, usuario } = useAuth();

  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esSuperAdmin = usuario?.administradorTipo === "Super Admin";
  const esAdmin =
    rolEfectivo === "Administrador" ||
    esSuperAdmin ||
    usuario?.roles?.includes("Administrador");
  const esDocente = rolEfectivo === "Docente";
  const esApoderado = rolEfectivo === "Apoderado";

  /* ── Datos maestros ────────────────────────────────────────── */
  const [cursos, setCursos] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [parametros, setParametros] = useState(null);

  /* ── Estado de la vista ────────────────────────────────────── */
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("semana");

  /* ── Confirmación de suspensión masiva ─────────────────────── */
  const [confirmandoSuspenderTodo, setConfirmandoSuspenderTodo] =
    useState(false);
  const [suspendiendo, setSuspendiendo] = useState(false);

  /* ── Panel lateral crear / editar ───────────────────────────── */
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  /* ── Colapsar sidebar mientras panel esté abierto ───────────── */
  useEffect(() => {
    if (panelAbierto) {
      document.body.classList.add("horarios-panel-open");
    } else {
      document.body.classList.remove("horarios-panel-open");
    }
    return () => document.body.classList.remove("horarios-panel-open");
  }, [panelAbierto]);

  /* ── Carga de datos maestros ───────────────────────────────── */
  useEffect(() => {
    if (esApoderado) return;
    const cargar = async () => {
      try {
        const [rC, rB, rA, rP] = await Promise.all([
          fetch(`${API}/horarios/cursos`, { headers: authHeaders() }),
          fetch(`${API}/horarios/bloques`, { headers: authHeaders() }),
          fetch(`${API}/horarios/asignaturas`, { headers: authHeaders() }),
          fetch(`${API}/bloques/parametros`, { headers: authHeaders() }),
        ]);
        setCursos(await rC.json());
        setBloques(await rB.json());
        setAsignaturas(await rA.json());
        const pData = await rP.json();
        setParametros(pData);
      } catch {
        setError("Error al cargar datos de configuración.");
      }
    };
    cargar();
  }, [esApoderado]);

  /* ── Carga de horarios ─────────────────────────────────────── */
  const cargarHorarios = useCallback(async (cursoId) => {
    setLoading(true);
    setError("");
    try {
      const url = cursoId
        ? `${API}/horarios?curso_id=${cursoId}`
        : `${API}/horarios`;
      const res = await fetch(url, { headers: authHeaders() });
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
    if (esDocente) cargarHorarios("");
  }, [esDocente, cargarHorarios]);

  const handleCursoChange = (e) => {
    const id = e.target.value;
    setCursoSeleccionado(id);
    if (id) cargarHorarios(id);
    else setHorarios([]);
  };

  /* ── Agrupar por día ───────────────────────────────────────── */
  const horariosPorDia = DIAS.reduce((acc, dia) => {
    acc[dia] = horarios.filter((h) => h.dia === dia);
    return acc;
  }, {});

  const totalBloques = horarios.length;
  const bloquesActivos = horarios.filter((h) => h.estado === "Activo").length;
  const bloquesSuspendidos = totalBloques - bloquesActivos;

  /* ── Duración sugerida según tipo ──────────────────────────── */
  const duracionSugerida = (tipo) => {
    if (tipo === "Clase") return parametros?.Parametro_Institucional_Duracion_Bloque ?? 45;
    if (tipo === "Recreo") return parametros?.Parametro_Institucional_Duracion_Recreo ?? 15;
    return DUR_EVENTO_ACADEMICO;
  };

  /* ── Preview naranja para el calendario ────────────────────── */
  const previewBloque =
    panelAbierto &&
    form.Horario_Asignatura_Dia_Semana &&
    form.hora_inicio &&
    form.hora_fin
      ? {
          dia: form.Horario_Asignatura_Dia_Semana,
          hora_inicio: form.hora_inicio,
          hora_fin: form.hora_fin,
          asignatura:
            asignaturas.find(
              (a) => a.Asignatura_Id === Number(form.Asignatura_Id)
            )?.Asignatura_Nombre || "Vista previa",
          tipo: form.tipo,
        }
      : null;

  /* ── Panel helpers ─────────────────────────────────────────── */
  const abrirCrear = () => {
    setForm({ ...EMPTY_FORM, Curso_Id: cursoSeleccionado });
    setModoEdicion(false);
    setIdEditando(null);
    setErrorModal("");
    setPanelAbierto(true);
  };

  const abrirEditar = (h) => {
    setForm({
      Horario_Asignatura_Dia_Semana: h.dia,
      Horario_Asignatura_Estado: h.estado,
      Curso_Id: h.Curso_Id,
      tipo: h.tipo_bloque || "Clase",
      hora_inicio: h.hora_inicio?.slice(0, 5) || "",
      hora_fin: h.hora_fin?.slice(0, 5) || "",
      Asignatura_Id: h.Asignatura_Id,
      Usuario_Id: h.Usuario_Id || "",
      _bloqueId: h.Bloque_Horario_Id,
    });
    setModoEdicion(true);
    setIdEditando(h.Horario_Asignatura_Id);
    setErrorModal("");
    setPanelAbierto(true);
  };

  const cerrarPanel = () => {
    setPanelAbierto(false);
    setErrorModal("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "tipo" && prev.hora_inicio) {
        const dur = duracionSugerida(value);
        next.hora_fin = sumarMinutos(prev.hora_inicio, dur);
      }
      return next;
    });
  };

  const usarDuracionSugerida = () => {
    if (!form.hora_inicio) return;
    const dur = duracionSugerida(form.tipo);
    const horaFinSugerida = sumarMinutos(form.hora_inicio, dur);
    if (horaFinSugerida) {
      setForm((prev) => ({ ...prev, hora_fin: horaFinSugerida }));
    }
  };

  /* ── Guardar (crear o editar) ──────────────────────────────── */
  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorModal("");

    const bloqueEncontrado = encontrarBloque(
      bloques,
      form.hora_inicio,
      form.hora_fin,
      form.tipo
    );
    const bloqueId = bloqueEncontrado?.Bloque_Horario_Id ?? form._bloqueId;

    if (!bloqueId) {
      setErrorModal(
        `No existe un bloque "${form.tipo}" de ${form.hora_inicio} a ${form.hora_fin} configurado. ` +
          "Ve a Bloques Horarios para crearlo primero."
      );
      setGuardando(false);
      return;
    }

    const body = {
      Horario_Asignatura_Dia_Semana: form.Horario_Asignatura_Dia_Semana,
      Horario_Asignatura_Estado: form.Horario_Asignatura_Estado,
      Curso_Id: Number(form.Curso_Id),
      Bloque_Horario_Id: Number(bloqueId),
      Asignatura_Id: Number(form.Asignatura_Id),
      Usuario_Id: form.Usuario_Id ? Number(form.Usuario_Id) : null,
    };

    try {
      const url = modoEdicion
        ? `${API}/horarios/${idEditando}`
        : `${API}/horarios`;
      const method = modoEdicion ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      cerrarPanel();
      cargarHorarios(cursoSeleccionado);
    } catch (e) {
      setErrorModal(e.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  /* ── Cambiar estado de un bloque ───────────────────────────── */
  const handleCambiarEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Suspendido" : "Activo";
    try {
      const res = await fetch(`${API}/horarios/${id}/estado`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      cargarHorarios(cursoSeleccionado);
    } catch (e) {
      setError(e.message || "Error al cambiar estado");
    }
  };

  /* ── Suspender TODOS los bloques activos del curso ─────────── */
  const handleSuspenderTodo = async () => {
    setSuspendiendo(true);
    setError("");
    try {
      const activos = horarios.filter((h) => h.estado === "Activo");
      await Promise.all(
        activos.map((h) =>
          fetch(`${API}/horarios/${h.Horario_Asignatura_Id}/estado`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ estado: "Suspendido" }),
          })
        )
      );
      setConfirmandoSuspenderTodo(false);
      cargarHorarios(cursoSeleccionado);
    } catch {
      setError("Error al suspender clases.");
    } finally {
      setSuspendiendo(false);
    }
  };

  /* ── Si es Apoderado ───────────────────────────────────────── */
  if (esApoderado) return <AccesoDenegado rol="Apoderado" />;

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div style={styles.page}>

      {/* ── Encabezado ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>
            {esAdmin ? "Gestión de Horarios" : `Mi Horario`}
          </h1>
          <p style={styles.subtitulo}>
            {esAdmin
              ? "Administración de bloques horarios por curso"
              : `Horario asignado a ${usuario?.nombre || "docente"} — solo lectura`}
          </p>
        </div>

        <div style={styles.headerRight}>
          <RolBadge
            rol={
              esAdmin
                ? esSuperAdmin
                  ? "Super Administrador"
                  : "Administrador"
                : "Docente"
            }
          />
          {esAdmin && cursoSeleccionado && (
            <button
              className="btn-primary"
              onClick={abrirCrear}
              style={styles.btnCrear}
            >
              + Agregar bloque
            </button>
          )}
        </div>
      </div>

      {/* ── Selector de curso (solo admin) ── */}
      {esAdmin && (
        <div style={styles.selectorRow}>
          <label htmlFor="cursoSelect" style={styles.label}>
            Curso:
          </label>
          <select
            id="cursoSelect"
            value={cursoSeleccionado}
            onChange={handleCursoChange}
            style={styles.select}
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

      {/* ── Tarjetas de resumen (admin + curso elegido) ── */}
      {esAdmin && cursoSeleccionado && horarios.length > 0 && (
        <div style={styles.statsRow}>
          <StatCard label="Total bloques" value={totalBloques} color="#1e3a5f" />
          <StatCard
            label="Activos"
            value={bloquesActivos}
            color="#166534"
            bg="#dcfce7"
          />
          <StatCard
            label="Suspendidos"
            value={bloquesSuspendidos}
            color="#991b1b"
            bg="#fee2e2"
          />
        </div>
      )}

      {/* ── Error global ── */}
      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* ── Mensaje inicial (admin sin curso) ── */}
      {esAdmin && !cursoSeleccionado && !loading && (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📅</span>
          <p>Selecciona un curso para ver y gestionar su horario.</p>
        </div>
      )}

      {loading && <p style={styles.loadingText}>Cargando horarios...</p>}

      {/* ── Grilla semanal ── */}
      {!loading && horarios.length > 0 && (
        <>
          {/* Toggle de vista */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setVista("semana")}
                style={{
                  padding: "0.35rem 0.75rem",
                  border: "none",
                  cursor: "pointer",
                  background: vista === "semana" ? "#1e3a5f" : "#f9fafb",
                  color: vista === "semana" ? "#fff" : "#6b7280",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                }}
              >
                📅 Semana
              </button>
              <button
                onClick={() => setVista("lista")}
                style={{
                  padding: "0.35rem 0.75rem",
                  border: "none",
                  borderLeft: "1px solid #e5e7eb",
                  cursor: "pointer",
                  background: vista === "lista" ? "#1e3a5f" : "#f9fafb",
                  color: vista === "lista" ? "#fff" : "#6b7280",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                }}
              >
                ☰ Lista
              </button>
            </div>
          </div>

          {/* Acción masiva — solo Admin con curso seleccionado */}
          {esAdmin && cursoSeleccionado && bloquesActivos > 0 && (
            <div style={styles.accionMasiva}>
              {!confirmandoSuspenderTodo ? (
                <button
                  style={styles.btnSuspenderTodo}
                  onClick={() => setConfirmandoSuspenderTodo(true)}
                >
                  ⚠ Suspender todas las clases del curso
                </button>
              ) : (
                <div style={styles.confirmRow}>
                  <span style={{ color: "#92400e", fontWeight: 600 }}>
                    ¿Confirmar suspensión de {bloquesActivos} bloque(s) activo(s)?
                  </span>
                  <button
                    style={styles.btnConfirmarSuspender}
                    onClick={handleSuspenderTodo}
                    disabled={suspendiendo}
                  >
                    {suspendiendo ? "Suspendiendo..." : "Sí, suspender"}
                  </button>
                  <button
                    style={styles.btnCancelarConfirm}
                    onClick={() => setConfirmandoSuspenderTodo(false)}
                    disabled={suspendiendo}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          {vista === "semana" ? (
            <VistaHorario
              horarios={horarios}
              esAdmin={esAdmin}
              onEditar={abrirEditar}
              onCambiarEstado={handleCambiarEstado}
              preview={previewBloque}
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.tabla}>
                <thead>
                  <tr style={styles.theadRow}>
                    <th style={styles.th}>Día</th>
                    <th style={styles.th}>Bloque horario</th>
                    <th style={styles.th}>Asignatura</th>
                    <th style={styles.th}>Docente</th>
                    <th style={styles.th}>Estado</th>
                    {esAdmin && <th style={styles.th}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {DIAS.map((dia) =>
                    horariosPorDia[dia].length === 0
                      ? null
                      : horariosPorDia[dia].map((h, idx) => (
                          <tr
                            key={h.Horario_Asignatura_Id}
                            style={{
                              background:
                                h.estado === "Suspendido"
                                  ? "#fef9f9"
                                  : idx % 2 === 0
                                  ? "#f9fafb"
                                  : "#fff",
                              borderBottom: "1px solid #e5e7eb",
                              opacity: h.estado === "Suspendido" ? 0.75 : 1,
                            }}
                          >
                            {idx === 0 ? (
                              <td
                                rowSpan={horariosPorDia[dia].length}
                                style={styles.tdDia}
                              >
                                {dia}
                              </td>
                            ) : null}

                            <td style={styles.td}>
                              <span style={styles.hora}>
                                {h.hora_inicio?.slice(0, 5)} –{" "}
                                {h.hora_fin?.slice(0, 5)}
                              </span>
                              <br />
                              <small style={styles.detalleFila}>
                                {h.jornada} · {h.tipo_bloque}
                              </small>
                            </td>

                            <td style={styles.td}>{h.asignatura}</td>

                            <td style={styles.td}>
                              {h.docente ? (
                                h.docente
                              ) : (
                                <span style={styles.sinAsignar}>
                                  Sin asignar
                                </span>
                              )}
                            </td>

                            <td style={styles.td}>
                              <EstadoBadge estado={h.estado} />
                            </td>

                            {esAdmin && (
                              <td
                                style={{ ...styles.td, whiteSpace: "nowrap" }}
                              >
                                <button
                                  onClick={() => abrirEditar(h)}
                                  style={styles.btnAccion}
                                  title="Editar bloque"
                                >
                                  ✏ Editar
                                </button>
                                <button
                                  onClick={() =>
                                    handleCambiarEstado(
                                      h.Horario_Asignatura_Id,
                                      h.estado
                                    )
                                  }
                                  style={{
                                    ...styles.btnAccion,
                                    marginLeft: "0.4rem",
                                    background:
                                      h.estado === "Activo"
                                        ? "#fee2e2"
                                        : "#dcfce7",
                                    color:
                                      h.estado === "Activo"
                                        ? "#991b1b"
                                        : "#166534",
                                    borderColor:
                                      h.estado === "Activo"
                                        ? "#fecaca"
                                        : "#bbf7d0",
                                  }}
                                  title={
                                    h.estado === "Activo"
                                      ? "Suspender clase"
                                      : "Reactivar clase"
                                  }
                                >
                                  {h.estado === "Activo"
                                    ? "⏸ Suspender"
                                    : "▶ Activar"}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Sin datos ── */}
      {!loading &&
        horarios.length === 0 &&
        (cursoSeleccionado || esDocente) && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📋</span>
            <p>
              No hay bloques horarios registrados
              {cursoSeleccionado ? " para este curso" : ""}.
            </p>
          </div>
        )}

      {/* ── Leyenda de permisos ── */}
      <PermisosLeyenda esAdmin={esAdmin} esDocente={esDocente} />

      {/* ── Panel lateral crear / editar (solo Admin) ── */}
      {esAdmin && panelAbierto && (
        <PanelForm
          modoEdicion={modoEdicion}
          idEditando={idEditando}
          form={form}
          bloques={bloques}
          asignaturas={asignaturas}
          cursos={cursos}
          cursoSeleccionado={cursoSeleccionado}
          guardando={guardando}
          errorModal={errorModal}
          parametros={parametros}
          onChange={handleFormChange}
          onUsarSugerida={usarDuracionSugerida}
          onSubmit={handleGuardar}
          onClose={cerrarPanel}
          duracionSugerida={duracionSugerida}
          bloqueMatcheado={encontrarBloque(
            bloques,
            form.hora_inicio,
            form.hora_fin,
            form.tipo
          )}
        />
      )}
    </div>
  );
}

/* ── Sub-componentes ───────────────────────────────────────────── */

function RolBadge({ rol }) {
  const color =
    rol === "Super Administrador"
      ? { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" }
      : rol === "Administrador"
      ? { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" }
      : { bg: "#fef9c3", text: "#92400e", border: "#fde68a" };
  return (
    <span
      style={{
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "0.82rem",
        fontWeight: 700,
        background: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
      }}
    >
      {rol}
    </span>
  );
}

function StatCard({ label, value, color, bg = "#f0f4ff" }) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${color}22`,
        borderRadius: "10px",
        padding: "0.9rem 1.4rem",
        minWidth: 120,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function PermisosLeyenda({ esAdmin, esDocente }) {
  const permisos = esAdmin
    ? [
        { icono: "✅", texto: "Ver horario por curso" },
        { icono: "✅", texto: "Crear bloques horarios (CU49)" },
        { icono: "✅", texto: "Editar bloques (CU55)" },
        { icono: "✅", texto: "Suspender / Activar clases (CU49)" },
        { icono: "✅", texto: "Asignar docente a asignatura (CU57)" },
        { icono: "✅", texto: "Suspender todas las clases del curso" },
      ]
    : esDocente
    ? [
        { icono: "✅", texto: "Ver propio horario (lectura)" },
        { icono: "🚫", texto: "Crear / Editar bloques" },
        { icono: "🚫", texto: "Suspender clases" },
      ]
    : [];

  if (permisos.length === 0) return null;

  return (
    <div style={styles.leyendaBox}>
      <strong style={{ color: "#1e3a5f", fontSize: "0.85rem" }}>
        Permisos del rol (Incremento 1):
      </strong>
      <ul style={{ margin: "0.4rem 0 0 0", paddingLeft: "1rem" }}>
        {permisos.map((p) => (
          <li
            key={p.texto}
            style={{ fontSize: "0.82rem", color: "#374151", marginBottom: 2 }}
          >
            {p.icono} {p.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Panel lateral derecho ─────────────────────────────────────── */
function PanelForm({
  modoEdicion,
  idEditando,
  form,
  bloques,
  asignaturas,
  cursos,
  cursoSeleccionado,
  guardando,
  errorModal,
  parametros,
  onChange,
  onUsarSugerida,
  onSubmit,
  onClose,
  duracionSugerida,
  bloqueMatcheado,
}) {
  const [docentesInfo, setDocentesInfo] = useState([]);
  const [cargandoDoc, setCargandoDoc] = useState(false);

  const { Asignatura_Id, hora_inicio, hora_fin, tipo, Horario_Asignatura_Dia_Semana, Usuario_Id } = form;
  const camposListos = Asignatura_Id && bloqueMatcheado && Horario_Asignatura_Dia_Semana;

  const durSugerida = duracionSugerida(tipo);
  const horaFinSugerida = sumarMinutos(hora_inicio, durSugerida);
  const yaUsaSugerida = hora_fin === horaFinSugerida && !!horaFinSugerida;

  useEffect(() => {
    if (!camposListos) { setDocentesInfo([]); return; }

    setCargandoDoc(true);
    const params = new URLSearchParams({
      asignatura_id: Asignatura_Id,
      bloque_id: bloqueMatcheado.Bloque_Horario_Id,
      dia: Horario_Asignatura_Dia_Semana,
    });
    if (modoEdicion && idEditando) params.append("horario_id", idEditando);

    fetch(`/api/horarios/docentes-disponibles?${params}`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        const asig = asignaturas.find(
          (a) => a.Asignatura_Id === Number(Asignatura_Id)
        );
        const asigLow = (asig?.Asignatura_Nombre || "").toLowerCase();

        const enriched = data.map((d) => {
          const espLow = (d.Docente_Especialidad || "").toLowerCase();
          const coincide =
            espLow.length > 0 &&
            (asigLow.includes(espLow) || espLow.includes(asigLow));
          return { ...d, coincide_especialidad: coincide };
        });

        enriched.sort((a, b) => {
          const sA = (a.disponible ? 10 : 0) + (a.coincide_especialidad ? 5 : 0);
          const sB = (b.disponible ? 10 : 0) + (b.coincide_especialidad ? 5 : 0);
          return sB - sA || a.Usuario_Nombre_Completo.localeCompare(b.Usuario_Nombre_Completo);
        });
        setDocentesInfo(enriched);
      })
      .catch(() => setDocentesInfo([]))
      .finally(() => setCargandoDoc(false));
  }, [Asignatura_Id, bloqueMatcheado, Horario_Asignatura_Dia_Semana, modoEdicion, idEditando]);

  const docSel = docentesInfo.find((d) => d.Usuario_Id === Number(Usuario_Id));
  const sugeridos = docentesInfo.filter((d) => d.disponible && d.coincide_especialidad);
  const disponibles = docentesInfo.filter((d) => d.disponible && !d.coincide_especialidad);
  const noDisp = docentesInfo.filter((d) => !d.disponible);
  const nDisp = docentesInfo.filter((d) => d.disponible).length;

  return (
    <>
      {/* Backdrop translúcido */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.18)",
          zIndex: 980,
        }}
        onClick={onClose}
      />

      {/* Panel deslizable */}
      <div style={styles.panel}>
        {/* Cabecera del panel */}
        <div style={styles.panelHeader}>
          <div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "1.05rem", fontWeight: 700 }}>
              {modoEdicion ? "Editar bloque horario" : "Agregar bloque horario"}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
              CU54 — Programar asignatura en el horario
            </p>
          </div>
          <button onClick={onClose} style={styles.panelBtnClose} title="Cerrar panel">
            ✕
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div style={styles.panelBody}>
          <form onSubmit={onSubmit}>

            {/* ── Tipo de bloque ── */}
            <label style={styles.labelModal}>Tipo de bloque *</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              {TIPOS_BLOQUE.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ target: { name: "tipo", value: t } })}
                  style={{
                    flex: 1,
                    padding: "0.4rem 0.3rem",
                    borderRadius: "8px",
                    border: `2px solid ${form.tipo === t ? tipoColor(t).border : "#e5e7eb"}`,
                    background: form.tipo === t ? tipoColor(t).bg : "#f9fafb",
                    color: form.tipo === t ? tipoColor(t).text : "#6b7280",
                    fontWeight: form.tipo === t ? 700 : 400,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {tipoIcon(t)} {t}
                </button>
              ))}
            </div>

            {/* ── Hora inicio y fin ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={styles.labelModal}>Hora inicio *</label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={form.hora_inicio}
                  onChange={onChange}
                  style={styles.inputModal}
                  required
                />
              </div>
              <div>
                <label style={styles.labelModal}>Hora término *</label>
                <input
                  type="time"
                  name="hora_fin"
                  value={form.hora_fin}
                  onChange={onChange}
                  style={styles.inputModal}
                  required
                />
              </div>
            </div>

            {/* ── Sugerencia de duración ── */}
            {hora_inicio && (
              <div style={{
                margin: "0.5rem 0",
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                background: yaUsaSugerida ? "#f0fdf4" : "#fff7ed",
                border: `1px solid ${yaUsaSugerida ? "#bbf7d0" : "#fed7aa"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}>
                <span style={{ fontSize: "0.8rem", color: yaUsaSugerida ? "#15803d" : "#9a3412" }}>
                  {yaUsaSugerida
                    ? `✓ Usando duración estándar de ${durSugerida} min para ${tipo}`
                    : `Duración estándar de "${tipo}": ${durSugerida} min → termina ${horaFinSugerida || "—"}`}
                </span>
                {!yaUsaSugerida && horaFinSugerida && (
                  <button
                    type="button"
                    onClick={onUsarSugerida}
                    style={{
                      padding: "0.25rem 0.65rem",
                      borderRadius: "6px",
                      border: "1px solid #f97316",
                      background: "#fff7ed",
                      color: "#ea580c",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Usar sugerida
                  </button>
                )}
              </div>
            )}

            {/* ── Estado del bloque matcheado ── */}
            {hora_inicio && hora_fin && (
              <div style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "7px",
                marginBottom: "0.25rem",
                fontSize: "0.8rem",
                background: bloqueMatcheado ? "#f0fdf4" : "#fff7ed",
                border: `1px solid ${bloqueMatcheado ? "#bbf7d0" : "#fed7aa"}`,
                color: bloqueMatcheado ? "#15803d" : "#9a3412",
              }}>
                {bloqueMatcheado
                  ? `✓ Bloque configurado encontrado (${bloqueMatcheado.Bloque_Horario_Jornada})`
                  : `⚠ No existe un bloque "${tipo}" de ${hora_inicio} a ${hora_fin}. Créalo en Bloques Horarios.`}
              </div>
            )}

            {/* ── Día ── */}
            <label style={styles.labelModal}>Día *</label>
            <select
              name="Horario_Asignatura_Dia_Semana"
              value={form.Horario_Asignatura_Dia_Semana}
              onChange={onChange}
              style={styles.inputModal}
              required
            >
              <option value="">— Selecciona —</option>
              {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* ── Asignatura ── */}
            <label style={styles.labelModal}>Asignatura *</label>
            <select
              name="Asignatura_Id"
              value={form.Asignatura_Id}
              onChange={onChange}
              style={styles.inputModal}
              required
            >
              <option value="">— Selecciona —</option>
              {asignaturas.map((a) => (
                <option key={a.Asignatura_Id} value={a.Asignatura_Id}>
                  {a.Asignatura_Nombre}
                </option>
              ))}
            </select>

            {/* ── Selector inteligente de docente ── */}
            <label style={styles.labelModal}>
              Docente
              {camposListos && (
                <span style={{ marginLeft: 6, fontSize: "0.78rem", fontWeight: 400, color: "#64748b" }}>
                  {cargandoDoc ? "(cargando…)" : `(${nDisp} disponible${nDisp !== 1 ? "s" : ""})`}
                </span>
              )}
            </label>

            {!camposListos && (
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0 0 0.5rem", fontStyle: "italic" }}>
                Selecciona día, bloque coincidente y asignatura para ver docentes.
              </p>
            )}

            <select
              name="Usuario_Id"
              value={form.Usuario_Id}
              onChange={onChange}
              style={styles.inputModal}
              disabled={cargandoDoc}
            >
              <option value="">— Sin asignar —</option>
              {camposListos && docentesInfo.length > 0 ? (
                <>
                  {sugeridos.length > 0 && (
                    <optgroup label="⭐ Recomendados — especialidad coincide">
                      {sugeridos.map((d) => (
                        <option key={d.Usuario_Id} value={d.Usuario_Id}>
                          {d.Usuario_Nombre_Completo} — {d.Docente_Especialidad}
                          {d.Docente_Carga_Horaria_Maxima != null
                            ? ` (${d.carga_actual}h / ${d.Docente_Carga_Horaria_Maxima}h)`
                            : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {disponibles.length > 0 && (
                    <optgroup label="✓ Disponibles">
                      {disponibles.map((d) => (
                        <option key={d.Usuario_Id} value={d.Usuario_Id}>
                          {d.Usuario_Nombre_Completo}
                          {d.Docente_Especialidad ? ` — ${d.Docente_Especialidad}` : ""}
                          {d.Docente_Carga_Horaria_Maxima != null
                            ? ` (${d.carga_actual}h / ${d.Docente_Carga_Horaria_Maxima}h)`
                            : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {noDisp.length > 0 && (
                    <optgroup label="✗ No disponibles">
                      {noDisp.map((d) => (
                        <option key={d.Usuario_Id} value={d.Usuario_Id} disabled>
                          {d.Usuario_Nombre_Completo} —{" "}
                          {d.conflicto_horario
                            ? "conflicto de horario"
                            : `carga máxima (${d.carga_actual}h / ${d.Docente_Carga_Horaria_Maxima}h)`}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              ) : null}
            </select>

            {/* Info contextual del docente seleccionado */}
            {docSel && (
              <div style={{
                marginTop: "0.4rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.82rem",
                background: docSel.coincide_especialidad ? "#f0fdf4" : "#fffbeb",
                border: `1px solid ${docSel.coincide_especialidad ? "#bbf7d0" : "#fde68a"}`,
                color: docSel.coincide_especialidad ? "#15803d" : "#92400e",
              }}>
                {docSel.coincide_especialidad
                  ? `✓ Especialidad "${docSel.Docente_Especialidad}" coincide con la asignatura.`
                  : docSel.Docente_Especialidad
                  ? `⚠ Especialidad "${docSel.Docente_Especialidad}" no coincide con la asignatura.`
                  : "ℹ El docente no tiene especialidad registrada."}
                {docSel.Docente_Carga_Horaria_Maxima != null && (
                  <span style={{ marginLeft: 8, color: "#64748b" }}>
                    Carga: {docSel.carga_nueva}h / {docSel.Docente_Carga_Horaria_Maxima}h semana.
                  </span>
                )}
              </div>
            )}

            {/* Selector de curso si no hay uno pre-seleccionado */}
            {!cursoSeleccionado && (
              <>
                <label style={styles.labelModal}>Curso *</label>
                <select
                  name="Curso_Id"
                  value={form.Curso_Id}
                  onChange={onChange}
                  style={styles.inputModal}
                  required
                >
                  <option value="">— Selecciona —</option>
                  {cursos.map((c) => (
                    <option key={c.Curso_Id} value={c.Curso_Id}>{c.Curso_Nombre}</option>
                  ))}
                </select>
              </>
            )}

            {/* ── Estado ── */}
            <label style={styles.labelModal}>Estado *</label>
            <select
              name="Horario_Asignatura_Estado"
              value={form.Horario_Asignatura_Estado}
              onChange={onChange}
              style={styles.inputModal}
              required
            >
              <option value="Activo">Activo</option>
              <option value="Suspendido">Suspendido</option>
            </select>

            {errorModal && (
              <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem", background: "#fee2e2", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                {errorModal}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={onClose}
                style={{ ...styles.btnCancelar, flex: 1 }}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={guardando || (!bloqueMatcheado && !form._bloqueId)}
              >
                {guardando
                  ? "Guardando..."
                  : modoEdicion
                  ? "Guardar cambios"
                  : "Agregar bloque"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function tipoColor(tipo) {
  if (tipo === "Clase") return { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" };
  if (tipo === "Recreo") return { bg: "#f0fdf4", border: "#86efac", text: "#166534" };
  return { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" };
}

function tipoIcon(tipo) {
  if (tipo === "Clase") return "📚";
  if (tipo === "Recreo") return "⛹";
  return "🎓";
}

/* ── Vista Semanal (Google Calendar-style) ─────────────────────── */

const PX_H = 1.5;

function toMinH(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
}

function minToHHMMH(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function VistaHorario({ horarios, esAdmin, onEditar, onCambiarEstado, preview }) {
  const [hovered, setHovered] = useState(null);

  if (!horarios.length && !preview) return null;

  const allStarts = [
    ...horarios.map((h) => toMinH(h.hora_inicio)),
    ...(preview ? [toMinH(preview.hora_inicio)] : []),
  ];
  const allEnds = [
    ...horarios.map((h) => toMinH(h.hora_fin)),
    ...(preview ? [toMinH(preview.hora_fin)] : []),
  ];

  if (!allStarts.length) return null;

  const rangoMin = Math.floor(Math.min(...allStarts) / 60) * 60;
  const rangoMax = Math.ceil(Math.max(...allEnds) / 60) * 60;
  const totalMin = rangoMax - rangoMin;
  const totalPx = totalMin * PX_H;

  const horas = Array.from(
    { length: totalMin / 60 + 1 },
    (_, i) => rangoMin + i * 60
  );
  const diasNom = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const diasAbr = ["Lun", "Mar", "Mié", "Jue", "Vie"];

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* Encabezados de día */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb" }}>
        <div
          style={{
            width: 56,
            flexShrink: 0,
            borderRight: "1px solid #e5e7eb",
          }}
        />
        {diasNom.map((d, i) => {
          const n = horarios.filter((h) => h.dia === d).length;
          const tienePreview = preview?.dia === d;
          return (
            <div
              key={d}
              style={{
                flex: 1,
                padding: "10px 0",
                textAlign: "center",
                background: tienePreview ? "#fff7ed" : "#f8fafc",
                borderLeft: i > 0 ? "1px solid #e5e7eb" : "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                color: tienePreview ? "#c2410c" : "#1e3a5f",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {diasAbr[i]}
              <span
                style={{
                  fontWeight: 400,
                  marginLeft: 5,
                  opacity: 0.55,
                  fontSize: "0.72rem",
                }}
              >
                ({n}{tienePreview ? "+1" : ""})
              </span>
            </div>
          );
        })}
      </div>

      {/* Cuerpo: eje horario + columnas */}
      <div style={{ display: "flex" }}>
        {/* Etiquetas de hora */}
        <div
          style={{
            width: 56,
            flexShrink: 0,
            position: "relative",
            height: totalPx,
            borderRight: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          {horas.map((m) => (
            <div
              key={m}
              style={{
                position: "absolute",
                top: (m - rangoMin) * PX_H - 7,
                right: 8,
                fontSize: "0.7rem",
                color: "#9ca3af",
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {minToHHMMH(m)}
            </div>
          ))}
        </div>

        {/* Columnas de días */}
        {diasNom.map((d, di) => {
          const diaBloques = horarios.filter((h) => h.dia === d);
          const mostrarPreview = preview?.dia === d;

          return (
            <div
              key={d}
              style={{
                flex: 1,
                position: "relative",
                height: totalPx,
                borderLeft: di > 0 ? "1px solid #e5e7eb" : "none",
                background: "#fafafa",
              }}
            >
              {/* Líneas de hora */}
              {horas.map((m) => (
                <div
                  key={m}
                  style={{
                    position: "absolute",
                    top: (m - rangoMin) * PX_H,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: "#e5e7eb",
                  }}
                />
              ))}
              {/* Líneas de media hora */}
              {horas.slice(0, -1).map((m) => (
                <div
                  key={`h${m}`}
                  style={{
                    position: "absolute",
                    top: (m + 30 - rangoMin) * PX_H,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: "#f3f4f6",
                  }}
                />
              ))}

              {diaBloques.length === 0 && !mostrarPreview && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#e5e7eb",
                    fontSize: "1.5rem",
                  }}
                >
                  —
                </div>
              )}

              {diaBloques.map((h) => {
                const sMin = toMinH(h.hora_inicio);
                const eMin = toMinH(h.hora_fin);
                const top = (sMin - rangoMin) * PX_H;
                const ht = Math.max((eMin - sMin) * PX_H - 3, 24);
                const susp = h.estado === "Suspendido";
                const isHov = hovered === h.Horario_Asignatura_Id;

                return (
                  <div
                    key={h.Horario_Asignatura_Id}
                    onMouseEnter={() => setHovered(h.Horario_Asignatura_Id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: "absolute",
                      top,
                      left: 4,
                      right: 4,
                      height: ht,
                      background: susp ? "#fef9f9" : "#eff6ff",
                      border: `1px solid ${susp ? "#fecaca" : "#93c5fd"}`,
                      borderLeft: `3px solid ${susp ? "#ef4444" : "#1e40af"}`,
                      borderRadius: 6,
                      padding: "2px 5px 2px 7px",
                      overflow: "hidden",
                      cursor: esAdmin ? "pointer" : "default",
                      opacity: susp ? 0.75 : 1,
                      zIndex: isHov ? 10 : 1,
                      boxShadow: isHov ? "0 3px 10px rgba(0,0,0,0.12)" : "none",
                      transition: "box-shadow 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        height: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{ flex: 1, overflow: "hidden", minWidth: 0 }}
                        onClick={() => esAdmin && onEditar(h)}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            color: susp ? "#991b1b" : "#1e40af",
                            lineHeight: 1.4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                          }}
                        >
                          {h.hora_inicio?.slice(0, 5)}–{h.hora_fin?.slice(0, 5)}
                        </div>
                        {ht > 28 && (
                          <div
                            style={{
                              fontSize: "0.66rem",
                              color: susp ? "#991b1b" : "#1e40af",
                              opacity: 0.9,
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h.asignatura}
                          </div>
                        )}
                        {ht > 48 && h.docente && (
                          <div
                            style={{
                              fontSize: "0.62rem",
                              color: "#6b7280",
                              lineHeight: 1.2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h.docente}
                          </div>
                        )}
                      </div>

                      {isHov && esAdmin && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            paddingLeft: 3,
                            flexShrink: 0,
                          }}
                        >
                          <button
                            title="Editar"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditar(h);
                            }}
                            style={{
                              width: 18,
                              height: 18,
                              padding: 0,
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              background: "#1e40af",
                              color: "#fff",
                              fontSize: "0.55rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✏
                          </button>
                          <button
                            title={susp ? "Activar" : "Suspender"}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCambiarEstado(h.Horario_Asignatura_Id, h.estado);
                            }}
                            style={{
                              width: 18,
                              height: 18,
                              padding: 0,
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              background: susp ? "#166534" : "#dc2626",
                              color: "#fff",
                              fontSize: "0.6rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {susp ? "▶" : "⏸"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ── Preview naranja ── */}
              {mostrarPreview && (() => {
                const sMin = toMinH(preview.hora_inicio);
                const eMin = toMinH(preview.hora_fin);
                if (eMin <= sMin) return null;
                const top = (sMin - rangoMin) * PX_H;
                const ht = Math.max((eMin - sMin) * PX_H - 3, 24);
                return (
                  <div
                    key="preview"
                    style={{
                      position: "absolute",
                      top,
                      left: 4,
                      right: 4,
                      height: ht,
                      background: "rgba(251, 146, 60, 0.18)",
                      border: "2px dashed #f97316",
                      borderLeft: "3px solid #ea580c",
                      borderRadius: 6,
                      padding: "2px 5px 2px 7px",
                      overflow: "hidden",
                      zIndex: 20,
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.7rem", color: "#c2410c", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden" }}>
                      {preview.hora_inicio}–{preview.hora_fin}
                    </div>
                    {ht > 28 && (
                      <div style={{ fontSize: "0.65rem", color: "#ea580c", opacity: 0.9, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {preview.asignatura}
                      </div>
                    )}
                    {ht > 44 && (
                      <div style={{ fontSize: "0.6rem", color: "#9a3412", fontStyle: "italic", lineHeight: 1.2 }}>
                        Vista previa
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Estilos ───────────────────────────────────────────────────── */
const styles = {
  page: { padding: "1.75rem" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  titulo: { margin: 0, color: "#1e3a5f", fontSize: "1.5rem" },
  subtitulo: { margin: "0.3rem 0 0 0", color: "#6b7280", fontSize: "0.9rem" },
  headerRight: { display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" },

  btnCrear: { padding: "0.5rem 1.1rem" },

  selectorRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
    background: "#f0f4ff",
    border: "1px solid #dbeafe",
    padding: "0.8rem 1.1rem",
    borderRadius: "10px",
  },
  label: { fontWeight: 700, color: "#1e3a5f", fontSize: "0.95rem", whiteSpace: "nowrap" },
  select: {
    padding: "0.45rem 0.8rem",
    borderRadius: "6px",
    border: "1px solid #93c5fd",
    fontSize: "0.9rem",
    minWidth: 200,
  },

  statsRow: { display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" },

  errorBanner: {
    color: "#dc2626",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },

  emptyState: {
    textAlign: "center",
    padding: "3rem 1rem",
    color: "#6b7280",
    background: "#f9fafb",
    borderRadius: "10px",
    border: "1px dashed #d1d5db",
  },
  emptyIcon: { fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" },

  loadingText: { color: "#6b7280", fontStyle: "italic" },

  accionMasiva: {
    marginBottom: "1rem",
    padding: "0.8rem 1rem",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "8px",
  },
  btnSuspenderTodo: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "0.45rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  confirmRow: { display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" },
  btnConfirmarSuspender: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  btnCancelarConfirm: {
    background: "#f9fafb",
    border: "1px solid #d1d5db",
    color: "#374151",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },

  tabla: { width: "100%", borderCollapse: "collapse", minWidth: 700 },
  theadRow: { background: "#1e3a5f", color: "#fff" },
  th: { padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" },
  td: { padding: "0.65rem 1rem", verticalAlign: "middle", fontSize: "0.9rem" },
  tdDia: {
    padding: "0.65rem 1rem",
    fontWeight: 700,
    background: "#dbeafe",
    textAlign: "center",
    verticalAlign: "middle",
    color: "#1e40af",
    fontSize: "0.9rem",
  },
  hora: { fontWeight: 600, color: "#111827" },
  detalleFila: { color: "#6b7280" },
  sinAsignar: { color: "#9ca3af", fontStyle: "italic" },
  btnAccion: {
    padding: "0.35rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 500,
  },

  leyendaBox: {
    marginTop: "2rem",
    padding: "0.9rem 1.1rem",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    maxWidth: 420,
  },

  accessDenied: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 2rem",
    textAlign: "center",
  },
  accessDeniedIcon: { fontSize: "3.5rem", marginBottom: "1rem" },

  /* ── Panel lateral ── */
  panel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: 440,
    height: "100vh",
    background: "#fff",
    boxShadow: "-6px 0 32px rgba(0,0,0,0.18)",
    zIndex: 990,
    display: "flex",
    flexDirection: "column",
    animation: "slideInRight 0.22s ease",
  },
  panelHeader: {
    background: "#0f172a",
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  panelBtnClose: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    borderRadius: "6px",
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  panelBody: {
    flex: 1,
    overflowY: "auto",
    padding: "1.25rem",
  },

  labelModal: {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.25rem",
    marginTop: "0.85rem",
    fontSize: "0.875rem",
    color: "#374151",
  },
  inputModal: {
    width: "100%",
    padding: "0.45rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    fontSize: "0.9rem",
  },
  btnCancelar: {
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
};


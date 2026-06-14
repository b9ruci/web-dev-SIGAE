import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = "/api";
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DIAS_ABR = ["Lun", "Mar", "Mié", "Jue", "Vie"];

const ASIG_COLORS = [
  { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  { bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d" },
  { bg: "#d1fae5", border: "#6ee7b7", text: "#064e3b" },
  { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  { bg: "#ede9fe", border: "#c4b5fd", text: "#5b21b6" },
  { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  { bg: "#e0f2fe", border: "#7dd3fc", text: "#0c4a6e" },
  { bg: "#dcfce7", border: "#86efac", text: "#166534" },
  { bg: "#ffedd5", border: "#fdba74", text: "#9a3412" },
];

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

function tipoIcon(tipo) {
  if (tipo === "Recreo") return "⛹";
  if (tipo === "Evento Académico") return "🎓";
  return "📚";
}

/* ═══════════════════════════════════════════════════════════════ */
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

  // Master data
  const [cursos, setCursos] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [asignaturasCurso, setAsignaturasCurso] = useState([]);

  // View state
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [asignaturaActiva, setAsignaturaActiva] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Panel state
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);
  const [errorPanel, setErrorPanel] = useState("");

  // Bulk suspend
  const [confirmandoSuspender, setConfirmandoSuspender] = useState(false);
  const [suspendiendo, setSuspendiendo] = useState(false);

  // Sidebar collapse
  useEffect(() => {
    if (panelAbierto) document.body.classList.add("horarios-panel-open");
    else document.body.classList.remove("horarios-panel-open");
    return () => document.body.classList.remove("horarios-panel-open");
  }, [panelAbierto]);

  // Load master data
  useEffect(() => {
    if (esApoderado) return;
    Promise.all([
      fetch(`${API}/horarios/cursos`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/horarios/bloques`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([c, b]) => {
        setCursos(c);
        setBloques(b);
      })
      .catch(() => setError("Error al cargar datos de configuración."));
  }, [esApoderado]);

  const cargarHorarios = useCallback(async (cursoId) => {
    setLoading(true);
    setError("");
    try {
      const url = cursoId ? `${API}/horarios?curso_id=${cursoId}` : `${API}/horarios`;
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

  const cargarAsignaturas = useCallback(async (cursoId) => {
    if (!cursoId) { setAsignaturasCurso([]); return; }
    try {
      const res = await fetch(`${API}/horarios/asignaturas-curso?curso_id=${cursoId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setAsignaturasCurso(res.ok ? data : []);
    } catch {
      setAsignaturasCurso([]);
    }
  }, []);

  useEffect(() => {
    if (esDocente) cargarHorarios("");
  }, [esDocente, cargarHorarios]);

  const handleCursoChange = (id) => {
    setCursoSeleccionado(id);
    setAsignaturaActiva(null);
    setPanelAbierto(false);
    if (id) {
      cargarHorarios(id);
      cargarAsignaturas(id);
    } else {
      setHorarios([]);
      setAsignaturasCurso([]);
    }
  };

  // color index map for asignaturas
  const colorMap = {};
  asignaturasCurso.forEach((a, i) => {
    colorMap[a.Asignatura_Id] = ASIG_COLORS[i % ASIG_COLORS.length];
  });

  // ── Panel handlers ──
  const abrirDesdeGrid = (bloqueId, dia) => {
    // E1 (CU53): bloquear operación si el curso no tiene asignaturas en el plan
    if (asignaturasCurso.length === 0) {
      setError("Este curso no tiene asignaturas en el plan educativo. No es posible programar bloques horarios.");
      return;
    }
    setForm({
      ...EMPTY_FORM,
      Curso_Id: cursoSeleccionado,
      Bloque_Horario_Id: bloqueId,
      Horario_Asignatura_Dia_Semana: dia,
      Asignatura_Id: asignaturaActiva?.Asignatura_Id || "",
    });
    setModoEdicion(false);
    setIdEditando(null);
    setErrorPanel("");
    setPanelAbierto(true);
  };

  const abrirEditar = (h) => {
    setForm({
      Horario_Asignatura_Dia_Semana: h.dia,
      Horario_Asignatura_Estado: h.estado,
      Curso_Id: h.Curso_Id,
      Bloque_Horario_Id: h.Bloque_Horario_Id,
      Asignatura_Id: h.Asignatura_Id,
      Usuario_Id: h.Usuario_Id || "",
    });
    setModoEdicion(true);
    setIdEditando(h.Horario_Asignatura_Id);
    setErrorPanel("");
    setPanelAbierto(true);
  };

  const cerrarPanel = () => { setPanelAbierto(false); setErrorPanel(""); };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.Bloque_Horario_Id || !form.Horario_Asignatura_Dia_Semana || !form.Asignatura_Id) {
      setErrorPanel("Selecciona un bloque, día y asignatura.");
      return;
    }
    setGuardando(true);
    setErrorPanel("");
    const body = {
      Horario_Asignatura_Dia_Semana: form.Horario_Asignatura_Dia_Semana,
      Horario_Asignatura_Estado: form.Horario_Asignatura_Estado,
      Curso_Id: Number(form.Curso_Id),
      Bloque_Horario_Id: Number(form.Bloque_Horario_Id),
      Asignatura_Id: Number(form.Asignatura_Id),
      Usuario_Id: form.Usuario_Id ? Number(form.Usuario_Id) : null,
    };
    try {
      const url = modoEdicion ? `${API}/horarios/${idEditando}` : `${API}/horarios`;
      const method = modoEdicion ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      cerrarPanel();
      cargarHorarios(cursoSeleccionado);
      cargarAsignaturas(cursoSeleccionado);
    } catch (e) {
      setErrorPanel(e.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Suspendido" : "Activo";
    try {
      const res = await fetch(`${API}/horarios/${id}/estado`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      cargarHorarios(cursoSeleccionado);
      cargarAsignaturas(cursoSeleccionado);
    } catch (e) {
      setError(e.message || "Error al cambiar estado");
    }
  };

  const handleSuspenderTodo = async () => {
    setSuspendiendo(true);
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
      setConfirmandoSuspender(false);
      cargarHorarios(cursoSeleccionado);
      cargarAsignaturas(cursoSeleccionado);
    } catch {
      setError("Error al suspender clases.");
    } finally {
      setSuspendiendo(false);
    }
  };

  if (esApoderado) return <AccesoDenegado />;

  const cursoObj = cursos.find((c) => String(c.Curso_Id) === String(cursoSeleccionado));
  const bloquesActivos = horarios.filter((h) => h.estado === "Activo").length;

  const preview =
    panelAbierto && !modoEdicion && form.Bloque_Horario_Id && form.Horario_Asignatura_Dia_Semana
      ? {
          Bloque_Horario_Id: Number(form.Bloque_Horario_Id),
          dia: form.Horario_Asignatura_Dia_Semana,
          asignatura:
            asignaturasCurso.find((a) => a.Asignatura_Id === Number(form.Asignatura_Id))
              ?.Asignatura_Nombre || "Vista previa",
        }
      : null;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>{esAdmin ? "Gestión de Horarios" : "Mi Horario"}</h1>
          <p style={s.subtitulo}>
            {esAdmin
              ? "Programa bloques horarios por curso — CU54"
              : `Horario de ${usuario?.nombre || "docente"} — solo lectura`}
          </p>
        </div>
        <RolBadge
          rol={esAdmin ? (esSuperAdmin ? "Super Administrador" : "Administrador") : "Docente"}
        />
      </div>

      {error && <div style={s.errorBanner}>{error}</div>}

      {/* Course selector */}
      {esAdmin && (
        <div style={s.selectorRow}>
          <span style={s.selectorLabel}>Curso:</span>
          <select
            value={cursoSeleccionado}
            onChange={(e) => handleCursoChange(e.target.value)}
            style={s.select}
          >
            <option value="">— Selecciona un curso —</option>
            {cursos.map((c) => (
              <option key={c.Curso_Id} value={c.Curso_Id}>
                {c.Curso_Nombre} — {c.Nivel_Educativo_Nombre}
              </option>
            ))}
          </select>
          {cursoSeleccionado && asignaturasCurso.length === 0 && !loading && (
            <span style={{ color: "#dc2626", fontSize: "0.83rem" }}>
              ⚠ Este curso no tiene asignaturas en el plan educativo.
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {esAdmin && !cursoSeleccionado && !loading && (
        <div style={s.emptyState}>
          <span style={s.emptyIcon}>📅</span>
          <p>Selecciona un curso para ver y gestionar su horario.</p>
        </div>
      )}

      {loading && <p style={s.loadingText}>Cargando horarios...</p>}

      {/* Main content */}
      {(cursoSeleccionado || esDocente) && !loading && (
        <div style={esAdmin && cursoSeleccionado ? s.mainLayout : {}}>
          {/* Left: asignatura list (admin only) */}
          {esAdmin && cursoSeleccionado && (
            <div style={s.asigPanel}>
              <div style={s.asigPanelHead}>
                <span style={{ fontWeight: 700, color: "#1e3a5f", fontSize: "0.9rem" }}>
                  Asignaturas
                </span>
                {cursoObj && (
                  <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                    {cursoObj.Curso_Nombre}
                  </span>
                )}
              </div>

              {asignaturasCurso.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "0.85rem", padding: "0.75rem 0.5rem", fontStyle: "italic" }}>
                  Sin asignaturas en el plan educativo.
                </p>
              ) : (
                <div style={s.asigList}>
                  {asignaturasCurso.map((a, i) => {
                    const color = ASIG_COLORS[i % ASIG_COLORS.length];
                    const pct =
                      a.Horas_Semanales_Requeridas > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (Number(a.Horas_Programadas) / a.Horas_Semanales_Requeridas) * 100
                            )
                          )
                        : 0;
                    const completa = pct >= 100;
                    const activa =
                      asignaturaActiva?.Asignatura_Id === a.Asignatura_Id;

                    return (
                      <div
                        key={a.Asignatura_Id}
                        onClick={() => setAsignaturaActiva(activa ? null : a)}
                        style={{
                          ...s.asigCard,
                          borderColor: activa ? color.border : "#e5e7eb",
                          background: activa ? color.bg : "#fff",
                          boxShadow: activa ? `0 0 0 2px ${color.border}` : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4rem" }}>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "0.83rem",
                              color: activa ? color.text : "#111827",
                              flex: 1,
                              lineHeight: 1.3,
                            }}
                          >
                            {a.Asignatura_Nombre}
                          </span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "8px",
                              background: completa ? "#dcfce7" : pct > 0 ? "#fef3c7" : "#f3f4f6",
                              color: completa ? "#166534" : pct > 0 ? "#92400e" : "#6b7280",
                              flexShrink: 0,
                            }}
                          >
                            {completa ? "✓" : `${pct}%`}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#6b7280", margin: "3px 0 5px" }}>
                          {Number(a.Horas_Programadas).toFixed(1)}h / {a.Horas_Semanales_Requeridas}h sem.
                        </div>
                        <div
                          style={{
                            background: "#e5e7eb",
                            borderRadius: "4px",
                            height: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: completa ? "#22c55e" : color.border,
                              borderRadius: "4px",
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                        {completa && (
                          <div style={{ fontSize: "0.67rem", color: "#15803d", fontWeight: 600, marginTop: 4 }}>
                            ✓ Horas completas — no requiere más bloques
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bulk suspend */}
              {bloquesActivos > 0 && (
                <div style={{ marginTop: "auto", padding: "0.75rem 0.5rem 0", borderTop: "1px solid #e5e7eb" }}>
                  {!confirmandoSuspender ? (
                    <button
                      style={s.btnSuspenderTodo}
                      onClick={() => setConfirmandoSuspender(true)}
                    >
                      ⚠ Suspender todas las clases
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "#92400e", fontWeight: 600 }}>
                        ¿Suspender {bloquesActivos} bloque(s) activo(s)?
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button style={s.btnConfirmar} onClick={handleSuspenderTodo} disabled={suspendiendo}>
                          {suspendiendo ? "..." : "Sí"}
                        </button>
                        <button style={s.btnCancelarConf} onClick={() => setConfirmandoSuspender(false)}>
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right: institutional block grid */}
          <div style={s.gridArea}>
            {asignaturaActiva && esAdmin && (
              <div style={s.asigActivaBanner}>
                <span>
                  Asignando: <strong>{asignaturaActiva.Asignatura_Nombre}</strong>
                  {" — "}haz clic en una celda disponible para programar un bloque
                </span>
                <button
                  onClick={() => setAsignaturaActiva(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9a3412", fontSize: "1rem", padding: 0 }}
                >
                  ✕
                </button>
              </div>
            )}

            <VistaBloqueGrid
              bloques={bloques}
              horarios={horarios}
              esAdmin={esAdmin}
              asignaturaActiva={asignaturaActiva}
              colorMap={colorMap}
              preview={preview}
              onCelda={esAdmin ? abrirDesdeGrid : null}
              onEditar={esAdmin ? abrirEditar : null}
              onCambiarEstado={esAdmin ? handleCambiarEstado : null}
            />
          </div>
        </div>
      )}

      {/* Right panel */}
      {esAdmin && panelAbierto && (
        <PanelForm
          modoEdicion={modoEdicion}
          idEditando={idEditando}
          form={form}
          bloques={bloques}
          asignaturasCurso={asignaturasCurso}
          guardando={guardando}
          errorPanel={errorPanel}
          onChange={handleFormChange}
          onSubmit={handleGuardar}
          onClose={cerrarPanel}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  VistaBloqueGrid — institutional block timetable grid         */
/* ═══════════════════════════════════════════════════════════════ */
function VistaBloqueGrid({
  bloques,
  horarios,
  esAdmin,
  asignaturaActiva,
  colorMap,
  preview,
  onCelda,
  onEditar,
  onCambiarEstado,
}) {
  const [hoveredCell, setHoveredCell] = useState(null); // { bloqueId, dia }

  if (bloques.length === 0) {
    return (
      <div style={s.emptyState}>
        <span style={s.emptyIcon}>📋</span>
        <p>
          No hay bloques horarios configurados. Ve a{" "}
          <strong>Bloques Horarios</strong> para configurarlos primero.
        </p>
      </div>
    );
  }

  // Build lookup: { "bloqueId_Dia" → horario }
  const cellMap = {};
  horarios.forEach((h) => {
    cellMap[`${h.Bloque_Horario_Id}_${h.dia}`] = h;
  });

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", background: "#1e3a5f" }}>
        <div
          style={{
            width: 130,
            flexShrink: 0,
            padding: "0.65rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            borderRight: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          Bloque Horario
        </div>
        {DIAS.map((d, i) => (
          <div
            key={d}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "0.65rem 0.25rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              borderLeft: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {DIAS_ABR[i]}
          </div>
        ))}
      </div>

      {/* Block rows */}
      {bloques.map((bloque, bi) => {
        const esRecreo = bloque.Bloque_Horario_Tipo === "Recreo";
        const esEvento = bloque.Bloque_Horario_Tipo === "Evento Académico";

        return (
          <div
            key={bloque.Bloque_Horario_Id}
            style={{
              display: "flex",
              borderTop: bi === 0 ? "none" : "1px solid #f0f0f0",
              minHeight: 56,
            }}
          >
            {/* Block label */}
            <div
              style={{
                width: 130,
                flexShrink: 0,
                padding: "0.5rem 0.65rem",
                borderRight: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                background: esRecreo
                  ? "#f0fdf4"
                  : esEvento
                  ? "#f5f3ff"
                  : bi % 2 === 0
                  ? "#f8fafc"
                  : "#fff",
              }}
            >
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: esRecreo ? "#15803d" : esEvento ? "#5b21b6" : "#1e3a5f",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {bloque.Bloque_Horario_Hora_Inicio?.slice(0, 5)} –{" "}
                {bloque.Bloque_Horario_Hora_Fin?.slice(0, 5)}
              </span>
              <span
                style={{
                  fontSize: "0.67rem",
                  color: esRecreo ? "#15803d" : esEvento ? "#5b21b6" : "#94a3b8",
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                {tipoIcon(bloque.Bloque_Horario_Tipo)}{" "}
                {esRecreo ? "Recreo" : esEvento ? "Evento" : bloque.Bloque_Horario_Jornada}
              </span>
            </div>

            {/* Day cells */}
            {DIAS.map((dia, di) => {
              const key = `${bloque.Bloque_Horario_Id}_${dia}`;
              const h = cellMap[key];
              const isPreview =
                preview?.Bloque_Horario_Id === bloque.Bloque_Horario_Id &&
                preview?.dia === dia;
              const isHovered =
                hoveredCell?.bloqueId === bloque.Bloque_Horario_Id &&
                hoveredCell?.dia === dia;
              const canClick = esAdmin && !esRecreo && !h && !!onCelda;
              const asigColor = h ? colorMap[h.Asignatura_Id] || ASIG_COLORS[0] : null;

              return (
                <div
                  key={dia}
                  onMouseEnter={() => {
                    if (esAdmin && !esRecreo) setHoveredCell({ bloqueId: bloque.Bloque_Horario_Id, dia });
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => {
                    if (h && esAdmin && onEditar) { onEditar(h); return; }
                    if (canClick) onCelda(bloque.Bloque_Horario_Id, dia);
                  }}
                  style={{
                    flex: 1,
                    borderLeft: "1px solid " + (di === 0 ? "#e5e7eb" : "#f0f0f0"),
                    padding: "4px",
                    position: "relative",
                    cursor: h && esAdmin ? "pointer" : canClick ? "cell" : "default",
                    background: isPreview
                      ? "rgba(251,146,60,0.10)"
                      : h
                      ? h.estado === "Suspendido"
                        ? "#fef9f9"
                        : asigColor?.bg || "#eff6ff"
                      : esRecreo
                      ? "#f0fdf4"
                      : isHovered && canClick
                      ? "#f0f9ff"
                      : "transparent",
                    transition: "background 0.1s",
                  }}
                >
                  {/* Recreo stripe — only label on first day */}
                  {esRecreo && di === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "0.68rem",
                        color: "#15803d",
                        fontWeight: 600,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ─ Recreo ─
                    </div>
                  )}

                  {/* Preview dashed border */}
                  {isPreview && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 3,
                        border: "2px dashed #f97316",
                        borderRadius: 5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "#ea580c",
                          fontWeight: 700,
                          textAlign: "center",
                          padding: "0 2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "90%",
                        }}
                      >
                        {preview.asignatura}
                      </span>
                    </div>
                  )}

                  {/* Scheduled block */}
                  {h && !isPreview && (
                    <div
                      style={{
                        background:
                          h.estado === "Suspendido"
                            ? "rgba(254,226,226,0.4)"
                            : asigColor?.bg,
                        border: `1px solid ${
                          h.estado === "Suspendido" ? "#fca5a5" : asigColor?.border || "#93c5fd"
                        }`,
                        borderLeft: `3px solid ${
                          h.estado === "Suspendido" ? "#ef4444" : asigColor?.text || "#1e40af"
                        }`,
                        borderRadius: 5,
                        padding: "3px 5px",
                        height: "100%",
                        minHeight: 44,
                        boxSizing: "border-box",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color:
                            h.estado === "Suspendido" ? "#9b1c1c" : asigColor?.text || "#1e40af",
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.asignatura}
                      </div>
                      {h.docente && (
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
                      {h.estado === "Suspendido" && (
                        <div style={{ fontSize: "0.6rem", color: "#dc2626", fontWeight: 700 }}>
                          Suspendido
                        </div>
                      )}
                      {/* Hover action buttons */}
                      {isHovered && esAdmin && (
                        <div
                          style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            display: "flex",
                            gap: 2,
                          }}
                          onMouseLeave={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Editar"
                            onClick={(e) => { e.stopPropagation(); onEditar(h); }}
                            style={s.cellBtn}
                          >
                            ✏
                          </button>
                          <button
                            title={h.estado === "Activo" ? "Suspender" : "Activar"}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCambiarEstado(h.Horario_Asignatura_Id, h.estado);
                            }}
                            style={{
                              ...s.cellBtn,
                              background: h.estado === "Activo" ? "#dc2626" : "#166534",
                            }}
                          >
                            {h.estado === "Activo" ? "⏸" : "▶"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hover "add" hint for empty cell */}
                  {!h && !esRecreo && isHovered && canClick && !isPreview && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 3,
                        border: "2px dashed #93c5fd",
                        borderRadius: 5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    >
                      <span style={{ fontSize: "0.68rem", color: "#1e40af", fontWeight: 600 }}>
                        + Agregar
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          padding: "0.55rem 0.75rem",
          background: "#f8fafc",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <LegendItem color="#dbeafe" border="#93c5fd" label="Clase programada" />
        <LegendItem color="#f0fdf4" border="#86efac" label="Recreo" />
        <LegendItem color="rgba(251,146,60,0.10)" border="#f97316" dashed label="Vista previa" />
        {esAdmin && (
          <span style={{ fontSize: "0.7rem", color: "#6b7280", marginLeft: "auto" }}>
            Clic en celda vacía → agregar · Clic en bloque → editar
          </span>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, border, dashed, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          background: color,
          border: `${dashed ? "2px dashed" : "1px solid"} ${border}`,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PanelForm — right sidebar for confirming a block assignment  */
/* ═══════════════════════════════════════════════════════════════ */
function PanelForm({
  modoEdicion,
  idEditando,
  form,
  bloques,
  asignaturasCurso,
  guardando,
  errorPanel,
  onChange,
  onSubmit,
  onClose,
}) {
  const [docentesInfo, setDocentesInfo] = useState([]);
  const [cargandoDoc, setCargandoDoc] = useState(false);

  const bloque = bloques.find((b) => b.Bloque_Horario_Id === Number(form.Bloque_Horario_Id));
  const camposListos =
    !!form.Asignatura_Id && !!form.Bloque_Horario_Id && !!form.Horario_Asignatura_Dia_Semana;

  useEffect(() => {
    if (!camposListos) { setDocentesInfo([]); return; }
    setCargandoDoc(true);
    const params = new URLSearchParams({
      asignatura_id: form.Asignatura_Id,
      bloque_id: form.Bloque_Horario_Id,
      dia: form.Horario_Asignatura_Dia_Semana,
    });
    if (modoEdicion && idEditando) params.append("horario_id", idEditando);

    fetch(`/api/horarios/docentes-disponibles?${params}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const asig = asignaturasCurso.find((a) => a.Asignatura_Id === Number(form.Asignatura_Id));
        const asigLow = (asig?.Asignatura_Nombre || "").toLowerCase();
        const enriched = data.map((d) => {
          const espLow = (d.Docente_Especialidad || "").toLowerCase();
          return {
            ...d,
            coincide_especialidad:
              espLow.length > 0 &&
              (asigLow.includes(espLow) || espLow.includes(asigLow)),
          };
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
  }, [form.Asignatura_Id, form.Bloque_Horario_Id, form.Horario_Asignatura_Dia_Semana, modoEdicion, idEditando]);

  const sugeridos = docentesInfo.filter((d) => d.disponible && d.coincide_especialidad);
  const disponibles = docentesInfo.filter((d) => d.disponible && !d.coincide_especialidad);
  const noDisp = docentesInfo.filter((d) => !d.disponible);
  const docSel = docentesInfo.find((d) => d.Usuario_Id === Number(form.Usuario_Id));
  const nDisp = docentesInfo.filter((d) => d.disponible).length;

  // E3 (CU53): detectar asignatura con horas ya completas para advertir antes del submit
  const asigSel = asignaturasCurso.find((a) => a.Asignatura_Id === Number(form.Asignatura_Id));
  const asigPct =
    asigSel && asigSel.Horas_Semanales_Requeridas > 0
      ? Math.min(
          100,
          Math.round((Number(asigSel.Horas_Programadas) / asigSel.Horas_Semanales_Requeridas) * 100)
        )
      : 0;
  const asigCompleta = asigPct >= 100;

  return (
    <>
      {/* Panel */}
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "1.05rem", fontWeight: 700 }}>
              {modoEdicion ? "Editar bloque horario" : "Agregar bloque horario"}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
              CU54 — Programar asignatura en el horario
            </p>
          </div>
          <button onClick={onClose} style={s.panelBtnClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div style={s.panelBody}>
          <form onSubmit={onSubmit}>

            {/* ─── Paso 1: Programar bloque horario ─────────────── */}
            <div style={s.stepHeader}>
              <span style={s.stepNum}>1</span>
              <div>
                <div style={s.stepTitle}>Programar bloque horario</div>
                <div style={s.stepSub}>CU54 — asignatura, día y horario a asignar</div>
              </div>
            </div>

            {/* Block info chip */}
            {bloque && (
              <div style={s.bloqueChip}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0c4a6e", fontVariantNumeric: "tabular-nums" }}>
                    {bloque.Bloque_Horario_Hora_Inicio?.slice(0, 5)} – {bloque.Bloque_Horario_Hora_Fin?.slice(0, 5)}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#0284c7", marginTop: 3 }}>
                    {tipoIcon(bloque.Bloque_Horario_Tipo)} {bloque.Bloque_Horario_Tipo} · {bloque.Bloque_Horario_Jornada}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      background: "#0c4a6e",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                    }}
                  >
                    {form.Horario_Asignatura_Dia_Semana}
                  </div>
                </div>
              </div>
            )}

            {/* Asignatura */}
            <label style={s.label}>Asignatura *</label>
            <select
              name="Asignatura_Id"
              value={form.Asignatura_Id}
              onChange={onChange}
              style={s.input}
              required
            >
              <option value="">— Selecciona —</option>
              {asignaturasCurso.map((a) => {
                const pct =
                  a.Horas_Semanales_Requeridas > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (Number(a.Horas_Programadas) / a.Horas_Semanales_Requeridas) * 100
                        )
                      )
                    : 0;
                return (
                  <option key={a.Asignatura_Id} value={a.Asignatura_Id}>
                    {a.Asignatura_Nombre} ({pct}% — {Number(a.Horas_Programadas).toFixed(1)}h
                    /{a.Horas_Semanales_Requeridas}h)
                  </option>
                );
              })}
            </select>

            {/* E3 (CU53): aviso cuando la asignatura ya tiene todas sus horas programadas */}
            {asigCompleta && (
              <p
                style={{
                  color: "#92400e",
                  fontSize: "0.82rem",
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                  padding: "0.4rem 0.65rem",
                  borderRadius: "6px",
                  margin: "0.4rem 0 0",
                }}
              >
                ⚠ Esta asignatura ya tiene todas sus horas semanales programadas (
                {Number(asigSel.Horas_Programadas).toFixed(1)}h /{" "}
                {asigSel.Horas_Semanales_Requeridas}h). El servidor rechazará el registro si se excede el límite.
              </p>
            )}

            {/* ─── Paso 2: Asignar docente ──────────────────────── */}
            <div style={s.stepDivider} />
            <div style={s.stepHeader}>
              <span style={{ ...s.stepNum, background: "#0f766e" }}>2</span>
              <div>
                <div style={s.stepTitle}>Asignar docente</div>
                <div style={s.stepSub}>Opcional — puede definirse en otro momento</div>
              </div>
            </div>

            {/* Docente */}
            <label style={s.label}>
              Docente
              {camposListos && (
                <span style={{ marginLeft: 6, fontSize: "0.78rem", fontWeight: 400, color: "#64748b" }}>
                  {cargandoDoc ? "(cargando…)" : `(${nDisp} disponible${nDisp !== 1 ? "s" : ""})`}
                </span>
              )}
            </label>

            {!camposListos && (
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0 0 0.5rem", fontStyle: "italic" }}>
                Selecciona una asignatura para ver docentes disponibles.
              </p>
            )}

            <select
              name="Usuario_Id"
              value={form.Usuario_Id}
              onChange={onChange}
              style={s.input}
              disabled={cargandoDoc}
            >
              <option value="">— Sin asignar —</option>
              {camposListos && docentesInfo.length > 0 && (
                <>
                  {sugeridos.length > 0 && (
                    <optgroup label="⭐ Recomendados — especialidad coincide">
                      {sugeridos.map((d) => (
                        <option key={d.Usuario_Id} value={d.Usuario_Id}>
                          {d.Usuario_Nombre_Completo} — {d.Docente_Especialidad}
                          {d.Docente_Carga_Horaria_Maxima != null
                            ? ` (${d.carga_actual}h/${d.Docente_Carga_Horaria_Maxima}h)`
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
                            ? ` (${d.carga_actual}h/${d.Docente_Carga_Horaria_Maxima}h)`
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
                            : `carga máxima (${d.carga_actual}h/${d.Docente_Carga_Horaria_Maxima}h)`}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>

            {docSel && (
              <div
                style={{
                  marginTop: "0.4rem",
                  padding: "0.45rem 0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  background: docSel.coincide_especialidad ? "#f0fdf4" : "#fffbeb",
                  border: `1px solid ${docSel.coincide_especialidad ? "#bbf7d0" : "#fde68a"}`,
                  color: docSel.coincide_especialidad ? "#15803d" : "#92400e",
                }}
              >
                {docSel.coincide_especialidad
                  ? `✓ Especialidad "${docSel.Docente_Especialidad}" coincide.`
                  : docSel.Docente_Especialidad
                  ? `⚠ Especialidad "${docSel.Docente_Especialidad}" no coincide.`
                  : "ℹ Sin especialidad registrada."}
                {docSel.Docente_Carga_Horaria_Maxima != null && (
                  <span style={{ marginLeft: 8, color: "#64748b" }}>
                    Carga: {docSel.carga_nueva}h / {docSel.Docente_Carga_Horaria_Maxima}h sem.
                  </span>
                )}
              </div>
            )}

            {/* Estado */}
            <label style={s.label}>Estado *</label>
            <select
              name="Horario_Asignatura_Estado"
              value={form.Horario_Asignatura_Estado}
              onChange={onChange}
              style={s.input}
              required
            >
              <option value="Activo">Activo</option>
              <option value="Suspendido">Suspendido</option>
            </select>

            {errorPanel && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginTop: "0.5rem",
                  background: "#fee2e2",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                }}
              >
                {errorPanel}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={onClose}
                style={{ ...s.btnCancelar, flex: 1 }}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={guardando}
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

/* ═══════════════════════════════════════════════════════════════ */
/*  Helpers                                                       */
/* ═══════════════════════════════════════════════════════════════ */
function AccesoDenegado() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center" }}>
      <span style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔒</span>
      <h2 style={{ margin: "0 0 0.5rem", color: "#1e3a5f" }}>Sección no disponible</h2>
      <p style={{ margin: 0, color: "#6b7280", maxWidth: 380 }}>
        El rol <strong>Apoderado</strong> no tiene acceso al módulo de Horarios.
      </p>
    </div>
  );
}

function RolBadge({ rol }) {
  const map = {
    "Super Administrador": { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
    Administrador: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
    Docente: { bg: "#fef9c3", text: "#92400e", border: "#fde68a" },
  };
  const c = map[rol] || map["Docente"];
  return (
    <span
      style={{
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "0.82rem",
        fontWeight: 700,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {rol}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Styles                                                        */
/* ═══════════════════════════════════════════════════════════════ */
const s = {
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
  subtitulo: { margin: "0.3rem 0 0", color: "#6b7280", fontSize: "0.9rem" },

  selectorRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
    background: "#f0f4ff",
    border: "1px solid #dbeafe",
    padding: "0.7rem 1rem",
    borderRadius: "10px",
    flexWrap: "wrap",
  },
  selectorLabel: { fontWeight: 700, color: "#1e3a5f", fontSize: "0.95rem", whiteSpace: "nowrap" },
  select: {
    padding: "0.4rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #93c5fd",
    fontSize: "0.9rem",
    minWidth: 240,
  },

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

  mainLayout: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "1.25rem",
    alignItems: "start",
  },

  asigPanel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 300,
  },
  asigPanelHead: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "0.75rem 0.85rem 0.6rem",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  asigList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    padding: "0.6rem 0.5rem",
    flex: 1,
    overflowY: "auto",
  },
  asigCard: {
    padding: "0.55rem 0.65rem",
    borderRadius: "7px",
    border: "1.5px solid",
    cursor: "pointer",
    transition: "all 0.15s",
  },

  gridArea: { minWidth: 0 },

  asigActivaBanner: {
    padding: "0.5rem 0.75rem",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "8px",
    marginBottom: "0.75rem",
    fontSize: "0.84rem",
    color: "#9a3412",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
  },

  btnSuspenderTodo: {
    width: "100%",
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "0.4rem 0.75rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.78rem",
    textAlign: "center",
  },
  btnConfirmar: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "0.35rem 0.7rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.82rem",
  },
  btnCancelarConf: {
    background: "#f9fafb",
    border: "1px solid #d1d5db",
    color: "#374151",
    padding: "0.35rem 0.7rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.82rem",
  },

  cellBtn: {
    width: 18,
    height: 18,
    padding: 0,
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
    background: "#1e40af",
    color: "#fff",
    fontSize: "0.55rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Panel */
  panel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: 420,
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

  stepHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.65rem",
    marginBottom: "0.9rem",
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "0.68rem",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  stepTitle: {
    fontWeight: 700,
    fontSize: "0.88rem",
    color: "#1e293b",
    lineHeight: 1.3,
  },
  stepSub: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    marginTop: 2,
  },
  stepDivider: {
    borderTop: "1px dashed #e2e8f0",
    margin: "1.2rem 0 1rem",
  },

  bloqueChip: {
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },

  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.25rem",
    marginTop: "0.85rem",
    fontSize: "0.875rem",
    color: "#374151",
  },
  input: {
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

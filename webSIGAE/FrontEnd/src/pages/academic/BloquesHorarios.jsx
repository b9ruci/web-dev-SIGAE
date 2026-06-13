import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = "/api/bloques";

const JORNADAS    = ["Mañana", "Tarde"];
const TIPOS_BLOQUE = ["Clase", "Recreo", "Evento Académico"];
const IMPACTOS    = ["Sin impacto", "Salida anticipada", "Suspensión total"];

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

function hhmm(timeStr) {
  return timeStr ? String(timeStr).slice(0, 5) : "";
}

/* ── Chip de tipo de bloque ────────────────────────────────────── */
function TipoChip({ tipo }) {
  const map = {
    "Clase":           { bg: "#dbeafe", color: "#1e40af" },
    "Recreo":          { bg: "#dcfce7", color: "#166534" },
    "Evento Académico":{ bg: "#fef9c3", color: "#92400e" },
  };
  const s = map[tipo] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.78rem",
      fontWeight: 700, background: s.bg, color: s.color }}>
      {tipo}
    </span>
  );
}

/* ── Chip de impacto de evento ─────────────────────────────────── */
function ImpactoChip({ impacto }) {
  const map = {
    "Sin impacto":      { bg: "#f0fdf4", color: "#166534" },
    "Salida anticipada":{ bg: "#fef9c3", color: "#92400e" },
    "Suspensión total": { bg: "#fee2e2", color: "#991b1b" },
  };
  const s = map[impacto] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.78rem",
      fontWeight: 700, background: s.bg, color: s.color }}>
      {impacto}
    </span>
  );
}

/* ── Componente principal ──────────────────────────────────────── */
export default function BloquesHorarios() {
  const { rolActivo, usuario } = useAuth();
  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esSuperAdmin = usuario?.administradorTipo === "SuperAdmin";
  const esAdmin = rolEfectivo === "Administrador" || esSuperAdmin || usuario?.roles?.includes("Administrador");

  const [tab, setTab] = useState("parametros");

  if (!esAdmin) {
    return (
      <div style={s.page}>
        <div style={s.accessDenied}>
          <span style={{ fontSize: "3rem" }}>🔒</span>
          <h2 style={{ color: "#1e3a5f" }}>Acceso restringido</h2>
          <p style={{ color: "#6b7280" }}>
            Solo los administradores pueden gestionar bloques y parámetros horarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Encabezado */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Configuración Horaria Institucional</h1>
          <p style={s.subtitulo}>
            Parámetros, bloques horarios y eventos académicos — CU49 · CU53
          </p>
        </div>
        <span style={s.rolBadge}>
          {esSuperAdmin ? "Super Administrador" : "Administrador"}
        </span>
      </div>

      {/* Pestañas */}
      <div style={s.tabBar}>
        {[
          { key: "parametros", label: "⚙ Parámetros institucionales" },
          { key: "bloques",    label: "🕐 Bloques horarios" },
          { key: "eventos",    label: "📅 Eventos académicos" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ ...s.tabBtn, ...(tab === t.key ? s.tabBtnActive : {}) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={s.tabContent}>
        {tab === "parametros" && <TabParametros />}
        {tab === "bloques"    && <TabBloques />}
        {tab === "eventos"    && <TabEventos />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PESTAÑA 1 — Parámetros institucionales (CU53)
══════════════════════════════════════════════════════════════════ */
function TabParametros() {
  const [form, setForm]       = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]     = useState("");
  const [exito, setExito]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/parametros`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const f = {
          Parametro_Institucional_Inicio_Jornada:          hhmm(data.Parametro_Institucional_Inicio_Jornada),
          Parametro_Institucional_Fin_Jornada:             hhmm(data.Parametro_Institucional_Fin_Jornada),
          Parametro_Institucional_Duracion_Bloque:         String(data.Parametro_Institucional_Duracion_Bloque),
          Parametro_Institucional_Duracion_Recreo:         String(data.Parametro_Institucional_Duracion_Recreo),
          Parametro_Institucional_Bloques_Maximos_Diarios: String(data.Parametro_Institucional_Bloques_Maximos_Diarios),
        };
        setForm(f);
        setOriginal(f);
      } catch (e) {
        setError(e.message || "Error al cargar parámetros");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const hayambios = form && original && JSON.stringify(form) !== JSON.stringify(original);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    setExito("");
    try {
      const res  = await fetch(`${API}/parametros`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOriginal(form);
      setExito("Parámetros guardados correctamente.");
      setTimeout(() => setExito(""), 3500);
    } catch (e) {
      setError(e.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <p style={s.loadingText}>Cargando parámetros...</p>;

  return (
    <div style={s.seccion}>
      <div style={s.seccionHeader}>
        <h2 style={s.seccionTitulo}>Parámetros del horario institucional</h2>
        <p style={s.seccionDesc}>
          Define los límites de jornada, duración de bloques y recreos. Estos valores
          se usan para validar cada bloque horario que se registre (CU53).
        </p>
      </div>

      {error && <div style={s.errorBanner}>{error}</div>}
      {exito && <div style={s.exitoBanner}>✅ {exito}</div>}

      <form onSubmit={handleGuardar} style={s.formParametros}>
        {/* Jornada */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>🕐 Jornada escolar</legend>
          <div style={s.formRow}>
            <div style={s.formField}>
              <label style={s.label}>Inicio de jornada *</label>
              <input type="time" name="Parametro_Institucional_Inicio_Jornada"
                value={form.Parametro_Institucional_Inicio_Jornada}
                onChange={handleChange} style={s.input} required />
            </div>
            <div style={s.formField}>
              <label style={s.label}>Fin de jornada *</label>
              <input type="time" name="Parametro_Institucional_Fin_Jornada"
                value={form.Parametro_Institucional_Fin_Jornada}
                onChange={handleChange} style={s.input} required />
            </div>
          </div>
        </fieldset>

        {/* Bloques */}
        <fieldset style={s.fieldset}>
          <legend style={s.legend}>📐 Configuración de bloques</legend>
          <div style={s.formRow}>
            <div style={s.formField}>
              <label style={s.label}>Duración estándar de bloques (minutos) *</label>
              <input type="number" name="Parametro_Institucional_Duracion_Bloque"
                value={form.Parametro_Institucional_Duracion_Bloque}
                onChange={handleChange} style={s.input}
                min="1" max="180" required />
            </div>
            <div style={s.formField}>
              <label style={s.label}>Duración de recreos (minutos) *</label>
              <input type="number" name="Parametro_Institucional_Duracion_Recreo"
                value={form.Parametro_Institucional_Duracion_Recreo}
                onChange={handleChange} style={s.input}
                min="0" max="120" required />
            </div>
            <div style={s.formField}>
              <label style={s.label}>Máximo de bloques diarios *</label>
              <input type="number" name="Parametro_Institucional_Bloques_Maximos_Diarios"
                value={form.Parametro_Institucional_Bloques_Maximos_Diarios}
                onChange={handleChange} style={s.input}
                min="1" max="20" required />
            </div>
          </div>
        </fieldset>

        {/* Resumen visual */}
        {form && (
          <div style={s.resumenBox}>
            <strong style={{ color: "#1e3a5f", fontSize: "0.85rem" }}>Resumen configurado:</strong>
            <ul style={s.resumenList}>
              <li>Jornada: <b>{form.Parametro_Institucional_Inicio_Jornada || "—"}</b> → <b>{form.Parametro_Institucional_Fin_Jornada || "—"}</b></li>
              <li>Bloque estándar: <b>{form.Parametro_Institucional_Duracion_Bloque || "—"} min</b></li>
              <li>Recreo: <b>{form.Parametro_Institucional_Duracion_Recreo || "—"} min</b></li>
              <li>Máx. bloques/día: <b>{form.Parametro_Institucional_Bloques_Maximos_Diarios || "—"}</b></li>
            </ul>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={guardando || !hayambios}
            style={{ opacity: !hayambios ? 0.5 : 1 }}
          >
            {guardando ? "Guardando..." : "Guardar parámetros"}
          </button>
          {hayambios && (
            <button type="button" onClick={() => setForm(original)} style={s.btnSecundario}>
              Descartar cambios
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PESTAÑA 2 — Bloques horarios (CU49)
══════════════════════════════════════════════════════════════════ */
const EMPTY_BLOQUE = {
  Bloque_Horario_Hora_Inicio: "",
  Bloque_Horario_Hora_Fin:    "",
  Bloque_Horario_Jornada:     "Mañana",
  Bloque_Horario_Tipo:        "Clase",
};

function TabBloques() {
  const [bloques,   setBloques]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [form,      setForm]      = useState(EMPTY_BLOQUE);
  const [guardando, setGuardando] = useState(false);
  const [errorModal,setErrorModal]= useState("");
  const [eliminando,setEliminando]= useState(null);
  const [vista,     setVista]     = useState("calendario");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(API, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBloques(data);
    } catch (e) {
      setError(e.message || "Error al cargar bloques");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setForm(EMPTY_BLOQUE);
    setEditando(null);
    setErrorModal("");
    setModal(true);
  };

  const abrirEditar = (b) => {
    setForm({
      Bloque_Horario_Hora_Inicio: hhmm(b.Bloque_Horario_Hora_Inicio),
      Bloque_Horario_Hora_Fin:    hhmm(b.Bloque_Horario_Hora_Fin),
      Bloque_Horario_Jornada:     b.Bloque_Horario_Jornada,
      Bloque_Horario_Tipo:        b.Bloque_Horario_Tipo,
    });
    setEditando(b.Bloque_Horario_Id);
    setErrorModal("");
    setModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorModal("");
    try {
      const url    = editando ? `${API}/${editando}` : API;
      const method = editando ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModal(false);
      cargar();
    } catch (e) {
      setErrorModal(e.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    setEliminando(id);
    setError("");
    try {
      const res  = await fetch(`${API}/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      cargar();
    } catch (e) {
      setError(e.message || "Error al eliminar");
    } finally {
      setEliminando(null);
    }
  };

  const bloquesClase   = bloques.filter((b) => b.Bloque_Horario_Tipo === "Clase");
  const bloquesRecreo  = bloques.filter((b) => b.Bloque_Horario_Tipo === "Recreo");
  const bloquesEvento  = bloques.filter((b) => b.Bloque_Horario_Tipo === "Evento Académico");

  return (
    <div style={s.seccion}>
      <div style={{ ...s.seccionHeader, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={s.seccionTitulo}>Bloques horarios</h2>
          <p style={s.seccionDesc}>
            Registra los bloques de tiempo disponibles en la jornada escolar. Cada bloque debe
            estar dentro del rango institucional y no puede solaparse (CU49).
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <button
              onClick={() => setVista("calendario")}
              style={{ padding: "0.35rem 0.75rem", border: "none", cursor: "pointer",
                background: vista === "calendario" ? "#1e3a5f" : "#f9fafb",
                color: vista === "calendario" ? "#fff" : "#6b7280",
                fontSize: "0.82rem", fontWeight: 500 }}
            >📅 Calendario</button>
            <button
              onClick={() => setVista("lista")}
              style={{ padding: "0.35rem 0.75rem", border: "none", borderLeft: "1px solid #e5e7eb",
                cursor: "pointer",
                background: vista === "lista" ? "#1e3a5f" : "#f9fafb",
                color: vista === "lista" ? "#fff" : "#6b7280",
                fontSize: "0.82rem", fontWeight: 500 }}
            >☰ Lista</button>
          </div>
          <button className="btn-primary" onClick={abrirCrear}>+ Nuevo bloque</button>
        </div>
      </div>

      {error && <div style={s.errorBanner}>{error}</div>}

      {loading ? (
        <p style={s.loadingText}>Cargando bloques...</p>
      ) : bloques.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: "2.5rem" }}>🕐</span>
          <p>No hay bloques horarios registrados. Crea el primero.</p>
        </div>
      ) : (
        <>
          {/* Resumen por tipo */}
          <div style={s.statsRow}>
            <StatMini label="Clases"           value={bloquesClase.length}  color="#1e40af" bg="#dbeafe" />
            <StatMini label="Recreos"          value={bloquesRecreo.length} color="#166534" bg="#dcfce7" />
            <StatMini label="Eventos Acad."    value={bloquesEvento.length} color="#92400e" bg="#fef9c3" />
            <StatMini label="Total"            value={bloques.length}       color="#374151" bg="#f3f4f6" />
          </div>

          {vista === "calendario" ? (
            <VistaCalendario
              bloques={bloques}
              onEditar={abrirEditar}
              onEliminar={handleEliminar}
              eliminando={eliminando}
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.tabla}>
                <thead>
                  <tr style={s.theadRow}>
                    <th style={s.th}>Hora inicio</th>
                    <th style={s.th}>Hora fin</th>
                    <th style={s.th}>Duración</th>
                    <th style={s.th}>Jornada</th>
                    <th style={s.th}>Tipo</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bloques.map((b, idx) => {
                    const durMin = calcDuracion(b.Bloque_Horario_Hora_Inicio, b.Bloque_Horario_Hora_Fin);
                    return (
                      <tr key={b.Bloque_Horario_Id}
                        style={{ background: idx % 2 === 0 ? "#f9fafb" : "#fff", borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ ...s.td, fontWeight: 700 }}>{hhmm(b.Bloque_Horario_Hora_Inicio)}</td>
                        <td style={{ ...s.td, fontWeight: 700 }}>{hhmm(b.Bloque_Horario_Hora_Fin)}</td>
                        <td style={{ ...s.td, color: "#6b7280" }}>{durMin} min</td>
                        <td style={s.td}>{b.Bloque_Horario_Jornada}</td>
                        <td style={s.td}><TipoChip tipo={b.Bloque_Horario_Tipo} /></td>
                        <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                          <button onClick={() => abrirEditar(b)} style={s.btnAccion}>✏ Editar</button>
                          <button
                            onClick={() => { if (window.confirm("¿Eliminar este bloque?")) handleEliminar(b.Bloque_Horario_Id); }}
                            style={{ ...s.btnAccion, marginLeft: "0.4rem", background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }}
                            disabled={eliminando === b.Bloque_Horario_Id}
                          >
                            {eliminando === b.Bloque_Horario_Id ? "..." : "🗑 Eliminar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, color: "#1e3a5f" }}>
              {editando ? "Editar bloque horario" : "Nuevo bloque horario"}
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: "-0.5rem" }}>
              El bloque debe estar dentro del rango de jornada institucional configurado.
            </p>
            <form onSubmit={handleGuardar}>
              <div style={s.formRow}>
                <div style={s.formField}>
                  <label style={s.label}>Hora inicio *</label>
                  <input type="time" name="Bloque_Horario_Hora_Inicio"
                    value={form.Bloque_Horario_Hora_Inicio}
                    onChange={(e) => setForm((p) => ({ ...p, Bloque_Horario_Hora_Inicio: e.target.value }))}
                    style={s.input} required />
                </div>
                <div style={s.formField}>
                  <label style={s.label}>Hora fin *</label>
                  <input type="time" name="Bloque_Horario_Hora_Fin"
                    value={form.Bloque_Horario_Hora_Fin}
                    onChange={(e) => setForm((p) => ({ ...p, Bloque_Horario_Hora_Fin: e.target.value }))}
                    style={s.input} required />
                </div>
              </div>

              {form.Bloque_Horario_Hora_Inicio && form.Bloque_Horario_Hora_Fin && (
                <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: "0 0 0.75rem 0" }}>
                  Duración: <strong>{calcDuracion(form.Bloque_Horario_Hora_Inicio + ":00", form.Bloque_Horario_Hora_Fin + ":00")} minutos</strong>
                </p>
              )}

              <label style={s.label}>Jornada *</label>
              <select value={form.Bloque_Horario_Jornada}
                onChange={(e) => setForm((p) => ({ ...p, Bloque_Horario_Jornada: e.target.value }))}
                style={s.input} required>
                {JORNADAS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>

              <label style={{ ...s.label, marginTop: "0.75rem" }}>Tipo de bloque *</label>
              <div style={s.tipoGrid}>
                {TIPOS_BLOQUE.map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm((p) => ({ ...p, Bloque_Horario_Tipo: t }))}
                    style={{
                      ...s.tipoBtn,
                      ...(form.Bloque_Horario_Tipo === t ? s.tipoBtnActive : {}),
                    }}>
                    {t === "Clase" ? "📚" : t === "Recreo" ? "⛹" : "🎓"} {t}
                  </button>
                ))}
              </div>

              {errorModal && <p style={s.errorInline}>{errorModal}</p>}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModal(false)} style={s.btnSecundario} disabled={guardando}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear bloque"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PESTAÑA 3 — Eventos institucionales
══════════════════════════════════════════════════════════════════ */
const EMPTY_EVENTO = {
  Evento_Institucional_Nombre:        "",
  Evento_Institucional_Fecha:         "",
  Evento_Institucional_Descripcion:   "",
  Evento_Institucional_Impacto_Clases:"Sin impacto",
};

function TabEventos() {
  const [eventos,   setEventos]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [form,      setForm]      = useState(EMPTY_EVENTO);
  const [guardando, setGuardando] = useState(false);
  const [errorModal,setErrorModal]= useState("");
  const [eliminando,setEliminando]= useState(null);
  const [vista,     setVista]     = useState("calendario");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API}/eventos`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEventos(data);
    } catch (e) {
      setError(e.message || "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setForm(EMPTY_EVENTO);
    setEditando(null);
    setErrorModal("");
    setModal(true);
  };

  const abrirEditar = (ev) => {
    setForm({
      Evento_Institucional_Nombre:         ev.Evento_Institucional_Nombre,
      Evento_Institucional_Fecha:          ev.Evento_Institucional_Fecha?.slice(0, 10),
      Evento_Institucional_Descripcion:    ev.Evento_Institucional_Descripcion,
      Evento_Institucional_Impacto_Clases: ev.Evento_Institucional_Impacto_Clases,
    });
    setEditando(ev.Evento_Institucional_Id);
    setErrorModal("");
    setModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorModal("");
    try {
      const url    = editando ? `${API}/eventos/${editando}` : `${API}/eventos`;
      const method = editando ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModal(false);
      cargar();
    } catch (e) {
      setErrorModal(e.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    setEliminando(id);
    setError("");
    try {
      const res  = await fetch(`${API}/eventos/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      cargar();
    } catch (e) {
      setError(e.message || "Error al eliminar");
    } finally {
      setEliminando(null);
    }
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const proximos  = eventos.filter((ev) => ev.Evento_Institucional_Fecha?.slice(0,10) >= hoy);
  const pasados   = eventos.filter((ev) => ev.Evento_Institucional_Fecha?.slice(0,10)  < hoy);

  return (
    <div style={s.seccion}>
      <div style={{ ...s.seccionHeader, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={s.seccionTitulo}>Eventos académicos institucionales</h2>
          <p style={s.seccionDesc}>
            Registra eventos que afectan el normal desarrollo de clases: licenciaturas,
            consejos, actos patrióticos, etc.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <button
              onClick={() => setVista("calendario")}
              style={{ padding: "0.35rem 0.75rem", border: "none", cursor: "pointer",
                background: vista === "calendario" ? "#1e3a5f" : "#f9fafb",
                color: vista === "calendario" ? "#fff" : "#6b7280",
                fontSize: "0.82rem", fontWeight: 500 }}
            >📅 Semana</button>
            <button
              onClick={() => setVista("lista")}
              style={{ padding: "0.35rem 0.75rem", border: "none", borderLeft: "1px solid #e5e7eb",
                cursor: "pointer",
                background: vista === "lista" ? "#1e3a5f" : "#f9fafb",
                color: vista === "lista" ? "#fff" : "#6b7280",
                fontSize: "0.82rem", fontWeight: 500 }}
            >☰ Lista</button>
          </div>
          <button className="btn-primary" onClick={abrirCrear}>+ Nuevo evento</button>
        </div>
      </div>

      {error && <div style={s.errorBanner}>{error}</div>}

      {loading ? (
        <p style={s.loadingText}>Cargando eventos...</p>
      ) : eventos.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: "2.5rem" }}>📅</span>
          <p>No hay eventos registrados.</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div style={s.statsRow}>
            <StatMini label="Próximos" value={proximos.length} color="#1e40af" bg="#dbeafe" />
            <StatMini label="Pasados"  value={pasados.length}  color="#6b7280" bg="#f3f4f6" />
            <StatMini label="Total"    value={eventos.length}  color="#374151" bg="#f9fafb" />
          </div>

          {vista === "calendario" ? (
            <VistaCalendarioEventos
              eventos={eventos}
              onEditar={abrirEditar}
              onEliminar={handleEliminar}
              eliminando={eliminando}
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.tabla}>
                <thead>
                  <tr style={s.theadRow}>
                    <th style={s.th}>Nombre</th>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Impacto en clases</th>
                    <th style={s.th}>Descripción</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((ev, idx) => {
                    const esPasado = ev.Evento_Institucional_Fecha?.slice(0,10) < hoy;
                    return (
                      <tr key={ev.Evento_Institucional_Id}
                        style={{ background: idx % 2 === 0 ? "#f9fafb" : "#fff",
                                 borderBottom: "1px solid #e5e7eb",
                                 opacity: esPasado ? 0.65 : 1 }}>
                        <td style={{ ...s.td, fontWeight: 600 }}>
                          {ev.Evento_Institucional_Nombre}
                          {esPasado && <span style={{ marginLeft: 6, fontSize: "0.72rem",
                            color: "#9ca3af", fontWeight: 400 }}>Pasado</span>}
                        </td>
                        <td style={s.td}>
                          {ev.Evento_Institucional_Fecha
                            ? new Date(ev.Evento_Institucional_Fecha + "T12:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        <td style={s.td}>
                          <ImpactoChip impacto={ev.Evento_Institucional_Impacto_Clases} />
                        </td>
                        <td style={{ ...s.td, maxWidth: 280, color: "#6b7280", fontSize: "0.85rem" }}>
                          {ev.Evento_Institucional_Descripcion}
                        </td>
                        <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                          <button onClick={() => abrirEditar(ev)} style={s.btnAccion}>✏ Editar</button>
                          <button
                            onClick={() => { if (window.confirm("¿Eliminar este evento?")) handleEliminar(ev.Evento_Institucional_Id); }}
                            style={{ ...s.btnAccion, marginLeft: "0.4rem", background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }}
                            disabled={eliminando === ev.Evento_Institucional_Id}
                          >
                            {eliminando === ev.Evento_Institucional_Id ? "..." : "🗑 Eliminar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, color: "#1e3a5f" }}>
              {editando ? "Editar evento" : "Nuevo evento académico"}
            </h2>

            <form onSubmit={handleGuardar}>
              <label style={s.label}>Nombre del evento *</label>
              <input type="text" value={form.Evento_Institucional_Nombre}
                onChange={(e) => setForm((p) => ({ ...p, Evento_Institucional_Nombre: e.target.value }))}
                style={s.input} placeholder="Ej: Licenciatura 4tos Medios" required />

              <label style={{ ...s.label, marginTop: "0.75rem" }}>Fecha *</label>
              <input type="date" value={form.Evento_Institucional_Fecha}
                onChange={(e) => setForm((p) => ({ ...p, Evento_Institucional_Fecha: e.target.value }))}
                style={s.input} required />

              <label style={{ ...s.label, marginTop: "0.75rem" }}>Impacto en clases *</label>
              <div style={s.tipoGrid}>
                {IMPACTOS.map((imp) => (
                  <button key={imp} type="button"
                    onClick={() => setForm((p) => ({ ...p, Evento_Institucional_Impacto_Clases: imp }))}
                    style={{
                      ...s.tipoBtn,
                      ...(form.Evento_Institucional_Impacto_Clases === imp ? s.tipoBtnActive : {}),
                    }}>
                    {imp === "Sin impacto" ? "✅" : imp === "Salida anticipada" ? "⚠" : "🚫"} {imp}
                  </button>
                ))}
              </div>

              <label style={{ ...s.label, marginTop: "0.75rem" }}>Descripción *</label>
              <textarea value={form.Evento_Institucional_Descripcion}
                onChange={(e) => setForm((p) => ({ ...p, Evento_Institucional_Descripcion: e.target.value }))}
                style={{ ...s.input, minHeight: 80, resize: "vertical" }}
                placeholder="Describe el evento y su motivo" required />

              {errorModal && <p style={s.errorInline}>{errorModal}</p>}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModal(false)} style={s.btnSecundario} disabled={guardando}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Vista Semanal de Eventos (Google Calendar-style) ─────────── */

const IMPACTO_COLORES = {
  "Sin impacto":      { bg: "#f0fdf4", borde: "#22c55e", acento: "#166534", icono: "✅" },
  "Salida anticipada":{ bg: "#fefce8", borde: "#eab308", acento: "#92400e", icono: "⚠" },
  "Suspensión total": { bg: "#fef2f2", borde: "#ef4444", acento: "#991b1b", icono: "🚫" },
};

const DIAS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function lunesDe(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function VistaCalendarioEventos({ eventos, onEditar, onEliminar, eliminando }) {
  const [lunes,   setLunes]   = useState(() => lunesDe(new Date()));
  const [hovered, setHovered] = useState(null);

  const hoyISO = toISODate(new Date());

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + i);
    return d;
  });

  const prevSemana = () => { const d = new Date(lunes); d.setDate(d.getDate() - 7); setLunes(d); };
  const nextSemana = () => { const d = new Date(lunes); d.setDate(d.getDate() + 7); setLunes(d); };
  const irHoy     = () => setLunes(lunesDe(new Date()));

  const domingo = dias[6];
  const rangoLabel = `${lunes.toLocaleDateString("es-CL", { day: "numeric", month: "short" })} – ${domingo.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}`;

  const btnNav = {
    padding: "0.3rem 0.65rem", border: "1px solid #e5e7eb", borderRadius: 6,
    background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#374151",
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
      {/* Barra de navegación semanal */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "2px solid #e5e7eb", background: "#f8fafc", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button onClick={prevSemana} style={btnNav}>‹</button>
          <button onClick={nextSemana} style={btnNav}>›</button>
          <button onClick={irHoy} style={{ ...btnNav, fontSize: "0.78rem", color: "#1e40af", borderColor: "#93c5fd" }}>
            Hoy
          </button>
        </div>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e3a5f" }}>{rangoLabel}</span>
        <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
          {eventos.length} evento{eventos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grilla de días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {dias.map((dia, i) => {
          const diaISO   = toISODate(dia);
          const esHoy    = diaISO === hoyISO;
          const esPasado = diaISO < hoyISO;
          const esFinde  = i >= 5;
          const eventosDelDia = eventos.filter(ev => ev.Evento_Institucional_Fecha?.slice(0, 10) === diaISO);

          return (
            <div key={i} style={{
              borderLeft: i > 0 ? "1px solid #e5e7eb" : "none",
              borderTop: "1px solid #e5e7eb",
              minHeight: 110,
              background: esHoy ? "#eff6ff" : esFinde ? "#fafafa" : "#fff",
              opacity: esPasado && !esHoy ? 0.72 : 1,
            }}>
              {/* Cabecera del día */}
              <div style={{ padding: "8px 6px 5px", borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", color: esFinde ? "#9ca3af" : "#6b7280",
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {DIAS_ES[i]}
                </div>
                <div style={{
                  fontSize: "1.05rem", fontWeight: 700, lineHeight: 1,
                  marginTop: 3,
                  color: esHoy ? "#fff" : esFinde ? "#9ca3af" : "#1e3a5f",
                  background: esHoy ? "#1e40af" : "transparent",
                  borderRadius: "50%",
                  width: 28, height: 28,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  {dia.getDate()}
                </div>
              </div>

              {/* Eventos del día */}
              <div style={{ padding: "4px 4px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
                {eventosDelDia.map(ev => {
                  const col   = IMPACTO_COLORES[ev.Evento_Institucional_Impacto_Clases] || IMPACTO_COLORES["Sin impacto"];
                  const isHov = hovered === ev.Evento_Institucional_Id;

                  return (
                    <div
                      key={ev.Evento_Institucional_Id}
                      onMouseEnter={() => setHovered(ev.Evento_Institucional_Id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => onEditar(ev)}
                      style={{
                        background: col.bg,
                        border: `1px solid ${col.borde}`,
                        borderLeft: `3px solid ${col.acento}`,
                        borderRadius: 5,
                        padding: "3px 5px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        lineHeight: 1.35,
                        position: "relative",
                        boxShadow: isHov ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: col.acento,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        paddingRight: isHov ? 38 : 0 }}>
                        {col.icono} {ev.Evento_Institucional_Nombre}
                      </div>
                      <div style={{ fontSize: "0.63rem", color: col.acento, opacity: 0.75 }}>
                        {ev.Evento_Institucional_Impacto_Clases}
                      </div>

                      {/* Acciones al hover */}
                      {isHov && (
                        <div style={{ position: "absolute", top: 3, right: 4, display: "flex", gap: 2 }}>
                          <button title="Editar"
                            onClick={e => { e.stopPropagation(); onEditar(ev); }}
                            style={{ width: 16, height: 16, padding: 0, border: "none", borderRadius: 3,
                              cursor: "pointer", background: col.acento, color: "#fff",
                              fontSize: "0.55rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >✏</button>
                          <button title="Eliminar"
                            disabled={eliminando === ev.Evento_Institucional_Id}
                            onClick={e => { e.stopPropagation(); if (window.confirm("¿Eliminar este evento?")) onEliminar(ev.Evento_Institucional_Id); }}
                            style={{ width: 16, height: 16, padding: 0, border: "none", borderRadius: 3,
                              cursor: "pointer", background: "#dc2626", color: "#fff",
                              fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >×</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Vista Calendario (Google Calendar-style) ─────────────────── */

const PX_POR_MIN = 1.5;

const TIPO_COLORES = {
  "Clase":            { bg: "#eff6ff", borde: "#3b82f6", acento: "#1e40af", icono: "📚" },
  "Recreo":           { bg: "#f0fdf4", borde: "#22c55e", acento: "#166534", icono: "⛹" },
  "Evento Académico": { bg: "#fefce8", borde: "#eab308", acento: "#92400e", icono: "🎓" },
};

function toMin(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
}

function minToHHMM(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function VistaCalendario({ bloques, onEditar, onEliminar, eliminando }) {
  const [hovered, setHovered] = useState(null);

  if (!bloques.length) return null;

  const starts  = bloques.map(b => toMin(b.Bloque_Horario_Hora_Inicio));
  const ends    = bloques.map(b => toMin(b.Bloque_Horario_Hora_Fin));
  const rangoMin = Math.floor(Math.min(...starts) / 60) * 60;
  const rangoMax = Math.ceil(Math.max(...ends)   / 60) * 60;
  const totalMin = rangoMax - rangoMin;
  const totalPx  = totalMin * PX_POR_MIN;

  const horas = Array.from({ length: totalMin / 60 + 1 }, (_, i) => rangoMin + i * 60);

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
      {/* Encabezado de columnas */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb" }}>
        <div style={{ width: 56, flexShrink: 0, borderRight: "1px solid #e5e7eb" }} />
        {["Mañana", "Tarde"].map((j, ji) => {
          const n = bloques.filter(b => b.Bloque_Horario_Jornada === j).length;
          return (
            <div key={j} style={{
              flex: 1, padding: "10px 0", textAlign: "center",
              background: j === "Mañana" ? "#eff6ff" : "#faf5ff",
              borderLeft: ji > 0 ? "1px solid #e5e7eb" : "none",
              fontWeight: 700, fontSize: "0.88rem",
              color: j === "Mañana" ? "#1e40af" : "#7c3aed",
            }}>
              {j === "Mañana" ? "☀" : "🌙"} {j}
              <span style={{ fontWeight: 400, marginLeft: 6, opacity: 0.65, fontSize: "0.78rem" }}>
                {n} {n === 1 ? "bloque" : "bloques"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cuerpo: etiquetas de hora + columnas de jornada */}
      <div style={{ display: "flex" }}>
        {/* Etiquetas de hora */}
        <div style={{ width: 56, flexShrink: 0, position: "relative", height: totalPx, borderRight: "1px solid #e5e7eb", background: "#fff" }}>
          {horas.map(m => (
            <div key={m} style={{
              position: "absolute",
              top: (m - rangoMin) * PX_POR_MIN - 7,
              right: 8, fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, lineHeight: 1,
            }}>
              {minToHHMM(m)}
            </div>
          ))}
        </div>

        {/* Columnas por jornada */}
        {["Mañana", "Tarde"].map((j, ji) => {
          const jornadaBloques = bloques.filter(b => b.Bloque_Horario_Jornada === j);
          return (
            <div key={j} style={{
              flex: 1, position: "relative", height: totalPx,
              borderLeft: ji > 0 ? "1px solid #e5e7eb" : "none",
              background: "#fafafa",
            }}>
              {/* Líneas de hora llena */}
              {horas.map(m => (
                <div key={m} style={{
                  position: "absolute", top: (m - rangoMin) * PX_POR_MIN,
                  left: 0, right: 0, height: 1, background: "#e5e7eb",
                }} />
              ))}
              {/* Líneas de media hora (más suaves) */}
              {horas.slice(0, -1).map(m => (
                <div key={`h${m}`} style={{
                  position: "absolute", top: (m + 30 - rangoMin) * PX_POR_MIN,
                  left: 0, right: 0, height: 1, background: "#f3f4f6",
                }} />
              ))}

              {jornadaBloques.length === 0 && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  color: "#d1d5db", fontSize: "0.8rem", fontStyle: "italic", gap: 4,
                }}>
                  <span style={{ fontSize: "1.5rem" }}>—</span>
                  Sin bloques
                </div>
              )}

              {/* Bloques posicionados */}
              {jornadaBloques.map(b => {
                const sMin  = toMin(b.Bloque_Horario_Hora_Inicio);
                const eMin  = toMin(b.Bloque_Horario_Hora_Fin);
                const top   = (sMin - rangoMin) * PX_POR_MIN;
                const h     = Math.max((eMin - sMin) * PX_POR_MIN - 3, 22);
                const col   = TIPO_COLORES[b.Bloque_Horario_Tipo] || TIPO_COLORES["Clase"];
                const dur   = eMin - sMin;
                const isHov = hovered === b.Bloque_Horario_Id;

                return (
                  <div
                    key={b.Bloque_Horario_Id}
                    onMouseEnter={() => setHovered(b.Bloque_Horario_Id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: "absolute", top, left: 5, right: 5, height: h,
                      background: col.bg,
                      border: `1px solid ${col.borde}`,
                      borderLeft: `3px solid ${col.acento}`,
                      borderRadius: 6, padding: "2px 5px 2px 6px",
                      overflow: "hidden", cursor: "pointer",
                      zIndex: isHov ? 10 : 1,
                      boxShadow: isHov ? "0 3px 10px rgba(0,0,0,0.12)" : "none",
                      transition: "box-shadow 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", height: "100%", justifyContent: "space-between" }}>
                      {/* Texto del bloque */}
                      <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }} onClick={() => onEditar(b)}>
                        <div style={{ fontWeight: 700, fontSize: "0.72rem", color: col.acento, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden" }}>
                          {hhmm(b.Bloque_Horario_Hora_Inicio)}–{hhmm(b.Bloque_Horario_Hora_Fin)}
                        </div>
                        {h > 32 && (
                          <div style={{ fontSize: "0.68rem", color: col.acento, opacity: 0.8, lineHeight: 1.3 }}>
                            {col.icono} {b.Bloque_Horario_Tipo} · {dur} min
                          </div>
                        )}
                      </div>

                      {/* Botones de acción (al hacer hover) */}
                      {isHov && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 3, flexShrink: 0 }}>
                          <button
                            title="Editar"
                            onClick={e => { e.stopPropagation(); onEditar(b); }}
                            style={{
                              width: 18, height: 18, padding: 0, border: "none", borderRadius: 4,
                              cursor: "pointer", background: col.acento, color: "#fff",
                              fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >✏</button>
                          <button
                            title="Eliminar"
                            disabled={eliminando === b.Bloque_Horario_Id}
                            onClick={e => { e.stopPropagation(); if (window.confirm("¿Eliminar este bloque?")) onEliminar(b.Bloque_Horario_Id); }}
                            style={{
                              width: 18, height: 18, padding: 0, border: "none", borderRadius: 4,
                              cursor: "pointer", background: "#dc2626", color: "#fff",
                              fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >×</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */
function calcDuracion(inicio, fin) {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function StatMini({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 8,
      padding: "0.6rem 1rem", textAlign: "center", minWidth: 90 }}>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{label}</div>
    </div>
  );
}

/* ── Estilos ───────────────────────────────────────────────────── */
const s = {
  page: { padding: "1.75rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" },
  titulo:   { margin: 0, color: "#1e3a5f", fontSize: "1.5rem" },
  subtitulo:{ margin: "0.3rem 0 0 0", color: "#6b7280", fontSize: "0.9rem" },
  rolBadge: { padding: "4px 14px", borderRadius: 20, fontSize: "0.82rem", fontWeight: 700,
    background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd", flexShrink: 0 },

  tabBar: { display: "flex", gap: "0.25rem", borderBottom: "2px solid #e5e7eb",
    marginBottom: "1.75rem", flexWrap: "wrap" },
  tabBtn: { padding: "0.6rem 1.1rem", border: "none", background: "transparent",
    cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", borderRadius: "8px 8px 0 0",
    fontWeight: 500, transition: "all .15s" },
  tabBtnActive: { background: "#1e3a5f", color: "#fff", fontWeight: 700 },

  tabContent: { },

  seccion:      { },
  seccionHeader:{ display: "flex", flexDirection: "column", marginBottom: "1.25rem" },
  seccionTitulo:{ margin: "0 0 0.3rem 0", color: "#1e3a5f", fontSize: "1.15rem" },
  seccionDesc:  { margin: 0, color: "#6b7280", fontSize: "0.875rem" },

  formParametros: { },
  fieldset: { border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1rem" },
  legend:   { fontWeight: 700, color: "#1e3a5f", fontSize: "0.9rem", padding: "0 0.4rem" },
  formRow:  { display: "flex", gap: "1rem", flexWrap: "wrap" },
  formField:{ flex: "1 1 160px", display: "flex", flexDirection: "column" },
  label:    { fontWeight: 600, fontSize: "0.875rem", color: "#374151", marginBottom: "0.3rem" },
  input:    { padding: "0.45rem 0.65rem", borderRadius: 6, border: "1px solid #d1d5db",
    fontSize: "0.9rem", boxSizing: "border-box", width: "100%" },
  resumenBox:{ background: "#f0f4ff", border: "1px solid #dbeafe", borderRadius: 8,
    padding: "0.9rem 1.1rem", marginBottom: "0.5rem" },
  resumenList:{ margin: "0.3rem 0 0 1rem", padding: 0, fontSize: "0.85rem", color: "#374151" },

  statsRow:   { display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" },
  tabla:      { width: "100%", borderCollapse: "collapse", minWidth: 560 },
  theadRow:   { background: "#1e3a5f", color: "#fff" },
  th:         { padding: "0.7rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.85rem" },
  td:         { padding: "0.6rem 1rem", verticalAlign: "middle", fontSize: "0.875rem" },

  emptyState: { textAlign: "center", padding: "2.5rem 1rem", color: "#6b7280",
    background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" },

  tipoGrid:   { display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "0.4rem 0 0.5rem 0" },
  tipoBtn:    { padding: "0.4rem 0.9rem", border: "1px solid #d1d5db", borderRadius: 8,
    background: "#f9fafb", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 },
  tipoBtnActive:{ background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f" },

  btnAccion:  { padding: "0.35rem 0.75rem", borderRadius: 6, border: "1px solid #d1d5db",
    background: "#f9fafb", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 },
  btnSecundario:{ padding: "0.4rem 0.9rem", borderRadius: 6, border: "1px solid #d1d5db",
    background: "#f9fafb", cursor: "pointer", fontSize: "0.875rem" },

  errorBanner:{ color: "#dc2626", background: "#fee2e2", border: "1px solid #fecaca",
    padding: "0.7rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  exitoBanner:{ color: "#166534", background: "#dcfce7", border: "1px solid #bbf7d0",
    padding: "0.7rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  errorInline:{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" },
  loadingText:{ color: "#6b7280", fontStyle: "italic" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:   { background: "#fff", borderRadius: 12, padding: "2rem", width: "100%",
    maxWidth: 500, maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)" },

  accessDenied: { display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "4rem 2rem", textAlign: "center", gap: "0.75rem" },
};

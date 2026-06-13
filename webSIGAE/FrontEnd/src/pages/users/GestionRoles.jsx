import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../../services/api";
import {
  normalizarTexto,
  validarCorreoInstitucional,
  validarCorreo,
  DOMINIO_INSTITUCIONAL,
} from "../../utils/validaciones";

/* ── Badge de roles ─────────────────────────────────── */
function BadgesRol({ u }) {
  const badges = [];
  if (u.Es_Administrador) {
    if (u.Administrador_Tipo === "Super Admin")
      badges.push(<span key="sa" className="badge-rol badge-superadmin">Super Admin</span>);
    else
      badges.push(<span key="adm" className="badge-rol badge-admin">Administrador</span>);
  }
  if (u.Es_Docente)   badges.push(<span key="doc" className="badge-rol badge-docente">Docente</span>);
  if (u.Es_Apoderado) badges.push(<span key="apo" className="badge-rol badge-apoderado">Apoderado</span>);
  return badges.length > 0
    ? <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{badges}</div>
    : <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Sin roles</span>;
}

/* ── Campos específicos por rol ─────────────────────── */
function CamposDocente({ datos, errores, onChange }) {
  return (
    <>
      <div className="campo-pwd">
        <label>Correo institucional</label>
        <input
          name="Docente_Correo_Institucional"
          value={datos.Docente_Correo_Institucional || ""}
          onChange={onChange}
          placeholder={`nombre${DOMINIO_INSTITUCIONAL}`}
          className={errores.Docente_Correo_Institucional ? "input-invalid" : ""}
          required
        />
        {errores.Docente_Correo_Institucional && (
          <span className="input-error-msg">{errores.Docente_Correo_Institucional}</span>
        )}
      </div>
      <div className="campo-pwd">
        <label>Especialidad</label>
        <input
          name="Docente_Especialidad"
          value={datos.Docente_Especialidad || ""}
          onChange={onChange}
          placeholder="Ej: Matemáticas"
          required
        />
      </div>
      <div className="campo-pwd">
        <label>Carga horaria máxima (hrs)</label>
        <input
          type="number"
          name="Docente_Carga_Horaria_Maxima"
          value={datos.Docente_Carga_Horaria_Maxima || ""}
          onChange={onChange}
          min="1"
          max="44"
          required
        />
      </div>
    </>
  );
}

function CamposAdmin({ datos, errores, onChange, esSuperAdmin }) {
  return (
    <>
      {esSuperAdmin && (
        <div className="campo-pwd">
          <label>Tipo de administrador</label>
          <select
            name="Administrador_Tipo"
            value={datos.Administrador_Tipo || "Administrador Normal"}
            onChange={onChange}
          >
            <option value="Administrador Normal">Administrador Normal</option>
            <option value="Super Admin">Super Admin</option>
          </select>
        </div>
      )}
      <div className="campo-pwd">
        <label>Correo institucional</label>
        <input
          name="Administrador_Correo_Institucional"
          value={datos.Administrador_Correo_Institucional || ""}
          onChange={onChange}
          placeholder={`nombre${DOMINIO_INSTITUCIONAL}`}
          className={errores.Administrador_Correo_Institucional ? "input-invalid" : ""}
          required
        />
        {errores.Administrador_Correo_Institucional && (
          <span className="input-error-msg">{errores.Administrador_Correo_Institucional}</span>
        )}
      </div>
    </>
  );
}

function CamposApoderado({ datos, errores, onChange }) {
  return (
    <>
      <div className="campo-pwd">
        <label>Correo electrónico personal</label>
        <input
          type="email"
          name="Apoderado_Correo_Natural"
          value={datos.Apoderado_Correo_Natural || ""}
          onChange={onChange}
          placeholder="correo@ejemplo.com"
          className={errores.Apoderado_Correo_Natural ? "input-invalid" : ""}
          required
        />
        {errores.Apoderado_Correo_Natural && (
          <span className="input-error-msg">{errores.Apoderado_Correo_Natural}</span>
        )}
      </div>
      <div className="campo-pwd">
        <label>Dirección particular</label>
        <input
          name="Apoderado_Direccion"
          value={datos.Apoderado_Direccion || ""}
          onChange={onChange}
          placeholder="Ej: Av. Providencia 123, Santiago"
          required
        />
      </div>
    </>
  );
}

/* ── Página principal ───────────────────────────────── */
function GestionRoles() {
  const { id: idParam } = useParams();
  const { usuario: usuarioLogueado } = useAuth();
  const esSuperAdmin = usuarioLogueado?.administradorTipo === "Super Admin";

  const [busqueda, setBusqueda]                 = useState("");
  const [usuarios, setUsuarios]                 = useState([]);
  const [resultados, setResultados]             = useState([]);
  const [seleccionado, setSeleccionado]         = useState(null);
  const [rolNuevo, setRolNuevo]                 = useState("");
  const [datosRol, setDatosRol]                 = useState({});
  const [errores, setErrores]                   = useState({});
  const [loadingPage, setLoadingPage]           = useState(true);
  const [loadingEnvio, setLoadingEnvio]         = useState(false);
  const [msgExito, setMsgExito]                 = useState("");
  const [msgError, setMsgError]                 = useState("");
  // Gestión de roles activos (CU 21/22/23/24)
  const [modalGestion, setModalGestion]         = useState(null); // { tipo: 'desactivar-rol'|'reactivar-cuenta', rol?: string }
  const [loadingGestion, setLoadingGestion]     = useState(false);
  const [msgGestion, setMsgGestion]             = useState({ tipo: "", texto: "" });

  /* Carga inicial */
  useEffect(() => {
    cargarUsuarios();
  }, []);

  /* Filtro de búsqueda */
  useEffect(() => {
    if (!busqueda.trim()) { setResultados([]); return; }
    const texto = normalizarTexto(busqueda);
    setResultados(
      usuarios
        .filter(u =>
          normalizarTexto(u.Usuario_Nombre_Completo || "").includes(texto) ||
          normalizarTexto(u.Usuario_RUT || "").includes(texto)
        )
        .slice(0, 8)
    );
  }, [busqueda, usuarios]);

  const cargarUsuarios = async () => {
    try {
      const res = await apiFetch("/api/usuarios");
      if (!res) return;
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setUsuarios(lista);
      // Si venimos desde un formulario de registro con id en la URL, preseleccionar
      if (idParam) {
        const u = lista.find(u => u.Usuario_Id === Number(idParam));
        if (u) elegirUsuario(u);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPage(false);
    }
  };

  const elegirUsuario = (u) => {
    setSeleccionado(u);
    setBusqueda("");
    setResultados([]);
    setRolNuevo("");
    setDatosRol({});
    setErrores({});
    setMsgExito("");
    setMsgError("");
    setMsgGestion({ tipo: "", texto: "" });
    setModalGestion(null);
  };

  const refreshSeleccionado = async () => {
    try {
      const res = await apiFetch("/api/usuarios");
      if (!res) return;
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setUsuarios(lista);
      if (seleccionado) {
        const actualizado = lista.find(u => u.Usuario_Id === seleccionado.Usuario_Id);
        if (actualizado) setSeleccionado(actualizado);
      }
    } catch (e) { console.error(e); }
  };

  const confirmarGestion = async () => {
    if (!modalGestion || !seleccionado) return;
    setLoadingGestion(true);
    setMsgGestion({ tipo: "", texto: "" });
    try {
      if (modalGestion.tipo === "desactivar-rol") {
        const { rol } = modalGestion;
        const body = {
          Es_Administrador: rol === "Administrador" ? 0 : (seleccionado.Es_Administrador ? 1 : 0),
          Es_Docente:       rol === "Docente"       ? 0 : (seleccionado.Es_Docente       ? 1 : 0),
          Es_Apoderado:     rol === "Apoderado"     ? 0 : (seleccionado.Es_Apoderado     ? 1 : 0),
          Administrador_Tipo: rol === "Administrador" ? null : (seleccionado.Administrador_Tipo || null),
        };
        const res = await apiFetch(`/api/usuarios/${seleccionado.Usuario_Id}/roles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res) return;
        const data = await res.json();
        if (!res.ok) {
          setMsgGestion({ tipo: "error", texto: data.mensaje || "Error al desactivar el rol" });
        } else {
          setMsgGestion({ tipo: "exito", texto: `Rol ${rol} desactivado correctamente.` });
          setRolNuevo("");
          await refreshSeleccionado();
        }
      } else if (modalGestion.tipo === "reactivar-cuenta") {
        const res = await apiFetch(`/api/usuarios/${seleccionado.Usuario_Id}/estado`, { method: "PUT" });
        if (!res) return;
        const data = await res.json();
        if (!res.ok) {
          setMsgGestion({ tipo: "error", texto: data.mensaje || "Error al reactivar la cuenta" });
        } else {
          setMsgGestion({ tipo: "exito", texto: "Cuenta reactivada correctamente." });
          await refreshSeleccionado();
        }
      }
    } catch { setMsgGestion({ tipo: "error", texto: "Error de conexión al servidor" }); }
    finally { setLoadingGestion(false); setModalGestion(null); }
  };

  /* Roles que aún puede recibir este usuario */
  const rolesDisponibles = seleccionado
    ? [
        !seleccionado.Es_Docente   && "Docente",
        !seleccionado.Es_Apoderado && "Apoderado",
        esSuperAdmin && !seleccionado.Es_Administrador && "Administrador",
      ].filter(Boolean)
    : [];

  /* Validación por campo */
  const validarCampo = (name, value) => {
    if (!value) return "";
    if (name === "Docente_Correo_Institucional" || name === "Administrador_Correo_Institucional")
      return !validarCorreoInstitucional(value)
        ? `El correo debe pertenecer al dominio ${DOMINIO_INSTITUCIONAL}`
        : "";
    if (name === "Apoderado_Correo_Natural")
      return !validarCorreo(value) ? "Ingrese un correo electrónico válido" : "";
    return "";
  };

  const handleDatosChange = (e) => {
    const { name, value } = e.target;
    setDatosRol(prev => ({ ...prev, [name]: value }));
    setErrores(prev => ({ ...prev, [name]: validarCampo(name, value) }));
  };

  const handleRolChange = (nuevoRol) => {
    setRolNuevo(nuevoRol);
    setDatosRol({});
    setErrores({});
    setMsgExito("");
    setMsgError("");
  };

  /* Envío del formulario */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seleccionado || !rolNuevo) return;

    // Validación previa
    const nuevosErrores = {};
    Object.keys(datosRol).forEach(name => {
      const msg = validarCampo(name, datosRol[name]);
      if (msg) nuevosErrores[name] = msg;
    });
    if (Object.keys(nuevosErrores).length > 0) { setErrores(nuevosErrores); return; }

    setLoadingEnvio(true);
    setMsgExito("");
    setMsgError("");

    try {
      const res = await apiFetch(`/api/usuarios/${seleccionado.Usuario_Id}/asignar-rol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: rolNuevo, ...datosRol }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        setMsgError(data.mensaje || "Error al asignar el rol");
      } else {
        setMsgExito(`Rol ${rolNuevo} asignado correctamente a ${seleccionado.Usuario_Nombre_Completo}`);
        setSeleccionado(data.usuario);
        setRolNuevo("");
        setDatosRol({});
        cargarUsuarios();
      }
    } catch {
      setMsgError("Error de conexión al servidor");
    } finally {
      setLoadingEnvio(false);
    }
  };

  if (loadingPage) return <div className="page-container"><p>Cargando...</p></div>;

  return (
    <div className="page-container">
      <div className="form-card" style={{ maxWidth: "600px" }}>

        <h1>Asignar Rol a Usuario Existente</h1>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Busca un usuario registrado y asígnale un nuevo rol junto con sus datos específicos.
        </p>

        {/* ── Buscador (oculto si venimos con id en URL) ── */}
        {!idParam && (
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>
              Buscar usuario por nombre o RUT
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setSeleccionado(null); }}
              placeholder="Escribe nombre o RUT..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />
            {resultados.length > 0 && (
              <ul style={{
                position: "absolute", zIndex: 100, background: "#fff",
                border: "1px solid #e2e8f0", borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                width: "100%", margin: 0, padding: 0, listStyle: "none",
                maxHeight: "260px", overflowY: "auto",
              }}>
                {resultados.map(u => (
                  <li
                    key={u.Usuario_Id}
                    onMouseDown={() => elegirUsuario(u)}
                    style={{ padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    <span>
                      <strong>{u.Usuario_Nombre_Completo}</strong>
                      <span style={{ color: "#64748b", marginLeft: "8px", fontSize: "0.88rem" }}>
                        {u.Usuario_RUT}
                      </span>
                    </span>
                    <BadgesRol u={u} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Placeholder vacío ── */}
        {!seleccionado && !busqueda && !idParam && (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0", fontStyle: "italic" }}>
            Ingresa el nombre o RUT del usuario para comenzar.
          </p>
        )}

        {/* ── Panel del usuario seleccionado ── */}
        {seleccionado && (
          <div>
            {/* Card informativa */}
            <div style={{
              background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px",
              padding: "16px 20px", marginBottom: "24px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: "0 0 2px" }}>
                    {seleccionado.Usuario_Nombre_Completo}
                  </p>
                  <p style={{ color: "#64748b", margin: "0 0 10px", fontSize: "0.88rem" }}>
                    RUT: {seleccionado.Usuario_RUT}
                  </p>
                  <BadgesRol u={seleccionado} />
                </div>
                {!idParam && (
                  <button
                    type="button"
                    className="btn-roles"
                    style={{ fontSize: "0.82rem", padding: "5px 12px", whiteSpace: "nowrap" }}
                    onClick={() => { setSeleccionado(null); setBusqueda(""); }}
                  >
                    Cambiar usuario
                  </button>
                )}
              </div>
            </div>

            {/* Mensajes de éxito / error */}
            {msgExito && <div className="msg-exito" style={{ marginBottom: "16px" }}>{msgExito}</div>}
            {msgError && <div className="msg-error-form" style={{ marginBottom: "16px" }}>{msgError}</div>}

            {/* Formulario de asignación */}
            {rolesDisponibles.length > 0 ? (
              <form onSubmit={handleSubmit}>
                <div className="campo-pwd" style={{ marginBottom: "20px" }}>
                  <label style={{ fontWeight: 600 }}>Rol a asignar</label>
                  <select
                    value={rolNuevo}
                    onChange={e => handleRolChange(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "6px" }}
                  >
                    <option value="">— Seleccione un rol —</option>
                    {rolesDisponibles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Datos específicos del rol seleccionado */}
                {rolNuevo === "Docente" && (
                  <CamposDocente datos={datosRol} errores={errores} onChange={handleDatosChange} />
                )}
                {rolNuevo === "Administrador" && (
                  <CamposAdmin datos={datosRol} errores={errores} onChange={handleDatosChange} esSuperAdmin={esSuperAdmin} />
                )}
                {rolNuevo === "Apoderado" && (
                  <CamposApoderado datos={datosRol} errores={errores} onChange={handleDatosChange} />
                )}

                {rolNuevo && (
                  <button
                    type="submit"
                    className="btn-primario"
                    disabled={loadingEnvio}
                    style={{ marginTop: "20px", width: "100%" }}
                  >
                    {loadingEnvio ? "Asignando..." : `Asignar rol ${rolNuevo}`}
                  </button>
                )}
              </form>
            ) : (
              <p style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                Este usuario ya tiene todos los roles disponibles.
              </p>
            )}

            {/* ── Panel gestión de roles activos (CU 21/22/23/24) ── */}
            {(() => {
              const rolesActivos = [
                seleccionado.Es_Administrador && "Administrador",
                seleccionado.Es_Docente       && "Docente",
                seleccionado.Es_Apoderado     && "Apoderado",
              ].filter(Boolean);

              if (rolesActivos.length === 0 && seleccionado.Usuario_Estado_Cuenta) return null;

              return (
                <div style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px", color: "#1e293b" }}>
                    Gestión de roles y cuenta
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "16px" }}>
                    Desactiva un rol específico o reactiva la cuenta si está inactiva.
                  </p>

                  {/* Mensajes de resultado */}
                  {msgGestion.texto && (
                    <div
                      className={msgGestion.tipo === "exito" ? "msg-exito" : "msg-error-form"}
                      style={{ marginBottom: "16px" }}
                    >
                      {msgGestion.texto}
                    </div>
                  )}

                  {/* Roles activos desactivables */}
                  {rolesActivos.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                      {rolesActivos.map(rol => {
                        const puedeGestionar = rol !== "Administrador" || esSuperAdmin;
                        if (!puedeGestionar) return null;
                        return (
                          <div key={rol} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: "8px",
                            background: "#f8fafc",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span className={`badge-rol badge-${rol.toLowerCase()}`}>{rol}</span>
                              <span style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 500 }}>Activo</span>
                            </div>
                            <button
                              className="btn-desactivar"
                              style={{ fontSize: "0.82rem", padding: "5px 12px" }}
                              onClick={() => {
                                setMsgGestion({ tipo: "", texto: "" });
                                setModalGestion({ tipo: "desactivar-rol", rol });
                              }}
                            >
                              Desactivar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reactivar cuenta inactiva */}
                  {!seleccionado.Usuario_Estado_Cuenta && (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 16px", border: "1px solid #fca5a5", borderRadius: "8px",
                      background: "#fff1f2",
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, color: "#991b1b", fontSize: "0.9rem" }}>
                          Cuenta desactivada
                        </span>
                        <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#b91c1c" }}>
                          El usuario no puede iniciar sesión.
                        </p>
                      </div>
                      <button
                        className="btn-reactivar"
                        style={{ fontSize: "0.82rem", padding: "5px 12px" }}
                        onClick={() => {
                          setMsgGestion({ tipo: "", texto: "" });
                          setModalGestion({ tipo: "reactivar-cuenta" });
                        }}
                      >
                        Reactivar cuenta
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* Modal confirmación gestión de roles/cuenta (CU 21/22/23/24) */}
      {modalGestion && seleccionado && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="form-card" style={{ width: "460px", maxWidth: "95vw" }}>
            {modalGestion.tipo === "desactivar-rol" ? (
              <>
                <h2 style={{ marginBottom: "8px" }}>Desactivar rol {modalGestion.rol}</h2>
                <p style={{ color: "#64748b", marginBottom: "16px" }}>
                  <strong>{seleccionado.Usuario_Nombre_Completo}</strong>
                </p>
                <ul style={{ color: "#475569", fontSize: "0.9rem", marginBottom: "20px", paddingLeft: "18px" }}>
                  <li>El usuario perderá el acceso asociado al rol <strong>{modalGestion.rol}</strong>.</li>
                  <li>Su cuenta y otros roles permanecerán activos.</li>
                  <li>La información histórica se conservará.</li>
                </ul>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn-desactivar" onClick={confirmarGestion} disabled={loadingGestion}>
                    {loadingGestion ? "Procesando..." : `Desactivar rol ${modalGestion.rol}`}
                  </button>
                  <button className="btn-roles" onClick={() => setModalGestion(null)} disabled={loadingGestion}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: "8px" }}>Reactivar cuenta</h2>
                <p style={{ color: "#64748b", marginBottom: "16px" }}>
                  <strong>{seleccionado.Usuario_Nombre_Completo}</strong>
                </p>
                <ul style={{ color: "#475569", fontSize: "0.9rem", marginBottom: "20px", paddingLeft: "18px" }}>
                  <li>El usuario podrá volver a iniciar sesión.</li>
                  <li>Sus permisos serán restaurados según sus roles asignados.</li>
                  <li>Las sesiones anteriores no se restauran automáticamente.</li>
                </ul>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn-reactivar" onClick={confirmarGestion} disabled={loadingGestion}>
                    {loadingGestion ? "Procesando..." : "Confirmar reactivación"}
                  </button>
                  <button className="btn-roles" onClick={() => setModalGestion(null)} disabled={loadingGestion}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionRoles;

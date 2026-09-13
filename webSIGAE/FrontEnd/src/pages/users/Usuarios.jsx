import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getUsuariosPorFiltro } from "../../services/api";
import { normalizarTexto } from "../../utils/validaciones";

function Usuarios() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.administradorTipo === "Super Admin";
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [mensajeInfo, setMensajeInfo] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [modalConfirm, setModalConfirm]   = useState(null);
  // { usuario, conEleccion: bool, accion: 'cuenta'|'rol', rolAQuitar: string|null, rolesActivos: string[] }
  const [loadingToggle, setLoadingToggle] = useState(false);

  useEffect(() => {
    cargarUsuarios("Todos", "Todos");
  }, []);

  // CU29: listado con filtros avanzados por rol y estado de cuenta, resueltos en el backend
  const cargarUsuarios = async (rol, estado) => {
    setLoading(true);
    setErrorCarga("");
    setMensajeInfo("");
    try {
      const data = await getUsuariosPorFiltro({
        rol: rol === "Todos" ? undefined : rol,
        estado: estado === "Todos" ? undefined : (estado === "Activo" ? "1" : "0"),
      });
      if (Array.isArray(data)) {
        setUsuarios(data);
      } else {
        // CU29 - Excepción "Sin coincidencias"
        setUsuarios(data.usuarios || []);
        setMensajeInfo(data.mensaje || "No se encontraron usuarios con esos filtros");
      }
    } catch (error) {
      // CU29 - Excepción "Filtros fuera de privilegios" o "Problema técnico"
      setErrorCarga(error.message || "Ocurrió un problema técnico");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => cargarUsuarios(filtroRol, filtroEstado);

  const limpiarFiltros = () => {
    setFiltroRol("Todos");
    setFiltroEstado("Todos");
    setBusqueda("");
    cargarUsuarios("Todos", "Todos");
  };

const abrirConfirmToggle = (u) => {
  const rolesActivos = [
    u.Es_Administrador && "Administrador",
    u.Es_Docente       && "Docente",
    u.Es_Apoderado     && "Apoderado",
  ].filter(Boolean);

  // Al desactivar siempre mostrar elección: cuenta completa o solo un rol (CU 21/22)
  const conEleccion = !!u.Usuario_Estado_Cuenta && rolesActivos.length >= 1;

  setModalConfirm({
    usuario: u,
    conEleccion,
    accion: "cuenta",
    rolAQuitar: rolesActivos[0] ?? null,
    rolesActivos,
  });
};

const confirmarAccion = async () => {
  if (!modalConfirm) return;
  const { usuario: u, accion, rolAQuitar } = modalConfirm;
  setLoadingToggle(true);
  try {
    if (accion === "cuenta") {
      const res = await apiFetch(`/api/usuarios/${u.Usuario_Id}/estado`, { method: "PUT" });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) alert(data.mensaje || "Error al cambiar estado");
      else cargarUsuarios(filtroRol, filtroEstado);
    } else {
      // Quitar un rol específico
      const body = {
        Es_Administrador: rolAQuitar === "Administrador" ? 0 : (u.Es_Administrador ? 1 : 0),
        Es_Docente:       rolAQuitar === "Docente"       ? 0 : (u.Es_Docente       ? 1 : 0),
        Es_Apoderado:     rolAQuitar === "Apoderado"     ? 0 : (u.Es_Apoderado     ? 1 : 0),
        Administrador_Tipo: rolAQuitar === "Administrador" ? null : (u.Administrador_Tipo || null),
      };
      const res = await apiFetch(`/api/usuarios/${u.Usuario_Id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) alert(data.mensaje || "Error al quitar rol");
      else cargarUsuarios(filtroRol, filtroEstado);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoadingToggle(false);
    setModalConfirm(null);
  }
};

  const getCorreoPrincipal = (u) => {
    return u.Administrador_Correo_Institucional || u.Docente_Correo_Institucional || u.Apoderado_Correo_Natural || "—";
  };

  const getBadgesRoles = (u) => {
    const badges = [];
    if (u.Es_Administrador) {
      if (u.Administrador_Tipo === "Super Admin") {
        badges.push(<span key="sa" className="badge-rol badge-superadmin">Super Admin</span>);
      } else {
        badges.push(<span key="adm" className="badge-rol badge-admin">Administrador</span>);
      }
    }
    if (u.Es_Docente) badges.push(<span key="doc" className="badge-rol badge-docente">Docente</span>);
    if (u.Es_Apoderado) badges.push(<span key="apo" className="badge-rol badge-apoderado">Apoderado</span>);
    return badges.length > 0 ? badges : <span style={{ color: "#94a3b8" }}>Sin roles</span>;
  };

  // El filtro por rol/estado ya lo resuelve el backend (CU29); acá solo queda la búsqueda de texto libre
  const usuariosFiltrados = usuarios.filter((u) => {
    const textoBusqueda = normalizarTexto(busqueda);
    return (
      !busqueda ||
      normalizarTexto(u.Usuario_Nombre_Completo ?? "").includes(textoBusqueda) ||
      normalizarTexto(u.Usuario_RUT ?? "").includes(textoBusqueda) ||
      normalizarTexto(u.Administrador_Correo_Institucional ?? "").includes(textoBusqueda) ||
      normalizarTexto(u.Docente_Correo_Institucional ?? "").includes(textoBusqueda) ||
      normalizarTexto(u.Apoderado_Correo_Natural ?? "").includes(textoBusqueda)
    );
  });

  if (loading) {
    return (
      <div className="usuarios-container">
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administra los usuarios del sistema SIGAE</p>
      </div>

      {/* Filtros */}
      <div className="usuarios-filtros">
        <input
          type="text"
          className="usuarios-search"
          placeholder="Buscar por nombre, RUT o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="usuarios-select"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option value="Todos">Todos los roles</option>
          <option value="Administrador">Administrador</option>
          <option value="Docente">Docente</option>
          <option value="Apoderado">Apoderado</option>
        </select>
        <select
          className="usuarios-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
        <button type="button" className="btn-roles" onClick={aplicarFiltros}>Filtrar</button>
        <button type="button" className="btn-roles" onClick={limpiarFiltros}>Limpiar</button>
      </div>

      {/* Tabla */}
      {errorCarga && (
        <div className="usuarios-empty" style={{ color: "#dc2626" }}>
          {errorCarga}
        </div>
      )}

      {!errorCarga && mensajeInfo && (
        <div className="usuarios-empty">{mensajeInfo}</div>
      )}

      {!errorCarga && !mensajeInfo && usuariosFiltrados.length === 0 ? (
        <div className="usuarios-empty">No se encontraron usuarios</div>
      ) : !errorCarga && !mensajeInfo && (
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Roles</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Perfil</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u, idx) => {
              const esMismoUsuario = u.Usuario_Id === usuario?.id;
              const esSuperAdminFila = u.Administrador_Tipo === "Super Admin";

              return (
                <tr key={u.Usuario_Id}>
                  <td>{idx + 1}</td>
                  <td>{u.Usuario_Nombre_Completo}</td>
                  <td>{u.Usuario_RUT}</td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {getBadgesRoles(u)}
                    </div>
                  </td>
                  <td>{getCorreoPrincipal(u)}</td>
                  <td>
                    {u.Usuario_Estado_Cuenta
                      ? <span className="badge-activo">Activo</span>
                      : <span className="badge-inactivo">Inactivo</span>}
                  </td>
                  <td>
                    <button
                    className="btn-roles"
                    onClick={() =>
                      navigate(`/perfil/${u.Usuario_Id}`)
                    }
                    >
                      Ver Perfil
                      </button>
                      </td>
                  <td>
                    <div className="acciones-grupo">
{!esMismoUsuario &&
 !esSuperAdminFila &&
 !(u.Es_Administrador && !esSuperAdmin) && (
  <button
    className={u.Usuario_Estado_Cuenta ? "btn-desactivar" : "btn-reactivar"}
    onClick={() => abrirConfirmToggle(u)}
  >
    {u.Usuario_Estado_Cuenta ? "Desactivar" : "Reactivar"}
  </button>
)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal confirmación desactivar/reactivar / quitar rol — CU 21/22 */}
{modalConfirm && (() => {
  const { usuario: u, conEleccion, accion, rolAQuitar, rolesActivos } = modalConfirm;
  const desactivando = !!u.Usuario_Estado_Cuenta;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001,
    }}>
      <div className="form-card" style={{ width: "460px", maxWidth: "95vw" }}>

        <h2 style={{ marginBottom: "8px" }}>
          {desactivando ? "Gestionar cuenta" : "Reactivar cuenta"}
        </h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>
          <strong>{u.Usuario_Nombre_Completo}</strong>
        </p>

        {/* Selector de acción — solo para multi-rol al desactivar */}
        {conEleccion && (
          <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
              <input
                type="radio"
                name="accion-modal"
                checked={accion === "cuenta"}
                onChange={() => setModalConfirm({ ...modalConfirm, accion: "cuenta" })}
                style={{ marginTop: "3px" }}
              />
              <span>
                <strong>Desactivar cuenta completa</strong>
                <br />
                <small style={{ color: "#64748b" }}>
                  Suspende todos los accesos del usuario. Sus sesiones activas serán invalidadas.
                </small>
              </span>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
              <input
                type="radio"
                name="accion-modal"
                checked={accion === "rol"}
                onChange={() => setModalConfirm({ ...modalConfirm, accion: "rol" })}
                style={{ marginTop: "3px" }}
              />
              <span>
                <strong>Quitar un rol específico</strong>
                <br />
                <small style={{ color: "#64748b" }}>
                  La cuenta permanece activa pero sin el rol seleccionado.
                </small>
              </span>
            </label>

            {accion === "rol" && (
              <div style={{
                marginLeft: "26px", padding: "12px 14px",
                background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe",
              }}>
                <p style={{ margin: "0 0 10px", color: "#1d4ed8", fontSize: "0.88rem" }}>
                  La gestión de roles individuales se realiza desde el módulo de{" "}
                  <strong>Gestión de Roles</strong>.
                </p>
                <button
                  className="btn-roles"
                  style={{ fontSize: "0.85rem" }}
                  onClick={() => { setModalConfirm(null); navigate("/gestion-roles"); }}
                >
                  Ir a Gestión de Roles →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Consecuencias — sin elección (caso simple) */}
        {!conEleccion && (
          desactivando ? (
            <ul style={{ color: "#475569", fontSize: "0.9rem", marginBottom: "20px", paddingLeft: "18px" }}>
              <li>El acceso del usuario quedará restringido.</li>
              <li>Todas sus sesiones activas serán invalidadas.</li>
              <li>La información histórica se conservará.</li>
            </ul>
          ) : (
            <ul style={{ color: "#475569", fontSize: "0.9rem", marginBottom: "20px", paddingLeft: "18px" }}>
              <li>El usuario podrá volver a iniciar sesión.</li>
              <li>Sus permisos serán restaurados según su rol.</li>
              <li>Las sesiones anteriores NO se restauran automáticamente.</li>
            </ul>
          )
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          {accion !== "rol" && (
            <button
              className={desactivando ? "btn-desactivar" : "btn-reactivar"}
              onClick={confirmarAccion}
              disabled={loadingToggle}
            >
              {loadingToggle
                ? "Procesando..."
                : desactivando
                  ? "Confirmar desactivación"
                  : "Confirmar reactivación"}
            </button>
          )}
          <button
            className="btn-roles"
            onClick={() => setModalConfirm(null)}
            disabled={loadingToggle}
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
})()}
    </div>
  );
}

export default Usuarios;

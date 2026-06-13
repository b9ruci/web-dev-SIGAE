import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../../services/api";

function Usuarios() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.administradorTipo === "SuperAdmin";
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [modalConfirm, setModalConfirm]   = useState(null); // usuario a desactivar/reactivar
  const [loadingToggle, setLoadingToggle] = useState(false);
  // Modal roles
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [roles, setRoles] = useState({
    Es_Administrador: false,
    Es_Docente: false,
    Es_Apoderado: false,
    Administrador_Tipo: "Administrador Normal",
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await apiFetch("/api/usuarios");
      if (!res) return;
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

const abrirConfirmToggle = (u) => {
  setModalConfirm(u);
};

const confirmarToggle = async () => {
  if (!modalConfirm) return;
  setLoadingToggle(true);
  try {
    const res = await apiFetch(`/api/usuarios/${modalConfirm.Usuario_Id}/estado`, { method: "PUT" });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) {
      alert(data.mensaje || "Error al cambiar estado");
    } else {
      cargarUsuarios();
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoadingToggle(false);
    setModalConfirm(null);
  }
};

  const abrirRoles = (u) => {
    setUsuarioSeleccionado(u);
    setRoles({
      Es_Administrador: !!u.Es_Administrador,
      Es_Docente: !!u.Es_Docente,
      Es_Apoderado: !!u.Es_Apoderado,
      Administrador_Tipo: u.Administrador_Tipo || "Administrador Normal",
    });
  };

  const guardarRoles = async () => {
    try {
      const body = {
        Es_Administrador: roles.Es_Administrador ? 1 : 0,
        Es_Docente: roles.Es_Docente ? 1 : 0,
        Es_Apoderado: roles.Es_Apoderado ? 1 : 0,
        Administrador_Tipo: roles.Es_Administrador ? roles.Administrador_Tipo : null,
      };
      const res = await apiFetch(`/api/usuarios/${usuarioSeleccionado.Usuario_Id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res) return;
      if (res.ok) {
        setUsuarioSeleccionado(null);
        cargarUsuarios();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getCorreoPrincipal = (u) => {
    return u.Administrador_Correo_Institucional || u.Docente_Correo_Institucional || u.Apoderado_Correo_Natural || "—";
  };

  const getBadgesRoles = (u) => {
    const badges = [];
    if (u.Es_Administrador) {
      if (u.Administrador_Tipo === "SuperAdmin") {
        badges.push(<span key="sa" className="badge-rol badge-superadmin">Super Admin</span>);
      } else {
        badges.push(<span key="adm" className="badge-rol badge-admin">Administrador</span>);
      }
    }
    if (u.Es_Docente) badges.push(<span key="doc" className="badge-rol badge-docente">Docente</span>);
    if (u.Es_Apoderado) badges.push(<span key="apo" className="badge-rol badge-apoderado">Apoderado</span>);
    return badges.length > 0 ? badges : <span style={{ color: "#94a3b8" }}>Sin roles</span>;
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const textoBusqueda = busqueda.toLowerCase();
    const coincideTexto =
  !busqueda ||
  u.Usuario_Nombre_Completo?.toLowerCase().includes(textoBusqueda) ||
  u.Usuario_RUT?.toLowerCase().includes(textoBusqueda) ||
  u.Administrador_Correo_Institucional?.toLowerCase().includes(textoBusqueda) ||
  u.Docente_Correo_Institucional?.toLowerCase().includes(textoBusqueda) ||
  u.Apoderado_Correo_Natural?.toLowerCase().includes(textoBusqueda);

    const coincideRol =
      filtroRol === "Todos" ||
      (filtroRol === "Administrador" && u.Es_Administrador) ||
      (filtroRol === "Docente" && u.Es_Docente) ||
      (filtroRol === "Apoderado" && u.Es_Apoderado);

    const coincideEstado =
      filtroEstado === "Todos" ||
      (filtroEstado === "Activo" && u.Usuario_Estado_Cuenta) ||
      (filtroEstado === "Inactivo" && !u.Usuario_Estado_Cuenta);

    return coincideTexto && coincideRol && coincideEstado;
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
      </div>

      {/* Tabla */}
      {usuariosFiltrados.length === 0 ? (
        <div className="usuarios-empty">No se encontraron usuarios</div>
      ) : (
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
              const esSuperAdminFila = u.Administrador_Tipo === "SuperAdmin";

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
                      {esSuperAdmin && (
                        <button
                          className="btn-roles"
                          onClick={() => abrirRoles(u)}
                        >
                          Gestionar Roles
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

      {/* Modal gestión de roles */}
      {usuarioSeleccionado && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
        >
          <div className="form-card" style={{ width: "420px", maxWidth: "95vw" }}>
            <h2 style={{ marginBottom: "20px" }}>
              Gestionar Roles: {usuarioSeleccionado.Usuario_Nombre_Completo}
            </h2>
            <div className="roles-grid">
              <div className="rol-item">
                <input
                  type="checkbox"
                  id="chk-admin"
                  checked={roles.Es_Administrador}
                  onChange={(e) => setRoles({ ...roles, Es_Administrador: e.target.checked })}
                />
                <label htmlFor="chk-admin">Administrador</label>
              </div>
              {roles.Es_Administrador && (
                <select
                  className="rol-tipo-select"
                  value={roles.Administrador_Tipo}
                  onChange={(e) => setRoles({ ...roles, Administrador_Tipo: e.target.value })}
                >
                  <option value="Administrador Normal">Administrador Normal</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              )}
              <div className="rol-item">
                <input
                  type="checkbox"
                  id="chk-docente"
                  checked={roles.Es_Docente}
                  onChange={(e) => setRoles({ ...roles, Es_Docente: e.target.checked })}
                />
                <label htmlFor="chk-docente">Docente</label>
              </div>
              <div className="rol-item">
                <input
                  type="checkbox"
                  id="chk-apoderado"
                  checked={roles.Es_Apoderado}
                  onChange={(e) => setRoles({ ...roles, Es_Apoderado: e.target.checked })}
                />
                <label htmlFor="chk-apoderado">Apoderado</label>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-primario" onClick={guardarRoles}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal confirmación desactivar/reactivar — CU 22/23/24/25 */}
{modalConfirm && (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001,
  }}>
    <div className="form-card" style={{ width: "420px", maxWidth: "95vw" }}>
      <h2 style={{ marginBottom: "8px" }}>
        {modalConfirm.Usuario_Estado_Cuenta ? "Desactivar cuenta" : "Reactivar cuenta"}
      </h2>
      <p style={{ color: "#64748b", marginBottom: "16px" }}>
        <strong>{modalConfirm.Usuario_Nombre_Completo}</strong>
      </p>

      {modalConfirm.Usuario_Estado_Cuenta ? (
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
      )}

<div style={{ display: "flex", gap: "10px" }}>
  <button
    className={modalConfirm.Usuario_Estado_Cuenta ? "btn-desactivar" : "btn-reactivar"}
    onClick={confirmarToggle}
    disabled={loadingToggle}
  >
    {loadingToggle
      ? "Procesando..."
      : modalConfirm.Usuario_Estado_Cuenta
        ? "Confirmar desactivación"
        : "Confirmar reactivación"}
  </button>
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
)}
    </div>
  );
}

export default Usuarios;

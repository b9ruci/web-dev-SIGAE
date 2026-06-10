import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../pages/context/AuthContext";

function MainLayout() {
  const { usuario, rolActivo, logout } = useAuth();
  const navigate = useNavigate();
  const [mostrarModalLogout, setMostrarModalLogout] = useState(false);

  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esSuperAdmin = usuario?.administradorTipo === "SuperAdmin";
  const esAdmin = rolEfectivo === "Administrador" || esSuperAdmin || usuario?.roles?.includes("Administrador");
  const esDocente = rolEfectivo === "Docente";
  const esApoderado = rolEfectivo === "Apoderado";

  // CU 12: confirmar antes de cerrar sesión
  const confirmarCierre = () => setMostrarModalLogout(true);

  const cancelarCierre = () => setMostrarModalLogout(false);

  const cerrarSesion = async () => {
    setMostrarModalLogout(false);
    await logout();
    navigate("/");
  };

  return (
    <div className="layout">
      {/* MODAL CONFIRMACIÓN CIERRE DE SESIÓN (CU 12) */}
      {mostrarModalLogout && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Cerrar sesión</h2>
            <p>¿Estás seguro de que deseas cerrar tu sesión?</p>
            <div className="modal-actions">
              <button onClick={cerrarSesion} className="btn-danger">
                Sí, cerrar sesión
              </button>
              <button onClick={cancelarCierre} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <h2 className="logo">SIGAE</h2>

          {usuario && (
            <div className="sidebar-user-info">
              <div className="nombre">{usuario.nombre}</div>
              <div className="rol-badge">{rolEfectivo || "Usuario"}</div>
            </div>
          )}

          <nav className="menu">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/perfil">Mi Perfil</Link>

            {esAdmin && (
              <>
                <span className="menu-section">Administración</span>
                <Link to="/usuarios">Gestión de Usuarios</Link>
                {esSuperAdmin && <Link to="/registrar-admin">Registrar Admin</Link>}
                <Link to="/registrar-docente">Registrar Docente</Link>
                <Link to="/registrar-apoderado">Registrar Apoderado</Link>
                <Link to="/registrar-estudiante">Registrar Estudiante</Link>
                <Link to="/cursos">Cursos</Link>
                <Link to="/horarios">Horarios</Link>
                <Link to="/bloques">Bloques Horarios</Link>
                <Link to="/reportes">Reportes</Link>
              </>
            )}

            {esDocente && (
              <>
                <span className="menu-section">Docente</span>
                <Link to="/cursos">Mis Cursos</Link>
                <Link to="/horarios">Mi Horario</Link>
                <Link to="/citaciones">Citaciones</Link>
                <Link to="/mensajes">Mensajes</Link>
              </>
            )}

            {esApoderado && (
              <>
                <span className="menu-section">Apoderado</span>
                <Link to="/citaciones">Citaciones</Link>
                <Link to="/mensajes">Mensajes</Link>
              </>
            )}
          </nav>
        </div>

        <button className="logout-button" onClick={confirmarCierre}>
          Cerrar Sesión
        </button>
      </aside>

      {/* CONTENIDO */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;

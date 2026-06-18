import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../pages/context/AuthContext";

function MainLayout() {
  const { usuario, rolActivo, logout } = useAuth();
  const navigate = useNavigate();
  const [mostrarModalLogout, setMostrarModalLogout] = useState(false);
  
  // Estados para los dropdowns
  const [gestionAbierto, setGestionAbierto] = useState(false);
  const [registrarAbierto, setRegistrarAbierto] = useState(false);
  const [gestionAcademicaAbierto, setGestionAcademicaAbierto] = useState(false);

  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esSuperAdmin = usuario?.administradorTipo === "Super Admin";
  const esAdmin = rolEfectivo === "Administrador" || esSuperAdmin || usuario?.roles?.includes("Administrador");
  const esDocente = rolEfectivo === "Docente";
  const esApoderado = rolEfectivo === "Apoderado";

  const confirmarCierre = () => setMostrarModalLogout(true);
  const cancelarCierre = () => setMostrarModalLogout(false);
  const cerrarSesion = async () => {
    setMostrarModalLogout(false);
    await logout();
    navigate("/");
  };

  return (
    <div className="layout">
      {/* MODAL CONFIRMACIÓN CIERRE DE SESIÓN */}
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
          <div className="logo-row">
            <img src="/logo-colegio.png" alt="Logo Colegio Jacques Cousteau" className="sidebar-logo-img" />
          </div>
          
          {usuario && (
            <div className="sidebar-user-info">
              <div className="nombre">
                {usuario.nombre || usuario.Usuario_Nombre_Completo || "Usuario"}
              </div>
              <div className="rol-badge">{rolEfectivo || "Usuario"}</div>
            </div>
          )}

          <nav className="menu">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/perfil">Mi Perfil</Link>

            {esAdmin && (
              <>
                <span className="menu-section">Administración</span>

                {/* Dropdown: Gestión Usuarios, Roles y Apoderados */}
                <div className="menu-item-dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={() => setGestionAbierto(!gestionAbierto)}
                  >
                    Gestión Usuarios
                    <span className={`dropdown-arrow ${gestionAbierto ? 'open' : ''}`}>▾</span>
                  </button>
                  {gestionAbierto && (
                    <div className="submenu">
                      <Link to="/usuarios">Gestión de Usuarios</Link>
                      {esSuperAdmin && <Link to="/gestion-roles">Gestión de Roles</Link>}
                      <Link to="/apoderados">Gestión de Apoderados</Link>
                    </div>
                  )}
                </div>

                {/* Dropdown: Registrar Usuario */}
                <div className="menu-item-dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={() => setRegistrarAbierto(!registrarAbierto)}
                  >
                    Registrar Usuario
                    <span className={`dropdown-arrow ${registrarAbierto ? 'open' : ''}`}>▾</span>
                  </button>
                  {registrarAbierto && (
                    <div className="submenu">
                      {esSuperAdmin && <Link to="/registrar-admin">Registrar Admin</Link>}
                      <Link to="/registrar-docente">Registrar Docente</Link>
                      <Link to="/registrar-apoderado">Registrar Apoderado</Link>
                      
                    </div>
                  )}
                </div>

                {/* Dropdown: Gestión Académica */}
                <div className="menu-item-dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={() => setGestionAcademicaAbierto(!gestionAcademicaAbierto)}
                  >
                    Gestión Académica
                    <span className={`dropdown-arrow ${gestionAcademicaAbierto ? 'open' : ''}`}>▾</span>
                  </button>
                  {gestionAcademicaAbierto && (
                    <div className="submenu">
                      <Link to="/plan-educativo">Plan Educativo</Link>
                      <Link to="/asignaturas">Asignaturas</Link>
                      <Link to="/cursos">Cursos</Link>
                      <Link to="/horarios">Horarios</Link>
                      <Link to="/bloques-horarios">Bloques Horarios</Link>
                      <Link to="/registrar-estudiante">Registrar Estudiante</Link>
                    </div>
                  )}
                </div>

                <Link to="/reportes">Reportes</Link>
              </>
            )}

            {esDocente && (
              <>
                <span className="menu-section">Docente</span>
                <Link to="/plan-educativo">Plan Educativo</Link>
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
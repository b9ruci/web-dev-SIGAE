import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../pages/context/AuthContext";

function Sidebar() {
  const { usuario, rolActivo, logout } = useAuth();
  const [registrarAbierto, setRegistrarAbierto] = useState(false);
  const [gestionAcademicaAbierto, setGestionAcademicaAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esSuperAdmin = usuario?.administradorTipo === "Super Admin";
  const esAdmin = rolEfectivo === "Administrador";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-row">
          <img src="/logo-colegio.png" alt="Logo Colegio Jacques Cousteau" className="sidebar-logo-img" />
          <h2>SIGAE</h2>
        </div>
        <p>{usuario?.nombre}</p>
        <small>{rolEfectivo}</small>
      </div>

      <nav className="sidebar-menu">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/perfil">Mi Perfil</Link>

        {/* Dropdown: Gestión Académica */}
        {esAdmin && (
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
                <Link to="/cursos">Cursos</Link>
                <Link to="/horarios">Horarios</Link>
                <Link to="/registrar-estudiante">Registro de Estudiante</Link>
                <Link to="/estudiantes">Gestión de Estudiantes</Link>
                <Link to="/bloques-horarios">Bloques Horarios</Link>
                <Link to="/asignaturas">Asignaturas</Link>
              </div>
            )}
          </div>
        )}

        {/* Dropdown: Registrar Usuario (solo admins) */}
        {esAdmin && (
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
        )}

        {esAdmin && (
          <>
            <Link to="/usuarios">Gestión de Usuarios</Link>
            <Link to="/gestion-roles">Gestión de Roles</Link>
            <Link to="/apoderados">Gestión de Apoderados</Link>
            <Link to="/reportes">Reportes</Link>
          </>
        )}

        {rolEfectivo === "Docente" && (
          <>
            <Link to="/plan-educativo">Plan Educativo</Link>
            <Link to="/cursos">Mis Cursos</Link>
            <Link to="/estudiantes">Mis Estudiantes</Link>
            <Link to="/horarios">Mi Horario</Link>
            <Link to="/citaciones">Citaciones</Link>
            <Link to="/mensajes">Mensajes</Link>
          </>
        )}

        {rolEfectivo === "Apoderado" && (
          <>
            <Link to="/citaciones">Citaciones</Link>
            <Link to="/mensajes">Mensajes</Link>
          </>
        )}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </aside>
  );
}

export default Sidebar;
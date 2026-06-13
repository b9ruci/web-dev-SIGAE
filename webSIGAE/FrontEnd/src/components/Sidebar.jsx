import { Link } from "react-router-dom";
import { useAuth } from "../pages/context/AuthContext";

function Sidebar() {

  const {
    usuario,
    rolActivo,
    logout
  } = useAuth();

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

        <h2>SIGAE</h2>

        <p>
          {usuario?.nombre}
        </p>

        <small>
          {rolEfectivo}
        </small>

      </div>

      <nav className="sidebar-menu">

        <Link to="/dashboard">
          Dashboard
        </Link>

        <Link to="/perfil">
          Mi Perfil
        </Link>

        {esAdmin && (
          <>
            <Link to="/usuarios">
              Usuarios
            </Link>

            <Link to="/gestion-roles">
              Gestión de Roles
            </Link>

            {esSuperAdmin && (
              <Link to="/registrar-admin">
                Registrar Admin
              </Link>
            )}

            <Link to="/registrar-docente">
              Registrar Docente
            </Link>

            <Link to="/registrar-apoderado">
              Registrar Apoderado
            </Link>

            <Link to="/registrar-estudiante">
              Registrar Estudiante
            </Link>

            <Link to="/apoderados">
              Asignar Est. a Apoderados
            </Link>

            <Link to="/plan-educativo">
              Plan Educativo
            </Link>

            <Link to="/cursos">
              Cursos
            </Link>

            <Link to="/horarios">
              Horarios
            </Link>

            <Link to="/reportes">
              Reportes
            </Link>
          </>
        )}

        {rolEfectivo === "Docente" && (
          <>
            <Link to="/plan-educativo">
              Plan Educativo
            </Link>

            <Link to="/cursos">
              Mis Cursos
            </Link>

            <Link to="/horarios">
              Mi Horario
            </Link>

            <Link to="/citaciones">
              Citaciones
            </Link>

            <Link to="/mensajes">
              Mensajes
            </Link>
          </>
        )}

        {rolEfectivo === "Apoderado" && (
          <>
            <Link to="/citaciones">
              Citaciones
            </Link>

            <Link to="/mensajes">
              Mensajes
            </Link>
          </>
        )}

      </nav>

      <button
        className="logout-btn"
        onClick={handleLogout}
      >
        Cerrar sesión
      </button>

    </aside>

  );
}

export default Sidebar;
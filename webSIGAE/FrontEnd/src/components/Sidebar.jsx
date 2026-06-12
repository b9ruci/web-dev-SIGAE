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

  return (

    <aside className="sidebar">

      <div className="sidebar-header">

        <h2>SIGAE</h2>

        <p>
          {usuario?.nombre}
        </p>

        <small>
          {rolActivo || usuario?.roles?.[0]}
        </small>

      </div>

      <nav className="sidebar-menu">

        <Link to="/dashboard">
          Dashboard
        </Link>
        
        usuario?.roles?.includes("Administrador") && (
          <>
            <Link to="/usuarios">
              Usuarios
            </Link>

            <Link to="/gestion-roles">
            Gestión de Roles
            </Link>

            <Link to="/registrar-admin">
              Registrar Admin
            </Link>

            <Link to="/registrar-docente">
              Registrar Docente
            </Link>

            <Link to="/registrar-apoderado">
              Registrar Apoderado
            </Link>

            <Link to="/registrar-estudiante">
              Registrar Estudiante
            </Link>

            <Link to="/plan-educativo">
              Plan Educativo
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
        )

        {rolActivo === "Docente" && (
          <>
            <Link to="/plan-educativo">
              Plan Educativo
            </Link>

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

        {rolActivo === "Apoderado" && (
          <>
            <Link to="/citaciones">
              Citaciones
            </Link>

            <Link to="/mensajes">
              Mensajes
            </Link>

            <Link to="/perfil">
              Mi Perfil
            </Link>
          </>
        )}

      </nav>

      <button
        className="logout-btn"
        onClick={handleLogout}
      >
        Cerrar sesiÃ³n
      </button>

    </aside>

  );
}

export default Sidebar;
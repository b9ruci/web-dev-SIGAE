import { Outlet, Link, useNavigate } from "react-router-dom";

function MainLayout() {

  const navigate = useNavigate();

  const cerrarSesion = () => {

    localStorage.removeItem("usuario");

    navigate("/");
  };

  return (

    <div className="layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div>

          <h2 className="logo">
            SIGAE
          </h2>

          <nav className="menu">

            <Link to="/dashboard">
              Dashboard
            </Link>

            <Link to="/usuarios">
              Usuarios
            </Link>

            <Link to="/registrar-admin">
              Registrar Administrador
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

            <Link to="/cursos">
              Cursos
            </Link>

            <Link to="/horarios">
              Horarios
            </Link>

            <Link to="/bloques">
              Bloques Horarios
            </Link>

            <Link to="/mensajes">
              Mensajes
            </Link>

            <Link to="/citaciones">
              Citaciones
            </Link>

            <Link to="/reportes">
              Reportes
            </Link>

            <Link to="/perfil">
              Mi Perfil
            </Link>

          </nav>

        </div>

        <button
          className="logout-button"
          onClick={cerrarSesion}
        >
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
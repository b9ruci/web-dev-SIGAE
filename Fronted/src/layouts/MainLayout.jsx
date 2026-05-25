import { Outlet, Link, useNavigate } from "react-router-dom";

function MainLayout() {

  const navigate = useNavigate();

  const cerrarSesion = () => {

    // Aquí después se elimina token/sessionStorage

    navigate("/");
  };

  return (

    <div className="layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <h2>SIGAE</h2>

        <nav>

          {/* DASHBOARD */}

          <Link to="/dashboard">
            Dashboard
          </Link>

          {/* USUARIOS */}

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

          {/* ACADÉMICO */}

          <Link to="/cursos">
            Cursos
          </Link>

          <Link to="/horarios">
            Horarios
          </Link>

          <Link to="/bloques">
            Bloques Horarios
          </Link>

          {/* COMUNICACIÓN */}

          <Link to="/mensajes">
            Mensajes
          </Link>

          <Link to="/citaciones">
            Citaciones
          </Link>

          {/* REPORTES */}

          <Link to="/reportes">
            Reportes
          </Link>

          {/* PERFIL */}

          <Link to="/perfil">
            Mi Perfil
          </Link>

        </nav>

        {/* CERRAR SESIÓN */}

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
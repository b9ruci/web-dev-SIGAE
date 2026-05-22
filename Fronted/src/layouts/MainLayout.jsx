import { Link, Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>SIGAE</h2>

        <nav>
          <Link to="/dashboard">Inicio</Link>

          <Link to="/usuarios">
            Usuarios
          </Link>

          <Link to="/estudiantes">
            Estudiantes
          </Link>

          <Link to="/horarios">
            Horarios
          </Link>

          <Link to="/citaciones">
            Citaciones
          </Link>

          <Link to="/">
            Cerrar sesión
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
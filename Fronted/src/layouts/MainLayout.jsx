import { Outlet, Link } from "react-router-dom";

function MainLayout() {
  return (
    <div className="layout">

      <aside className="sidebar">
        <h2>SIGAE</h2>

        <nav>
          <Link to="/dashboard">
            Dashboard
          </Link>

          <Link to="/usuarios">
            Usuarios
          </Link>

          <Link to="/reportes">
            Reportes
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
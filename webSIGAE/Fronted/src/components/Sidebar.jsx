import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar-header">
        <h2>SIGAE</h2>
        <p>Sistema Escolar</p>
      </div>

      <nav className="sidebar-menu">

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

      <button className="logout-btn">
        Cerrar sesión
      </button>

    </aside>
  );
}

export default Sidebar;
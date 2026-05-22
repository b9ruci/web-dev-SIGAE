import { Outlet, Link } from "react-router-dom";

function MainLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          background: "#1e293b",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>SIGAE</h2>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/usuarios">Usuarios</Link>
          <Link to="/docentes">Docentes</Link>
          <Link to="/apoderados">Apoderados</Link>
          <Link to="/estudiantes">Estudiantes</Link>
        </nav>
      </aside>

      {/* Contenido */}
      <main style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
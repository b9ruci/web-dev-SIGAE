import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../pages/context/AuthContext";

function Sidebar() {
  const { usuario, rolActivo, logout } = useAuth();
  const [registrarAbierto, setRegistrarAbierto] = useState(false);

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
        <p>{usuario?.nombre}</p>
        <small>{rolEfectivo}</small>
      </div>

      <nav className="sidebar-menu">

        <Link to="/dashboard">Dashboard</Link>
        <Link to="/perfil">Mi Perfil</Link>

        {esAdmin && (
          <>
            <Link to="/usuarios">Gestión de Usuarios</Link>
            <Link to="/gestion-roles">Gestión de Roles</Link>

            <div>
              <button
                onClick={() => setRegistrarAbierto(!registrarAbierto)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  color: "white",
                  padding: "12px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "inherit",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                Registrar Usuario
                <span style={{ fontSize: "0.75rem", transition: "transform 0.2s", display: "inline-block", transform: registrarAbierto ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
              </button>

              {registrarAbierto && (
                <div style={{ display: "flex", flexDirection: "column", paddingLeft: "12px", borderLeft: "2px solid #2563eb", marginLeft: "12px" }}>
                  {esSuperAdmin && (
                    <Link to="/registrar-admin">Registrar Admin</Link>
                  )}
                  <Link to="/registrar-docente">Registrar Docente</Link>
                  <Link to="/registrar-apoderado">Registrar Apoderado</Link>
                  <Link to="/registrar-estudiante">Registrar Estudiante</Link>
                </div>
              )}
            </div>

            <Link to="/apoderados">Gestión de Apoderados</Link>
            <Link to="/cursos">Cursos</Link>
            <Link to="/horarios">Horarios</Link>
            <Link to="/bloques-horarios">Bloques Horarios</Link>
            <Link to="/reportes">Reportes</Link>
          </>
        )}

        {rolEfectivo === "Docente" && (
          <>
            <Link to="/plan-educativo">Plan Educativo</Link>
            <Link to="/cursos">Mis Cursos</Link>
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

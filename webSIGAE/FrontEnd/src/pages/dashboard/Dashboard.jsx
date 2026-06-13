import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ── Dashboard de Administrador ───────────────────── */
function DashboardAdmin() {
  const [stats, setStats] = useState({
    usuarios: 0, docentes: 0, apoderados: 0,
    estudiantes: 0, cursos: 0, citaciones: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/dashboard/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <h2>Cargando dashboard...</h2>;

  return (
    <div className="dashboard-container">
      <h1>Dashboard SIGAE</h1>
      <p>Bienvenido al Sistema de Gestión Académica Escolar</p>

      <div className="dashboard-cards">
        <div className="card"><h3>Usuarios</h3><p>{stats.usuarios}</p></div>
        <div className="card"><h3>Docentes</h3><p>{stats.docentes}</p></div>
        <div className="card"><h3>Apoderados</h3><p>{stats.apoderados}</p></div>
        <div className="card"><h3>Estudiantes</h3><p>{stats.estudiantes}</p></div>
        <div className="card"><h3>Cursos</h3><p>{stats.cursos}</p></div>
        <div className="card"><h3>Citaciones</h3><p>{stats.citaciones}</p></div>
      </div>

      <div className="quick-actions">
        <h2>Accesos Rápidos</h2>
        <div className="actions-grid">
          <Link to="/registrar-docente">Registrar Docente</Link>
          <Link to="/registrar-apoderado">Registrar Apoderado</Link>
          <Link to="/registrar-estudiante">Registrar Estudiante</Link>
          <Link to="/citaciones">Ver Citaciones</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard de Docente ──────────────────────────── */
function DashboardDocente({ nombre }) {
  return (
    <div className="dashboard-container">
      <h1>Bienvenido, {nombre}</h1>
      <p>Panel del Docente — SIGAE</p>

      <div className="quick-actions">
        <h2>Accesos Rápidos</h2>
        <div className="actions-grid">
          <Link to="/horarios">Mi Horario</Link>
          <Link to="/citaciones">Mis Citaciones</Link>
          <Link to="/mensajes">Mensajes</Link>
          <Link to="/perfil">Mi Perfil</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard de Apoderado ────────────────────────── */
function DashboardApoderado({ nombre }) {
  return (
    <div className="dashboard-container">
      <h1>Bienvenido, {nombre}</h1>
      <p>Panel del Apoderado — SIGAE</p>

      <div className="quick-actions">
        <h2>Accesos Rápidos</h2>
        <div className="actions-grid">
          <Link to="/citaciones">Mis Citaciones</Link>
          <Link to="/mensajes">Mensajes</Link>
          <Link to="/perfil">Mi Perfil</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal ──────────────────────────── */
function Dashboard() {
  const { usuario, rolActivo } = useAuth();

  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esSuperAdmin = usuario?.administradorTipo === "SuperAdmin";
  const esAdmin =
    rolEfectivo === "Administrador" ||
    esSuperAdmin ||
    usuario?.roles?.includes("Administrador");
  const esDocente  = rolEfectivo === "Docente";
  const esApoderado = rolEfectivo === "Apoderado";

  if (esAdmin)     return <DashboardAdmin />;
  if (esDocente)   return <DashboardDocente nombre={usuario?.nombre} />;
  if (esApoderado) return <DashboardApoderado nombre={usuario?.nombre} />;

  // Fallback genérico
  return (
    <div className="dashboard-container">
      <h1>Dashboard SIGAE</h1>
      <p>Bienvenido al Sistema de Gestión Académica Escolar</p>
    </div>
  );
}

export default Dashboard;

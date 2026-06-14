import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../../services/api";

/* ── Grupo de navegación ───────────────────────────── */
function NavGroup({ titulo, icono, color, links }) {
  return (
    <div className="nav-group">
      <div className="nav-group-header" style={{ background: color }}>
        <span>{icono}</span>
        <span>{titulo}</span>
      </div>
      <div className="nav-group-links">
        {links.filter(Boolean).map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard de Administrador ───────────────────── */
function DashboardAdmin({ esSuperAdmin }) {
  const [stats, setStats] = useState({
    usuarios: 0, docentes: 0, apoderados: 0,
    estudiantes: 0, cursos: 0, citaciones: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/dashboard/stats")
      .then((r) => {
        if (!r || !r.ok) throw new Error();
        return r.json();
      })
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
          <Link to="/usuarios">Gestión de Usuarios</Link>
          {esSuperAdmin && <Link to="/registrar-admin">Registrar Administrador</Link>}
          <Link to="/registrar-docente">Registrar Docente</Link>
          <Link to="/registrar-apoderado">Registrar Apoderado</Link>
          <Link to="/registrar-estudiante">Registrar Estudiante</Link>
          <Link to="/plan-educativo">Plan Educativo</Link>
          <Link to="/citaciones">Ver Citaciones</Link>
        </div>
      </div>

      {/* ── Navegación por secciones ── */}
      <div className="nav-sections">
        <h2>Módulos del sistema</h2>
        <div className="nav-sections-grid">

          <NavGroup
            titulo="Registro de Usuarios"
            icono="✏"
            color="#4f46e5"
            links={[
              { label: "Registrar Docente",       to: "/registrar-docente" },
              { label: "Registrar Apoderado",      to: "/registrar-apoderado" },
              { label: "Registrar Estudiante",     to: "/registrar-estudiante" },
              esSuperAdmin && { label: "Registrar Administrador", to: "/registrar-admin" },
            ]}
          />

          <NavGroup
            titulo="Gestión de Usuarios"
            icono="👤"
            color="#0f766e"
            links={[
              { label: "Gestión de Usuarios",   to: "/usuarios" },
              { label: "Gestión de Apoderados", to: "/apoderados" },
              esSuperAdmin && { label: "Gestión de Roles", to: "/gestion-roles" },
            ]}
          />

          <NavGroup
            titulo="Gestión Académica"
            icono="📚"
            color="#7c3aed"
            links={[
              { label: "Plan Educativo",   to: "/plan-educativo" },
              { label: "Asignaturas",      to: "/asignaturas" },
              { label: "Cursos",           to: "/cursos" },
              { label: "Horarios",         to: "/horarios" },
              { label: "Bloques Horarios", to: "/bloques-horarios" },
            ]}
          />

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
          <Link to="/plan-educativo">Plan Educativo</Link>
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
  const esSuperAdmin = usuario?.administradorTipo === "Super Admin";
  const esAdmin =
    rolEfectivo === "Administrador" ||
    esSuperAdmin ||
    usuario?.roles?.includes("Administrador");
  const esDocente  = rolEfectivo === "Docente";
  const esApoderado = rolEfectivo === "Apoderado";

  if (esAdmin)     return <DashboardAdmin esSuperAdmin={esSuperAdmin} />;
  if (esDocente)   return <DashboardDocente nombre={usuario?.nombre} />;
  if (esApoderado) return <DashboardApoderado nombre={usuario?.nombre} />;

  return (
    <div className="dashboard-container">
      <h1>Dashboard SIGAE</h1>
      <p>Bienvenido al Sistema de Gestión Académica Escolar</p>
    </div>
  );
}

export default Dashboard;

